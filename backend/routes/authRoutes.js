
const express = require("express");
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");
const passport = require("../config/passport");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    req.user = {
      userId: req.user.userId,
    };
    next();
  },
  getProfile
);

module.exports = router;
