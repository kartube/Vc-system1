const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

app.get("/login/:name", (req, res) => {
  const userId = Math.random().toString(36).substring(2, 10);
  res.json({ userId });
});

// rooms data
const rooms = {};

io.on("connection", (socket) => {

  socket.on("join-room", ({ room, userId, name }) => {

    if (!room || !userId) return;

    socket.join(room);

    socket.room = room;
    socket.userId = userId;
    socket.name = name || "Guest";

    if (!rooms[room]) rooms[room] = {};

    rooms[room][userId] = {
      id: userId,
      name: socket.name,
      speaking: false,
      muted: false
    };

    io.to(room).emit("room-users", rooms[room]);

    socket.to(room).emit("user-joined", { userId, name: socket.name });

    console.log("JOIN:", userId, room);
  });

  socket.on("voice-state", ({ room, userId, speaking }) => {
    if (!rooms[room] || !rooms[room][userId]) return;

    rooms[room][userId].speaking = speaking;

    io.to(room).emit("room-users", rooms[room]);
  });

  socket.on("mute-state", ({ room, userId, muted }) => {
    if (!rooms[room] || !rooms[room][userId]) return;

    rooms[room][userId].muted = muted;

    io.to(room).emit("room-users", rooms[room]);
  });

  socket.on("disconnect", () => {
    const room = socket.room;
    const id = socket.userId;

    if (rooms[room]) {
      delete rooms[room][id];
      io.to(room).emit("room-users", rooms[room]);
    }
  });

});

server.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
