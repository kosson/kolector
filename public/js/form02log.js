var log = {
    contorAcces: 0
};

/* ======== Integrarea lui EditorJS ======== https://editorjs.io */
const editorX = new EditorJS({
    placeholder: 'Introdu aici conținutul',
    /**
    * onReady callback
    */
    onReady: () => {
        console.log('Editor.js is ready to work!');
    },
    /**
     * Id of Element that should contain Editor instance
     */
    holder: 'codex-editor',
    /**
     * Enable autofocus
     */ 
    autofocus: true,
    tools: {
        header: {
            class: Header,
            config: {
                placeholder: 'Introdu titlul sau subtitlul'
            }
        },
        paragraph: {
            class: Paragraph,
            inlineToolbar: true,
        },
        list: {
            class: List,
            inlineToolbar: true
        },
        table: {
            class: Table,
            inlineToolbar: true
        },
        inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+M',
        }
    }
});

var title = document.querySelector('#titlelog');
title.addEventListener('change', (evt) => {
    evt.preventDefault();
    log.title = evt.target.value;
});

var autor = document.querySelector('#autor');
autor.addEventListener('change', (evt) => {
    evt.preventDefault();
    log.autor = evt.target.value;
});

var submitBtn = document.querySelector('#enterlog');
submitBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    var idContributor = document.querySelector('#idContributor');
    log.idContributor = idContributor.value;
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