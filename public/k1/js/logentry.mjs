import {socket, pubComm, createElement, check4url, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

/* === OBIECTUL RESURSA din `data-content` === */
let data    = document.querySelector('#codex').dataset;
let dataRes = JSON.parse(JSON.stringify(data)) || null;

// Obiectul record
let log = {
    id: dataRes._id,
    content: JSON.parse(dataRes.content)
};

// USER ID (necesar upload-ului imaginilor, vezi metodele editorului)
// let userId = document.querySelector('#userId').value;

/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    placeholder: 'Introdu aici conținutul',
    logLevel: 'VERBOSE', 
    /* VERBOSE 	Show all messages (default)
        INFO 	Show info and debug messages
        WARN 	Show only warn messages
        ERROR 	Show only error messages */
    /**
    * onReady callback
    */
    onReady: () => {
        console.log('Editor.js is ready to work!');

        if (dataRes.content.blocks) {
            dataRes.content.blocks.map(element => {
                if(element.data.file) {
                    let fileUrl = check4url(element.data.file.url);
                    let pathF = fileUrl.path2file;
                    switch (element.type) {
                        case 'image':
                            // dacă există o cale și este și în setul `imagini`
                            if (pathF !== undefined) {
                                return pathF;
                            }
                            break;
                        case 'attaches':
                            if (pathF !== undefined) {
                                fileRes.add(pathF);
                                return pathF;
                            }
                            break;
                        default:
                            return;
                    }
                }
            });
        }

    },
    /**
     * Id of Element that should contain Editor instance
     */
    holder: 'codex',
    data: log.content,
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
        },
        image: {
            class: ImageTool,
            config: {
                /* === providing custom uploading methods === */
                uploader: {
                    /**
                     * ÎNCARCĂ FIȘIERUL DE PE HARD!!!
                     * Folosește sockets pentru comunicarea cu serverul. Evenimentul `resursa`
                     * @param {File} file - Fișierul încărcat ca prim parametru
                     * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                     */
                    uploadByFile(file){
                        // => construcția obiectul care va fi trimis către server
                        let objRes = {
                            user: userId,      // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                            name: autor.value, // este de forma "Nicu Constantinescu"
                            resF: file,        // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                            numR: file.name,   // name: "Sandro_Botticelli_083.jpg"
                            type: file.type,   // type: "image/jpeg"
                            size: file.size
                        };

                        /**
                         * Funcția are rolul de executor pentru promisiune
                         * @param {Function} resolve callback-ul care se declanșează la rezolvarea promisiunii
                         * @param {Function} reject  callback-ul declanșat la respingerea promisiunii
                         */
                        function executor (resolve, reject) {
                            // console.log('Cand încarc un fișier, trimit obiectul: ', objRes);                                
                            // TRIMITE ÎN SERVER
                            pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server. Serverul creează bag-ul și scrie primul fișier!!! [UUID creat!]

                            // RĂSPUNSUL SERVERULUI
                            pubComm.on('resursa', (respObj) => {
                                // console.log('În urma încărcării fișierului de imagine am primit de la server: ', respObj);

                                // constituie cale relativă de pe server
                                var urlAll = new URL(`${respObj.file}`);
                                var path = urlAll.pathname; // VERIFICĂ `path` SĂ FIE DE FORMA: "/repo/5e31bbd8f482274f3ef29103/5af78e50-5ebb-11ea-9dcc-f50399016f10/data/628px-European_Union_main_map.svg.png"

                                /* Editor.js se așteaptă ca acesta să fie populat după ce fișierul a fost trimis. */                            
                                const obj4EditorJS = {
                                    success: respObj.success, // 1 succes, 0 eșec
                                    file: {
                                        url: path, // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                        size: respObj.size
                                    }
                                };

                                // Adaugă imaginea încărcată în `Set`-ul `fileRes`.
                                // imagini.add(path); // încarcă url-ul imaginii în Set-ul destinat ținerii evidenței acestora. Necesar alegerii copertei

                                resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                            });
                        }
                        // construiește promisiunea
                        var promise = new Promise(executor);
                        // REZOLVĂ PROMISIUNEA!!!                     
                        return promise.then((obi) => {
                            console.log("form01adress obiectul promisiune la încărcarea unei imagini ", obi);
                            return obi; // returnează rezultatul promisiunii. Este ceea ce are nevoie Editor.js în caz de succes
                        }).catch((error) => {
                            if (error) {
                                pubComm.emit('mesaje', `Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
                            }
                        });
                    },
                    
                    /**
                     * ÎNCARCĂ CU PASTE LINK SAU DRAG-AND-DROP
                     * Follosește `fetch` pentru a aduce imaginea de la distanță
                     * Folosește sockets pentru comunicarea cu serverul. Evenimentul `resursa`
                     * @param {String} url - Întreaga adresă către fișierul de imagine
                     * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                     */
                    uploadByUrl(url){
                        // console.log("[uploadByUrl] În uploadByUrl am primit următorul url drept parametru: ", url);

                        decodedURL = decodeURIComponent(url); // Dacă nu faci `decode`, mușcă pentru linkurile HTML encoded cu escape squence pentru caracterele speciale și non latine
                        let urlObj = check4url(decodedURL); // adună toate informațiile despre fișier
                        /**
                         * Funcția validează răspunsul în funcție de headere și stare
                         * @param {Object} response 
                         */
                        function validateResponse(response) {
                            if (!response.ok) {
                                // pubComm.emit('mesaje', `Am încercat să trag imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                console.log('[uploadByUrl::validateResponse] Am detectat o eroare: ', response.statusText);
                            }
                            // console.log('[uploadByUrl::validateResponse] fetch a adus: ', response); // response.body este deja un ReadableStream

                            let result = response.blob();

                            // obiectul care va fi trimis către server
                            let objRes = {
                                user: userId,
                                name: autor.value,
                                resF: result,                 // introdu fișierul ca blob
                                numR: urlObj.afterLastSlash,  // completează obiectul care va fi trimis serverului cu numele fișierului
                                type: result.type,            // completează cu extensia
                                size: result.size             // completează cu dimensiunea 
                            };                   
                            
                            // console.log("[uploadByUrl::fetch] În server am trimis obiectul de imagine format după fetch: ", objRes);

                            pubComm.emit('resursa', objRes);    // trimite resursa în server (se va emite fără uuid dacă este prima)

                            // promisiune necesară pentru a confirma resursa primită OK!
                            const promissed = new Promise((resolve, reject) => {                                   
                                pubComm.on('resursa', (respObj) => {
                                    // console.log('[uploadByUrl::pubComm<resursa>)] UUID-ul primit prin obiectul răspuns este: ', respObj.uuid);

                                    let fileLink = new URL(`${respObj.file}`);
                                    let path = fileLink.pathname; // va fi calea către fișier, fără domeniu
                                    
                                    // obiectul necesar lui Editor.js
                                    const obj4EditorJS = {
                                        success:  respObj.success,
                                        file: {
                                            url:  path, // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                            size: respObj.size
                                        }
                                    };

                                    // Adaugă imaginea încărcată în `Set`-ul `fileRes`. Este necesar comparatorului pentru ștergere
                                    imagini.add(path);

                                    resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                });
                            });
                            // returnează promisiunea așteptată de Editor.js
                            return promissed.then((obi) => {                                    
                                return obi;
                            }).catch(error => {
                                if (error) {
                                    console.log('Promisiunea așteptată de Editor.js a eșuat cu următoarele detalii: ', error);
                                }
                            });                            
                        }

                        // ADU RESURSA DE PE WEB înainte de a o trimite în server
                        return fetch(decodedURL)
                            .then(validateResponse)
                            .catch((error) => {
                                if (error) {
                                    console.log('Am eșuat în aducerea resursei cu `fetch` cu următoarele detalii: ', error);
                                }
                            });
                    }
                },
                captionPlaceholder: 'Legendă:',
                buttonContent: 'Selectează fișier',
                types: 'image/*'
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