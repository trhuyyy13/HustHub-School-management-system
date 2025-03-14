CREATE TABLE Students (
    student_id VARCHAR(8) PRIMARY KEY,
    student_name VARCHAR(50),
    student_dob DATE,
    student_email VARCHAR(100) UNIQUE,
    student_major VARCHAR(50)
);

CREATE TABLE Teachers (
    teacher_id VARCHAR(10) PRIMARY KEY,
    teacher_name VARCHAR(50),
    teacher_faculty VARCHAR(50),
    teacher_email VARCHAR(100) UNIQUE
);

CREATE TABLE Courses (
    course_id VARCHAR(6) PRIMARY KEY,
    course_name VARCHAR(100),
    course_credit INT
);

CREATE TABLE Rooms (
    room_id VARCHAR(10) PRIMARY KEY,
    room_name VARCHAR(50) UNIQUE,
    capacity INT
);

CREATE TABLE Classes (
    class_id SERIAL PRIMARY KEY,            -- Use SERIAL for auto-incrementing
    course_id VARCHAR(6),
    teacher_id VARCHAR(10),
    room_id VARCHAR(10),
    semester VARCHAR(10),
    class_time_start TIME,
    class_time_end TIME,
    class_time_day VARCHAR(20),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Teachers(teacher_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Enrollments (
    enrollment_id SERIAL PRIMARY KEY,        -- Use SERIAL for auto-incrementing
    student_id VARCHAR(8),
    class_id INT,
    enrollment_date DATE,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Grades (
    grade_id SERIAL PRIMARY KEY,             -- Use SERIAL for auto-incrementing
    enrollment_id INT,
    midterm_score FLOAT,
    final_score FLOAT,
    FOREIGN KEY (enrollment_id) REFERENCES Enrollments(enrollment_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);
