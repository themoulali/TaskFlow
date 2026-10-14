
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getColumns,
} = require("../controllers/columnController");

const router = express.Router();

router.use(protect);

router.get("/boards/:boardId/columns", getColumns);

module.exports = router;
