const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/room.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/room.html"));
});

let socketMap = {};

io.on("connection", (socket) => {

    socket.on("join-room", ({ room, userId }) => {

        socketMap[userId] = socket.id;
        socket.join(room);

        socket.to(room).emit("user-joined", userId);

        console.log("JOIN:", userId, room);
    });

    socket.on("offer", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("offer", d);
        }
    });

    socket.on("answer", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("answer", d);
        }
    });

    socket.on("ice-candidate", d => {
        if (socketMap[d.to]) {
            socket.to(socketMap[d.to]).emit("ice-candidate", d);
        }
    });

});

server.listen(PORT, () => {
    console.log("🔥 VC RUNNING ON " + PORT);
});