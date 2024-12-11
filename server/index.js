const { Server } = require("socket.io");
const {
  removeUserFromQueue,
  disconnectUserFromRoom,
  handleSkip,
} = require("./utils/user.utils");
const { default: axios } = require("axios");

const waitingUsers = [];
const rooms = {};
const users = {};

const io = new Server(3000, {
  cors: {
    origin: "*",
  },
});

console.log("Socket.IO server running on port 3000");

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  if (!users[socket.id]) {
    users[socket.id] = {
      socket,
      id: socket.id,
      class: null,
      preference: null,
      prev: null,
    };
  }

  socket.on("join", () => {
    if (waitingUsers.length > 0) {
      console.log("waitingUsers", waitingUsers);

      console.log("users", users);
      waitingUsers.forEach((partnerId, index) => {
        if (users[partnerId.id]?.class != null) {
          console.log(users[partnerId.id].class, users[socket.id].preference);
          if (
            users[partnerId.id]?.class == users[socket.id]?.preference &&
            partnerId.id !== socket.id &&
            partnerId.id != users[socket.id].prev
          ) {
            const roomId = `${socket.id}-${partnerId.id}`;
            rooms[roomId] = [{ socket, id: socket.id }, partnerId];
            socket.join(roomId);
            partnerId.socket.join(roomId);
            io.to(partnerId.id).emit("room-connected", roomId);
            io.to(socket.id).emit("room-connected", roomId);
            console.log("call");
            waitingUsers.splice(index, 1);
            console.log("rooms", rooms);
          }
        }
      });
    } else {
      console.log("wait: ", socket.id);
      waitingUsers.push({ socket, id: socket.id });
      socket.emit("waiting");
    }
  });

  socket.on("setPreference", (preference) => {
    users[socket.id].preference = preference;
    console.log("setPreference", preference);
  });

  socket.on("frame", async (frame, roomId) => {
    axios
      .post(
        "http://0.0.0.0:8000/predict",
        {
          base64_string: frame, // Send base64 string to the server
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then(function (response) {
        const { predictions } = response.data;
        if (predictions.length > 1) {
          users[socket.id].class = "others";
        } else {
          if (users[socket.id]) users[socket.id].class = predictions[0].class;
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  });

  socket.on("message", (msg, roomId, sender) => {
    console.log(msg, roomId, sender);
    socket.to(roomId).emit("message", msg, sender);
  });

  socket.on("offer", (offer, roomId, id) => {
    const room = rooms[roomId];
    if (room) {
      const user = room[0].id == id ? room[1].socket : room[0].socket;
      user.emit("offer", offer, roomId);
    }
  });

  socket.on("answer", (answer, roomId, id) => {
    const room = rooms[roomId];
    const user = room[0].id == id ? room[1].socket : room[0].socket;
    user.emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate, roomId, id, type) => {
    const room = rooms[roomId];
    const user = room[0].id == id ? room[1].socket : room[0].socket;
    user.emit("ice-candidate", candidate, type);
  });

  socket.on("skip", (id, roomId) => {
    handleSkip(id, roomId, rooms, waitingUsers, users);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];

    removeUserFromQueue(socket.id, waitingUsers);
    disconnectUserFromRoom(socket.id, rooms, io);
  });
});
