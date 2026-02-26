const db = require('../db/index.js');

exports.getAllDepartments = async (req, res) => {
    try {
        let query = `
            SELECT d.*, c.name as college_name, c.code as college_code
            FROM "Department" d
            LEFT JOIN "College" c ON d.college_id = c.id
        `;
        const params = [];

        // HOD can only see their college's departments
        if (req.user.roles.includes('DEPARTMENT_HEAD') && !req.user.roles.includes('ADMIN')) {
            if (req.user.dept_id) {
                query += ' WHERE d.college_id = (SELECT college_id FROM "Department" WHERE id = $1)';
                params.push(req.user.dept_id);
            }
        }

        query += ' ORDER BY c.name, d.name';

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT d.*, c.name as college_name
            FROM "Department" d
            LEFT JOIN "College" c ON d.college_id = c.id
            WHERE d.id = $1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
};

exports.createDepartment = async (req, res) => {
    const { name, code, college_id } = req.body;

    if (!name || !code || !college_id) {
        return res.status(400).json({ error: 'Name, code, and college are required' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO "Department" (name, code, college_id) VALUES ($1, $2, $3) RETURNING *`,
            [name, code.toUpperCase(), college_id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('CREATE', 'Department', $1, $2, $3)`,
            [rows[0].id, req.user.id, JSON.stringify(rows[0])]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Department code already exists' });
        }
        res.status(500).json({ error: 'Failed to create department' });
    }
};

exports.updateDepartment = async (req, res) => {
    const { name, code, college_id } = req.body;
    try {
        const oldDept = await db.query('SELECT * FROM "Department" WHERE id = $1', [req.params.id]);
        if (oldDept.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        const { rows } = await db.query(
            `UPDATE "Department" 
             SET name = COALESCE($1, name), 
                 code = COALESCE($2, code),
                 college_id = COALESCE($3, college_id),
                 updated_at = NOW()
             WHERE id = $4 RETURNING *`,
            [name, code?.toUpperCase(), college_id, req.params.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('UPDATE', 'Department', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify({ before: oldDept.rows[0], after: rows[0] })]
        );

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update department' });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const dept = await db.query('SELECT * FROM "Department" WHERE id = $1', [req.params.id]);
        if (dept.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        await db.query('DELETE FROM "Department" WHERE id = $1', [req.params.id]);

        await db.query(
            `INSERT INTO "AuditLog"(action, entity_type, entity_id, user_id, changes)
             VALUES('DELETE', 'Department', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify(dept.rows[0])]
        );

        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete department' });
    }
};
