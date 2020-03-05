let editorDiv = document.querySelector('#codex');
let redObj = JSON.parse(editorDiv.dataset.content);
console.log(redObj.content.blocks);

function renderBlks () {
    redObj.content.blocks.map(block => {
        editorX.blocks.render(block);
    });
}

// redObj.content.blocks.map(block => {
//     editorX.blocks.render(block);
// });
/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    // placeholder: 'Introdu conținut care să nu fie mai mult de câteva paragrafe. Editorul nu poate fi folosit pentru compunere de resurse. Acestea trebuie să existe deja!!!',
    data: redObj.content,
    /* onReady callback */
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
        console.log(editorX);
    },
    onChange: () => {console.log('Conținutul s-a modificat și ar trebui să apară un buton de salvare a acestuia')},
    /* id element unde se injectează editorul */
    holder: 'codex-editor',
    
    /* Activează autofocus */ 
    autofocus: false,
    
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
            class: AttachesTool,
            buttonText: 'Încarcă un fișier',
            config: {
                endpoint: `${location.origin}/repo`
            },
            errorMessage: 'Nu am putut încărca fișierul.'
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
                /* === providing custom uploading methods === */
                uploader: {
                    /**
                     * Upload file to the server and return an uploaded image data
                     * @param {File} file - file selected from the device or pasted by drag-n-drop
                     * @return {Promise.<{success, file: {url}}>}
                     */
                    uploadByFile(file){  
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)
                        console.log(file);

                        // => construcția obiectul care va fi trimis către server
                        let objRes = {
                            user: RED.idContributor,
                            name: RED.nameUser,
                            uuid: RED.uuid, // dacă deja a fost trimisă o primă resursă, înseamnă că în RED.uuid avem valoare deja
                            resF: file,     // este chiar fișierul
                            numR: file.name,
                            type: file.type
                        };

                        /* obiectul necesar lui Editor.js după ce fișierul a fost trimis
                           după ce trimiți fișierul, Editor.js se așteaptă ca acesta să fie populat */
                        let obj4EditorJS = {
                            success: '',
                            file: {
                                url: ''
                            }
                        };

                        /**
                         * Funcția are rolul de executor pentru promisiune
                         * @param {Function} resolve `callback-ul care se declanșează la rezolvarea promisiunii
                         * @param {Function} reject `callback-ul declanșat la respingerea promisiunii`
                         */
                        function executor (resolve, reject) {
                            // console.log('Cand încarc un fișier, trimit următorul obiect: ', objRes);                            
                            pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server
                            // trimite obiectul către server
                            pubComm.on('resursa', (respObj) => {
                                // în cazul în care pe server nu există nicio resursă, prima va fi creată și se va primi înapoi uuid-ul directorului generat de server
                                if (!RED.uuid) {
                                    RED.uuid = respObj.uuid;
                                }
                                // console.log('În urma încărcării fișierului de imagine am primit de la server: ', respObj);
                                
                                // completarea proprietăților așteptate de EditorJS în cazul succesului.
                                obj4EditorJS.success = respObj.success;
                                obj4EditorJS.file.url = respObj.file;

                                // constituie calea către imagine
                                var urlAll = new URL(`${respObj.file}`);
                                var path = urlAll.pathname;
                                imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora. Necesar alegerii copertei

                                // RESOLVE / REJECT
                                resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                reject(mesaj => {
                                    pubComm.emit('mesaje', `Promisiunea așteptată de Editor.js a fost respinsă; ${mesaj}`); // CÂND EȘUEAZĂ!
                                });
                            });
                        }
                        // construiește promisiunea
                        var promise = new Promise(executor);                        
                        return promise.then((obi) => {
                            return obi; // returnează rezultatul promisiunii. Este ceea ce are nevoie Editor.js
                        }).catch((error) => {
                            if (error) {
                                pubComm.emit('mesaje', `Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
                            }
                        });
                    },
                    uploadByUrl(url){
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)

                        url = decodeURIComponent(url); // Din nou m-a mușcat rahatul ăsta pentru URL-urile care sunt afișate în browser encoded deja... Flying Flamingos!!!
                        
                        /**
                         * Funcția validează răspunsul în funcție de headere și stare
                         * @param {Object} response 
                         */
                        function validateResponse(response) {
                            if (!response.ok) {
                                pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                throw Error(response.statusText);
                            }
                            console.log(response); // response.body este deja un ReadableStream
                            return response;
                        }

                        /**
                         * Funcția are rolul de a extrage numele fișierului
                         * @argument {String} url Este chiar url-ul în formă string
                         */
                        function fileNameFromUrl(url) {
                            var matches = url.match(/\/([^\/?#]+)[^\/]*$/);
                            if (matches.length > 1) {
                                return matches[1];
                            }
                            return null;
                        }

                        // adu-mi fișierul de pe net!!!
                        return fetch(url)
                            .then(validateResponse)
                            .then(response => response.blob())
                            .then(response => {
                                // completează proprietățile necesare pentru a-l face `File` like.
                                response.lastModifiedDate = new Date();
                                response.name = fileNameFromUrl(decodeURI(url)); // WARNING: Bites like fucking shit!!!
                                // console.log('Fetch-ul adaugă proprietatea response.name cu url-ul după prelucrarea cu fileNameFromUrl(url): ', response.name);

                                // obiectul trimis către server
                                let objRes = {
                                    user: RED.idContributor,
                                    name: RED.nameUser,
                                    uuid: RED.uuid,
                                    resF: null,
                                    numR: '',
                                    type: ''
                                };

                                // FIXME: Nu rezolvă imagini de pe Wikipedia Commons de tipul celor codate deja. De ex:
                                // https://upload.wikimedia.org/wikipedia/commons/d/df/Paulina_Rubio_%40_Asics_Music_Festival_09.jpg
                                // https://upload.wikimedia.org/wikipedia/commons/1/1b/R%C3%ADo_Moscova%2C_Mosc%C3%BA%2C_Rusia%2C_2016-10-03%2C_DD_16-17_HDR.jpg
                                // La imaginea https://kosson.ro/images/Autori/Doina_Hendre_Biro/identite_collective/SP01.jpg dă eroare de CORS.

                                objRes.numR = response.name; // completează obiectul care va fi trimis serverului cu numele fișierului
                                objRes.type = response.type; // completează cu extensia
                                objRes.resF = response;
                                
                                // trimite resursa în server
                                pubComm.emit('resursa', objRes);
                                
                                const promissed = new Promise((resolve, reject) => {
                                    // obiectul necesar lui Editor.js
                                    let obj4EditorJS = {
                                        success: '',
                                        file: {
                                            url: ''
                                        }
                                    };                                    
                                    
                                    pubComm.on('resursa', (respObj) => {
                                        // cazul primei trimiteri de resursă: setează uuid-ul proaspăt generat! Este cazul în care prima resursă trimisă este un fișier imagine.
                                        if (!RED.uuid) {
                                            RED.uuid = respObj.uuid;
                                        }
                                        // console.log('În cazul paste-ului de imagine, pe canalul resursa am primit următorul obiect: ', respObj);
                                        obj4EditorJS.success = respObj.success;
                                        obj4EditorJS.file.url = respObj.file;

                                        // constituie calea către imagine
                                        console.log(respObj.file);
                                        var urlAll = new URL(`${respObj.file}`);
                                        var path = urlAll.pathname;
                                        imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora.
                                        
                                        resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                        reject(mesaj => {
                                            pubComm.emit('mesaje', mesaj); // CÂND EȘUEAZĂ!
                                        });
                                    });
                                });
                                // returnează promisiunea așteptată de Editor.js
                                return promissed.then((obi) => {
                                    // console.log('Înainte de a returna promisiunea care se rezolvă cu obiectul: ', obi);
                                    return obi;
                                }).catch(error => {
                                    if (error) {
                                        pubComm.emit('mesaje', `Am eșuat cu următoarele detalii: ${error}`);
                                    }
                                });
                            })
                            .catch((error) => {
                                if (error) {
                                    pubComm.emit('mesaje', `Am eșuat cu următoarele detalii: ${error}`);
                                }
                            });
                    }
                },
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
    /**
     * Previously saved data that should be rendered
     */
    // data: {}
});

console.log(typeof(editorX));