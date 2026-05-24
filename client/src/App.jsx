import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  //
  // FETCH TASKS
  //
  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:3000/tasks", {
        params: {
          status: statusFilter || undefined,
          search: search || undefined,
          sort: sort || undefined,
        },
      });
  
      setTasks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  //
  // CREATE TASK
  //
  const createTask = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:3000/tasks", {
        title,
        description,
        status: "Pending",
        dueDate,
      });

      setTitle("");
      setDescription("");
      setDueDate("");

      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  //
  // DELETE TASK
  //
  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `http://localhost:3000/tasks/${id}`
      );

      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  //
  // UPDATE STATUS
  //
  const updateStatus = async (id, currentStatus) => {
    let newStatus = "Pending";

    if (currentStatus === "Pending") {
      newStatus = "In Progress";
    } else if (currentStatus === "In Progress") {
      newStatus = "Completed";
    }

    try {
      await axios.patch(
        `http://localhost:3000/tasks/${id}`,
        {
          status: newStatus,
        }
      );

      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, search, sort]);

  return (
    <div className="container">
      <h1>Task Manager</h1>

      <form onSubmit={createTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <input
          type="date"
          value={dueDate}
          onChange={(e) =>
            setDueDate(e.target.value)
          }
          required
        />

        <button type="submit">
          Create Task
        </button>
      </form>

      <div className="filters">
  <input
    type="text"
    placeholder="Search tasks..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All Statuses</option>
    <option value="Pending">Pending</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
  </select>

  <select
    value={sort}
    onChange={(e) => setSort(e.target.value)}
  >
    <option value="">Default</option>
    <option value="dueDate">Sort by Due Date</option>
  </select>

  <button
    onClick={() => {
      setSearch("");
      setStatusFilter("");
      setSort("");
    }}
  >
    Reset Filters
  </button>
</div>

      <div className="tasks">
        {tasks.map((task) => (
          <div
            className="task-card"
            key={task.id}
          >
            <h3>{task.title}</h3>

            <p>{task.description}</p>

            <p>
              <strong>Status:</strong>{" "}
              {task.status}
            </p>

            <p>
              <strong>Due:</strong>{" "}
              {task.dueDate}
            </p>

            <button
              onClick={() =>
                updateStatus(
                  task.id,
                  task.status
                )
              }
            >
              Update Status
            </button>

            <button
              onClick={() =>
                deleteTask(task.id)
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;