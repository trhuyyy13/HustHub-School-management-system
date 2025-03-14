// src/controllers/admin-teacherController.js

const { pool } = require("../config/db");

// Allowed columns for sorting to prevent SQL injection
const ALLOWED_SORT_COLUMNS = [
  "teacher_id",
  "teacher_name",
  "teacher_faculty",
  "teacher_email",
];

const getTeachersPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 100;
  const offset = (page - 1) * limit;

  // Get sort parameters from query, default to teacher_id
  const sortBy = ALLOWED_SORT_COLUMNS.includes(req.query.sortBy)
    ? req.query.sortBy
    : "teacher_id";
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

  try {
    const countResult = await pool.query("SELECT COUNT(*) FROM teachers");
    const totalTeachers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTeachers / limit);

    const query = `
            SELECT * FROM teachers
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT $1 OFFSET $2
        `;
    const result = await pool.query(query, [limit, offset]);
    const teachers = result.rows;

    res.render("admin-teacher-page", {
      teachers,
      currentPage: page,
      totalPages,
      sortBy,
      sortOrder,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).send("Server Error");
  }
};
// Create New Teacher
const createTeacher = async (req, res) => {
  const { teacher_id, teacher_name, teacher_faculty, teacher_email } = req.body;
  try {
    // Check if a teacher with the same ID or email already exists
    const existingTeacher = await pool.query(
      "SELECT * FROM teachers WHERE teacher_id = $1 OR teacher_email = $2",
      [teacher_id, teacher_email]
    );

    if (existingTeacher.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Teacher with the same ID or email already exists." });
    }

    // Insert the new teacher
    await pool.query(
      "INSERT INTO teachers (teacher_id, teacher_name, teacher_faculty, teacher_email) VALUES ($1, $2, $3, $4)",
      [teacher_id, teacher_name, teacher_faculty, teacher_email]
    );
    res.status(200).json({ message: "Teacher added successfully." });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

const updateTeacher = async (req, res) => {
  const { teacher_id, teacher_name, teacher_faculty, teacher_email } = req.body;
  try {
    // Fetch the current teacher data
    const currentTeacher = await pool.query(
      "SELECT * FROM teachers WHERE teacher_id = $1",
      [teacher_id]
    );

    if (currentTeacher.rows.length === 0) {
      return res.status(404).json({ error: "Teacher not found." });
    }

    const currentData = currentTeacher.rows[0];

    // Only update fields that have changed
    const updatedName =
      teacher_name !== currentData.teacher_name
        ? teacher_name
        : currentData.teacher_name;
    const updatedFaculty =
      teacher_faculty !== currentData.teacher_faculty
        ? teacher_faculty
        : currentData.teacher_faculty;
    const updatedEmail =
      teacher_email !== currentData.teacher_email
        ? teacher_email
        : currentData.teacher_email;

    await pool.query(
      "UPDATE teachers SET teacher_name = $1, teacher_faculty = $2, teacher_email = $3 WHERE teacher_id = $4",
      [updatedName, updatedFaculty, updatedEmail, teacher_id]
    );

    res.status(200).json({ message: "Teacher updated successfully." });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// Delete Teacher
const deleteTeacher = async (req, res) => {
  const { teacher_id } = req.body;
  try {
    await pool.query("DELETE FROM teachers WHERE teacher_id = $1", [
      teacher_id,
    ]);
    res.redirect("/admin/teacher");
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).send("Server Error");
  }
};

// Search Teachers
const searchTeachers = async (req, res) => {
  const { query } = req.query;
  try {
    const searchQuery = `%${query}%`;
    const result = await pool.query(
      "SELECT * FROM teachers WHERE teacher_id ILIKE $1 OR teacher_name ILIKE $1",
      [searchQuery]
    );
    res.json({ teachers: result.rows });
  } catch (error) {
    console.error("Error searching teachers:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  getTeachersPage,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  searchTeachers,
};
