const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Board = require("./models/Board");
const onlineUsersByBoard = new Map();


const broadcastBoardPresence = (boardId) => {
  const users = onlineUsersByBoard.get(boardId);

  if (!users) return;

  const onlineUserIds = Array.from(users.keys());

  io.to(`board:${boardId}`).emit("presence:updated", {
    boardId,
    onlineUserIds,
  });
};

require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return next(new Error("Invalid authentication token"));
    }

    socket.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});


io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("board:join", async (boardId, callback) => {
    const respond =
      typeof callback === "function" ? callback : () => {};

    try {
      if (!mongoose.isValidObjectId(boardId)) {
        return respond({
          success: false,
          message: "Invalid board ID",
        });
      }

      const board = await Board.findOne({
        _id: boardId,
        owner: socket.user.userId,
      });

      if (!board) {
        return respond({
          success: false,
          message: "Board not found or access denied",
        });
      }
      const boardIdString = board._id.toString();
      const roomName = `board:${boardIdString}`;

      await socket.join(roomName);

      let users = onlineUsersByBoard.get(boardIdString);

      if (!users) {
        users = new Map();
        onlineUsersByBoard.set(boardIdString, users);
      }

      const userId = socket.user.userId.toString();
      const userSockets = users.get(userId) || new Set();

      userSockets.add(socket.id);
      users.set(userId, userSockets);

      broadcastBoardPresence(boardIdString);

      return respond({
        success: true,
        message: "Joined board room successfully",
        boardId: boardIdString,
      });

    } catch (error) {
      console.error("Board room join error:", error.message);

      return respond({
        success: false,
        message: "Failed to join board room",
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
    const userId = socket.user.userId.toString();

    for (const [boardId, users] of onlineUsersByBoard.entries()) {
      const userSockets = users.get(userId);

      if (!userSockets || !userSockets.has(socket.id)) {
        continue;
      }

      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        users.delete(userId);
      }

      if (users.size === 0) {
        onlineUsersByBoard.delete(boardId);
      }

      broadcastBoardPresence(boardId);
    }
  });
});


app.set("io", io);

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`TaskFlow API running on port ${PORT}`);
      console.log("Socket.IO server initialized");
    });
  } catch (error) {
    console.error("Failed to start TaskFlow server:", error.message);
    process.exitCode = 1;
  }
};

startServer();
