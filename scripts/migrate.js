require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db/index.js');

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
        if (!file.endsWith('.sql')) continue;

        console.log(`Running ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        try {
            await db.query(sql);
            console.log(`✓ ${file} completed`);
        } catch (err) {
            console.error(`Migration failed: ${err.message}`);
        }
    }

    console.log('All migrations completed!');
    process.exit(0);
}

runMigrations().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
