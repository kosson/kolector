import {createElement, pubComm, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });


// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

function clbkDOMContentLoaded () {
    // WORKING: Introdu mecanismul de ștergere
    // #1 Ref element
    // #2 Trimite un event `delresid` în server::serverul șterge înregistrarea din MongoDB și din Elasticsearch și directorul de pe HDD.
    // #3 serverul trimite înapoi pe același eveniment confirmarea că a șters tot și face redirectare către /profile/resurse

    // #1
    let data = document.querySelector('.resursa').dataset;
    let dataRes = JSON.parse(JSON.stringify(data)) || null;
    let content = JSON.parse(dataRes.content) || null;
    let imagini = new Set(); // un `Set` cu toate imaginile care au fost introduse în document.
    let fisiere = new Set(); // un `Set` cu toate fișierele care au fost introduse în document la un moment dat (înainte de `onchange`).

    // constituie obiectul de lucru
    var resObi = {
        id:           dataRes.id, 
        contribuitor: dataRes.contribuitor,
        uuid:         content.uuid,
        content
    };

    /* === AUTORI și AUTORUL PRINCIPAL === */
    let author = '';
    if (dataRes.autori) {
        let autoriArr = resObi.autori.split(','); // tratez cazul în care ai mai mulți autori delimitați de virgule
        if (autoriArr.length >= 1) {
            author = autoriArr[0].trim();
        } else {
            author = autori;
        }
    }

    /* === RED.nameUser === */
    resObi.nameUser = author;
    // console.log("[personal-res::profile/:id] Obiectul resursă arată astfel: ", dataRes);

    /* === RED.versioned === */
    resObi.versioned = false;

    /**
     * Funcția are rolul de a afișa un buton *Actualizează* în cazul în care datele din RED au suferit modificări
     */
    function changed () {
        // console.log("E ceva modificat în editor");
        var saveBtn = new createElement('button', 'saveversion', ['btn-sm', 'btn-primary'], {onclick: "createVersion(this)"}).creeazaElem('Actualizează');
        document.querySelector('.resursa').appendChild(saveBtn);
        let btnsave = document.getElementById('saveversion');
        btnsave.classList.remove('btn-primary');
        btnsave.classList.add('btn-warning');
    }

    /* === Integrarea lui EditorJS === https://editorjs.io */
    const editorX = new EditorJS({
        placeholder: '',
        logLevel: 'VERBOSE',
        data: resObi.content.content,
        onReady: () => {
            console.log('Editor.js e gata de treabă!');
            //Construiește logica pentru a popula `imagini` și `fisiere` de îndată ce s-au încărcat datele
            if (resObi.content.blocks) {
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
        holder: 'edi',    
        /* Obiectul tuturor instrumentelor pe care le oferă editorul */ 
        tools: { 
            header: {
                class: Header,
                inlineToolbar: ['link'],
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
                        twitter: true,
                        codepen: {
                            regex: /https?:\/\/codepen.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                            embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                            html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                            height: 300,
                            width: 600,
                            id: (groups) => groups.join('/embed/')
                        },
                        genially: {
                            regex: /https?:\/\/view.genial.ly\/(\w+)\/?(\w+(-[\w]+)+)?/,
                            embedUrl: 'https://view.genial.ly/<%= remote_id %>',
                            html: "<div style='position: relative; padding-bottom: 56.25%; padding-top: 0; height: 0;'><iframe frameborder='0' style='width: 100%; height: 100%;' type='text/html' allowscriptaccess='always' allowfullscreen='true' scrolling='yes' allownetworking='all'></iframe></div>"
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
                         * ÎNCARCĂ FIȘIERUL DE PE HARD!!!
                         * @param {File} file - Fișierul încărcat ca prim parametru
                         * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                         */
                        uploadByFile(file){  
                            //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)
                            // console.log(file.size);

                            // => construcția obiectul care va fi trimis către server
                            let objRes = {
                                user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte este email-ul]
                                name: RED.nameUser, // este de forma "Nicu Constantinescu"
                                uuid: RED.uuid,  // dacă deja a fost trimisă o primă resursă, înseamnă că în RED.uuid avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                                resF: file,      // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                                numR: file.name, // name: "Sandro_Botticelli_083.jpg"
                                type: file.type, // type: "image/jpeg"
                                size: file.size
                            };

                            /**
                             * Funcția are rolul de executor pentru promisiune
                             * @param {Function} resolve `callback-ul care se declanșează la rezolvarea promisiunii
                             * @param {Function} reject `callback-ul declanșat la respingerea promisiunii`
                             */
                            function executor (resolve, reject) {
                                // console.log('Cand încarc un fișier, trimit următorul obiect: ', objRes);
                                
                                // TRIMITE ÎN SERVER
                                pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server. Serverul creează bag-ul și scrie primul fișier!!! [UUID creat!]

                                // RĂSPUNSUL SERVERULUI
                                pubComm.on('resursa', (respObj) => {
                                    // în cazul în care pe server nu există nicio resursă, prima va fi creată și se va primi înapoi uuid-ul directorului nou creat
                                    if (!RED.uuid) {
                                        RED.uuid = respObj.uuid; // setează și UUID-ul în obiectul RED local
                                    }
                                    // console.log('În urma încărcării fișierului de imagine am primit de la server: ', respObj);

                                    // constituie cale relativă către imagine
                                    var urlAll = new URL(`${respObj.file}`);
                                    var path = urlAll.pathname;   // de forma "/repo/5e31bbd8f482274f3ef29103/5af78e50-5ebb-11ea-9dcc-f50399016f10/data/628px-European_Union_main_map.svg.png"
                                    // obj4EditorJS.file.url = path; // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                    
                                    //_ FIXME: !!!!!!!!!!!
                                    /* Obiectul necesar lui Editor.js după ce fișierul a fost trimis. 
                                    După ce trimiți fișierul, Editor.js se așteaptă ca acesta să fie populat */                            
                                    const obj4EditorJS = {
                                        success: respObj.success,
                                        file: {
                                            url: path,
                                            size: respObj.file.size
                                        }
                                    };
                                    
                                    // completarea proprietăților așteptate de EditorJS în cazul succesului.
                                    // obj4EditorJS.success = respObj.success; // 1
                                    // obj4EditorJS.file.url = respObj.file; // Așa era preluat url-ul de obiectul succes până la 0.5.3
                                    

                                    // TODO: verifică dacă respectiva cale există sau nu în Set.
                                    if (!imagini.has(path)) {
                                        imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora. Necesar alegerii copertei
                                    }

                                    // RESOLVE / REJECT
                                    resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                    reject(mesaj => {
                                        pubComm.emit('mesaje', `Promisiunea așteptată de Editor.js a fost respinsă; ${mesaj}`); // CÂND EȘUEAZĂ!
                                    });
                                });
                            }
                            // construiește promisiunea
                            var promise = new Promise(executor);
                            // REZOLVĂ PROMISIUNEA!!!                     
                            return promise.then((obi) => {
                                return obi; // returnează rezultatul promisiunii. Este ceea ce are nevoie Editor.js în caz de succes
                            }).catch((error) => {
                                if (error) {
                                    pubComm.emit('mesaje', `Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
                                }
                            });
                        },
                        
                        /**
                         * ÎNCARCĂ CU PASTE LINK SAU DRAG-AND-DROP
                         * @param {String} url - Întreaga adresă către fișierul de imagine
                         * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                         */
                        uploadByUrl(url){
                            //_TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)

                            // Unele URL-uri este posibil să fie HTML encoded
                            url = decodeURIComponent(url); // Dacă nu decode, mușcă pentru fișierele afișate în browser encoded deja... Flying Flamingos!!!
                            
                            /**
                             * Funcția validează răspunsul în funcție de headere și stare
                             * @param {Object} response 
                             */
                            function validateResponse(response) {
                                if (!response.ok) {
                                    pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                    console.log('Am detectat o eroare: ', response.statusText);
                                }
                                console.log(response); // response.body este deja un ReadableStream
                                return response;
                            }

                            /**
                             * Funcția are rolul de a extrage numele fișierului
                             * @param {String} url Este chiar url-ul în formă string
                             */
                            function fileNameFromUrl(url) {
                                var matches = url.match(/\/([^\/?#]+)[^\/]*$/);
                                if (matches.length > 1) {
                                    return matches[1];
                                }
                                return null;
                            }

                            // ADU RESURSA
                            return fetch(url)
                                .then(validateResponse)
                                .then(response => response.blob())
                                .then(response => {
                                    // TODO: Detectează dimensiunea și nu permite încărcarea peste o anumită limită.
                                    console.log(response);

                                    // completează proprietățile necesare pentru a-l face `File` like pe răspunsul care este un Blob.
                                    response.lastModifiedDate = new Date();
                                    response.name = fileNameFromUrl(decodeURI(url)); // Trebuie decode, altfel te mușcă!
                                    // console.log('Fetch-ul adaugă proprietatea response.name cu url-ul după prelucrarea cu fileNameFromUrl(url): ', response.name);

                                    // obiectul care va fi trimis către server
                                    let objRes = {
                                        user: RED.idContributor,
                                        name: RED.nameUser,
                                        uuid: RED.uuid,
                                        resF: null,
                                        numR: '',
                                        type: '',
                                        size: 0
                                    };

                                    objRes.resF = response; // introdu fișierul ca blob
                                    objRes.numR = response.name; // completează obiectul care va fi trimis serverului cu numele fișierului
                                    objRes.type = response.type; // completează cu extensia
                                    objRes.size = response.size; // completează cu dimensiunea                            
                                    
                                    // trimite resursa în server
                                    pubComm.emit('resursa', objRes);

                                    const promissed = new Promise((resolve, reject) => {                                   
                                        pubComm.on('resursa', (respObj) => {
                                            // obiectul necesar lui Editor.js
                                            let obj4EditorJS = {
                                                success: respObj.success,
                                                file: {
                                                    url: respObj.file,
                                                    size: response.size
                                                }
                                            };

                                            // cazul primei trimiteri de resursă: setează UUID-ul proaspăt generat! Este cazul în care prima resursă trimisă este un fișier imagine.
                                            if (!RED.uuid) {
                                                RED.uuid = respObj.uuid;
                                            }
                                            // console.log('În cazul paste-ului de imagine, pe canalul resursa am primit următorul obiect: ', respObj);
                                            // obj4EditorJS.success = respObj.success;
                                            // obj4EditorJS.file.url = respObj.file;

                                            // constituie calea către imagine
                                            console.log(respObj.file);
                                            var urlAll = new URL(`${respObj.file}`);
                                            var path = urlAll.pathname;
                                            imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora                                      
                                            
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
        },
        onChange: changeContent
    });

    /**
     * Funcția este listener pentru modificările aduse conținutului din editor -> proprietatea `onChange` a obiectului `editorX`.
     * De fiecare dată când se modifică conținutul, actualizează `resObi.content`.
     * Apelează `check4url()` pentru a verifica dacă este url
     * Apelează `pickCover()` pentru a genera galeria imaginilor care trebuie selectate.
     */
     function changeContent () {
        if (resObi.versioned === false) {
            resObi.versioned = true;
            // console.log('Era false, acum este ', RED.versioned);
            changed(); // activează butonul *Actualizează*
        }

        editorX.save().then((content) => {  
            // console.log(`la salvare am urmatorul continut `, content);
            
            /* === ACTUALIZEAZĂ `resObi.content` cu noua valoare === */
            resObi.content = null;    // Dacă există deja, mai întâi setează `content` la `null` 
            resObi.content = content; // actualizează obiectul `content` la noua stare.

            /* === Logică de ștergere din server a imaginilor și fișierelor care au fost șterse din editor === */
            // PAS 1: constituie array-ul celor rămase
            let contentResArr = resObi.content.blocks.map((element) => {
                // imagini.clear(); // curăță setul imaginilor de cele anterioare pentru că altfel poluezi galeria

                /* 
                * trebuie făcută verificare pentru că la files, se consideră eveniment apariția selecției de pe disc
                * și astfel, se introduc elemente vide în `Set`-uri 
                * */
                if(element.data.file) {
                    if (element.data.file.url !== undefined) {
                        let fileUrl = check4url(element.data.file.url);
                        let pathF = fileUrl.path2file;
                        switch (element.type) {
                            case 'image':
                                // dacă există o cale și este și în setul `imagini`
                                if (pathF !== undefined) {
                                    fileRes.add(pathF); // și încarcă-le în Set-ul `fileRes`
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
                }

                switch (element.type) {
                    case 'paragraph':
                        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'content', content: content});
                        break;
                    case 'embed':
                        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'content', content: content});
                        break;                
                    default:
                        break;
                }
            });  

            let fileResArr = Array.from(fileRes);
            let differenceArr = fileResArr.filter((elem) => {
                if (!contentResArr.includes(elem)) return elem;
            });

            // PAS 2: compară fiecare înregistrare din `Set` cu cele ale array-ului `contentResArr`
            differenceArr.forEach((fpath) => {
                // dacă ai șters cu succes din `fileRes`, șterge imediat și din `imagini`
                if (fileRes.delete(fpath)) {
                    imagini.delete(fpath);
                    // extrage numele fișierului din `fileUrl`
                    let fileName = fpath.split('/').pop();
                    // emite un eveniment de ștergere a fișierului din subdirectorul resursei.

                    let obi = {
                        uuid: resObi.uuid,
                        idContributor: resObi.contribuitor,
                        content: resObi.content,
                        id: resObi.id,
                        fileName
                    };

                    console.log(`Obiectul trimis pe delfile este `, obi);

                    pubComm.emit('delfile', obi);
                }
            });

            // console.log("Rămâne câte un rest în imagini? ", imagini);
            pickCover(); // formează galeria pentru ca utilizatorul să poată selecta o imagine
        }).catch((e) => {
            console.log(e);
        });
    };    

    // #2
    /**
     * Trimite un event `delresid` în server::serverul șterge înregistrarea din MongoDB și din Elasticsearch și directorul de pe HDD.
     */
    function deleteRes () {
        pubComm.emit('delresid', resObi);
        // console.log('Am trimis obiectul: ', resObi);
        pubComm.on('deldir', (res) => {
            // alert(res);
            if (res) {
                window.location = '/profile/resurse/'; // redirect
            }
        });
    }

    // #3
    var resursa          = document.getElementById(resObi.id);
    var validateCheckbox = document.getElementById('valid');
    var publicCheckbox   = document.getElementById('public');
    validateCheckbox.addEventListener('click', validateResource);
    publicCheckbox.addEventListener('click', setGeneralPublic);

    // setează clasele în funcție de starea resursei
    if (validateCheckbox.checked) {
        resursa.classList.add('validred');
    } else {
        resursa.classList.add('invalidred');
    }

    /**
     * Funcția are rolul de listener pentru input checkbox-ul pentru validare
     * Modifică documentul în bază, declarându-l valid
     * Input checkbox-ul se formează din rute routes.js la app.get('/profile/resurse/:idres'...
     * @param {Object} evt 
     */
    function validateResource (evt) {
        var queryObj = {_id: dataRes.id};
        // se va trimite valoarea true sau false, depinde ce valoarea are checkbox-ul la bifare sau debifare
        if (validateCheckbox.checked) {
            // verifică dacă există clasa 'invalidred' (resursa pornește nevalidată)
            if (resursa.classList.contains('invalidred')) {
                resursa.classList.replace('invalidred', 'validred');
            }
            queryObj.expertCheck = true;
            pubComm.emit('validateRes', queryObj);
        } else {
            if (resursa.classList.contains('validred')) {
                resursa.classList.replace('validred', 'invalidred');
            }
            queryObj.expertCheck = false;        
            pubComm.emit('validateRes', queryObj);
        }
        pubComm.on('validateRes', (response) => {
            // TODO: modifică backgroundul galben în verde pal
            if (response.expertCheck) {
                console.log('Schimb culoarea background-ului din galben în verde pal');
            } else {
                console.log('Schimb culoarea background-ului din verde pal în galben');
            }
        });
    };

    /**
     * Funcția are rolul de a seta o resursă ca fiind disponibilă publicului
     * @param {Object} evt 
     */
    function setGeneralPublic (evt) {
        var queryObj = {_id: dataRes.id};
        // se va trimite valoarea true sau false, depinde ce valoarea are checkbox-ul la bifare sau debifare
        if (publicCheckbox.checked) {
            queryObj.generalPublic = true;
            pubComm.emit('setPubRes', queryObj);
        } else {
            queryObj.generalPublic = false;        
            pubComm.emit('setPubRes', queryObj);
        }    
        pubComm.on('setPubRes', (response) => {
            // TODO: modifică backgroundul galben în verde pal
            if (response.generalPublic) {
                console.log('Resursa a intrat în zona publică');
            } else {
                console.log('Resursa a fost retrasă din zona publică');
            }
        });
    };

    // Obține informație despre repo-ul git.
    let infobtn = document.getElementById('infoload');
    infobtn.addEventListener('click', (evt) => {
        console.log(`[personal-res.mjs] Am să aduc informație despre repo`, resObi.contribuitor, content.emailContrib);
        let obi = {path: `${resObi.contribuitor}/${resObi.uuid}`, name: content.autori, email: content.emailContrib, message: ''};
        pubComm.emit('gitstat', obi);
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

    let saveversionbtn = document.getElementById('saveversion');
    saveversionbtn.addEventListener('click', (evt) => {
        console.log(`[personal-res.mjs] Voi salva această versiune`);
    });

    // Procesarea răspunsului privind starea repo-ului de git
    pubComm.on('gitstat', (data) => {
        console.log(`Repo-ul de git are următoarele date `, data);

        /*
            GITGRAPH
        */
        // Get the graph container HTML element.

        const graphContainer = document.getElementById("graph-container");

        if (GitgraphJS !== null) {
            graphContainer.innerHTML = '';

            // Instantiate the graph.
            const gitgraph = GitgraphJS.createGitgraph(graphContainer, {
                orientation: 'vertical-reverse',
                template: GitgraphJS.templateExtend('metro', {
                    colors: ['red', 'blue', 'orange']
                })
            }); // https://www.nicoespeon.com/gitgraph.js/#14
            // https://www.nicoespeon.com/gitgraph.js/stories/?path=//story/gitgraph-js-1-basic-usage--default
            
            const master = gitgraph.branch("master", {
                style: {
                    label: {
                        color: 'green',
                        font: 'italic 10pt serif'
                    }
                }
            });
            let commitpiece;
            for (commitpiece of data) {
                master.commit({
                    subject: commitpiece.message,
                    author: commitpiece.authorName,
                    dotText: '🙀',
                    style: {
                        message: {
                            displayAuthor: true,
                            displayBranch: true,
                            displayHash:   false,
                            font: "normal 10pt Arial",
                            color: 'green'
                        }
                    },
                    // onClick: alert('Bau')
                });
            }
            // https://www.nicoespeon.com/gitgraph.js/stories/?path=/story/gitgraph-js-3-events--on-commit-dot-click
        }
    });
};

document.addEventListener("DOMContentLoaded", clbkDOMContentLoaded);