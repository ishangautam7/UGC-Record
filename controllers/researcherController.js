const db = require('../db/index.js');

exports.getAllResearchers = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT rp.*, u.name, u.email, d.name as department_name
            FROM "ResearcherProfile" rp
            JOIN "User" u ON rp.user_id = u.id
            JOIN "Department" d ON rp.dept_id = d.id
            ORDER BY u.name
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch researchers' });
    }
};

exports.getResearcherById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT rp.*, u.name, u.email, d.name as department_name
            FROM "ResearcherProfile" rp
            JOIN "User" u ON rp.user_id = u.id
            JOIN "Department" d ON rp.dept_id = d.id
            WHERE rp.id = $1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Researcher not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch researcher' });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT rp.*, d.name as department_name
            FROM "ResearcherProfile" rp
            JOIN "Department" d ON rp.dept_id = d.id
            WHERE rp.user_id = $1
        `, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Researcher profile not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

exports.createResearcherProfile = async (req, res) => {
    const { user_id, dept_id, designation, h_index, citations } = req.body;
    try {
        const { rows } = await db.query(
            `INSERT INTO "ResearcherProfile" (user_id, dept_id, designation, h_index, citations) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, dept_id, designation, h_index || null, citations || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create researcher profile' });
    }
};

exports.updateResearcherProfile = async (req, res) => {
    const { designation, h_index, citations, dept_id } = req.body;
    try {
        const { rows } = await db.query(
            `UPDATE "ResearcherProfile" 
             SET designation = COALESCE($1, designation), 
                 h_index = COALESCE($2, h_index), 
                 citations = COALESCE($3, citations),
                 dept_id = COALESCE($4, dept_id)
             WHERE id = $5 RETURNING *`,
            [designation, h_index, citations, dept_id, req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Researcher profile not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update researcher profile' });
    }
};
