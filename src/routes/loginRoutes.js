const express = require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');

router.get('/', (req, res) => {
  res.render('login-page');
});

router.post('/', login);

module.exports = router;