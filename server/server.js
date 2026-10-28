
const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

const validStatuses = ["Pending", "In Progress", "Completed"];

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Validation helpers
function isValidTaskId(id) {
  return /^\d+$/.test(id) &&
    Number.isSafeInteger(Number(id)) &&
    Number(id) > 0;
}

function isValidDueDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  // Accept the YYYY-MM-DDTHH:mm format used by datetime-local,
  // with optional seconds and milliseconds.
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/
  );

  if (!match) {
    return false;
  }

  const [
    ,
    yearString,
    monthString,
    dayString,
    hourString,
    minuteString,
    secondString = "0",
    millisecondString = "0",
  ] = match;

  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const second = Number(secondString);
  const millisecond = Number(millisecondString.padEnd(3, "0"));

  if (
    month < 1 ||
    month > 12 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second &&
    date.getUTCMilliseconds() === millisecond
  );
}

function isValidRequestBody(body) {
  return (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
}

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Task API is running" });
});

// Get all tasks, with optional filtering and sorting
app.get("/tasks", (req, res) => {
  const { status, search, sort } = req.query;

  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  if (search) {
    sql += " AND title LIKE ?";
    params.push(`%${search}%`);
  }

  if (sort === "dueDate") {
    sql += " ORDER BY dueDate ASC";
  } else if (sort === "status") {
    sql += " ORDER BY status ASC";
  } else {
    sql += " ORDER BY id DESC";
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json(rows);
  });
});

// Get a task by ID
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;

  if (!isValidTaskId(id)) {
    return res.status(400).json({
      error: "Task ID must be a positive integer.",
    });
  }

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(row);
  });
});

// Create a task
app.post("/tasks", (req, res) => {
  const body = req.body;

  if (!isValidRequestBody(body)) {
    return res.status(400).json({
      error: "A valid request body is required.",
    });
  }

  const { title, description = "", status, dueDate } = body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    !status ||
    !dueDate
  ) {
    return res.status(400).json({
      error: "Title, status, and due date are required.",
    });
  }

  if (typeof description !== "string") {
    return res.status(400).json({
      error: "Description must be a string.",
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status value.",
    });
  }

  if (!isValidDueDate(dueDate)) {
    return res.status(400).json({
      error: "Due date must be a valid date and time in YYYY-MM-DDTHH:mm format.",
    });
  }

  const trimmedTitle = title.trim();

  const sql = `
    INSERT INTO tasks (title, description, status, dueDate)
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    sql,
    [trimmedTitle, description, status, dueDate],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      return res.status(201).json({
        id: this.lastID,
        title: trimmedTitle,
        description,
        status,
        dueDate,
      });
    }
  );
});

// Update a task's status
app.patch("/tasks/:id", (req, res) => {
  const { id } = req.params;

  if (!isValidTaskId(id)) {
    return res.status(400).json({
      error: "Task ID must be a positive integer.",
    });
  }

  if (!isValidRequestBody(req.body)) {
    return res.status(400).json({
      error: "A valid request body is required.",
    });
  }

  const { status } = req.body;

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
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      return res.status(200).json({
        message: "Task updated successfully",
      });
    }
  );
});

// Delete a task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  if (!isValidTaskId(id)) {
    return res.status(400).json({
      error: "Task ID must be a positive integer.",
    });
  }

  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  });
});

// Start the server only when this file is run directly.
// This allows Jest and Supertest to import the app without opening a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


 // Handle errors from JSON parsing and other middleware.
 app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON in request body.",
    });
  }

  console.error("Unexpected API error:", err.message);

  return res.status(err.status || 500).json({
    error:
      err.status >= 400 && err.status < 500
        ? err.message
        : "An unexpected server error occurred.",
  });
});

// Start the server only when this file is run directly.
// This allows Jest and Supertest to import the app without opening a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

