// src/controllers/admin-studentController.js

const { pool } = require("../config/db");

// Allowed columns for sorting to prevent SQL injection
const ALLOWED_SORT_COLUMNS = [
  "student_id",
  "student_name",
  "student_dob",
  "student_email",
  "student_major",
];

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  // Months are zero-based in JavaScript
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

const getStudentsPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 100;
  const offset = (page - 1) * limit;

  const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sortBy)
    ? req.query.sortBy
    : "student_id";
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

  try {
    const countResult = await pool.query("SELECT COUNT(*) FROM students");
    const totalStudents = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalStudents / limit);

    const query = `
            SELECT * FROM students
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $1 OFFSET $2
        `;
    const result = await pool.query(query, [limit, offset]);

    // Format student_dob as 'YYYY-MM-DD'
    const students = result.rows.map((student) => ({
      ...student,
      student_dob: formatDate(student.student_dob),
    }));

    res.render("admin-student-page", {
      students,
      currentPage: page,
      totalPages,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send("Server Error");
  }
};

const createStudent = async (req, res) => {
  const {
    student_id,
    student_name,
    student_dob,
    student_email,
    student_major,
  } = req.body;
  try {
    // Check for duplicate ID or email
    const existingStudent = await pool.query(
      "SELECT * FROM students WHERE student_id = $1 OR student_email = $2",
      [student_id, student_email]
    );

    if (existingStudent.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Student with the same ID or email already exists." });
    }

    await pool.query(
      "INSERT INTO students (student_id, student_name, student_dob, student_email, student_major) VALUES ($1, $2, $3, $4, $5)",
      [student_id, student_name, student_dob, student_email, student_major]
    );
    res.status(200).json({ message: "Student added successfully." });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updateStudent = async (req, res) => {
  const {
    student_id,
    student_name,
    student_dob,
    student_email,
    student_major,
  } = req.body;

  try {
    // Fetch the current student data
    const currentStudent = await pool.query(
      "SELECT * FROM students WHERE student_id = $1",
      [student_id]
    );

    if (currentStudent.rows.length === 0) {
      return res.status(404).json({ error: "Student not found." });
    }

    const currentData = currentStudent.rows[0];

    // Only update fields that have changed
    const updatedName =
      student_name !== currentData.student_name
        ? student_name
        : currentData.student_name;
    const updatedDob =
      student_dob !== formatDate(currentData.student_dob)
        ? student_dob
        : formatDate(currentData.student_dob);
    const updatedEmail =
      student_email !== currentData.student_email
        ? student_email
        : currentData.student_email;
    const updatedMajor =
      student_major !== currentData.student_major
        ? student_major
        : currentData.student_major;

    await pool.query(
      "UPDATE students SET student_name = $1, student_dob = $2, student_email = $3, student_major = $4 WHERE student_id = $5",
      [updatedName, updatedDob, updatedEmail, updatedMajor, student_id]
    );

    res.status(200).json({ message: "Student updated successfully." });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// Delete Student
const deleteStudent = async (req, res) => {
  const { student_id } = req.body;
  try {
    await pool.query("DELETE FROM students WHERE student_id = $1", [
      student_id,
    ]);
    res.redirect("/admin/student");
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).send("Server Error");
  }
};

// Search Students
const searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    const searchQuery = `%${query}%`;
    const result = await pool.query(
      "SELECT * FROM students WHERE student_id ILIKE $1 OR student_name ILIKE $1",
      [searchQuery]
    );

    // Format student_dob as 'YYYY-MM-DD'
    const students = result.rows.map((student) => ({
      ...student,
      student_dob: formatDate(student.student_dob),
    }));

    res.json({ students });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  getStudentsPage,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudents,
};
