// Helper to remove a user from the waiting queue
function removeUserFromQueue(userId, waitingUsers) {
  const index = waitingUsers.findIndex((user) => user.id === userId);
  if (index !== -1) {
    waitingUsers.splice(index, 1); // Remove the user from the queue
  }
}

function disconnectUserFromRoom(userId, rooms) {
  for (const roomId in rooms) {
    const roomUsers = rooms[roomId];

    const userIndex = roomUsers.findIndex((user) => user.id === userId);

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

function handleSkip(id, roomId, rooms, waitingUsers, users) {
  const room = rooms[roomId];
  if (!room) {
    console.log(`Room with ID ${roomId} does not exist.`);
    return;
  }

  // Find the skipping user and their partner
  const userIndex = room.findIndex((user) => user.id === id);

  if (userIndex > -1) {
    const partner = room.find((user, index) => index !== userIndex);

    if (partner) {
      // Notify the partner about the skip
      partner.socket.emit("partner-disconnected");

      partner.socket.leave(roomId);
      users[id].prev = partner.id;
      users[partner.id].prev = id
      // Add the partner back to the waiting pool
      waitingUsers.push({ socket: partner.socket, id: partner.id });
    }

    // Add the skipping user back to the waiting pool
    const currentUser = room[userIndex];
    currentUser.socket.leave(roomId);
    waitingUsers.push({ socket: currentUser.socket, id: currentUser.id });

    // Remove the room
    delete rooms[roomId];
    console.log(`Room ${roomId} has been deleted.`);
  }
}

module.exports = { removeUserFromQueue, disconnectUserFromRoom, handleSkip };
