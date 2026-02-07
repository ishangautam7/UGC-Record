require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db/index.js');

async function seedRoles() {
    console.log('Seeding roles...');
    const roles = [
        { name: 'ADMIN', description: 'Full system access' },
        { name: 'DEPARTMENT_HEAD', description: 'Manages department, approves projects and expenses' },
        { name: 'RESEARCHER', description: 'Creates and manages research projects' },
        { name: 'AUDITOR', description: 'View-only access for auditing' }
    ];

    for (const role of roles) {
        try {
            await db.query(
                'INSERT INTO "Role" (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                [role.name, role.description]
            );
            console.log(`Role created: ${role.name}`);
        } catch (err) {
            console.error(`Failed to create role ${role.name}:`, err.message);
        }
    }
}

async function seedAdmin() {
    console.log('Seeding admin user...');
    try {
        const existing = await db.query('SELECT id FROM "User" WHERE email = $1', ['admin@ugc.com']);

        if (existing.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const { rows: userRows } = await db.query(
            'INSERT INTO "User" (name, email, password, department) VALUES ($1, $2, $3, $4) RETURNING id',
            ['System Admin', 'admin@ugc.com', hashedPassword, 'Administration']
        );

        const { rows: roleRows } = await db.query('SELECT id FROM "Role" WHERE name = $1', ['ADMIN']);

        if (roleRows.length > 0) {
            await db.query(
                'INSERT INTO "UserRole" (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userRows[0].id, roleRows[0].id]
            );
        }

        console.log('Admin user created: admin@ugc.com / admin123');
    } catch (err) {
        console.error('Failed to seed admin user:', err.message);
    }
}

async function run() {
    await seedRoles();
    await seedAdmin();
    console.log('Seeding complete!');
    process.exit(0);
}

run();
