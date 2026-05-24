# DTS-Developer-Technical-Test

A full-stack task management application built for a technical assessment.  
The system allows users to create, view, update, and delete tasks via a RESTful API with a React frontend.

---

## Features

### Backend (REST API)
- Create a new task
- Retrieve all tasks
- Retrieve a task by ID
- Update task status
- Delete a task
- Input validation and error handling
- SQLite database integration

### Frontend (React)
- Create tasks via a form
- View all tasks in a clean interface
- Update task status
- Delete tasks
- Automatic UI updates after changes

---

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite3
- CORS

### Frontend
- React (Vite)
- Axios
- JavaScript (ES6+)

---

## Project Structure
dts-developer-technical-test/
│
├── server/
│ ├── database.js
│ ├── server.js
│ └── tasks.db
│
└── client/
├── src/
├── App.jsx
└── main.jsx
---
## Getting Started

### 1. Clone the repository
git clone https://github.com/lunarnode66/DTS-Developer-Technical-Test
cd dts-developer-technical-test

### 2. Backend Setup
cd server
npm install
#### Start the backend server:
http://localhost:3000

### 3. Front End Setup
cd client
npm install
npm run dev

#### The Frontend will run on:
http://localhost:5173