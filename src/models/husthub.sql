
CREATE Table [Students] (
    student_id VARCHAR(8) primary key,
    student_name VARCHAR(50),
    student_dob DATE,
    student_email VARCHAR(100) unique,
    student_major VARCHAR(50)
)

CREATE Table [Teachers] (
    teacher_id VARCHAR(10) primary key,
    teacher_name VARCHAR(50),
    teacher_faculty VARCHAR(50),
    teacher_email VARCHAR(100) unique
)

CREATE Table [Courses] (
    course_id VARCHAR(6) primary key,
    course_name VARCHAR(100),
    course_credit INT
)

CREATE Table Rooms (
    room_id VARCHAR(10) primary key,
    room_name VARCHAR(50) unique,
    capacity INT
)

CREATE Table Classes (
    class_id INT identity(1,1) primary key,
    course_id VARCHAR(6),
    teacher_id VARCHAR(10),
    room_id VARCHAR(10),
    semester VARCHAR(10),
    class_time_start TIME,
    class_time_end TIME,
    class_time_day VARCHAR(20),
	FOREIGN KEY ([course_id]) REFERENCES [Courses] ([course_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY ([teacher_id]) REFERENCES [Teachers] ([teacher_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY ([room_id]) REFERENCES [Rooms] ([room_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE
)

CREATE Table Enrollments (
    enrollment_id INT identity(1,1) primary key,
    student_id VARCHAR(8),
    class_id INT,
    enrollment_date DATE,
	FOREIGN KEY ([student_id]) REFERENCES [Students] ([student_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY ([class_id]) REFERENCES [Classes] ([class_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE
)

CREATE Table Grades (
    grade_id INT identity(1,1) primary key,
    enrollment_id INT,
    midterm_score FLOAT,
    final_score FLOAT,
	FOREIGN KEY ([enrollment_id]) REFERENCES [Enrollments] ([enrollment_id]) 
    ON DELETE CASCADE ON UPDATE CASCADE
)

--Testing data admin
-- CREATE TABLE admins (
--     username VARCHAR(50) UNIQUE NOT NULL,
--     password VARCHAR(255) NOT NULL,
--     role VARCHAR(50) NOT NULL
-- );
-- INSERT INTO admins (username, password, role) VALUES ('admin', 'admin_password', 'admin');









