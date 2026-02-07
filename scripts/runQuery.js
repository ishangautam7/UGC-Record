require("dotenv").config()
const db = require("../db/index.js")

const main = async () => {
    res = await db.query("SELECT * FROM \"User\";")
    console.log(res.rows)
}

main()