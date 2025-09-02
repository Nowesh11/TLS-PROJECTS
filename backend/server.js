const app = require("./app");
const { Server } = require("socket.io");
const http = require("http");

// Start server
const PORT = process.env.PORT || 8080;
const HOST = "localhost";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Handle new message
  socket.on("send_message", (data) => {
    // Broadcast message to all users in the chat room
    socket.to(data.chatId).emit("receive_message", data);
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.chatId).emit("user_stop_typing", data);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Server listening on interface: ${HOST}`);
});

// Add error handling
server.on("error", (err) => {
  console.error("Server error:", err);
});

// Add connection logging
server.on("connection", (socket) => {
  console.log("New connection established from:", socket.remoteAddress);
});