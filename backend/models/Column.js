
const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Column title is required"],
      trim: true,
      maxlength: [100, "Column title cannot exceed 100 characters"],
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Column must belong to a board"],
    },
    position: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Column", columnSchema);