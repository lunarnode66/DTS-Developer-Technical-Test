# Task Management Application

A full-stack task management application built as part of a software development technical assessment. The project demonstrates REST API development, database integration, input validation, automated testing, and frontend development using React.

## Features

### Task Management
- Create tasks with a title, optional description, status, and due date and time.
- Retrieve all tasks or an individual task by ID.
- Update task status.
- Delete tasks.
- Search tasks by title.
- Filter tasks by status.
- Sort tasks by due date or status.

### Backend
- RESTful API built with Node.js and Express.
- SQLite database integration for task persistence.
- Input validation and consistent error responses.
- Parameterised SQL queries.
- CORS configuration.
- Automated API tests using Jest and Supertest.
- Configurable database path for isolated testing.

### Frontend
- React interface built with Vite.
- API communication using Axios.
- Task creation, status updates, and deletion.
- Search, filtering, and sorting.
- Loading, success, and error feedback.
- Responsive layout and form validation.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, Axios |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Testing | Jest, Supertest |
| Development Tools | npm, Git, GitHub |

## Project Structure

```text
DTS-Developer-Technical-Test/
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── tests/
│   │   └── tasks.test.js
│   ├── database.js
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

The SQLite database is created automatically when the backend starts, if it does not already exist.

## Getting Started

### Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/) and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/lunarnode66/DTS-Developer-Technical-Test.git
cd DTS-Developer-Technical-Test
```

### 2. Set Up the Backend

Open a terminal in the project directory and run:

```bash
cd server
npm install
npm start
```

The API will be available at:

`http://localhost:3000`

Keep this terminal running.

### 3. Set Up the Frontend

Open a second terminal in the project directory and run:

```bash
cd client
npm install
npm run dev
```

Open the frontend at:

`http://localhost:5173`

Both the frontend and backend must be running for the application to work correctly.

## API Documentation

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check the API root |
| GET | `/tasks` | Retrieve all tasks |
| GET | `/tasks/:id` | Retrieve a task by ID |
| POST | `/tasks` | Create a new task |
| PATCH | `/tasks/:id` | Update a task's status |
| DELETE | `/tasks/:id` | Delete a task |

### Query Parameters

The `GET /tasks` endpoint supports the following optional query parameters:

| Parameter | Description | Example |
|---|---|---|
| `status` | Filter by task status | `?status=Pending` |
| `search` | Search task titles | `?search=report` |
| `sort` | Sort by due date or status | `?sort=dueDate` |

Parameters can be combined, for example:

`http://localhost:3000/tasks?status=Pending&search=report&sort=dueDate`

### Create a Task

**Request:** `POST /tasks`

```json
{
  "title": "Complete project documentation",
  "description": "Write the README and API documentation",
  "status": "Pending",
  "dueDate": "2026-12-15T17:00"
}
```

The title, status, and due date are required. The description is optional.

### Update Task Status

**Request:** `PATCH /tasks/:id`

```json
{
  "status": "In Progress"
}
```

Valid statuses are:

- `Pending`
- `In Progress`
- `Completed`

### Error Handling

The API validates incoming data and returns appropriate HTTP status codes for invalid requests, missing tasks, malformed JSON, and unexpected server errors.

## Running Tests

The backend includes automated API tests covering task operations, validation, and error handling.

From the `server` directory, run:

```bash
npm test
```

The test suite uses a separate temporary SQLite database to avoid modifying the application's normal database during testing.

## Design Decisions

- **RESTful architecture:** HTTP methods and resource-based endpoints provide a clear API structure.
- **SQLite:** A lightweight relational database keeps local setup straightforward.
- **Parameterized queries:** User-provided values are passed as SQL parameters rather than concatenated into query strings.
- **Input validation:** Invalid task data is rejected before database operations.
- **Automated testing:** Jest and Supertest verify API behaviour and error handling.
- **Separation of concerns:** The frontend, API, and database logic are organised into separate files and directories.

## Future Improvements

- Add task editing beyond status changes.
- Introduce authentication and user-specific tasks.
- Add pagination for larger task collections.
- Expand frontend component and integration tests.
- Add deployment and continuous integration workflows.

## License

This project was developed for a technical assessment and portfolio purposes. No licence has been specified.