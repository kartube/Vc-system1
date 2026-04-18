const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

// الصفحات
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin.html"));
});

// login بسيط
app.get("/login/:name", (req, res) => {
  const userId = Math.random().toString(36).substr(2, 10);
  res.json({ userId });
});

// rooms memory
let rooms = {};

io.on("connection", (socket) => {

  // دخول روم
  socket.on("join-room", ({ room, userId }) => {

    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(userId);

    socket.to(room).emit("user-joined", userId);
  });

  // voice
  socket.on("offer", (data) => socket.to(data.to).emit("offer", data));
  socket.on("answer", (data) => socket.to(data.to).emit("answer", data));

  // admin ban
  socket.on("admin-ban", ({ target }) => {
    io.emit("user-banned", target);
  });

  // admin kick
  socket.on("admin-kick", ({ target }) => {
    io.emit("user-kicked", target);
  });

});

server.listen(PORT, () => {
  console.log("Server running on " + PORT);
});