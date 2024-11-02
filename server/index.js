const { Server } = require('socket.io');

const io = new Server(3000, {
    cors: {
        origin: "*",
    },
});

console.log('Socket.IO server running on port 3000');

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('message', (msg) => {
        console.log('Message received:', msg);
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
