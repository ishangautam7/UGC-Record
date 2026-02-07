const db = require('../db/index.js');

exports.getAllLogs = async (req, res) => {
    try {

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const entity = req.query.entity;

        let query = `
            SELECT al.*, u.name as user_name, u.email as user_email
            FROM "AuditLog" al
            LEFT JOIN "User" u ON al.user_id = u.id
        `;
        const params = [];

        if (entity) {
            query += ' WHERE al.entity = $1';
            params.push(entity);
        }

        query += ' ORDER BY al.timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

exports.getLogsByEntity = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT al.*, u.name as user_name
            FROM "AuditLog" al
            LEFT JOIN "User" u ON al.user_id = u.id
            WHERE al.entity = $1 AND al.entity_id = $2
            ORDER BY al.timestamp DESC
        `, [req.params.entity, req.params.entityId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
