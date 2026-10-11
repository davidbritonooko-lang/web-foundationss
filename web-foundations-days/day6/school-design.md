# School Database System Design

## Table Explanations

* **`students`**: Stores core personal and contact details for each student registered in the school. The email column is constrained to be `UNIQUE` to prevent duplicate user registrations.
* **`courses`**: Stores the curriculum details, including the official course title and unique course code identifiers (e.g., `CS101`).
* **`enrolments`**: A junction (join) table that connects students to courses. It tracks the relationship between a student and a course while storing transactional attribute data specific to that relationship, such as the student's `grade`.

---

## Relationships & The Join Table

* **One-to-Many Relationships**: 
  * One student can have multiple enrolments (one-to-many with `enrolments`).
  * One course can have multiple enrolments (one-to-many with `enrolments`).
* **Many-to-Many Relationship & The Join Table**: 
  * Students and courses share a **many-to-many** relationship because a single student can enrol in multiple courses, and a single course can be taken by many students. 
  * A relational database cannot store arrays or multi-valued columns efficiently, which is why a join table (`enrolments`) is required. By breaking down the many-to-many relationship into two separate one-to-many relationships, the join table stores pairs of foreign keys (`student_id` and `course_id`) alongside relationship-specific metadata (like `grade`) and enforces uniqueness to prevent duplicate enrolments.

---

## Database Indexing

* **Recommended Index:** An index on the foreign key column `enrolments(student_id)` (and `enrolments(course_id)`).
* **Reason:** In a school system, frequent queries involve looking up all courses taken by a student or joining enrolment records against student profiles. Indexing these foreign key columns speeds up `JOIN` performance and speeds up lookup operations across large datasets.

---

## SQL vs. NoSQL Selection Rationale

For a school administration and academic tracking system, **SQL (Relational Database)** is the clear and superior choice. School data is inherently structured, relational, and deeply interconnected across entities (students, teachers, courses, enrolments, and grades). SQL databases guarantee ACID compliance, which is critical in academic settings to ensure data integrity—such as preventing orphaned enrolment records, ensuring unique student emails, and strictly enforcing constraints like preventing duplicate enrolments. NoSQL document stores lack native relational integrity enforcement, making relational databases much safer and more efficient for handling institutional records.