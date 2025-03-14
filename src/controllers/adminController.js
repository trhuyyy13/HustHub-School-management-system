const { pool } = require("../config/db");

// Hàm xử lý trang chủ admin
const getHomePage = async (req, res) => {
  const totalStudentsdb = await pool.query(`SELECT COUNT(*) FROM Students;`);
  const totalTeachersdb = await pool.query(`SELECT COUNT(*) FROM Teachers;`);
  const totalClassessdb = await pool.query(`SELECT COUNT(*) FROM Classes;`);
  const totalStudents = totalStudentsdb.rows[0].count;
  const totalTeachers = totalTeachersdb.rows[0].count;
  const totalClasses = totalClassessdb.rows[0].count;

  res.render("admin-home-page", {
    totalStudents,
    totalClasses,
    totalTeachers,
    notices: [],
  });
};

// Hàm xử lý đăng xuất
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error logging out:", err);
      return res.redirect("/admin");
    }
    res.clearCookie("sessionId"); // Xóa cookie session
    res.redirect("/"); // Điều hướng đến trang chủ sau khi đăng xuất
  });
};
const searchCourses = async (req, res) => {
  const { searchText } = req.body;

  try {
    // Nếu searchText là rỗng, trả về tất cả khóa học
    const query = searchText
      ? `SELECT * FROM Courses WHERE course_id LIKE $1 OR course_name LIKE $1`
      : `SELECT * FROM Courses`;
    const params = searchText ? [`%${searchText}%`] : [];

    const result = await pool.query(query, params);
    const courses = result.rows;

    // Trả về HTML chứa danh sách khóa học từ partial view
    res.render("partials/courses-list", { courses: courses });
  } catch (err) {
    console.error("Lỗi khi truy vấn cơ sở dữ liệu:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const searchClasses = async (req, res) => {
  const { searchText1 } = req.body;

  try {
    // Nếu searchText là rỗng, trả về tất cả lớp học
    const query = searchText1
      ? `SELECT * FROM Classes WHERE class_id LIKE $1`
      : `SELECT * FROM Classes`;
    const params = searchText1 ? [`%${searchText1}%`] : [];

    const result = await pool.query(query, params);
    const classes = result.rows;

    // Trả về HTML chứa danh sách lớp học từ partial view
    res.render("partials/classes-list", { classes: classes });
  } catch (err) {
    console.error("Lỗi khi truy vấn cơ sở dữ liệu:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const createCourse = async (req, res) => {
  const { course_id, course_name, course_credit } = req.body;

  try {
    // Kiểm tra xem mã khóa học đã tồn tại chưa
    const course = await pool.query(
      "SELECT * FROM Courses WHERE course_id = $1",
      [course_id]
    );
    if (course.rows.length > 0) {
      return res.status(400).send("Mã khóa học đã tồn tại");
    }

    // Thêm khóa học vào cơ sở dữ liệu
    await pool.query(
      "INSERT INTO Courses (course_id, course_name, course_credit) VALUES ($1, $2, $3)",
      [course_id, course_name, course_credit]
    );
    res.status(201).send("Khóa học đã được tạo");
    console.log("Khóa học đã được tạo");
  } catch (err) {
    console.error("Lỗi khi tạo khóa học:", err);
    res.status(500).send("Có lỗi xảy ra");
    console.log("Có lỗi xảy ra");
  }
};

const updateCourse = async (req, res) => {
  const { course_id, course_name, course_credit } = req.body;

  try {
    await pool.query(
      "UPDATE Courses SET course_name = $2, course_credit = $3 WHERE course_id = $1",
      [course_id, course_name, course_credit]
    );
    res.status(200).send("Khóa học đã được cập nhật");
  } catch (err) {
    console.error("Lỗi khi cập nhật khóa học:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const deleteCourse = async (req, res) => {
  const { course_id } = req.body;

  try {
    await pool.query("DELETE FROM Courses WHERE course_id = $1", [course_id]);
    res.status(200).send("Khóa học đã được xóa");
  } catch (err) {
    console.error("Lỗi khi xóa khóa học:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const getCoursesPage = async (req, res) => {
  // Pass the data to the EJS template
  const result = await pool.query("SELECT * FROM Courses");
  const courses = result.rows;
  res.render("admin-courses-page", { courses: courses });
};

const getClassesPage = async (req, res) => {
  try {
    const courseId = req.params.course_id; // Lấy course_id từ URL nếu có

    let classesQuery, classes;
    if (courseId) {
      // Nếu có course_id, chỉ lấy các lớp thuộc khóa học đó
      classesQuery = `
                SELECT *
                FROM Classes 
                JOIN Teachers ON Classes.teacher_id = Teachers.teacher_id
                JOIN Courses ON Classes.course_id = Courses.course_id
                WHERE Classes.course_id = $1
            `;
      classes = (await pool.query(classesQuery, [courseId])).rows;
    } else {
      // Nếu không có course_id, lấy tất cả các lớp học
      classesQuery = `
                SELECT 
                    Classes.class_id, 
                    Classes.class_name, 
                    Classes.course_id, 
                    Classes.class_time_start, 
                    Classes.class_time_end,
                    Courses.course_name, 
                    Teachers.teacher_name
                FROM Classes 
                JOIN Courses ON Classes.course_id = Courses.course_id
                JOIN Teachers ON Classes.teacher_id = Teachers.teacher_id
            `;
      classes = (await pool.query(classesQuery)).rows;
    }

    // Nếu có course_id, lấy thêm thông tin chi tiết của khóa học
    let course = null;
    if (courseId) {
      const courseResult = await pool.query(
        "SELECT * FROM Courses WHERE course_id = $1",
        [courseId]
      );
      course = courseResult.rows[0];
    }

    // Render view `admin-classes-page` với danh sách các lớp học và thông tin khóa học
    res.render("admin-classes-page", { classes, course });
    //   res.render('partials/classes-list', { classes, course });
  } catch (error) {
    console.error("Error fetching classes or course:", error);
    res.status(500).send("Server Error");
  }
};

const createClass = async (req, res) => {
  const {
    class_id,
    course_id,
    teacher_id,
    room_id,
    class_time_start,
    class_time_end,
    class_time_day,
  } = req.body;
  console.log("Request body:", req.body);

  // Chỉ định giá trị semester tự động là 20241
  const semester = "20241";

  try {
    // Kiểm tra xem mã lớp học đã tồn tại chưa
    const classes = await pool.query(
      "SELECT * FROM Classes WHERE class_id = $1",
      [class_id]
    );
    if (classes.rows.length > 0) {
      return res.status(400).send("Mã lớp học đã tồn tại");
    }

    // Thêm lớp học vào cơ sở dữ liệu
    await pool.query(
      "INSERT INTO Classes (class_id, course_id, teacher_id, room_id, semester, class_time_start, class_time_end, class_time_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        class_id,
        course_id,
        teacher_id,
        room_id,
        semester,
        class_time_start,
        class_time_end,
        class_time_day,
      ]
    );

    res.status(201).send("Lớp học đã được tạo");
    console.log("Lớp học đã được tạo");
  } catch (err) {
    console.error("Lỗi khi tạo lớp học:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const updateClass = async (req, res) => {
  const {
    class_id,
    teacher_id,
    room_id,
    class_time_start,
    class_time_end,
    class_time_day,
    course_id2,
  } = req.body;
  console.log("Request body:", req.body);

  try {
    const classExists = await pool.query(
      "SELECT * FROM Classes WHERE class_id = $1",
      [class_id]
    );
    if (classExists.rows.length === 0) {
      return res.status(404).send("Không tìm thấy mã lớp học");
    }

    await pool.query(
      "UPDATE Classes SET teacher_id = $2, room_id = $3, class_time_start = $4, class_time_end = $5, class_time_day = $6 WHERE class_id = $1",
      [
        class_id,
        teacher_id,
        room_id,
        class_time_start,
        class_time_end,
        class_time_day,
      ]
    );
    res.status(200).send("Lớp học đã được cập nhật");
  } catch (err) {
    console.error("Lỗi khi cập nhật lớp học:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

const deleteClass = async (req, res) => {
  const { class_id, course_id1 } = req.body;
  console.log("Request body:", req.body);

  try {
    const classExists = await pool.query(
      "SELECT * FROM Classes WHERE class_id = $1",
      [class_id]
    );
    if (classExists.rows.length === 0) {
      return res.status(404).send("Không tìm thấy mã lớp học");
    }

    await pool.query("DELETE FROM Classes WHERE class_id = $1", [class_id]);
    res.status(200).send("Khóa học đã được xóa");
  } catch (err) {
    console.error("Lỗi khi xóa khóa học:", err);
    res.status(500).send("Có lỗi xảy ra");
  }
};

// Route
module.exports = {
  deleteClass,
  updateClass,
  createClass,
  searchClasses,
  getHomePage,
  logout,
  searchCourses,
  getCoursesPage,
  createCourse,
  updateCourse,
  deleteCourse,
  getClassesPage,
};
