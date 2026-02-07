require('dotenv').config();
const { pool } = require("../db/index");
const fs = require("fs");
const path = require("path");

const setupDb = async () => {
    try {
        const schemaPath = path.join(__dirname, "../db/schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf8");

        console.log("Running schema.sql...");
        await pool.query(schemaSql);
        console.log("Database initialized successfully!");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        await pool.end();
    }
};

setupDb();
