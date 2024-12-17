import { io, Socket } from "socket.io-client";

let socket: Socket | null = null; // Singleton socket instance

const getSocket = () => {
    if (!socket) {
        // Create a new socket connection only if it doesn't already exist
        socket = io(import.meta.env.VITE_API_URL, {
            transports: ["websocket", "polling"], // Enable fallback transports
            withCredentials: true, // Necessary for CORS
        });

        socket.on("connect", () => {
            console.log("Connected:", socket?.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected:", socket?.id);
        });

        socket.on("connect_error", (err) => {
            console.error("Connection Error:", err.message);
        });
    }

    return socket;
};

export { getSocket, Socket };
