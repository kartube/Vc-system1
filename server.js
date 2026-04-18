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

const rooms = {};

io.on("connection", (socket) => {

  console.log("USER CONNECTED");

  socket.on("join-room", ({ room, userId }) => {

    if (!room || !userId) return;

    socket.join(room);

    socket.room = room;
    socket.userId = userId;

    if (!rooms[room]) rooms[room] = [];
    if (!rooms[room].includes(userId)) {
        rooms[room].push(userId);
    }

    socket.to(room).emit("user-joined", userId);

    console.log("JOIN:", userId, "ROOM:", room);
  });

  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", data);
  });

  // 🔥 ICE candidates (دي كانت ناقصة عندك)
  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", data);
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