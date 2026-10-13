
require("dotenv").config({ path: "./backend/.env" });

const mongoose = require("mongoose");
const connectDB = require("./backend/config/db");
const Board = require("./backend/models/Board");

async function testDatabase() {
  let testBoard;

  try {
    await connectDB();

    testBoard = await Board.create({
      title: "TaskFlow Database Verification",
      description: "Temporary record for Day 1 verification",
    });

    console.log("PASS: Board document created");

    const savedBoard = await Board.findById(testBoard._id);

    if (!savedBoard) {
      throw new Error("Created board could not be retrieved");
    }

    console.log("PASS: Board document retrieved");
    console.log("PASS: Board title:", savedBoard.title);
  } catch (error) {
    console.error("FAIL: Database verification:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      if (testBoard) {
        await Board.deleteOne({ _id: testBoard._id });
        console.log("Cleanup: Temporary board deleted");
      }
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError.message);
    }

    await mongoose.disconnect();
  }
}

testDatabase();