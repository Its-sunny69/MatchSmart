const { Server } = require('socket.io');
const { removeUserFromQueue, disconnectUserFromRoom } = require('./utils/user.utils');
const { default: axios } = require('axios');

const waitingUsers = [];
const rooms = {};
const users = {};
/**
 * users[user.Id] = {
 * class:'male'
 * preference : 'female'
 * }
 * waitingUsers = id 
 * id = users 
 * 
 * w[0]
 * 
 * user.class 
 * 
 * w = id => usr.class == preference
 * user.class == preference
 *  
 */

const io = new Server(3000, {
    cors: {
        origin: "*",
    },
});

console.log('Socket.IO server running on port 3000');

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    users[socket.id] = {
        class: null,
        preference: null
    }

    socket.on("join", () => {
        if (waitingUsers.length > 0) {
            let partnerId = null
            waitingUsers.forEach((item, index) => {
                console.log(users[item.id])
                if (users[item.id].class != null) {
                    if (users[item.id].class == users[socket.id].perference) {
                        partnerId = waitingUsers[index]
                        const roomId = `${socket.id}-${partnerId.id}`;
                        rooms[roomId] = [{ socket, id: socket.id }, partnerId];
                        socket.join(roomId);
                        partnerId.socket.join(roomId);
                        io.to(partnerId.id).emit("room-connected", roomId);
                        io.to(socket.id).emit("room-connected", roomId);
                        console.log(users, rooms)
                        console.log('call')
                        waitingUsers.splice(index, 1);
                    }
                }
            })
        } else {
            console.log('wait: ', socket.id)
            waitingUsers.push({ socket, id: socket.id });
            socket.emit("waiting");
        }
    });

    socket.on("setPreference", (preference) => {
        console.log('setPreference', preference)
        users[socket.id].preference = preference
    })

    // {
    //     inference_id: 'da98d344-da71-49f3-ab93-7cca8ccb5eac',
    //     time: 0.029687725998883252,
    //     image: { width: 1280, height: 720 },
    //     predictions: [
    //       {
    //         x: 101,
    //         y: 341,
    //         width: 200,
    //         height: 682,
    //         confidence: 0.4134555757045746,
    //         class: 'male',
    //         class_id: 1,
    //         detection_id: '21003b01-5a89-4c46-afba-0314d09f107d'
    //       }
    //     ]
    //   }

    socket.on("frame", async (frame, roomId) => {
        axios.post("http://0.0.0.0:8000/predict", {
            base64_string: frame // Send base64 string to the server
        }, {
            headers: { "Content-Type": "application/json" }
        })
            .then(function (response) {
                const { predictions } = response.data;
                console.log(predictions)
                if (predictions.length > 1) {
                    users[socket.id].class = 'others'
                }
                else {
                    users[socket.id].class = predictions[0].class
                }
            })
            .catch(function (error) {
                console.log(error)
            });
    })

    socket.on("message", (msg, roomId, sender) => {
        console.log(msg, roomId, sender)
        socket.to(roomId).emit("message", msg, sender);
    })

    socket.on("offer", (offer, roomId, id) => {
        const room = rooms[roomId]
        if (room) {
            const user = room[0].id == id ? room[1].socket : room[0].socket
            user.emit("offer", offer, roomId);
        }
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

