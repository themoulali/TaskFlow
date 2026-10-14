
const Board = require("../models/Board");
const Column = require("../models/Column");

const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: boards.length,
      data: boards,
    });
  } catch (error) {
    console.error("Get boards error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve boards",
    });
  }
};

const createBoard = async (req, res) => {
  try {
    const { title, description = "" } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Board title is required",
      });
    }

    const board = await Board.create({
        title: title.trim(),
        description:
            typeof description === "string" ? description.trim() : "",
        owner: req.user.userId,
    });

    try {
        await Column.insertMany([
        {
            title: "To Do",
            board: board._id,
            position: 0,
        },
        {
            title: "In Progress",
            board: board._id,
            position: 1,
        },
        {
            title: "Done",
            board: board._id,
            position: 2,
        },
    ]);
} catch (columnError) {
  await Board.deleteOne({ _id: board._id });
  throw columnError;
}

    return res.status(201).json({
      success: true,
      message: "Board created successfully",
      data: board,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create board error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create board",
    });
  }
};

module.exports = {
  getBoards,
  createBoard,
};
