
const express = require("express");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

module.exports = app;