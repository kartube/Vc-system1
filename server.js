const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// static files
app.use(express.static(path.join(__dirname, "public")));

// login
app.get("/login/:name", (req, res) => {
  const userId = Math.random().toString(36).substring(2, 10);
  res.json({ userId });
});

// 🔥 ROOMS SYSTEM
const rooms = {};

io.on("connection", (socket) => {

  socket.on("join-room", ({ room, userId }) => {
    if (!room || !userId) return;

    socket.join(room);

    socket.room = room;
    socket.userId = userId;

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(userId);

    socket.to(room).emit("user-joined", userId);

    console.log("JOIN:", userId, "ROOM:", room);
  });

  // voice relay
  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", data);
  });

  socket.on("disconnect", () => {
    if (socket.room && rooms[socket.room]) {
      rooms[socket.room] = rooms[socket.room].filter(id => id !== socket.userId);
    }
  });

});

server.listen(PORT, () => {
  console.log("Server running on " + PORT);
});