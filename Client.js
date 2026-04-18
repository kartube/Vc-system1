const socket = io();

let localStream;
let peers = {};
let myId;

async function startVoice(room, userId){

    myId = userId;

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    socket.emit("join-room", { room, userId });

    socket.on("user-joined", async (id) => {

        const pc = createPeer(id);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", {
            to: id,
            from: myId,
            offer
        });
    });

    socket.on("offer", async (data) => {

        const pc = createPeer(data.from);

        await pc.setRemoteDescription(data.offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
            to: data.from,
            from: myId,
            answer
        });
    });

    socket.on("answer", async (data) => {
        if(peers[data.from]){
            await peers[data.from].setRemoteDescription(data.answer);
        }
    });
}

function createPeer(id){

    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    pc.ontrack = (event) => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
    };

    peers[id] = pc;
    return pc;
}