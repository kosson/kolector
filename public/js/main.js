var socket = io();
var pubComm = io('/redcol');
var uuid = '';

// MANAGEMENTUL COMUNICĂRII pe socketuri
pubComm.on('mesaje', (mess) => {
    // TODO: execută funcție care afișează mesajul
    // broadcastMes(mess);
    console.log(mess);
    $.toast({
        heading: 'Colectorul spune:',
        text: `${mess}`,
        position: 'top-center',
        showHideTransition: 'fade',
        hideAfter : 7000,
        icon: 'info'
    });
    //https://kamranahmed.info/toast
});

pubComm.on('uuid', (id) => {
    uuid = id;
    RED.uuid = id;
});