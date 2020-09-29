// import {createElement, decodeCharEntities, datasetToObject} from './main.mjs';
// import {AttachesToolPlus} from './uploader.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

var pubComm = io('/redcol', {
    query: {['_csrf']: csrfToken}
});

var log = {
    contorAcces: 0
};

/* === Integrarea lui EditorJS === https://editorjs.io */
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
    },
    i18n: {
        messages: {
            // traducerea diferitelor componente ale UI-ului
            ui: {
                "blockTunes": {
                    "toggler": {
                        "Click to tune": "Apasă pentru a modifica",
                        "or drag to move": "sau trage pentru a muta"
                    },
                },                
                "toolbar": {
                    "toolbox": {
                        "Add": "Adaugă"
                    }
                }
            },
            toolNames: {
                "Text": "Paragraf",
                "Attaches": "Încarcă fișiere",
                "Heading": "Subtitluri",
                "List": "Listă",
                "Warning": "Avertizare",
                "Checklist": "Checklist",
                "Quote": "Citat",
                "Code": "Cod",
                "Delimiter": "Delimitare",
                "Raw HTML": "HTML pur",
                "Table": "Tabel",
                "Link": "Link",
                "Marker": "Marker",
                "Bold": "Bold",
                "Italic": "Italic",
                "InlineCode": "Cod inclus",
            },
            /**
             * Section allows to translate Block Tunes
             */
            blockTunes: {
                /**
                 * Each subsection is the i18n dictionary that will be passed to the corresponded Block Tune plugin
                 * The name of a plugin should be equal the name you specify in the 'tunes' section for that plugin
                 *
                 * Also, there are few internal block tunes: "delete", "moveUp" and "moveDown"
                 */
                "delete": {
                    "Delete": "Șterge blocul"
                },
                "moveUp": {
                    "Move up": "Mută mai sus"
                },
                "moveDown": {
                    "Move down": "Mută mai jos"
                }
            }      
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
    window.location.href = '/log';
});