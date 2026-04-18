const socket = io();

let localStream;
let myId;
let myRoom;

async function startVoice(room, userId, name){

    myId = userId;
    myRoom = room;

    localStorage.setItem("room", room);

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    socket.emit("join-room", {
        room,
        userId,
        name
    });

    // 🎤 detect speaking (simple)
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    function detect(){
        analyser.getByteFrequencyData(data);

        let volume = data.reduce((a,b)=>a+b)/data.length;

        socket.emit("voice-state", {
            room: myRoom,
            userId: myId,
            speaking: volume > 20
        });

        requestAnimationFrame(detect);
    }

    detect();

    socket.on("room-users", (users) => {
        if(window.renderUsers){
            window.renderUsers(users);
        }
    });
}
