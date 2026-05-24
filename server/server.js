const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

//
// MIDDLEWARE
//
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

//
// HEALTH CHECK
//
app.get("/", (req, res) => {
  res.json({
    message: "Task API is running"
  });
});

//
// VALID STATUSES
//
const validStatuses = [
  "Pending",
  "In Progress",
  "Completed"
];

//
// GET ALL TASKS
// Supports:
// - Filtering
// - Searching
// - Sorting
//
app.get("/tasks", (req, res) => {
  const { status, search, sort } = req.query;

  let sql = "SELECT * FROM tasks WHERE 1=1";
  let params = [];

  //
  // FILTER BY STATUS
  //
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  //
  // SEARCH BY TITLE
  //
  if (search) {
    sql += " AND title LIKE ?";
    params.push(`%${search}%`);
  }

  //
  // SORTING
  //
  if (sort === "dueDate") {
    sql += " ORDER BY dueDate ASC";
  } else if (sort === "status") {
    sql += " ORDER BY status ASC";
  } else {
    sql += " ORDER BY id DESC";
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: err.message,
      });
    }

    res.json(rows);
  });
});

//
// GET TASK BY ID
//
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT * FROM tasks WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (!row) {
        return res.status(404).json({
          error: "Task not found",
        });
      }

      res.json(row);
    }
  );
});

//
// CREATE TASK
//
app.post("/tasks", (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      error: "Request body is required",
    });
  }

  const {
    title,
    description = "",
    status,
    dueDate
  } = req.body;

  //
  // VALIDATION
  //
  if (!title || !status || !dueDate) {
    return res.status(400).json({
      error: "Title, status, and due date are required.",
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status value.",
    });
  }

  const sql = `
    INSERT INTO tasks (
      title,
      description,
      status,
      dueDate
    )
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    sql,
    [title, description, status, dueDate],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        description,
        status,
        dueDate,
      });
    }
  );
});

//
// UPDATE TASK STATUS
//
app.patch("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  //
  // VALIDATION
  //
  if (!status) {
    return res.status(400).json({
      error: "Status is required.",
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status value.",
    });
  }

  db.run(
    "UPDATE tasks SET status = ? WHERE id = ?",
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Task not found",
        });
      }

      res.json({
        message: "Task updated successfully",
      });
    }
  );
});

//
// DELETE TASK
//
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM tasks WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: "Task not found",
        });
      }

      res.json({
        message: "Task deleted successfully",
      });
    }
  );
});

//
// START SERVER
//
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});