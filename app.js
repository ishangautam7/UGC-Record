const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const researcherRoutes = require('./routes/researcherRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const collegeRoutes = require('./routes/collegeRoutes');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/researchers', researcherRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/colleges', collegeRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
