-- day6/school.sql - School Database Schema, Seed Data, and Queries

-- Drop tables if they already exist to ensure clean execution
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;

-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    -- Rule preventing the same student enrolling on the same course twice
    UNIQUE(student_id, course_id)
);


-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

-- Insert students (including Diana Prince who has no enrolments to test LEFT JOINs)
INSERT INTO students (name, email) VALUES 
('Alice Smith', 'alice@example.com'),
('Bob Jones', 'bob@example.com'),
('Charlie Brown', 'charlie@example.com'),
('Diana Prince', 'diana@example.com');

-- Insert courses
INSERT INTO courses (title, code) VALUES 
('Introduction to Computer Science', 'CS101'),
('Database Management Systems', 'CS202'),
('Web Foundations', 'WD101');

-- Insert enrolments (at least 5)
INSERT INTO enrolments (student_id, course_id, grade) VALUES 
(1, 1, 'A'),
(1, 2, 'B+'),
(2, 1, 'A-'),
(2, 3, 'B'),
(3, 2, 'A');


-- ==========================================
-- 3. FIVE CORE QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name, e.g., 'Alice Smith')
SELECT c.title, c.code, e.grade 
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON s.id = e.student_id
WHERE s.name = 'Alice Smith';

-- Query 2: All students on one course (by course title, e.g., 'Introduction to Computer Science')
SELECT s.name, s.email, e.grade 
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE c.title = 'Introduction to Computer Science';

-- Query 3: The number of students per course (including courses with 0 students)
SELECT c.title, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.title;

-- Query 4: Students who have no enrolments
SELECT s.name, s.email 
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- Query 5: Update of one enrolment's grade (updating Alice's grade in CS101 from 'A' to 'A+')
UPDATE enrolments 
SET grade = 'A+' 
WHERE student_id = 1 AND course_id = 1;