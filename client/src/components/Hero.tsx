import { useEffect, useRef, useState } from "react";
import { getSocket, Socket } from "../utils/socket";
import Chatbox from "./Chatbox";
import { Button } from "./ui/button";

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
    const socket = useRef<Socket>(getSocket()).current;
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [roomId, setRoomId] = useState<string>('');
    const [waiting, setWaiting] = useState(true);

    useEffect(() => {
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

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track

                // Update remoteVideoRef with the remote stream
                if (remoteVideoRef.current) {
                    if (track1.kind === "video") {
                        remoteVideoRef.current.srcObject = new MediaStream([track1, track2]);
                    }
                    else {
                        remoteVideoRef.current.srcObject = new MediaStream([track2, track1]);
                    }
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
    }, [socket]);

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
        <div className="w-full h-fit min-h-[500px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            <div className="w-full h-full flex flex-col">
                <div className="w-full h-[300px] bg-red-600">
                    <video className="w-full h-full" autoPlay playsInline muted ref={localVideoRef}></video>
                </div>
                <div className="w-full h-[300px] bg-blue-600">
                    {localStream && waiting && <p>Waiting for a partner...</p>}
                    <video className="w-full h-full" autoPlay playsInline ref={remoteVideoRef}></video>
                </div>
            </div>
            <div className="w-full h-fit flex flex-col justify-center items-start p-2">
                <Button
                    type="button"
                    disabled={!waiting}
                    className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={startCamera}
                >
                    {waiting ? "Find a Partner" : "Connected"}
                </Button>
                <Button
                    type="button"
                    className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
                    onClick={stopCamera}
                >
                    Stop
                </Button>
                <h1>{roomId}</h1>
                <h2>My Id: {socket?.id}</h2>
                <Chatbox roomId={roomId} socket={socket} />
            </div>
        </div>
    );
}
