const socket = io();

let localStream;
let peers = {};
let myId;

async function startVoice(room, userId){

    console.log("START VOICE:", room, userId);

    myId = userId;

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        console.error("MIC ERROR:", e);
        alert("Microphone blocked");
        return;
    }

    // 🔥 مهم: نربط الأحداث مرة واحدة فقط
    if (!socket.connectedOnce) {
        socket.connectedOnce = true;

        socket.on("user-joined", async (id) => {
            console.log("USER JOINED:", id);

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

            console.log("OFFER RECEIVED:", data.from);

            const pc = createPeer(data.from);

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", {
                to: data.from,
                from: myId,
                answer
            });
        });

        socket.on("answer", async (data) => {

            console.log("ANSWER RECEIVED:", data.from);

            if (peers[data.from]) {
                await peers[data.from].setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );
            }
        });
    }

    // 🔥 join room
    socket.emit("join-room", { room, userId });

    console.log("JOIN SENT");
}

function createPeer(id){

    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                to: id,
                from: myId,
                candidate: event.candidate
            });
        }
    };

    pc.ontrack = (event) => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
    };

    peers[id] = pc;
    return pc;
}