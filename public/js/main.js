var socket = io();
var pubComm = io('/redcol');
var uuid = '';

// MANAGEMENTUL COMUNICĂRII pe socketuri
pubComm.on('mesaje', (mess) => {
    // TODO: execută funcție care afișează mesajul
    // broadcastMes(mess);
    console.log(text);
});

pubComm.on('uuid', (id) => {
    uuid = id;
    RED.uuid = id;
});

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