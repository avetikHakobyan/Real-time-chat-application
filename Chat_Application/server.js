const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const path = require('path');
const fs = require('fs');

const WEB_ROOT = path.join(__dirname, 'public');

const { Server, Socket } = require('socket.io');
const io = new Server(server);

const PORT = 3000;

let users = [];
let mainMessagesArr = [];
let roomN = 0;

let choiceArr = [];

const RED = "FF0000";

app.use(express.static(WEB_ROOT));

let randomColor = () => Math.floor(Math.random() * 16601168).toString(16).padStart(6, '0');

let areDifferent = (color1, color2) => {
    let r1 = color1.substring(0, 2);
    let g1 = color1.substring(2, 4);
    let b1 = color1.substring(4);

    let r2 = color2.substring(0, 2);
    let g2 = color2.substring(2, 4);
    let b2 = color2.substring(4);

    let rNum1 = parseInt(r1, 16);
    let gNum1 = parseInt(g1, 16);
    let bNum1 = parseInt(b1, 16);
    let rNum2 = parseInt(r2, 16);
    let gNum2 = parseInt(g2, 16);
    let bNum2 = parseInt(b2, 16);

    return (Math.sqrt((rNum1 - rNum2) ** 2 + (gNum1 - gNum2) ** 2 + (bNum1 - bNum2) ** 2)) > 75;
}

const formatMessage = (username, message, color) => {
    return {
        username,
        message,
        color
    }
}

const addUser = (id, username) => {
    let user = { "id": id, "username": username, "room": "main", "color": randomColor() }
    while (user.color === '5865F2') {
        user.color = randomColor();
    }
    users.push(user);
    return user;
}

const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

const getUserById = (id) => {
    return users.find((user) => user.id === id);
}

const getUser = (username) => {
    return users.find((user) => user.username === username);
}

