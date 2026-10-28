
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const STATUSES = ["Pending", "In Progress", "Completed"];

function getErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response) {
    return `The request failed with status ${error.response.status}. Please try again.`;
  }

  if (error.request) {
    return "Unable to connect to the server. Please check that the API is running.";
  }

  return "Something went wrong. Please try again.";
}

function App() {
  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingTaskId, setProcessingTaskId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch tasks using the selected filters.
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        params: {
          status: statusFilter || undefined,
          search: search.trim() || undefined,
          sort: sort || undefined,
        },
      });

      setTasks(response.data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, sort]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create a task.
  const createTask = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter a task title.");
      return;
    }

    if (!dueDate) {
      setErrorMessage("Please select a due date and time.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/tasks`, {
        title: title.trim(),
        description: description.trim(),
        status: "Pending",
        dueDate,
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setSuccessMessage("Task created successfully.");

      await fetchTasks();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a task.
  const deleteTask = async (id) => {
    setErrorMessage("");
    setSuccessMessage("");
    setProcessingTaskId(id);

    try {
      await axios.delete(`${API_URL}/tasks/${id}`);

      setSuccessMessage("Task deleted successfully.");
      await fetchTasks();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Move a task to its next status.
  const updateStatus = async (id, currentStatus) => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    const newStatus = STATUSES[(currentIndex + 1) % STATUSES.length];

    setErrorMessage("");
    setSuccessMessage("");
    setProcessingTaskId(id);

    try {
      await axios.patch(`${API_URL}/tasks/${id}`, {
        status: newStatus,
      });

      setSuccessMessage(`Task status changed to ${newStatus}.`);
      await fetchTasks();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessingTaskId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSort("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <main className="container">
      <h1>Task Manager</h1>

      {errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}

      <form onSubmit={createTask}>
        <label htmlFor="task-title">Task title</label>
        <input
          id="task-title"
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />

        <label htmlFor="task-description">Description (optional)</label>
        <textarea
          id="task-description"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label htmlFor="task-due-date">Due date and time</label>
        <input
          id="task-due-date"
          type="datetime-local"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating task..." : "Create Task"}
        </button>
      </form>

      <section className="filters" aria-label="Task filters">
        <label htmlFor="task-search">Search tasks</label>
        <input
          id="task-search"
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label htmlFor="task-sort">Sort tasks</label>
        <select
          id="task-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="">Default</option>
          <option value="dueDate">Due Date</option>
          <option value="status">Status</option>
        </select>

        <button type="button" onClick={resetFilters}>
          Reset Filters
        </button>
      </section>

      <section className="tasks" aria-label="Tasks">
        <h2>Your Tasks</h2>

        {isLoading ? (
          <p role="status">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>
            {search || statusFilter
              ? "No tasks match your current filters."
              : "No tasks yet. Create your first task above."}
          </p>
        ) : (
          <>
            <p>
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} found
            </p>

            {tasks.map((task) => {
              const isProcessing = processingTaskId === task.id;

              return (
                <article className="task-card" key={task.id}>
                  <h3>{task.title}</h3>

                  {task.description && <p>{task.description}</p>}

                  <p>
                    <strong>Status:</strong> {task.status}
                  </p>

                  <p>
                    <strong>Due:</strong>{" "}
                    {task.dueDate.replace("T", " ")}
                  </p>

                  <button
                    type="button"
                    onClick={() => updateStatus(task.id, task.status)}
                    disabled={isProcessing || isLoading}
                    aria-label={`Change status for ${task.title}`}
                  >
                    {isProcessing ? "Updating..." : "Update Status"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    disabled={isProcessing || isLoading}
                    aria-label={`Delete ${task.title}`}
                  >
                    {isProcessing ? "Please wait..." : "Delete"}
                  </button>
                </article>
              );
            })}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
