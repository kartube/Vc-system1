const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ⭐ PORT
const PORT = process.env.PORT || 3000;

// ⭐ يخدم ملفات public
app.use(express.static(path.join(__dirname, "public")));

// ⭐ تأكد إن الصفحة الرئيسية تفتح
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// ⭐ حل مشكلة room.html
app.get("/room.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

// ⭐ admin
app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/admin.html"));
});

let users = {};
let rooms = {};
let socketMap = {};
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

        socketMap[userId] = socket.id;

        socket.join(room);

        if (!rooms[room]) rooms[room] = [];

        rooms[room].push(userId);

        socket.to(room).emit("user-joined", userId);

        console.log("JOIN:", userId, room);
    });

    // 🎤 offer
    socket.on("offer", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("offer", d);
        }
    });

    // 🎤 answer
    socket.on("answer", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("answer", d);
        }
    });

    // ❄️ ICE
    socket.on("ice-candidate", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("ice-candidate", d);
        }
    });

    // 🚫 ban
    socket.on("ban", ({ admin, target }) => {

        if (!users[admin] || users[admin].role !== "admin") return;

        bans[target] = true;
        fs.writeFileSync("bans.json", JSON.stringify(bans));

        io.emit("user-banned", target);
    });

});

server.listen(PORT, () => {
    console.log("🔥 RUNNING ON PORT " + PORT);
});