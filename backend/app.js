
const express = require("express");

const app = express();

// Parse incoming JSON requests
app.use(express.json());


const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

// Health-check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

module.exports = app;