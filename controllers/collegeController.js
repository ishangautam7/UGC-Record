const db = require('../db/index.js');

exports.getAllColleges = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM "Department" d WHERE d.college_id = c.id) as department_count,
                   (SELECT COUNT(*) FROM "User" u 
                    JOIN "Department" d ON u.dept_id = d.id 
                    WHERE d.college_id = c.id) as user_count
            FROM "College" c
            ORDER BY c.name
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch colleges' });
    }
};

exports.getCollegeById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM "Department" d WHERE d.college_id = c.id) as department_count
            FROM "College" c
            WHERE c.id = $1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'College not found' });
        }

        const departments = await db.query(
            'SELECT * FROM "Department" WHERE college_id = $1 ORDER BY name',
            [req.params.id]
        );

        res.status(200).json({
            ...rows[0],
            departments: departments.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch college' });
    }
};

exports.createCollege = async (req, res) => {
    const { name, code, address } = req.body;

    if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
    }

    try {
        const { rows } = await db.query(
            `INSERT INTO "College" (name, code, address) VALUES ($1, $2, $3) RETURNING *`,
            [name, code.toUpperCase(), address]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('CREATE', 'College', $1, $2, $3)`,
            [rows[0].id, req.user.id, JSON.stringify(rows[0])]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'College name or code already exists' });
        }
        res.status(500).json({ error: 'Failed to create college' });
    }
};

exports.updateCollege = async (req, res) => {
    const { name, code, address, is_active } = req.body;
    try {
        const oldCollege = await db.query('SELECT * FROM "College" WHERE id = $1', [req.params.id]);
        if (oldCollege.rows.length === 0) {
            return res.status(404).json({ error: 'College not found' });
        }

        const { rows } = await db.query(
            `UPDATE "College" 
             SET name = COALESCE($1, name), 
                 code = COALESCE($2, code),
                 address = COALESCE($3, address),
                 is_active = COALESCE($4, is_active),
                 updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [name, code?.toUpperCase(), address, is_active, req.params.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('UPDATE', 'College', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify({ before: oldCollege.rows[0], after: rows[0] })]
        );

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update college' });
    }
};

exports.deleteCollege = async (req, res) => {
    try {
        const college = await db.query('SELECT * FROM "College" WHERE id = $1', [req.params.id]);
        if (college.rows.length === 0) {
            return res.status(404).json({ error: 'College not found' });
        }

        await db.query('DELETE FROM "College" WHERE id = $1', [req.params.id]);

        await db.query(
            `INSERT INTO "AuditLog"(action, entity_type, entity_id, user_id, changes)
             VALUES('DELETE', 'College', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify(college.rows[0])]
        );

        res.status(200).json({ message: 'College deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete college' });
    }
};
