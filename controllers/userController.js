const db = require('../db/index.js');

exports.getAllUsers = async (req, res) => {
    try {
        let query = `
            SELECT u.id, u.name, u.email, u.department, u.is_active, u.created_at, u.last_login,
                   u.dept_id, d.name as department_name, d.college_id, c.name as college_name,
                   array_agg(r.name) as roles
            FROM "User" u
            LEFT JOIN "UserRole" ur ON u.id = ur.user_id
            LEFT JOIN "Role" r ON ur.role_id = r.id
            LEFT JOIN "Department" d ON u.dept_id = d.id
            LEFT JOIN "College" c ON d.college_id = c.id
        `;
        const params = [];

        const userRoles = req.user.roles.filter(r => r !== null);
        if (userRoles.includes('DEPARTMENT_HEAD') && !userRoles.includes('ADMIN')) {
            // HOD sees only users from departments in their college
            if (req.user.dept_id) {
                query += ' WHERE d.college_id = (SELECT college_id FROM "Department" WHERE id = $1)';
                params.push(req.user.dept_id);
            } else {
                return res.status(200).json([]);
            }
        }

        query += ' GROUP BY u.id, d.name, d.college_id, c.name ORDER BY u.created_at DESC';

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT u.id, u.name, u.email, u.department, u.is_active, u.created_at,
                   u.dept_id, d.name as department_name, c.name as college_name,
                   array_agg(r.name) as roles
            FROM "User" u
            LEFT JOIN "UserRole" ur ON u.id = ur.user_id
            LEFT JOIN "Role" r ON ur.role_id = r.id
            LEFT JOIN "Department" d ON u.dept_id = d.id
            LEFT JOIN "College" c ON d.college_id = c.id
            WHERE u.id = $1
            GROUP BY u.id, d.name, c.name
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

exports.updateUser = async (req, res) => {
    const { name, department, is_active, dept_id } = req.body;
    try {
        const { rows } = await db.query(
            `UPDATE "User" 
             SET name = COALESCE($1, name), 
                 department = COALESCE($2, department),
                 is_active = COALESCE($3, is_active),
                 dept_id = COALESCE($4, dept_id),
                 updated_at = NOW()
             WHERE id = $5 RETURNING id, name, email, department, is_active, dept_id`,
            [name, department, is_active, dept_id, req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const { rows } = await db.query(
            `UPDATE "User" SET is_active = NOT is_active, updated_at = NOW() 
             WHERE id = $1 RETURNING id, name, is_active`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM "User" WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
