
const mongoose = require("mongoose");
const Board = require("../models/Board");
const Column = require("../models/Column");

const getColumns = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.isValidObjectId(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID",
      });
    }

    const board = await Board.findOne({
      _id: boardId,
      owner: req.user.userId,
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const columns = await Column.find({
      board: board._id,
    }).sort({ position: 1 });

    return res.status(200).json({
      success: true,
      count: columns.length,
      data: columns,
    });
  } catch (error) {
    console.error("Get columns error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve columns",
    });
  }
};

module.exports = {
  getColumns,
};
