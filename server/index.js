const { Server } = require('socket.io');
const { removeUserFromQueue, disconnectUserFromRoom } = require('./utils/user.utils');

const waitingUsers = [];
const rooms = {};

const io = new Server(3000, {
    cors: {
        origin: "*",
    },
});

console.log('Socket.IO server running on port 3000');

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on("join", () => {
        if (waitingUsers.length > 0) {
            const partnerId = waitingUsers.shift();
            const roomId = `${socket.id}-${partnerId.id}`;
            rooms[roomId] = [{ socket, id: socket.id }, partnerId];
            console.log(rooms)
            socket.join(roomId);
            partnerId.socket.join(roomId);
            io.to(partnerId.id).emit("room-connected", roomId);
            io.to(socket.id).emit("room-connected", roomId);
            console.log('call')
        } else {
            console.log('wait: ', socket.id)
            waitingUsers.push({ socket, id: socket.id });
            socket.emit("waiting");
        }
    });

    socket.on("offer", (offer, roomId, id) => {
        const room = rooms[roomId]
        const user = room[0].id == id ? room[1].socket : room[0].socket
        user.emit("offer", offer, roomId);
    });

    socket.on("answer", (answer, roomId, id) => {
        const room = rooms[roomId]
        const user = room[0].id == id ? room[1].socket : room[0].socket
        user.emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate, roomId, id, type) => {
        const room = rooms[roomId]
        const user = room[0].id == id ? room[1].socket : room[0].socket
        user.emit("ice-candidate", candidate, type);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        removeUserFromQueue(socket.id, waitingUsers);
        disconnectUserFromRoom(socket.id, rooms, io);
    });
});

