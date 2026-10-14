
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.use(protect);

router.get("/boards/:boardId/tasks", getTasks);
router.post("/boards/:boardId/tasks", createTask);

router.patch("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);

module.exports = router;