const log = (msg, username) => {
    const date = new Date();
    let dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
    let file = path.join(__dirname, 'logs', `${dateString}events.log`);
    let dateTime = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    fs.stat(file, (err, stat) => {
        if (file.includes(`${dateString}events.log`)) {
            fs.appendFile(file, `${dateTime} ${username} ${msg}\n`, (err) => { })
        } else if (err === 'ENOENT') {
            fs.createWriteStream(file, { 'flags': 'a' });
        }
    })
}

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        const user = addUser(socket.id, username);
        socket.join('main');
        // socket.emit('reload-old-messages', mainMessagesArr);
        let msg = `<strong>${user.username}</strong> joined the chat. Say hi! 👋`;
        mainMessagesArr.push(formatMessage('Bot', msg));
        socket.to('main').emit('chat-message', formatMessage("Bot", msg));
        socket.emit('chat-message', formatMessage("Bot", `Welcome <strong>${user.username}</strong>! Enter !help to get a list of all available commands`))

        socket.on('disconnect', () => {
            const leftUser = removeUser(socket.id);
            let msg = `<strong>${leftUser.username}</strong> left the chat`;
            mainMessagesArr.push(formatMessage('Bot', msg));
            socket.to('main').emit('chat-message', formatMessage("Bot", msg));
        })

    })
    socket.on('chat-message', (msg) => {
        let user = getUserById(socket.id);
        if (user.room === 'main') {
            mainMessagesArr.push(formatMessage(user.username, msg, user.color));
        }
        log(msg.length, user.username);
        socket.to(user.room).emit('chat-message', formatMessage(user.username, msg, user.color));
        socket.emit('user-info', formatMessage("You", msg, user.color));
    })
    socket.on('serverUsers', () => {
        socket.emit('serverUsers', users.sort((a, b) => a.username.localeCompare(b.username)))
    })
    socket.on('private-message', pMsg => {
        if (getUser(pMsg.username)) {
            log(`${pMsg.username} ${pMsg.message.length}`, getUserById(socket.id).username)
            io.to(getUser(pMsg.username).id).emit('private-message', formatMessage(`${getUserById(socket.id).username} (private)`, pMsg.message, getUserById(socket.id).color));
            socket.emit('user-info', formatMessage("You (private)", pMsg.message, getUserById(socket.id).color));
        } else {
            socket.emit('chat-message', formatMessage('Bot', `Please enter a valid username. <strong>${pMsg.username}</strong> is not in the chat`, RED))
        }
    })
    socket.on('room-invite', username => {
        if (getUser(username)) {
            io.to(getUser(username).id).emit('private-message', formatMessage("Bot",
                `<strong>${getUserById(socket.id).username}</strong> is inviting you to join a private room 
            <button type="button" onclick="join_private(this)" class="btn btn-sm btn-success py-1" title="Accept">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                </svg>
            </button> 
            <button type="button" onclick="decline_room(this)" class="btn btn-sm btn-danger py-1" title="Decline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
            </button>`))
            socket.emit('chat-message', formatMessage('Bot', `Private room invitation sent to <strong>${username}</strong>.`, '32CD32'))
            io.to(getUser(username).id).emit('room-invite', getUserById(socket.id), username);
        } else {
            socket.emit('chat-message', formatMessage('Bot', `Please enter a valid username. <strong>${username}</strong> is not in the chat`, RED))
        }
    })
    socket.on('join-private', username => {
        let user = getUser(username);
        if (user) {
            let newRoom = ''; //let newRoom = `room-${roomN++}`;
            if (user.room === "main") {
                newRoom = `room-${roomN++}`;
            } else {
                newRoom = user.room;
            }
            socket.leave('main');
            socket.join(newRoom);
            getUserById(socket.id).room = newRoom;
            io.to(user.id).emit('join-private', newRoom);
            socket.emit('display-private');
            socket.broadcast.to(newRoom).emit('chat-message', formatMessage('Bot', `${getUserById(socket.id).username} joined the private room`))
        } else {
            socket.emit('invalid-invite');
            socket.emit('chat-message', formatMessage('Bot', `Request rejected because <strong>${username}</strong> is not in the chat`, RED))
        }
    })

    socket.on('join-room', newRoom => {
        let user = getUserById(socket.id);
        if (user.room === 'main') {
            socket.leave('main');
            socket.emit('display-private');
        } else {
            socket.leave(user.room);
        }
        socket.join(newRoom);
        getUserById(socket.id).room = newRoom;
    })

    socket.on('decline-room', (user, username) => {
        socket.to(getUser(user).id).emit('chat-message', formatMessage('Bot', `<strong>${username}</strong> declined the private room invitation`, RED))
    })

    socket.on('leave-private', () => {

        socket.broadcast.to(getUserById(socket.id).room).emit('chat-message', formatMessage('Bot', `<strong>${getUserById(socket.id).username}</strong> left the private room`))

        socket.leave(getUserById(socket.id).room);

        let roomSocketsArr = Array.from(io.sockets.adapter.rooms.get(getUserById(socket.id).room));

        if (roomSocketsArr.length === 1) {

            io.to(roomSocketsArr[0]).emit('leave-private', getUserById(socket.id).room);
            roomN--;
        }

        getUserById(socket.id).room = 'main';
        socket.join('main');
        socket.emit('display-public');
        socket.emit('reload-old-messages', mainMessagesArr);
        socket.emit('chat-message', formatMessage('Bot', `Welcome back!`));
    })

    socket.on('self-leave-private', room => {
        socket.leave(getUserById(socket.id).room);
        getUserById(socket.id).room = 'main';
        socket.join('main');
        socket.emit('display-public');
        socket.emit('reload-old-messages', mainMessagesArr);
        socket.emit('chat-message', formatMessage('Bot', `Welcome back!`));
    })

    socket.on('game-invite', username => {
        if (getUser(username)) {
            io.to(getUser(username).id).emit('private-message', formatMessage("Bot",
                `<strong>${getUserById(socket.id).username}</strong> is inviting you to play Rock/Paper/Scissors 
            <button type="button" onclick="accept_game(this)" class="btn btn-sm btn-success py-1" title="Accept">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                </svg>
            </button> 
            <button type="button" onclick="decline_game(this)" class="btn btn-sm btn-danger py-1" title="Decline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
            </button>`))
            socket.emit('chat-message', formatMessage('Bot', `Game invitation sent to <strong>${username}</strong>.`, '32CD32'))
            io.to(getUser(username).id).emit('game-invite', getUserById(socket.id), username);
        } else {
            socket.emit('chat-message', formatMessage('Bot', `Please enter a valid username. <strong>${username}</strong> is not in the chat`, RED))
        }
    })

    socket.on('decline-game', (user, username) => {
        socket.to(getUser(user).id).emit('chat-message', formatMessage('Bot', `<strong>${username}</strong> declined the game invitation`, RED))
    })

    socket.on('display-game', username => {
        let user = getUser(username);
        if (user) {
            io.to(user.id).emit('display-game', getUserById(socket.id));
        } else {
            socket.emit('invalid-invite');
            socket.emit('chat-message', formatMessage('Bot', `Request rejected because <strong>${username}</strong> is not in the chat`, RED))
        }
    })

    socket.on('display-own-game', user => {
        io.to(user.id).emit('display-own-game');
    })

    socket.on('play', (choice, username) => {
        choiceArr.push({ "username": username, "choice": choice })
        if (choiceArr.length === 2) {
            io.to(getUser(choiceArr[0].username).id, getUser(choiceArr[1].username)).emit('decide-winner', choiceArr, username);
        }
    })

    socket.on('decide-winner', (winner, username) => {
        choiceArr = [];
        if (winner === "You won") {
            log(`Winner:${getUserById(socket.id).username}`, getUserById(socket.id).username);
            winner = "You lost";
        } else if (winner === "You lost") {
            log(`Winner:${username}`, getUserById(socket.id).username)
            winner = "You won"
        }
        io.to(getUser(username).id).emit('display-winner', winner);
    })
})

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})