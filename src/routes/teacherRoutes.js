const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");

router.get("/", teacherController.getTeacherPage);
router.get("/classes", teacherController.getTeacherClasses);
router.get("/logout", teacherController.logout);
router.get("/profile", teacherController.getTeacherProfile);
router.get("/classes/:class_id", teacherController.getClassDetails);
router.post("/update-scores", teacherController.updateStudentScores);
router.get("/schedule", teacherController.getTeacherSchedule);

module.exports = router;
