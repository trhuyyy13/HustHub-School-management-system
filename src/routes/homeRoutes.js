// src/routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Route for home page
router.get('/', homeController.getHomePage);
module.exports = router;