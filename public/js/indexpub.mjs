import {socket} from './main.mjs';

// TESTAREA CONEXIUNII
// console.log('Socket sniff: ', {
//     detalii: socket.json
// });

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var socket = io({
//     query: {['_csrf']: csrfToken}
// });

// setInterval(() => {
//     socket.emit('testconn', 'test');
// }, 2000);