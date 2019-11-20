var log = {
    contorAcces: 0
};

var elemtitle = document.querySelector('#titlelog');
elemtitle.addEventListener('change', (evt) => {
    evt.preventDefault();
    log.title = evt.target.value;
    console.log(log);
});

var submitBtn = document.querySelector('#enterlog');
submitBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    editorX.save().then((content) => {
        log.content = content;
        pubComm.emit('log', log);
    }).catch((e) => {
        console.log(e);
    });
});

// aștept răspunsul de la server și redirecționez utilizatorul către resursa tocmai creată.
pubComm.on('log', (entry) => {
    console.log(entry); // FIXME: Dezactivează!
    window.location.href = '/log';
});