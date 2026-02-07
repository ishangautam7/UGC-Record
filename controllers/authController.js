const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/index.js');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { rows } = await db.query(
            `SELECT u.*, array_agg(r.name) as roles, d.name as department_name, c.name as college_name
             FROM "User" u 
             LEFT JOIN "UserRole" ur ON u.id = ur.user_id 
             LEFT JOIN "Role" r ON ur.role_id = r.id 
             LEFT JOIN "Department" d ON u.dept_id = d.id
             LEFT JOIN "College" c ON d.college_id = c.id
             WHERE u.email = $1 
             GROUP BY u.id, d.name, c.name`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        await db.query('UPDATE "User" SET last_login = NOW() WHERE id = $1', [user.id]);

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            token: generateToken(user.id)
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT u.*, array_agg(r.name) as roles, d.name as department_name, c.name as college_name
             FROM "User" u 
             LEFT JOIN "UserRole" ur ON u.id = ur.user_id 
             LEFT JOIN "Role" r ON ur.role_id = r.id 
             LEFT JOIN "Department" d ON u.dept_id = d.id
             LEFT JOIN "College" c ON d.college_id = c.id
             WHERE u.id = $1 
             GROUP BY u.id, d.name, c.name`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userWithoutPassword } = rows[0];
        res.json(userWithoutPassword);
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

exports.createUser = async (req, res) => {
    const { name, email, password, department, roleId, dept_id } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const existing = await db.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Non-admin users can only create users in their own college's departments
        let userDeptId = dept_id;
        if (!req.user.roles.includes('ADMIN') && req.user.dept_id) {
            // HOD can only create in departments of their college
            const deptCheck = await db.query(
                'SELECT d1.college_id FROM "Department" d1 JOIN "Department" d2 ON d1.college_id = d2.college_id WHERE d1.id = $1 AND d2.id = $2',
                [dept_id, req.user.dept_id]
            );
            if (deptCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Cannot create users in other colleges' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows } = await db.query(
            'INSERT INTO "User" (name, email, password, department, dept_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, department, dept_id, created_at',
            [name, email, hashedPassword, department, userDeptId || null]
        );

        const user = rows[0];

        if (roleId) {
            await db.query(
                'INSERT INTO "UserRole" (user_id, role_id) VALUES ($1, $2)',
                [user.id, roleId]
            );
        }

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('CREATE', 'User', $1, $2, $3)`,
            [user.id, req.user.id, JSON.stringify({ ...user, role_assigned: roleId })]
        );

        res.status(201).json(user);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
};
