const db = require('../db/index.js');

exports.getAllRoles = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "Role" ORDER BY name');
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM "Role" WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

exports.createRole = async (req, res) => {
    const { name, description } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO "Role" (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

exports.updateRole = async (req, res) => {
    const { name, description } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE "Role" SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { rows } = await db.query('DELETE FROM "Role" WHERE id = $1 RETURNING *', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};

exports.assignRoleToUser = async (req, res) => {
    const { userId, roleId } = req.body;
    try {
        await db.query(
            'INSERT INTO "UserRole" (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, roleId]
        );
        res.status(200).json({ message: 'Role assigned successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to assign role' });
    }
};

exports.removeRoleFromUser = async (req, res) => {
    const { userId, roleId } = req.body;
    try {
        await db.query(
            'DELETE FROM "UserRole" WHERE user_id = $1 AND role_id = $2',
            [userId, roleId]
        );
        res.status(200).json({ message: 'Role removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove role' });
    }
};
