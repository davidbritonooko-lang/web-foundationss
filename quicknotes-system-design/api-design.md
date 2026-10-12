# QuickNotes REST API Design

This document specifies the RESTful API design for the production QuickNotes service. Base URL: `https://api.quicknotes.com/v1`

## 1. Endpoint Overview Table

| **Method** | **Path** | **Description** | **Success Status Code** | 
| **GET** | `/notes` | Retrieve a paginated list of all notes for the authenticated user. | `200 OK` | 
| **GET** | `/notes/{id}` | Retrieve a single note by its unique ID. | `200 OK` | 
| **POST** | `/notes` | Create a new note. | `201 Created` | 
| **PUT** | `/notes/{id}` | Fully update or replace an existing note. | `200 OK` | 
| **PATCH** | `/notes/{id}` | Partially update an existing note (e.g., update title only). | `200 OK` | 
| **DELETE** | `/notes/{id}` | Permanently delete a note by its ID. | `204 No Content` | 

## 2. Request & Response Examples

### Creating a Note (`POST /notes`)

* **Request Headers:**

  * `Authorization: Bearer <token>`

  * `Content-Type: application/json`

* **Request Body Example:**

  ```
  {
    "title": "Project Architecture Planning",
    "body": "Finalize the database schema and review API endpoints with the team."
  }
  
  ```

* **Success Response (`201 Created`):**

  ```
  {
    "id": 42,
    "userId": 7,
    "title": "Project Architecture Planning",
    "body": "Finalize the database schema and review API endpoints with the team.",
    "createdAt": "2026-10-12T08:30:00Z",
    "updatedAt": "2026-10-12T08:30:00Z"
  }
  
  ```

### Listing Notes (`GET /notes`)

* **Request Headers:**

  * `Authorization: Bearer <token>`

* **Success Response (`200 OK`):**

  ```
  {
    "total": 2,
    "page": 1,
    "limit": 10,
    "data": [
      {
        "id": 42,
        "userId": 7,
        "title": "Project Architecture Planning",
        "body": "Finalize the database schema and review API endpoints with the team.",
        "createdAt": "2026-10-12T08:30:00Z",
        "updatedAt": "2026-10-12T08:30:00Z"
      },
      {
        "id": 41,
        "userId": 7,
        "title": "Grocery Shopping",
        "body": "Milk, eggs, coffee beans, and fresh bread.",
        "createdAt": "2026-10-11T14:15:00Z",
        "updatedAt": "2026-10-11T14:15:00Z"
      }
    ]
  }
  
  ```

## 3. Error Status Codes & Handling

All error responses return a standardized JSON body containing an error code, a descriptive message, and an optional validation error array.

### Error Response Schema Example

```
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid parameters.",
    "details": [
      {
        "field": "title",
        "issue": "Title is required and must not exceed 100 characters."
      }
    ]
  }
}

```

### Supported Error Codes

* **`400 Bad Request`**: Returned when request validation fails (e.g., missing mandatory `title` field, title exceeding 100 characters, or malformed JSON syntax).

* **`401 Unauthorized`**: Returned when the request lacks a valid authentication token or the token has expired/is invalid.

* **`403 Forbidden`**: Returned when an authenticated user attempts to access or modify a resource (e.g., a note) that belongs to another user.

* **`404 Not Found`**: Returned when the requested resource identifier (`id`) does not exist in the database (e.g., fetching or deleting note `/notes/99999`).

* **`500 Internal Server Error`**: Returned when an unexpected error occurs on the server side, such as a database connection drop or unhandled exception.