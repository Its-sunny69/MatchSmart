import { useEffect, useRef, useState } from "react";
import { getSocket, Socket } from "../utils/socket";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ]
};

export default function Hero() {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const senderPeerConnection = useRef<RTCPeerConnection | null>(null);
    const receiverPeerConnection = useRef<RTCPeerConnection | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [waiting, setWaiting] = useState(true);

    useEffect(() => {
        const socket = getSocket();
        setSocket(socket);

        socket.on("connect", () => console.log("Connected to the server"));
        socket.on("waiting", () => setWaiting(true));
        socket.on("room-connected", (id) => {
            setRoomId(id);
            setWaiting(false);
        });

        socket.on("offer", async (offer, id) => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            receiverPeerConnection.current = pc;
            await pc.setRemoteDescription(offer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            setRemoteStream(new MediaStream());

            console.log(pc)
            setRemoteStream(new MediaStream());

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                if (track1.kind === "video") {
                    setRemoteVideoTrack(track1);
                    setRemoteAudioTrack(track2);
                    remoteStream?.addTrack(track1);
                    remoteStream?.addTrack(track2);
                } else {
                    setRemoteVideoTrack(track2);
                    setRemoteAudioTrack(track1);
                    remoteStream?.addTrack(track2);
                    remoteStream?.addTrack(track1);
                }

                // Update remoteVideoRef with the remote stream
                if (remoteVideoRef.current) {
                    console.log(remoteStream)
                    remoteVideoRef.current.srcObject = new MediaStream([track1, track2]);
                    remoteVideoRef.current.play();
                }
            }, 100)

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", event.candidate, id, socket?.id, "receiver");
                }
            };
            socket.emit("answer", answer, id, socket.id);
        });

        socket.on("answer", (answer) => {
            senderPeerConnection.current?.setRemoteDescription(answer);
        });

        socket.on("ice-candidate", (candidate, type) => {
            const pc = type === 'sender' ? receiverPeerConnection.current : senderPeerConnection.current;
            pc?.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("partner-disconnected", () => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            socket.emit('join');
        });

        return () => {
            socket.disconnect();
            senderPeerConnection.current?.close();
            receiverPeerConnection.current?.close();
        };
    }, []);

    useEffect(() => {
        if (localStream) {
            initPeerConnection();
        }
    }, [localStream, roomId]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                audio: true,
            });
            setLocalStream(stream);
            const audioTrack = stream.getAudioTracks()[0]
            const videoTrack = stream.getVideoTracks()[0]
            setLocalAudioTrack(audioTrack);
            setlocalVideoTrack(videoTrack);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = new MediaStream([videoTrack]);
            }
            socket?.emit("join");
        } catch (error) {
            console.error("Error accessing the webcam:", error);
        }
    };

    const stopCamera = () => {
        localStream?.getTracks().forEach(track => track.stop());
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
    };

    const initPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        senderPeerConnection.current = pc;
        if (localVideoTrack) {
            console.log("added tack");
            console.log(localVideoTrack)
            pc.addTrack(localVideoTrack)
        }
        if (localAudioTrack) {
            console.log("added tack");
            console.log(localAudioTrack)
            pc.addTrack(localAudioTrack)
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && roomId) {
                socket?.emit("ice-candidate", event.candidate, roomId, socket?.id, "sender");
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", pc.iceConnectionState);
            if (pc.iceConnectionState === "disconnected") {
                console.warn("Peer disconnected.");
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                if (roomId) {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket?.emit("offer", offer, roomId, socket?.id);
                }
            } catch (error) {
                console.error("Error during negotiation:", error);
            }
        };
    };

    return (
        <div className="w-full h-full min-h-[500px] bg-gray-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="w-full h-[300px] bg-red-600">
                <video className="w-full h-full border-2" autoPlay playsInline muted ref={localVideoRef}></video>
            </div>
            <div className="w-full h-[300px] bg-blue-600">
                {localStream && waiting && <p>Waiting for a partner...</p>}
                <video className="w-full h-full border-2" autoPlay playsInline ref={remoteVideoRef}></video>
            </div>
            <div className="w-full h-[200px] flex flex-col justify-center items-start p-2">
                <button
                    type="button"
                    disabled={!waiting}
                    className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={startCamera}
                >
                    {waiting ? "Find a Partner" : "Connected"}
                </button>
                <button
                    type="button"
                    className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={stopCamera}
                >
                    Stop
                </button>
                <h1>{roomId}</h1>
                <h2>My Id: {socket?.id}</h2>
            </div>
        </div>
    );
}
