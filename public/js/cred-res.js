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
    id: dataRes.id, 
    contribuitor: dataRes.contributor,
    content: RED.content,
    uuid: dataRes.uuid
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
    data: resObi.content,
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
        //TODO: Construiește logica pentru a popula `imagini` și `fisiere` de îndată ce s-au încărcat datele
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
    },
    holder: 'edi',    
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
        attaches: {
            class: AttachesToolPlus,            
            config: {
                endpoint: `${location.origin}/upload`,
                buttonText: 'Încarcă un fișier',
                errorMessage: 'Nu am putut încărca fișierul.'
            }
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
    }
});