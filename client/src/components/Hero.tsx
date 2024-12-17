import { useEffect, useRef, useState } from "react";
import { getSocket, Socket } from "../utils/socket";
import Chatbox from "./Chatbox";
import { Button } from "./ui/button";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "27f60d5012436bb4337c1b0e",
      credential: "ipY5XP08LchtkTNc",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "27f60d5012436bb4337c1b0e",
      credential: "ipY5XP08LchtkTNc",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "27f60d5012436bb4337c1b0e",
      credential: "ipY5XP08LchtkTNc",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "27f60d5012436bb4337c1b0e",
      credential: "ipY5XP08LchtkTNc",
    },
  ],
};

interface HeroProps {
  preference: string,
  setIsOpen: Function
}

const Hero: React.FC<HeroProps> = ({ preference, setIsOpen }) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const senderPeerConnection = useRef<RTCPeerConnection | null>(null);
  const receiverPeerConnection = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<Socket | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setlocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    socket.current = getSocket();

    socket.current.on("waiting", () => setWaiting(true));
    socket.current.on("room-connected", (id) => {
      setRoomId(id);
      setWaiting(false);
    });

    socket.current.on("offer", async (offer, id) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      receiverPeerConnection.current = pc;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setTimeout(() => {
        const track1 = pc.getTransceivers()[0].receiver.track;
        const track2 = pc.getTransceivers()[1].receiver.track;
        if (remoteVideoRef.current) {
          if (track1.kind === "video") {
            remoteVideoRef.current.srcObject = new MediaStream([
              track1,
              track2,
            ]);
          } else {
            remoteVideoRef.current.srcObject = new MediaStream([
              track2,
              track1,
            ]);
          }
          remoteVideoRef.current.play();
        }
      }, 100);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current?.emit(
            "ice-candidate",
            event.candidate,
            id,
            socket.current?.id,
            "receiver"
          );
        }
      };
      socket.current?.emit("answer", answer, id, socket.current.id);
    });

    socket.current.on("answer", (answer) => {
      senderPeerConnection.current?.setRemoteDescription(answer);
    });

    socket.current.on("ice-candidate", (candidate, type) => {
      const pc =
        type === "sender"
          ? receiverPeerConnection.current
          : senderPeerConnection.current;
      pc?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.current.on("partner-disconnected", () => {
      receiverPeerConnection.current?.close();

      receiverPeerConnection.current = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setRoomId("");
      setWaiting(true);
      setTimeout(() => {
        socket.current?.emit("join");
      }, 2000);
    });

    return () => {
      socket.current?.disconnect();
      senderPeerConnection.current?.close();
      receiverPeerConnection.current?.close();
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      initPeerConnection();
    }
  }, [localStream, roomId]);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      setLocalStream(stream);
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      setLocalAudioTrack(audioTrack);
      setlocalVideoTrack(videoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context) {
          canvas.width = 1280;
          canvas.height = 720;
          const captureFrame = () => {
            if (
              localVideoRef.current &&
              !localVideoRef.current.paused &&
              !localVideoRef.current.ended
            ) {
              context.drawImage(
                localVideoRef.current,
                0,
                0,
                canvas.width,
                canvas.height
              );
              const frame = canvas.toDataURL("image/jpeg");
              sendFrame(frame);
              setTimeout(captureFrame, 10000);
            }
          };
          localVideoRef.current.play().then(() => {
            captureFrame();
          });
        }
      }
    } catch (error) {
      console.error("Error accessing the webcam:", error);
    }
  };

  const joinRoom = () => {
    setIsOpen(true)
    socket.current?.emit("setPreference", preference);
    if (socket.current) {
      socket.current.emit("join");
    }
  };

  const sendFrame = (frame: string) => {
    socket.current?.emit("frame", frame, roomId);
  };

  const skipChat = () => {
    socket.current?.emit("skip", socket.current?.id, roomId);

    receiverPeerConnection.current?.close();

    receiverPeerConnection.current = null;

    setRoomId("");
    setWaiting(true);
    socket.current?.emit("join");
  };

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    senderPeerConnection.current = pc;
    if (localVideoTrack) {
      console.log("added tack");
      console.log(localVideoTrack);
      pc.addTrack(localVideoTrack);
    }
    if (localAudioTrack) {
      console.log("added tack");
      console.log(localAudioTrack);
      pc.addTrack(localAudioTrack);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.current?.emit(
          "ice-candidate",
          event.candidate,
          roomId,
          socket.current?.id,
          "sender"
        );
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
          socket.current?.emit("offer", offer, roomId, socket.current?.id);
        }
      } catch (error) {
        console.error("Error during negotiation:", error);
      }
    };
  };

  return (
    <div className="w-full h-fit min-h-[500px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
      <div className="w-fit h-full flex flex-col gap-5">
        <div className="w-fit h-[300px] border border-black rounded-lg overflow-hidden">
          <video
            className="w-full h-full"
            autoPlay
            playsInline
            muted
            ref={localVideoRef}
          ></video>
        </div>
        <div className="w-full h-[300px] flex justify-center items-center bg-slate-400 border border-black rounded-lg overflow-hidden">
          {localStream && waiting ? (
            <p className="flex justify-center items-center h-full w-full">
              Waiting for a partner...
            </p>
          ) : (
            <video
              className="w-full h-full"
              autoPlay
              playsInline
              ref={remoteVideoRef}
            ></video>
          )}
        </div>
      </div>
      <div className="w-full h-full flex flex-col justify-center items-start p-2">
        <div className="flex gap-4">
          <Button
            type="button"
            disabled={!waiting}
            className="focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
            onClick={joinRoom}
          >
            {waiting ? "Find a Partner" : "Connected"}
          </Button>
          {
            !waiting &&
            (
              <Button
                type="button"
                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700"
                onClick={skipChat}
              >
                Skip
              </Button>
            )
          }
        </div>

        <Chatbox roomId={roomId} socket={socket.current} />
      </div>
    </div>
  );
}


export default Hero;