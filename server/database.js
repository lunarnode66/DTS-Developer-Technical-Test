
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = process.env.TASKS_DB_PATH
  ? path.resolve(process.env.TASKS_DB_PATH)
  : path.join(__dirname, "tasks.db");

const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      dueDate TEXT NOT NULL
    )
  `);
});

module.exports = db;
