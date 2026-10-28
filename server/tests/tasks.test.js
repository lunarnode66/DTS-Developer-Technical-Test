
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

// Create a separate temporary database for this test suite.
const testDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "hmcts-task-api-")
);

process.env.TASKS_DB_PATH = path.join(testDirectory, "tasks.db");

// Set the database path before importing the application.
const app = require("../server");
const db = require("../database");

const validTask = (overrides = {}) => ({
  title: "Test task",
  description: "Created during automated testing",
  status: "Pending",
  dueDate: "2027-01-15T10:00:00",
  ...overrides,
});

const createTask = async (overrides = {}) => {
  return request(app).post("/tasks").send(validTask(overrides));
};

afterAll(async () => {
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  fs.rmSync(testDirectory, { recursive: true, force: true });
  delete process.env.TASKS_DB_PATH;
});

describe("Task API", () => {
  describe("GET /", () => {
    it("returns a successful health check", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Task API is running",
      });
    });
  });

  describe("GET /tasks", () => {
    it("returns an array of tasks", async () => {
      const response = await request(app).get("/tasks");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("returns tasks with the expected properties", async () => {
      await createTask();

      const response = await request(app).get("/tasks");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Test task",
            description: "Created during automated testing",
            status: "Pending",
            dueDate: "2027-01-15T10:00:00",
          }),
        ])
      );
    });

    it("filters tasks by status", async () => {
      await createTask({ title: "Pending task", status: "Pending" });
      await createTask({ title: "Completed task", status: "Completed" });

      const response = await request(app)
        .get("/tasks")
        .query({ status: "Completed" });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe("Completed task");
    });

    it("searches tasks by title", async () => {
      await createTask({ title: "Prepare case file" });
      await createTask({ title: "Review documents" });

      const response = await request(app)
        .get("/tasks")
        .query({ search: "case" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Prepare case file");
    });

    it("sorts tasks by due date", async () => {
      await createTask({
        title: "Later task",
        dueDate: "2027-03-01T10:00:00",
      });
      await createTask({
        title: "Earlier task",
        dueDate: "2027-01-01T10:00:00",
      });

      const response = await request(app)
        .get("/tasks")
        .query({ sort: "dueDate" });

      expect(response.status).toBe(200);

      const dates = response.body.map((task) => task.dueDate);
      expect(dates).toEqual([...dates].sort());
    });

    it("sorts tasks by status", async () => {
      await createTask({ title: "Pending", status: "Pending" });
      await createTask({ title: "Completed", status: "Completed" });
      await createTask({ title: "In progress", status: "In Progress" });

      const response = await request(app)
        .get("/tasks")
        .query({ sort: "status" });

      expect(response.status).toBe(200);

      const statuses = response.body.map((task) => task.status);
      expect(statuses).toEqual([...statuses].sort());
    });
  });

  describe("GET /tasks/:id", () => {
    it("returns a task when its ID exists", async () => {
      const created = await createTask({ title: "Find this task" });

      const response = await request(app).get(
        `/tasks/${created.body.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(created.body.id);
      expect(response.body.title).toBe("Find this task");
    });

    it("returns 404 when the task does not exist", async () => {
      const response = await request(app).get("/tasks/999999999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    it.each(["abc", "1.5", "-1", "0"])(
      "rejects an invalid task ID: %s",
      async (id) => {
        const response = await request(app).get(`/tasks/${id}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      }
    );
  });

  describe("POST /tasks", () => {
    it("creates a task and returns 201", async () => {
      const response = await createTask();

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(validTask());
      expect(response.body.id).toEqual(expect.any(Number));
    });

    it("allows the optional description to be omitted", async () => {
      const { description, ...task } = validTask();

      const response = await request(app)
        .post("/tasks")
        .send(task);

      expect(response.status).toBe(201);
      expect(response.body.description).toBe("");
    });

    it.each([
      ["title", { status: "Pending", dueDate: "2027-01-15T10:00:00" }],
      ["status", { title: "Test task", dueDate: "2027-01-15T10:00:00" }],
      ["dueDate", { title: "Test task", status: "Pending" }],
    ])("rejects a task missing %s", async (field, task) => {
      const response = await request(app)
        .post("/tasks")
        .send(task);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects an empty title", async () => {
      const response = await createTask({ title: "" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects a title containing only whitespace", async () => {
      const response = await createTask({ title: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects a title that is not a string", async () => {
      const response = await createTask({ title: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects a description that is not a string", async () => {
      const response = await createTask({
        description: { text: "Invalid" },
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("rejects a due date that is not a string", async () => {
      const response = await createTask({ dueDate: 12345 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it.each([
      "not-a-date",
      "2027-02-30T10:00:00",
      "2027-13-01T10:00:00",
    ])("rejects an invalid due date: %s", async (dueDate) => {
      const response = await createTask({ dueDate });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it.each(["Unknown", "Done", "Cancelled"])(
      "rejects invalid status %s",
      async (status) => {
        const response = await createTask({ status });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Invalid status value.");
      }
    );
  });

  describe("PATCH /tasks/:id", () => {
    it("updates the status of an existing task", async () => {
      const created = await createTask({ status: "Pending" });

      const response = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: "In Progress" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Task updated successfully");

      const updated = await request(app).get(
        `/tasks/${created.body.id}`
      );

      expect(updated.body.status).toBe("In Progress");
    });

    it("rejects a request without a status", async () => {
      const created = await createTask();

      const response = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Status is required.");
    });

    it("rejects an invalid status", async () => {
      const created = await createTask();

      const response = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: "Unknown" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid status value.");
    });

    it("returns 404 when updating a nonexistent task", async () => {
      const response = await request(app)
        .patch("/tasks/999999999")
        .send({ status: "Completed" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    it("rejects an invalid task ID when updating", async () => {
      const response = await request(app)
        .patch("/tasks/abc")
        .send({ status: "Completed" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("deletes an existing task", async () => {
      const created = await createTask();

      const response = await request(app).delete(
        `/tasks/${created.body.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Task deleted successfully");

      const lookup = await request(app).get(
        `/tasks/${created.body.id}`
      );

      expect(lookup.status).toBe(404);
    });

    it("returns 404 when deleting a nonexistent task", async () => {
      const response = await request(app).delete("/tasks/999999999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    it("rejects an invalid task ID when deleting", async () => {
      const response = await request(app).delete("/tasks/abc");

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
