const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ⭐ مهم لـ Railway
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let users = {};
let rooms = {};
let bans = fs.existsSync("bans.json") ? JSON.parse(fs.readFileSync("bans.json")) : {};

// ================= LOGIN =================
app.get("/login/:name", (req, res) => {

    const userId = Math.random().toString(36).substr(2, 10);

    users[userId] = {
        name: req.params.name,
        role: req.params.name === "admin" ? "admin" : "user"
    };

    res.json({ userId });
});

// ================= SOCKET =================
io.on("connection", (socket) => {

    socket.on("join-room", ({ room, userId }) => {

        if (bans[userId]) {
            socket.emit("banned");
            return;
        }

        socket.join(room);

        if (!rooms[room]) rooms[room] = [];

        rooms[room].push(userId);

        socket.to(room).emit("user-joined", userId);

        console.log("JOIN:", userId, room);
    });

    // 🎤 voice exchange
    socket.on("offer", d => socket.to(d.to).emit("offer", d));
    socket.on("answer", d => socket.to(d.to).emit("answer", d));

    // 🚫 ban system
    socket.on("ban", ({ admin, target }) => {

        if (!users[admin] || users[admin].role !== "admin") return;

        bans[target] = true;
        fs.writeFileSync("bans.json", JSON.stringify(bans));

        io.emit("user-banned", target);
    });

});

server.listen(PORT, () => {
    console.log("🔥 VC SYSTEM RUNNING ON PORT " + PORT);
});