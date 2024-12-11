const findUserById = (id, rooms) => {
    for (const roomId in rooms) {
        const roomUsers = rooms[roomId];
        const userIndex = roomUsers.findIndex((user) => user.id === id);
        return userIndex > -1
    }
}


module.exports = { findUserById }