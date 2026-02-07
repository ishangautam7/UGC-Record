require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db/index.js');

async function seedAll() {
    console.log('Starting complete database seed...\n');

    // 1. Seed Roles
    console.log('1. Seeding Roles...');
    const roles = [
        { name: 'ADMIN', description: 'Full system access' },
        { name: 'DEPARTMENT_HEAD', description: 'Manages department, approves projects and expenses' },
        { name: 'RESEARCHER', description: 'Creates and manages research projects' },
        { name: 'AUDITOR', description: 'View-only access for auditing' }
    ];

    const roleMap = {};
    for (const role of roles) {
        const { rows } = await db.query(
            'INSERT INTO "Role" (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id, name',
            [role.name, role.description]
        );
        roleMap[role.name] = rows[0].id;
        console.log(`   ✓ Role: ${role.name}`);
    }

    // 2. Seed Colleges
    console.log('\n2. Seeding Colleges...');
    const colleges = [
        { name: 'Engineering College', code: 'ENG', address: 'Engineering Campus, Block A', students: 2500 },
        { name: 'Science College', code: 'SCI', address: 'Science Campus, Block B', students: 1800 },
        { name: 'Arts College', code: 'ART', address: 'Arts Campus, Block C', students: 1200 },
        { name: 'Commerce College', code: 'COM', address: 'Commerce Campus, Block D', students: 1500 },
        { name: 'Management College', code: 'MGT', address: 'Management Campus, Block E', students: 1000 }
    ];

    const collegeMap = {};
    for (const college of colleges) {
        const { rows } = await db.query(
            'INSERT INTO "College" (name, code, address, total_students) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id, name',
            [college.name, college.code, college.address, college.students]
        );
        collegeMap[college.code] = rows[0].id;
        console.log(`   ✓ College: ${college.name} (${college.code}) - ${college.students} students`);
    }

    // 3. Seed Departments
    console.log('\n3. Seeding Departments...');
    const departments = [
        { name: 'Computer Science', code: 'CS', college: 'ENG', students: 800 },
        { name: 'Electronics', code: 'ECE', college: 'ENG', students: 900 },
        { name: 'Mechanical', code: 'ME', college: 'ENG', students: 800 },
        { name: 'Physics', code: 'PHY', college: 'SCI', students: 600 },
        { name: 'Chemistry', code: 'CHEM', college: 'SCI', students: 600 },
        { name: 'Mathematics', code: 'MATH', college: 'SCI', students: 600 },
        { name: 'English Literature', code: 'ENG_LIT', college: 'ART', students: 600 },
        { name: 'History', code: 'HIST', college: 'ART', students: 600 },
        { name: 'Accounting', code: 'ACC', college: 'COM', students: 750 },
        { name: 'Finance', code: 'FIN', college: 'COM', students: 750 },
        { name: 'Business Administration', code: 'BA', college: 'MGT', students: 500 },
        { name: 'Marketing', code: 'MKT', college: 'MGT', students: 500 }
    ];

    const deptMap = {};
    for (const dept of departments) {
        const { rows } = await db.query(
            'INSERT INTO "Department" (name, code, college_id, total_students) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET name = $1 RETURNING id, name',
            [dept.name, dept.code, collegeMap[dept.college], dept.students]
        );
        deptMap[dept.code] = rows[0].id;
        console.log(`   ✓ Department: ${dept.name} → ${dept.college} (${dept.students} students)`);
    }

    // 4. Seed Users
    console.log('\n4. Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    const users = [
        // Admin (no department)
        { name: 'System Admin', email: 'admin@ugc.com', password: adminPassword, role: 'AD MIN', dept: null },

        // Auditor (no department)
        { name: 'Audit Officer', email: 'auditor@ugc.com', password: defaultPassword, role: 'AUDITOR', dept: null },

        // Department Heads (assigned to a primary department)
        { name: 'Dr. Ramesh Kumar', email: 'hod.eng@ugc.com', password: defaultPassword, role: 'DEPARTMENT_HEAD', dept: 'CS' },
        { name: 'Dr. Sunita Sharma', email: 'hod.sci@ugc.com', password: defaultPassword, role: 'DEPARTMENT_HEAD', dept: 'PHY' },
        { name: 'Dr. Anand Joshi', email: 'hod.art@ugc.com', password: defaultPassword, role: 'DEPARTMENT_HEAD', dept: 'ENG_LIT' },
        { name: 'Dr. Priya Patel', email: 'hod.com@ugc.com', password: defaultPassword, role: 'DEPARTMENT_HEAD', dept: 'ACC' },
        { name: 'Dr. Vikram Singh', email: 'hod.mgt@ugc.com', password: defaultPassword, role: 'DEPARTMENT_HEAD', dept: 'BA' },

        // Researchers
        { name: 'Dr. Amit Verma', email: 'amt.verma@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'CS' },
        { name: 'Dr. Neha Gupta', email: 'neha.gupta@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'ECE' },
        { name: 'Dr. Rahul Mehta', email: 'rahul.mehta@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'PHY' },
        { name: 'Dr. Kavita Rao', email: 'kavita.rao@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'CHEM' },
        { name: 'Prof. Suresh Iyer', email: 'suresh.iyer@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'ENG_LIT' },
        { name: 'Prof. Meera Nair', email: 'meera.nair@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'ACC' },
        { name: 'Dr. Arun Saxena', email: 'arun.saxena@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'BA' },
        { name: 'Dr. Pooja Mishra', email: 'pooja.mishra@ugc.com', password: defaultPassword, role: 'RESEARCHER', dept: 'ME' }
    ];

    const userMap = {};
    for (const user of users) {
        const deptId = user.dept ? deptMap[user.dept] : null;
        const { rows } = await db.query(
            'INSERT INTO "User" (name, email, password, department, dept_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET name = $1 RETURNING id, name, email',
            [user.name, user.email, user.password, user.dept || null, deptId]
        );

        await db.query(
            'INSERT INTO "UserRole" (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [rows[0].id, roleMap[user.role]]
        );

        userMap[user.email] = rows[0].id;
        console.log(`   ✓ User: ${user.name} (${user.role}) → ${user.dept || 'System'}`);
    }

    // 5. Seed Projects with released_funds
    console.log('\n5. Seeding Projects...');
    const projects = [
        { title: 'AI-Based Healthcare Diagnostics', slug: 'ai-healthcare', abstract: 'Using ML for early disease detection', grant: 500000, released: 200000, duration: 24, dept: 'CS', status: 'APPROVED', pi: 'amit.verma@ugc.com' },
        { title: 'Quantum Computing Research', slug: 'quantum-computing', abstract: 'Exploring quantum algorithms', grant: 800000, released: 400000, duration: 36, dept: 'PHY', status: 'ONGOING', pi: 'rahul.mehta@ugc.com' },
        { title: 'Green Chemistry Initiatives', slug: 'green-chemistry', abstract: 'Sustainable chemical processes', grant: 350000, released: 150000, duration: 18, dept: 'CHEM', status: 'APPROVED', pi: 'kavita.rao@ugc.com' },
        { title: 'IoT Smart Campus', slug: 'iot-campus', abstract: 'Smart campus using IoT sensors', grant: 450000, released: 100000, duration: 24, dept: 'ECE', status: 'PENDING', pi: 'neha.gupta@ugc.com' },
        { title: 'Digital Literature Archives', slug: 'digital-archives', abstract: 'Digitizing ancient manuscripts', grant: 250000, released: 250000, duration: 12, dept: 'ENG_LIT', status: 'COMPLETED', pi: 'suresh.iyer@ugc.com' },
        { title: 'Financial Risk Modeling', slug: 'risk-modeling', abstract: 'ML models for risk assessment', grant: 600000, released: 200000, duration: 24, dept: 'ACC', status: 'APPROVED', pi: 'meera.nair@ugc.com' },
        { title: 'Startup Ecosystem Study', slug: 'startup-study', abstract: 'Analysis of regional startups', grant: 300000, released: 150000, duration: 12, dept: 'BA', status: 'PENDING', pi: 'arun.saxena@ugc.com' },
        { title: 'Renewable Energy Systems', slug: 'renewable-energy', abstract: 'Solar and wind hybrid systems', grant: 700000, released: 400000, duration: 36, dept: 'ME', status: 'ONGOING', pi: 'pooja.mishra@ugc.com' }
    ];

    const projectMap = {};
    for (const project of projects) {
        const { rows } = await db.query(
            `INSERT INTO "Project" (title, slug, abstract, grant_amount, released_funds, duration, dept_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             ON CONFLICT (slug) DO UPDATE SET title = $1 RETURNING id, title`,
            [project.title, project.slug, project.abstract, project.grant, project.released, project.duration, deptMap[project.dept], project.status]
        );

        await db.query(
            'INSERT INTO "ProjectMember" (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [rows[0].id, userMap[project.pi], 'INVESTIGATOR']
        );

        projectMap[project.slug] = rows[0].id;
        console.log(`   ✓ Project: ${project.title} (${project.status}) - Released: ₹${project.released}`);
    }

    // 6. Seed Expenses
    console.log('\n6. Seeding Expenses...');
    const expenses = [
        { project: 'ai-healthcare', category: 'Equipment', amount: 150000, desc: 'GPU Server for ML training', status: 'APPROVED', filed_by: 'amit.verma@ugc.com' },
        { project: 'ai-healthcare', category: 'Travel', amount: 25000, desc: 'Conference travel - IEEE', status: 'PENDING', filed_by: 'amit.verma@ugc.com' },
        { project: 'quantum-computing', category: 'Consumables', amount: 75000, desc: 'Lab materials', status: 'APPROVED', filed_by: 'rahul.mehta@ugc.com' },
        { project: 'quantum-computing', category: 'Equipment', amount: 200000, desc: 'Quantum simulator license', status: 'APPROVED', filed_by: 'rahul.mehta@ugc.com' },
        { project: 'green-chemistry', category: 'Chemicals', amount: 45000, desc: 'Research chemicals', status: 'APPROVED', filed_by: 'kavita.rao@ugc.com' },
        { project: 'iot-campus', category: 'Equipment', amount: 80000, desc: 'IoT sensors and modules', status: 'PENDING', filed_by: 'neha.gupta@ugc.com' },
        { project: 'digital-archives', category: 'Equipment', amount: 60000, desc: 'High-res scanner', status: 'APPROVED', filed_by: 'suresh.iyer@ugc.com' },
        { project: 'risk-modeling', category: 'Software', amount: 100000, desc: 'Statistical software license', status: 'APPROVED', filed_by: 'meera.nair@ugc.com' },
        { project: 'renewable-energy', category: 'Equipment', amount: 250000, desc: 'Solar panels for testing', status: 'PENDING', filed_by: 'pooja.mishra@ugc.com' },
        { project: 'renewable-energy', category: 'Travel', amount: 35000, desc: 'Site visits', status: 'REJECTED', filed_by: 'pooja.mishra@ugc.com' }
    ];

    for (const expense of expenses) {
        await db.query(
            `INSERT INTO "Expense" (project_id, filed_by, category, amount, description, status, bill_date) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT DO NOTHING`,
            [projectMap[expense.project], userMap[expense.filed_by], expense.category, expense.amount, expense.desc, expense.status]
        );
        console.log(`   ✓ Expense: ₹${expense.amount} - ${expense.category} (${expense.status})`);
    }

    console.log('\n========================================');
    console.log('Database seeding completed successfully!');
    console.log('========================================\n');
    console.log('LOGIN CREDENTIALS:');
    console.log('------------------');
    console.log('Admin:       admin@ugc.com / admin123');
    console.log('Auditor:     auditor@ugc.com / password123');
    console.log('HOD (Eng):   hod.eng@ugc.com / password123');
    console.log('HOD (Sci):   hod.sci@ugc.com / password123');
    console.log('Researcher:  amit.verma@ugc.com / password123');
    console.log('\n');

    process.exit(0);
}

seedAll().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
