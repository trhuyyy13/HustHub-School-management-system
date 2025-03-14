const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const PayOS = require("@payos/node");

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

const showStudentPage = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    // Lấy thông tin sinh viên
    const studentResult = await pool.query(
      "SELECT * FROM students WHERE student_id = $1",
      [studentId]
    );

    // Lấy thông tin học phí
    const tuitionQuery = `
            SELECT c.course_id, c.course_name, c.course_credit
            FROM Enrollments e
            JOIN Classes cl ON e.class_id = cl.class_id
            JOIN Courses c ON cl.course_id = c.course_id
            WHERE e.student_id = $1
        `;
    const tuitionResult = await pool.query(tuitionQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).send("Student not found");
    }

    //Lấy thông tin tất cả khóa học để cho đăng ký lớp
    const courseQuery = `
            SELECT * FROM courses
        `;
    const coursesResult = await pool.query(courseQuery);

    //Lấy thông tin các lớp đăng ký
    const enrollmentQuery = `
        SELECT * FROM public.courses co
        JOIN public.classes cl ON cl.course_id = co.course_id
        JOIN public.enrollments en ON en.class_id = cl.class_id
        WHERE en.student_id = $1  
    `;
    const enrollmentResult = await pool.query(enrollmentQuery, [studentId]);

    res.render("student-page", {
      student: studentResult.rows[0],
      courses: coursesResult.rows,
      enrollments: enrollmentResult.rows,
      checkPayment: studentResult.rows[0].check_payment, // Add this line
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const avatarBuffer = req.file.buffer;

    await pool.query("UPDATE students SET avatar = $1 WHERE student_id = $2", [
      avatarBuffer,
      studentId,
    ]);

    res.json({
      success: true,
      avatar: avatarBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

const generateQR = async (req, res) => {
  const YOUR_DOMAIN = `http://localhost:3000`;
  const body = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount: 20000,
    description: "Thanh toan hoc phi",
    items: [
      {
        name: "Thanh toan hoc phi",
        quantity: 10,
        price: 2000,
      },
    ],
    returnUrl: `${YOUR_DOMAIN}/student/update-payment-status`, //thanhcong
    cancelUrl: `${YOUR_DOMAIN}/student/update-payment-status`,
  };

  try {
    const paymentLinkResponse = await payOS.createPaymentLink(body);

    res.send(paymentLinkResponse);
  } catch (error) {
    console.error(error);
    res.send("Something went error");
  }
};

const updatePaymentStatus = async (req, res) => {
  const studentId = req.user.user_id;

  console.log("paid");

  try {
    await pool.query(
      "UPDATE students SET check_payment = true WHERE student_id = $1",
      [studentId]
    );
    res
      .status(200)
      .json({ success: true, message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const viewClasses = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const classQuery = `
      SELECT class_id, course_id, teacher_name, room_id, semester, class_time_start, class_time_end, class_time_day FROM public.classes cl
      JOIN public.teachers t ON cl.teacher_id = t.teacher_id
      WHERE cl.course_id = $1
    `;
    const classResult = await pool.query(classQuery, [courseId]);

    res.json(classResult.rows);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).send("Internal Server Error");
  }
};

const generateRandomId = () => {
  return Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
};
const registerForClass = async (req, res) => {
  const student_id = req.user.user_id;
  const class_id = req.body.classId;
  const course_id = req.body.courseId;
  const enrollment_id = generateRandomId();
  const enrollment_date = new Date(); // Current date and time

  console.log(class_id, student_id, course_id);

  try {
    // Check if the student is already enrolled in the course
    const checkCourseQuery = `
      SELECT * FROM enrollments e
      JOIN classes cl ON e.class_id = cl.class_id
      WHERE e.student_id = $1 AND cl.course_id = $2
    `;
    const checkCourseResult = await pool.query(checkCourseQuery, [
      student_id,
      course_id,
    ]);

    console.log(checkCourseResult.rows);

    if (checkCourseResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for a class in this course.",
      });
    }

    // Check for time conflicts
    const checkTimeConflictQuery = `
      SELECT * FROM enrollments e
      JOIN classes cl ON e.class_id = cl.class_id
      WHERE e.student_id = $1
        AND cl.class_time_day = (SELECT class_time_day FROM classes WHERE class_id = $2)
        AND (
          (cl.class_time_start BETWEEN (SELECT class_time_start FROM classes WHERE class_id = $2) AND (SELECT class_time_end FROM classes WHERE class_id = $2))
          OR (cl.class_time_end BETWEEN (SELECT class_time_start FROM classes WHERE class_id = $2) AND (SELECT class_time_end FROM classes WHERE class_id = $2))
        )
    `;
    const checkTimeConflictResult = await pool.query(checkTimeConflictQuery, [
      student_id,
      class_id,
    ]);

    if (checkTimeConflictResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Time conflict with another registered class.",
      });
    }

    // Insert the new enrollment
    const query = `
      INSERT INTO enrollments (enrollment_id, student_id, class_id, enrollment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [enrollment_id, student_id, class_id, enrollment_date];

    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "Successfully registered for the class!",
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to register for the class." });
    }
  } catch (error) {
    console.error("Error registering for class:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getGrades = async (req, res) => {
  const student_id = req.user.user_id;

  try {
    const query = `
      SELECT c.course_id, c.course_name, c.course_credit, g.midterm_score, g.final_score
      FROM grades g
      JOIN enrollments e ON g.enrollment_id = e.enrollment_id
      JOIN classes cl ON e.class_id = cl.class_id
      JOIN courses c ON cl.course_id = c.course_id
      WHERE e.student_id = $1
    `;
    const result = await pool.query(query, [student_id]);

    res.json({ grades: result.rows });
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.user.user_id;

    // Hàm chuyển đổi tên ngày sang số trong tuần (FullCalendar yêu cầu)
    const dayMap = {
      "Thứ 2": 1, // Thứ Hai
      "Thứ 3": 2, // Thứ Ba
      "Thứ 4": 3, // Thứ Tư
      "Thứ 5": 4, // Thứ Năm
      "Thứ 6": 5, // Thứ Sáu
      "Thứ 7": 6, // Thứ Bảy
      "Chủ Nhật": 0, // Chủ Nhật
    };

    // Lấy thời khóa biểu của sinh viên
    const timetableQuery = `
      SELECT 
        c.course_name,
        cl.class_time_day,
        cl.class_time_start,
        cl.class_time_end,
        r.room_name,
        t.teacher_name
      FROM 
        Enrollments e
      JOIN 
        Classes cl ON e.class_id = cl.class_id
      JOIN 
        Courses c ON cl.course_id = c.course_id
      JOIN 
        Rooms r ON cl.room_id = r.room_id
      JOIN 
        Teachers t ON cl.teacher_id = t.teacher_id
      WHERE 
        e.student_id = $1
    `;
    const timetableResult = await pool.query(timetableQuery, [studentId]);

    // Định dạng lại kết quả thời khóa biểu cho FullCalendar
    const events = timetableResult.rows.map((row) => ({
      title: row.course_name,
      daysOfWeek: [dayMap[row.class_time_day]], // Chuyển đổi ngày sang số
      startTime: row.class_time_start,
      endTime: row.class_time_end,
    }));

    // Trả về kết quả dưới dạng JSON
    res.json(events);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getRegisteredClasses = async (req, res) => {
  const studentId = req.user.user_id;

  try {
    const query = `
      SELECT c.course_name, cl.class_id, t.teacher_name, cl.room_id, cl.class_time_start, cl.class_time_end, cl.class_time_day
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.class_id
      JOIN courses c ON cl.course_id = c.course_id
      JOIN teachers t ON cl.teacher_id = t.teacher_id
      WHERE e.student_id = $1
    `;
    const result = await pool.query(query, [studentId]);
    console.log("heee");

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching registered classes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeRegisteredClass = async (req, res) => {
  const studentId = req.user.user_id;
  const classId = req.body.classId;

  try {
    const query = `
      DELETE FROM enrollments
      WHERE student_id = $1 AND class_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [studentId, classId]);

    if (result.rows.length > 0) {
      res
        .status(200)
        .json({ success: true, message: "Successfully removed the class!" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to remove the class." });
    }
  } catch (error) {
    console.error("Error removing registered class:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  showStudentPage,
  uploadAvatar,
  generateQR,
  viewClasses,
  registerForClass,
  getGrades,
  getStudentTimetable,
  getRegisteredClasses,
  removeRegisteredClass,
  updatePaymentStatus, // Add this line
};
