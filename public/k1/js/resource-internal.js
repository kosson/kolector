import {pubComm, createElement, decodeCharEntities, datasetToObject} from './main.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

// OBȚINEREA DATELOR
let dataRes = document.querySelector('.resursa').dataset;
let RED = JSON.parse(dataRes.content);

let autoriArr = RED.autori.split(','); // tratez cazul în care ai mai mulți autori delimitați de virgule
let author = '';
if (autoriArr.length >= 1) {
    author = autoriArr[0].trim();
} else {
    author = autori;
}
RED.nameUser = author;
// console.log("[personal-res::profile/:id] Obiectul resursă arată astfel: ", dataRes);

// OBIECTUL RESURSEI
var resObi = {
    id:           dataRes.id, 
    contribuitor: dataRes.contribuitor,
    content:      RED.content,
    uuid:         dataRes.uuid
};

let imagini = new Set(); // un `Set` cu toate imaginile care au fost introduse în document.
let fisiere = new Set(); // un `Set` cu toate fișierele care au fost introduse în document la un moment dat (înainte de `onchange`).

// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
function validURL(str) {
    // var pattern = new RegExp('^(http?s?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-aA-zZ\d%_.~+]*)*(\[-a-z\d_]*)?(\?[;&a-z\d%_.~+=-]*)?$', 'i');
    var pattern = new RegExp('^(http?s?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ //port
            '(\\?[;&amp;a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i');
    return !!pattern.test(str);
}

/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    placeholder: '',
    logLevel: 'VERBOSE',
    data: resObi.content,
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
        //_ TODO: Construiește logica pentru a popula `imagini` și `fisiere` de îndată ce s-au încărcat datele
        if(resObi?.content?.blocks) {
            resObi.content.blocks.map(obj => {
                switch (obj.type) {
                    case 'image':
                        imagini.add(obj.data.file.url);
                        break;
                    case 'attaches':
                        fisiere.add(obj.data.file.url);
                        break;
                }
            });
        }
    },
    holder: 'codex-editor',    
    /* Obiectul tuturor instrumentelor pe care le oferă editorul */ 
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
        },
        embed: {
            class: Embed,
            inlineToolbar: true,
            config: {
                services: {
                    youtube: true,
                    coub: true,
                    codepen: {
                        regex: /https?:\/\/codepen.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                        embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                        html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                        height: 300,
                        width: 600,
                        id: (groups) => groups.join('/embed/')
                    }
                }
            }
        },
        image: {
            class: ImageTool,
            config: {
                captionPlaceholder: 'Legendă:',
                buttonContent: 'Selectează fișier',
                types: 'image/*'
            }
        },
        quote: {
            class: Quote,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+O',
            config: {
                quotePlaceholder: 'Introdu citatul',
                captionPlaceholder: 'Autorul citatului',
            }
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

// descarcă resursa ca zip
let zipdownloadbtn = document.getElementById('zipdownload');
zipdownloadbtn.addEventListener('click', (evt) => {
    fetch(`${document.location.origin}${document.location.pathname}/zip?` + new URLSearchParams({
        path: `${resObi.contribuitor}/${resObi.uuid}`,
        uuid: `${resObi.uuid}`
    }).toString()).then((response) => {
        if (response.status != 200) {
            throw new Error("Bad Server Response"); 
        } else {
            downloadFile(response);
        }
        }).catch((error) => {
        console.log(error);
    });
});

// Tratarea modulului de apreciere a resursei (5 stele)
let votesArr = RED?.metrics?.fiveStars || [0,0,0,0,0]; // cazul în care nu am array de aprecieri
let idx = undefined, votes = undefined, lblClassName = undefined;

for (idx = 0; idx < votesArr.length; idx++) {
    votes = votesArr[idx];
    lblClassName = `star${idx + 1}`;
    document.querySelector(`label.${lblClassName}`).setAttribute('title', votes);
}
const starRatingForm = document.querySelector(".rating-system");
// starRatingForm.addEventListener("change", (e) => {
//     pubComm.emit('rating5s', value);
//     return e.target.value;
// });