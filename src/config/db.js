const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "HUSTHUB",
  password: "hieunt04lm",
  port: "5432",
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log("Connected to the PostgreSQL database successfully");
  } catch (err) {
    console.error("Database connection error:", err.stack);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
