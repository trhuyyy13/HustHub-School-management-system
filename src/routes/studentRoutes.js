const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { authenticateToken } = require("../middlewares/authenticateToken");
const {
  showStudentPage,
  uploadAvatar,
  generateQR,
  viewClasses,
  registerForClass,
  getGrades,
  getStudentTimetable,
  getRegisteredClasses,
  removeRegisteredClass,
  updatePaymentStatus,
} = require("../controllers/studentController");

// Route hiển thị trang sinh viên
router.get("/", authenticateToken, showStudentPage);

// Route xử lý upload avatar
router.post(
  "/upload-avatar",
  authenticateToken,
  upload.single("avatar"),
  uploadAvatar
);

// Route xử lý generate qr thanh toán học phí
router.post("/create-embedded-payment-link", authenticateToken, generateQR);

// Route xử lý lấy dữ liệu lớp học
router.get("/classes/:courseId", authenticateToken, viewClasses);

// Đăng ký lớp
router.post("/register", authenticateToken, registerForClass);

// Xem điểm
router.get("/grades", authenticateToken, getGrades);

// Lấy thời khóa biểu
router.get("/time-table", authenticateToken, getStudentTimetable);

// Lấy các lớp đã đăng ký
router.get("/registered-classes", authenticateToken, getRegisteredClasses);

// Xóa lớp đã đăng ký
router.post(
  "/remove-registered-class",
  authenticateToken,
  removeRegisteredClass
);

// Route to update payment status
router.get("/update-payment-status", authenticateToken, updatePaymentStatus);

module.exports = router;
