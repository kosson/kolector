var socket = io();
var pubComm = io('/redcol');

// MANAGEMENTUL COMUNICĂRII pe socketuri
pubComm.on('mesaje', (mess) => {
    // TODO: execută funcție care afișează mesajul
    // broadcastMes(mess);
    console.log(text);
});

$(document).ready(function() {
    $('#competenteS').DataTable();
} );