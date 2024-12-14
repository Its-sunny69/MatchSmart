import { io, Socket } from "socket.io-client";

const getSocket = () => {

    const socket: Socket = io(import.meta.env.VITE_API_URL);

    socket.on("connect", () => {
        console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    })
    return socket
}

export { getSocket, Socket }