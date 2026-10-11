# Library REST API Design

A RESTful API specification for managing books within a digital library system. Base URL: `https://api.librarysystem.com/v1`

---

## Endpoints

### 1. List Books
* **Method:** `GET`
* **Path:** `/books`
* **Description:** Retrieve a paginated list of all books in the library inventory.
* **Success Status Code:** `200 OK`

### 2. List Books by Author (Query Parameter)
* **Method:** `GET`
* **Path:** `/books?author=George+Orwell`
* **Description:** Retrieve a filtered list of books written by a specific author.
* **Success Status Code:** `200 OK`

### 3. Get One Book
* **Method:** `GET`
* **Path:** `/books/{id}`
* **Description:** Retrieve detailed information for a single book identified by its unique ID.
* **Success Status Code:** `200 OK`

### 4. Create Book
* **Method:** `POST`
* **Path:** `/books`
* **Description:** Add a new book entry into the library catalog.
* **Example Request Body:**
  ```json
  {
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt",
    "isbn": "978-0201616224",
    "publishedYear": 1999
  }