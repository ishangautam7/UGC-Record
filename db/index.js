const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("Error connecting to database", err.stack);
    } else {
        console.log("Database connected successfully", res.rows[0]);
    }
})

module.exports = {
    async query(text, params) {
        try {
            const start = Date.now();
            const res = await pool.query(text, params);
            const time = Date.now() - start;
            console.log("Executed in " + time + "ms");
            return res;
        } catch (err) {
            console.error("Database Error: ", err);
            throw (err)
        }
    }, pool
};