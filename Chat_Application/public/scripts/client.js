const elChat = document.querySelector("#chat-form");

const elMessages = document.querySelector("#messages");
const elChatInput = document.querySelector("#chat-input");
const elBtnSend = document.querySelector("#btnSend");

const elGame = document.querySelector('#game');
const elRock = document.querySelector('button[name="Rock"]');
const elPaper = document.querySelector('button[name="Paper"]');
const elScissors = document.querySelector('button[name="Scissors"]');

const elWinner = document.querySelector('#winner');
const elCountDown = document.querySelector('#countDown');

const RED = "FF0000";

let mainMessagesArr = [];

let darkMode = false;

let currChoice = '';

//Source: https://www.sitepoint.com/get-url-parameters-with-javascript/
const urlString = window.location.search;
const urlParams = new URLSearchParams(urlString);
const currUsername = urlParams.get('username');

const socket = io();

socket.emit('join', currUsername);

const emitChatMessage = (msg) => {
    if (msg) {
        socket.emit('chat-message', msg);
    }
}

const returnUserList = (arr) => {
    let str = `<ol class="ps-5">`
    for (let i = 0; i < arr.length; i++) {
        str += `<li style="color: #${arr[i].color};">${arr[i].username}</li>`;
    }
    str += `</ol>`;
    return str;
}

const returnHelpList = () => {
    let str = `<ul class="ps-5">`;
    str += `<li><strong>!help</strong>: Provides Help information for Avet's Chat commands.</li>`
    str += `<li><strong>!!users</strong>: Displays a list of the usernames of all the users on the server. This is displayed sorted by the username</li>`;
    str += `<li><strong>!clear</strong>: Clear all messages from view</li>`;
    str += `<li><strong>!"username" "message"</strong> (without quotes): Send a private message to just one other person in the chat.</li>`;
    str += `<li><strong>!invite "username"</strong> (without quotes): Send a private message to invite another person in the chat to a private room.</li>`;
    str += `<li><strong>#leave</strong>: Leave a private room and go back to the main . *Note* you need to be in a private room to enter this command</li>`;
    str += `<li><strong>!play "username"</strong> (without quotes): Send a private message to invite another person in the chat to play the Rock/Paper/Scissors (RPS) game together</li>`;
    str += `</ul>`;
    return str;
}

const displayMessage = (msg) => {
    mainMessagesArr.push(msg);
    let div = document.createElement('div');
    let div2 = document.createElement('div');
    let spanUser = document.createElement('span');
    let spanMessage = document.createElement('span');
    let spanDate = document.createElement('span');

    let date = new Date();
    let dayMonthYear = date.toLocaleString();
    spanDate.textContent = `${dayMonthYear}`;
    spanDate.classList.add('ps-2', 'fs-7', 'text-secondary');

    if (msg.username === 'Bot') {
        spanUser.style.backgroundColor = '#5865F2';
        spanMessage.style.color = `#${msg.color}`;
        spanUser.textContent = `👷🏻‍♂️ ${msg.username}`;
        spanUser.classList.add('pe-2');
        div2.append(spanUser, spanDate);
    } else if (msg.username === 'You') {
        spanUser.style.backgroundColor = `#${msg.color}`;
        spanUser.textContent = msg.username;
        div.classList.add('align-items-end');
        div2.append(spanDate, spanUser);
        spanUser.classList.add('ms-2');
    } else {
        spanUser.style.backgroundColor = `#${msg.color}`;
        spanUser.textContent = msg.username;
        div2.append(spanUser, spanDate);
    }

    spanUser.style.color = '#FFFFFF'
    spanUser.classList.add('p-1', 'px-2', 'rounded', 'fs-6');

    div2.classList.add('mb-2');
    spanMessage.innerHTML = msg.message;
    div.classList.add('d-flex', 'flex-column', 'mb-3');
    if (darkMode) {
        div.classList.add('dark_main-message');
    } else {
        div.classList.add('main-message');
    }
    div.append(div2, spanMessage);
    elMessages.appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
}

const displayBotMessage = (text, color) => {
    displayMessage({ "username": "Bot", "message": text, "color": `${color}` })
}

const handleChat = (e) => {
    e.preventDefault();
    let value = `${elChatInput.value}`;
    if (value.charAt(0) === '!') {

        if (value === "!!users") {
            socket.emit('serverUsers');
        } else if (value === "!help") {
            displayBotMessage(`Available commands:<br>${returnHelpList()}`)
        } else if (value.match(/^!\S+\s.+$/gm)) {

            if (value.match(/^!(invite)\s\S+$/gm)) {

                let username = value.substring(value.indexOf(' ') + 1);
                socket.emit('room-invite', username);

            } else if (value.match(/^!(play)\s\S+$/gm)) {

                let username = value.substring(value.indexOf(' ') + 1);
                socket.emit('game-invite', username);

            } else {

                let username = value.substring(1, value.indexOf(' '));
                let message = value.substring(value.indexOf(' ') + 1);
                socket.emit('private-message', { username, message });

            }
        } else if (value === "!clear") {
            elMessages.innerHTML = "";
        } else {
            displayBotMessage(`Invalid command entered, for a list of valid commands enter <strong>!help</strong>`, RED);
        }
    } else if (value === "#leave") {
        if (darkMode) {
            socket.emit('leave-private');
        } else {
            displayBotMessage(`Invalid command entered, for a list of valid commands enter <strong>!help</strong>`, RED);
        }
    } else if (value.includes('http') || value.includes('https')) {
        emitChatMessage(`<a href='${value}'>${value}</a>`);
    } else {
        emitChatMessage(value);
    }
    elChatInput.value = '';
}

