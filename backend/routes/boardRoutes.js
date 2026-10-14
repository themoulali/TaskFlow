
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getBoards,
  createBoard,
} = require("../controllers/boardController");

const router = express.Router();

// All board routes require a valid JWT.
router.use(protect);

router.route("/")
  .get(getBoards)
  .post(createBoard);

module.exports = router;
