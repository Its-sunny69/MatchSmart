import { io, Socket } from "socket.io-client";

const getSocket = () => {

    const socket: Socket = io("http://localhost:3000");

    socket.on("connect", () => {
        console.log("Connected:", socket.id);
    });

    socket.on("message", (msg: string) => {
        console.log("Received message:", msg);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    })
    return socket
}

export { getSocket }