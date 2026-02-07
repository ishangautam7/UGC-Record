const db = require('../db/index.js');

// Helper to check college filter
const getCollegeFilter = (user) => {
    const userRoles = user.roles?.filter(r => r !== null) || [];
    if (userRoles.includes('ADMIN')) return null;
    return user.college_id;
};

exports.getAllProjects = async (req, res) => {
    try {
        let query = `
            SELECT p.*, d.name as department_name, c.name as college_name,
                   (SELECT COUNT(*) FROM "Expense" e WHERE e.project_id = p.id) as expense_count,
                   (SELECT COALESCE(SUM(amount), 0) FROM "Expense" e WHERE e.project_id = p.id AND e.status = 'APPROVED') as total_expenses
            FROM "Project" p
            LEFT JOIN "Department" d ON p.dept_id = d.id
            LEFT JOIN "College" c ON d.college_id = c.id
        `;
        const params = [];

        const collegeId = getCollegeFilter(req.user);
        if (collegeId) {
            query += ' WHERE d.college_id = $1';
            params.push(collegeId);
        }

        query += ' ORDER BY p.created_at DESC';

        const { rows } = await db.query(query, params);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

exports.getMyProjects = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT p.*, d.name as department_name,
                   (SELECT COUNT(*) FROM "Expense" e WHERE e.project_id = p.id) as expense_count,
                   (SELECT COALESCE(SUM(amount), 0) FROM "Expense" e WHERE e.project_id = p.id AND e.status = 'APPROVED') as total_expenses
            FROM "Project" p
            LEFT JOIN "Department" d ON p.dept_id = d.id
            JOIN "ProjectMember" pm ON p.id = pm.project_id
            WHERE pm.user_id = $1
            ORDER BY p.created_at DESC
        `, [req.user.id]);
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT p.*, d.name as department_name, c.name as college_name
            FROM "Project" p
            LEFT JOIN "Department" d ON p.dept_id = d.id
            LEFT JOIN "College" c ON d.college_id = c.id
            WHERE p.id = $1
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const membersResult = await db.query(`
            SELECT pm.*, u.name, u.email
            FROM "ProjectMember" pm
            JOIN "User" u ON pm.user_id = u.id
            WHERE pm.project_id = $1
        `, [req.params.id]);

        const expensesResult = await db.query(`
            SELECT e.*, u.name as filed_by_name
            FROM "Expense" e
            JOIN "User" u ON e.filed_by = u.id
            WHERE e.project_id = $1
            ORDER BY e.created_at DESC
        `, [req.params.id]);

        res.status(200).json({
            ...rows[0],
            members: membersResult.rows,
            expenses: expensesResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

exports.createProject = async (req, res) => {
    const { title, slug, abstract, grant_amount, duration, dept_id, start_date, end_date } = req.body;

    if (!title || !dept_id) {
        return res.status(400).json({ error: 'Title and department are required' });
    }

    try {
        const projectSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const { rows } = await db.query(
            `INSERT INTO "Project" (title, slug, abstract, grant_amount, duration, dept_id, status, start_date, end_date) 
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8) RETURNING *`,
            [title, projectSlug, abstract, grant_amount || 0, duration, dept_id, start_date || null, end_date || null]
        );

        await db.query(
            `INSERT INTO "ProjectMember" (project_id, user_id, role) VALUES ($1, $2, 'PI')`,
            [rows[0].id, req.user.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('CREATE', 'Project', $1, $2, $3)`,
            [rows[0].id, req.user.id, JSON.stringify(rows[0])]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

exports.updateProject = async (req, res) => {
    const { title, abstract, grant_amount, duration, start_date, end_date } = req.body;
    try {
        const oldProject = await db.query('SELECT * FROM "Project" WHERE id = $1', [req.params.id]);
        if (oldProject.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { rows } = await db.query(
            `UPDATE "Project" 
             SET title = COALESCE($1, title), 
                 abstract = COALESCE($2, abstract),
                 grant_amount = COALESCE($3, grant_amount),
                 duration = COALESCE($4, duration),
                 start_date = COALESCE($5, start_date),
                 end_date = COALESCE($6, end_date),
                 updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [title, abstract, grant_amount, duration, start_date, end_date, req.params.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('UPDATE', 'Project', $1, $2, jsonb_build_object('before', $3::jsonb, 'after', $4::jsonb))`,
            [req.params.id, req.user.id, JSON.stringify(oldProject.rows[0]), JSON.stringify(rows[0])]
        );

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

exports.updateProjectStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'AUDITED', 'ONGOING', 'COMPLETED'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const oldProject = await db.query('SELECT * FROM "Project" WHERE id = $1', [req.params.id]);
        if (oldProject.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { rows } = await db.query(
            `UPDATE "Project" SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('STATUS_CHANGE', 'Project', $1, $2, jsonb_build_object('from', $3::text, 'to', $4::text))`,
            [req.params.id, req.user.id, oldProject.rows[0].status, status]
        );

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project status' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await db.query('SELECT * FROM "Project" WHERE id = $1', [req.params.id]);
        if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await db.query('DELETE FROM "Project" WHERE id = $1', [req.params.id]);

        await db.query(
            `INSERT INTO "AuditLog" (action, entity_type, entity_id, user_id, changes)
             VALUES ('DELETE', 'Project', $1, $2, $3)`,
            [req.params.id, req.user.id, JSON.stringify(project.rows[0])]
        );

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

exports.addProjectMember = async (req, res) => {
    const { user_id, role } = req.body;
    const validRoles = ['PI', 'CO_PI', 'TEAM_MEMBER'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be PI, CO_PI, or TEAM_MEMBER' });
    }

    try {
        const existing = await db.query(
            'SELECT * FROM "ProjectMember" WHERE project_id = $1 AND user_id = $2',
            [req.params.id, user_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this project' });
        }

        const { rows } = await db.query(
            `INSERT INTO "ProjectMember" (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
            [req.params.id, user_id, role]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add project member' });
    }
};

exports.removeProjectMember = async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM "ProjectMember" WHERE project_id = $1 AND user_id = $2',
            [req.params.id, req.params.userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.status(200).json({ message: 'Member removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

exports.getProjectStats = async (req, res) => {
    try {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE p.status = 'PENDING') as pending,
                COUNT(*) FILTER (WHERE p.status = 'APPROVED') as approved,
                COUNT(*) FILTER (WHERE p.status = 'ONGOING') as ongoing,
                COUNT(*) FILTER (WHERE p.status = 'COMPLETED') as completed,
                COALESCE(SUM(p.grant_amount), 0) as total_grant_amount
            FROM "Project" p
            LEFT JOIN "Department" d ON p.dept_id = d.id
        `;
        const params = [];

        const collegeId = getCollegeFilter(req.user);
        if (collegeId) {
            query += ' WHERE d.college_id = $1';
            params.push(collegeId);
        }

        const stats = await db.query(query, params);
        res.status(200).json(stats.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
};
