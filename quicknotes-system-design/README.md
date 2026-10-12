# QuickNotes

## Description
QuickNotes is a full-stack note-taking web application designed to transition from a browser-only client to a scalable cloud service supporting 1 million users. The project encompasses a robust front-end API client (`index.html`, `style.css`, `api.js`) interacting with RESTful endpoints, alongside comprehensive architectural and database design documentation for backend implementation.

---

## How to Run the API Client
1. Clone or download the repository to your local machine.
2. Ensure you have the following files in your project root:
   - `index.html`
   - `style.css`
   - `api.js`
3. Open `index.html` in any modern web browser directly, or serve it using a local development server (such as Live Server in VS Code).
4. Click **"Load notes"** to fetch and view notes from the JSONPlaceholder practice API.
5. Use the form to create a new note (validated for titles up to 100 characters) or click **"Delete"** on any note item to remove it.

---

## Design Documents
* **[API Design (`docs/api-design.md`)](docs/api-design.md)**: Defines RESTful endpoints, request/response JSON payloads, and error handling codes (`400`, `401`, `403`, `404`, `500`).
* **[Data Model (`docs/data-model.md`)](docs/data-model.md)**: Details the relational database schema (`users`, `notes`, `tags`, `note_tags`), foreign keys, join tables, indexing strategy, and SQL vs. NoSQL justification.
* **[Architecture (`docs/architecture.md`)](docs/architecture.md)**: Outlines functional/non-functional requirements, traffic estimates for 1M users, system architecture diagram, request flows, and single-point-of-failure (SPOF) mitigation.

---

## What I Learned
1. **RESTful Architecture Principles:** Designing clear, resource-oriented endpoint structures using proper HTTP methods (`GET`, `POST`, `DELETE`) and standard status codes (`200`, `201`, `204`).
2. **Relational Database Modeling:** Structuring complex many-to-many relationships using junction/join tables and indexing foreign keys to optimize query performance for large-scale applications.
3. **Front-End Asynchronous State Management:** Handling asynchronous JavaScript (`async/await`) cycles with robust error handling (`try/catch/finally`), input validation, and UI state management (loading, success, error, and empty states).