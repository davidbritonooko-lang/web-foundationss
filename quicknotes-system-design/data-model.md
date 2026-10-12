# QuickNotes Data Model & Database Architecture

This document outlines the relational database schema, table structures, constraints, relationships, and technology selection for the QuickNotes application.

---

## 1. Entities & Columns

### 1. `users`
Stores account and authentication credentials for registered users.
* `id` (`INTEGER`, Primary Key, Auto-increment)
* `username` (`TEXT`, Not Null, Unique)
* `email` (`TEXT`, Not Null, Unique)
* `created_at` (`TIMESTAMP`, Default Current Timestamp)

### 2. `notes`
Stores the core note records created by users.
* `id` (`INTEGER`, Primary Key, Auto-increment)
* `user_id` (`INTEGER`, Not Null, Foreign Key referencing `users(id)`)
* `title` (`TEXT`, Not Null)
* `body` (`TEXT`)
* `created_at` (`TIMESTAMP`, Default Current Timestamp)

### 3. `tags`
Stores categorical tags that users can assign to notes.
* `id` (`INTEGER`, Primary Key, Auto-increment)
* `name` (`TEXT`, Not Null, Unique)

### 4. `note_tags`
A junction table resolving the many-to-many relationship between notes and tags.
* `id` (`INTEGER`, Primary Key, Auto-increment)
* `note_id` (`INTEGER`, Not Null, Foreign Key referencing `notes(id)`)
* `tag_id` (`INTEGER`, Not Null, Foreign Key referencing `tags(id)`)
* Constraint: `UNIQUE(note_id, tag_id)` to prevent duplicate tagging.

---

## 2. Relationships Explained

* **One-to-Many Relationships**:
  * **User to Notes**: One user can author many notes, but each note belongs to exactly one user (`notes.user_id`).
* **Many-to-Many Relationships**:
  * **Notes to Tags**: A single note can possess multiple tags (e.g., `#work`, `#urgent`), and a single tag can be applied to many different notes. Relational databases cannot store multi-valued arrays efficiently in a single column; therefore, a **join table (`note_tags`)** is required. It breaks down the many-to-many relationship into two one-to-many relationships by holding foreign key pairs (`note_id` and `tag_id`).

---

## 3. CREATE TABLE Statements

```sql
-- Drop tables if they already exist (in correct order of dependency)
DROP TABLE IF EXISTS note_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(note_id, tag_id)
);
```

---

## 4. Example SQL Queries

### Query 1: Retrieve all notes for a specific user ordered by newest first
```sql
SELECT id, title, body, created_at 
FROM notes 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Query 2: JOIN query to find all notes associated with a specific tag name (e.g., 'Work')
```sql
SELECT n.id, n.title, n.body 
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON t.id = nt.tag_id
WHERE t.name = 'Work';
```

### Query 3: Aggregate count of notes per user
```sql
SELECT u.username, COUNT(n.id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.username;
```

---

## 5. Indexing Strategy

* **Recommended Index:** `CREATE INDEX idx_notes_user_id ON notes(user_id);`
* **Reason:** In a note-taking application, users constantly query their own note lists (`WHERE user_id = ?`). Without an index, the database would perform a full table scan across all notes in the system. Indexing `user_id` allows the database engine to instantly locate and retrieve a user's notes with high performance.

---

## 6. Technology Justification: SQL vs. NoSQL

For QuickNotes, a **relational SQL database** is selected. Note-taking and tagging systems are fundamentally relational, involving structured entities (`users`, `notes`, `tags`) bound by strict foreign key constraints and many-to-many associations. SQL guarantees ACID compliance, ensuring data integrity and preventing orphaned records (e.g., ensuring notes cannot exist without a valid user). While NoSQL offers flexible schemas, it lacks native relational query capabilities like multi-table joins, making SQL the superior choice for maintainability and data consistency.