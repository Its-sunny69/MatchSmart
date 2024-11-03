// Helper to remove a user from the waiting queue
function removeUserFromQueue(userId, waitingUsers) {
    const index = waitingUsers.indexOf(userId);
    if (index > -1) waitingUsers.splice(index, 1);
}

function disconnectUserFromRoom(userId, rooms) {
    for (const roomId in rooms) {
        const roomUsers = rooms[roomId];

        const userIndex = roomUsers.findIndex(user => user.id === userId);

        if (userIndex > -1) {
            const partner = roomUsers.find((user, index) => index !== userIndex);

            if (partner) {
                partner.socket.emit("partner-disconnected", userId);
            }

            delete rooms[roomId];
            break;
        }
    }
}


module.exports = { removeUserFromQueue, disconnectUserFromRoom };
