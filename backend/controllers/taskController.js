
const mongoose = require("mongoose");
const Board = require("../models/Board");
const Column = require("../models/Column");
const Task = require("../models/Task");

const getOwnedBoard = async (boardId, userId) => {
  if (!mongoose.isValidObjectId(boardId)) {
    return { error: "invalid" };
  }

  const board = await Board.findOne({
    _id: boardId,
    owner: userId,
  });

  return board ? { board } : { error: "notFound" };
};

const getTasks = async (req, res) => {
  try {
    const result = await getOwnedBoard(
      req.params.boardId,
      req.user.userId
    );

    if (result.error === "invalid") {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    if (!result.board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const tasks = await Task.find({
      board: result.board._id,
    })
      .populate("column", "title position")
      .sort({ position: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tasks",
    });
  }
};

const createTask = async (req, res) => {
  try {
    const { boardId } = req.params;
    const {
      title,
      description = "",
      columnId,
      priority = "medium",
      dueDate = null,
    } = req.body;

    const result = await getOwnedBoard(
      boardId,
      req.user.userId
    );

    if (result.error === "invalid") {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    if (!result.board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (!mongoose.isValidObjectId(columnId)) {
      return res.status(400).json({
        success: false,
        message: "A valid column ID is required",
      });
    }

    const column = await Column.findOne({
      _id: columnId,
      board: result.board._id,
    });

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column does not belong to this board",
      });
    }

    if (!["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Priority must be low, medium, or high",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
      board: result.board._id,
      column: column._id,
      priority,
      dueDate,
    });

    await task.populate("column", "title position");

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const board = await Board.findOne({
      _id: task.board,
      owner: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "priority",
      "dueDate",
      "position",
      "columnId",
    ];

    const unsupported = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );

    if (unsupported.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported field: ${unsupported[0]}`,
      });
    }

    if ("title" in req.body) {
      if (
        typeof req.body.title !== "string" ||
        !req.body.title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty",
        });
      }

      task.title = req.body.title.trim();
    }

    if ("description" in req.body) {
      if (typeof req.body.description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }

      task.description = req.body.description.trim();
    }

    if ("priority" in req.body) {
      if (!["low", "medium", "high"].includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: "Priority must be low, medium, or high",
        });
      }

      task.priority = req.body.priority;
    }

    if ("dueDate" in req.body) {
      task.dueDate = req.body.dueDate;
    }

    if ("position" in req.body) {
      if (
        !Number.isInteger(req.body.position) ||
        req.body.position < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Position must be a non-negative integer",
        });
      }

      task.position = req.body.position;
    }

    if ("columnId" in req.body) {
      if (!mongoose.isValidObjectId(req.body.columnId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid column ID",
        });
      }

      const column = await Column.findOne({
        _id: req.body.columnId,
        board: board._id,
      });

      if (!column) {
        return res.status(400).json({
          success: false,
          message: "Column does not belong to this board",
        });
      }

      task.column = column._id;
    }

    await task.save();
    await task.populate("column", "title position");

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const board = await Board.findOne({
      _id: task.board,
      owner: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
