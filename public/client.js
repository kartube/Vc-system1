const socket = io();

let localStream;
let myId;
let myRoom;

async function startVoice(room, userId, name){

    myId = userId;
    myRoom = room;

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    socket.emit("join-room", {
        room,
        userId,
        name
    });

    document.getElementById("status").innerText =
        "Connected to " + room;

    // 🔊 speaking detection
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(localStream);
    const analyser = audioCtx.createAnalyser();

    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    function loop(){

        analyser.getByteFrequencyData(data);

        let vol = data.reduce((a,b)=>a+b)/data.length;

        socket.emit("voice-state", {
            room: myRoom,
            userId: myId,
            speaking: vol > 15
        });

        requestAnimationFrame(loop);
    }

    loop();

    // 👥 update users UI
    socket.on("room-users", (users) => {
        if(window.renderUsers){
            window.renderUsers(users);
        }
    });
}
