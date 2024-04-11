const socket = io();
const elForm = document.querySelector('form');
const elUsername = document.querySelector('#username');
const errorSpan = document.querySelector('#errorSpan');
const errorUser = document.querySelector('#errorUser');

elUsername.focus()

elForm.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('serverUsers');
    socket.on('serverUsers', users => {
        let value = `${elUsername.value}`;
        if (users.map((user) => user.username).includes(value)) {
            errorSpan.classList.remove('visually-hidden');
            errorUser.textContent = `${value}`;
        } else {
            elForm.submit();
            errorSpan.classList.add('visually-hidden');
            errorUser.textContent = ``;
        }
    })
})