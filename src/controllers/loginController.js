const jwt = require("jsonwebtoken");
const accessTokenSecret = "hieunguyentrung";
const { pool } = require("../config/db");

const login = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    if (role === "admin") {
      if (username === "admin" && password === "admin") {
        const accessToken = jwt.sign(
          { username: "admin", role: "admin" },
          accessTokenSecret,
          { expiresIn: "1h" }
        );
        res.cookie("accessToken", accessToken, { httpOnly: true });
        res.redirect("/admin");
      } else {
        return res.render("login-page", {
          error: "Sai tài khoản hoặc mật khẩu",
        });
      }
    } else {
      const result = await pool.query(
        `SELECT * FROM ${role}s WHERE ${role}_email = $1 AND ${role}_id = $2`,
        [username, password]
      );

      if (result.rows.length === 0) {
        return res.render("login-page", {
          error: "Sai tài khoản hoặc mật khẩu",
        });
      }

      const user = result.rows[0];
      console.log(user);
      req.session.user = user;
      const accessToken = jwt.sign(
        { user_id: user[`${role}_id`], role: role },
        accessTokenSecret,
        { expiresIn: "1h" }
      );
      res.cookie("accessToken", accessToken, { httpOnly: true });
      if (role === "student") {
        res.redirect("/student");
      } else if (role === "teacher") {
        res.redirect("/teacher");
      } else {
        res.sendStatus(400); // Bad Request
      }
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500); // Internal Server Error
  }
};

module.exports = { login };