const join_private = (e) => {
    let username = e.previousElementSibling.textContent;
    socket.emit('join-private', username);
}

const decline_room = (e) => {
    let username = e.previousElementSibling.previousElementSibling.textContent;
    e.parentElement.parentElement.remove();
    socket.emit('decline-room', username, currUsername);
}

const accept_game = (e) => {
    let username = e.previousElementSibling.textContent;
    e.parentElement.parentElement.remove();
    socket.emit('display-game', username);
}

const decline_game = (e) => {
    let username = e.previousElementSibling.previousElementSibling.textContent;
    e.parentElement.parentElement.remove();
    socket.emit('decline-game', username, currUsername);
}

const disableAll = () => {
    elRock.classList.add('disabled');
    elPaper.classList.add('disabled');
    elScissors.classList.add('disabled');
}

const enableAll = () => {
    elRock.classList.remove('disabled');
    elPaper.classList.remove('disabled');
    elScissors.classList.remove('disabled');
}

const resetGame = () => {
    elWinner.textContent = "Choose...";
    disableAll();
    countDown(2);
}

const countDown = (x) => {
    let count = x;
    let countInterval = setInterval(function () {
        elCountDown.textContent = count;
        count--;
        console.log(count)
        if (count === -1) {
            clearInterval(countInterval);
            enableAll();
        }
    }, 1000);
}

const play = (e) => {
    if (e.name === "Rock") {
        elPaper.classList.add('disabled');
        elScissors.classList.add('disabled');
    } else if (e.name === "Paper") {
        elRock.classList.add('disabled');
        elScissors.classList.add('disabled');
    } else if (e.name === "Scissors") {
        elPaper.classList.add('disabled');
        elRock.classList.add('disabled');
    }
    socket.emit('play', e.name, currUsername);
}

const decideWinner = (u1, u2) => {
    if (u1 === u2) {
        return "It's a tie";
    } else if (u1 === "Paper") {
        return (u2 === "Rock") ? `You won` : `You lost`
    } else if (u1 === "Scissors") {
        return (u2 === "Paper") ? `You won` : `You lost`
    } else if (u1 === "Rock") {
        return (u2 === "Scissors") ? `You won` : `You lost`
    }
}

elBtnSend.addEventListener('click', function (e) {
    handleChat(e);
})

elChat.addEventListener('submit', function (e) {
    handleChat(e);
})

document.querySelector('#btnClose').addEventListener('click', () => {
    elGame.classList.add('visually-hidden');
    socket.emit('close-game')
})

socket.on('chat-message', (msg) => {
    socket.emit('user-info');
    displayMessage(msg);
})

socket.on('serverUsers', (users) => {
    displayBotMessage(`🟢 Users online:<br>${returnUserList(users)}`)
    window.scrollTo(0, document.body.scrollHeight)
})

socket.on('user-info', user => {
    displayMessage(user)
});

socket.on('private-message', pMsg => {
    displayMessage(pMsg)
})

socket.on('join-private', newRoom => {
    socket.emit('join-room', newRoom);
})

socket.on('invalid-invite', () => {
    document.querySelector('button[title="Decline"]').parentElement.parentElement.remove();
})

socket.on('display-private', () => {
    darkMode = true;
    elMessages.innerHTML = "";
    document.body.style.backgroundColor = '#181a1b';
    document.body.style.color = '#d1cdc7';
    document.querySelectorAll('.main-message').forEach(el => { el.classList.replace('main-message', 'dark_main-message') });
    displayBotMessage('You joined a private room 🔒 Enter #leave to go back to the main room');
})

socket.on('display-public', () => {
    darkMode = false;
    elMessages.innerHTML = "";
    document.body.style.backgroundColor = '#FFFFFF';
    document.body.style.color = '#212529';
    document.querySelectorAll('.main-message').forEach(el => { el.classList.replace('dark_main-message', 'main-message') })
})

socket.on('leave-private', room => {
    socket.emit('self-leave-private', room);
})

socket.on('reload-old-messages', arr => {
    if (arr.length !== 0) {
        arr.forEach(msg => {
            displayMessage(msg);
        })
    }
})

socket.on('display-game', user => {
    elGame.classList.remove('visually-hidden');
    elMessages.lastChild.remove();
    resetGame();
    socket.emit('display-own-game', user)
})

socket.on('display-own-game', () => {
    elGame.classList.remove('visually-hidden');
    resetGame();
})

socket.on('play', (choice, username) => {
    socket.emit('play', choice, username)
})

socket.on('decide-winner', (arr, username) => {
    let winner = decideWinner(arr[0].choice, arr[1].choice);
    elWinner.textContent = winner;
    socket.emit('decide-winner', winner, username);
    elWinner.textContent += ' (Replaying in)';
    countDown(4);
    setTimeout(() => {
        resetGame();
    }, 5000);
})

socket.on('display-winner', winner => {
    elWinner.textContent = winner;
    elWinner.textContent += ` (Replaying in)`;
    countDown(4);
    setTimeout(() => {
        resetGame();
    }, 5000);
})

socket.on('close-game', () => {
    elGame.classList.add('visually-hidden');
})