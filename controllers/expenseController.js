const db = require('../db/index.js');

exports.getAllExpenses = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT e.*, p.title as project_title, u.name as filed_by_name
            FROM "Expense" e
            JOIN "Project" p ON e.project_id = p.id
            JOIN "User" u ON e.filed_by = u.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

exports.getMyExpenses = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT e.*, p.title as project_title
            FROM "Expense" e
            JOIN "Project" p ON e.project_id = p.id
            WHERE e.filed_by = $1
            ORDER BY e.created_at DESC
        `, [req.user.id]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

exports.getExpensesByProject = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT e.*, u.name as filed_by_name
            FROM "Expense" e
            JOIN "User" u ON e.filed_by = u.id
            WHERE e.project_id = $1
            ORDER BY e.created_at DESC
        `, [req.params.projectId]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

exports.getExpenseById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT e.*, p.title as project_title, u.name as filed_by_name
            FROM "Expense" e
            JOIN "Project" p ON e.project_id = p.id
            JOIN "User" u ON e.filed_by = u.id
            WHERE e.id = $1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expense' });
    }
};

exports.createExpense = async (req, res) => {
    const { project_id, bill_date, category, amount, description } = req.body;

    if (!project_id || !amount || !category) {
        return res.status(400).json({ error: 'Project, amount, and category are required' });
    }

    try {
        const project = await db.query('SELECT * FROM "Project" WHERE id = $1', [project_id]);
        if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.rows[0].status !== 'APPROVED' && project.rows[0].status !== 'ONGOING') {
            return res.status(400).json({ error: 'Can only add expenses to approved or in-progress projects' });
        }

        const { rows } = await db.query(
            `INSERT INTO "Expense" (project_id, filed_by, bill_date, category, amount, description, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
            [project_id, req.user.id, bill_date || new Date(), category, amount, description]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('CREATE', 'Expense', CREATE, Expense, $3)`,
            [rows[0].id, req.user.id, JSON.stringify(rows[0])]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

exports.updateExpenseStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const oldExpense = await db.query('SELECT * FROM "Expense" WHERE id = $1', [req.params.id]);
        if (oldExpense.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const { rows } = await db.query(
            `UPDATE "Expense" SET status = $1 WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('STATUS_CHANGE', 'Expense', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify({ from: oldExpense.rows[0].status, to: status })]
        );

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update expense status' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await db.query('SELECT * FROM "Expense" WHERE id = $1', [req.params.id]);
        if (expense.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        if (expense.rows[0].status === 'APPROVED') {
            return res.status(400).json({ error: 'Cannot delete approved expenses' });
        }

        await db.query('DELETE FROM "Expense" WHERE id = $1', [req.params.id]);

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('DELETE', 'Expense', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify(expense.rows[0])]
        );

        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

exports.getExpenseStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
                COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
                COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0) as total_approved_amount,
                COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) as total_pending_amount
            FROM "Expense"
        `);
        res.status(200).json(stats.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expense stats' });
    }
};
