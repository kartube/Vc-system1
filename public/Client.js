const socket = io();

let localStream;
let peers = {};
let myId;

// 🎤 تشغيل الفويس
async function startVoice(room, userId){

    myId = userId;

    // تشغيل المايك
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // دخول الروم
    socket.emit("join-room", { room, userId });

    console.log("Joined room:", room);

    // 👥 لما حد يدخل
    socket.on("user-joined", async (newUserId) => {

        console.log("User joined:", newUserId);

        const pc = createPeer(newUserId);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", {
            to: newUserId,
            from: myId,
            offer
        });
    });

    // 📡 استلام offer
    socket.on("offer", async (data) => {

        console.log("Received offer from:", data.from);

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

    // 📡 استلام answer
    socket.on("answer", async (data) => {

        console.log("Received answer from:", data.from);

        if(peers[data.from]){
            await peers[data.from].setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );
        }
    });

}

// 🔗 إنشاء اتصال بين لاعبين
function createPeer(userId){

    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

    // إضافة المايك
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    // استقبال الصوت
    pc.ontrack = (event) => {

        console.log("Receiving audio from:", userId);

        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;

        document.body.appendChild(audio);
    };

    peers[userId] = pc;

    return pc;
}
