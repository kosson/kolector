import {createElement, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

// document.addEventListener("DOMContentLoaded", function clbkDOMContentLoaded () {});

    /* === VARIABILE NECESARE LA NIVEL DE MODUL ȘI MAI DEPARTE === */
    var uuid    = document.querySelector("meta[property='uuid']").getAttribute("content") || '',
        RED     = {},
        csrfToken = '',
        pubComm = null,
        sync    = false,     // variabila ține evidența tranzacționării uuid-ului cu serverul. În cazul în care uuid-ul este setat, nu se va mai emite mai jos la prima modificare a editorului (onchange editor.js)
        imagini = new Set(), // un `Set` cu toate imaginile care au fost introduse în document.
        fileRes = new Set(); // un `Set` care unifică fișierele, fie imagini, fie atașamente.

    // TOKEN-ul CSRF
    if(document.getElementsByName('_csrf')[0].value) {
        csrfToken = document.getElementsByName('_csrf')[0].value;
    }

    // trebuie recreat pentru fiecare cale în parte [specific prin inperecherea cu csrf-ul]
    pubComm = io('/redcol', {
        allowUpgrades: true,
        query: {['_csrf']: csrfToken}
    });
    
    /* === Obiectul RED - valori din oficiu === */
    RED.expertCheck     = false;
    RED.uuid            = uuid;
    RED.emailContrib    = '';
    RED.langRED         = '';
    RED.title           = '';
    RED.titleI18n       = [];
    RED.idContributor   = '';
    RED.description     = '';
    RED.licenta         = '';
    // pas 2 formular va completa următoarele
    RED.arieCurriculara = [];
    RED.level           = [];
    RED.discipline      = [];
    RED.competenteGen   = [];
    RED.competenteS     = [];
    RED.activitati      = [];
    RED.relatedTo       = [];
    RED.etichete        = [];

    /* === UUID === */
    // este necesar pentru a primi uuid-ul generat de multer atunci când prima resursă încărcată este un fișier
    pubComm.on('uuid', (token) => {
        // console.log("[form01adres.mjs] Am primit pe uuid următoarea solicitare: ", token);
        if (token.requested) {                              /* MULTER:: servește uuid-ul existent lui multer: semnătura `{requested: true}` este a multer-ului (engine customizat) */ 
            if (uuid !== 'undefined') {                     /* -> `uuid` este deja setat, înseamnă că o primă resursă a fost scrisă pe disc; trimite-l celui care l-a solicitat */
                pubComm.emit('uuid', uuid);                 /* -> a fost încărcată vreo imagine, atunci, `uuid` este setat. Trimite-l! */
            } else {
                pubComm.emit('uuid', '');                   /* -> primul fișier este un atașament, trimite șir vid */
            }
        } else if (token === uuid) {                        /* cazul în care nu avem `token.requested`, ci un string cu un uuid trimis de prin `routes::sockets`, verifică să fie ce este în client */
            if (RED.uuid == 'undefined') RED.uuid = uuid;   /* cazul în care este trimis `uuid`-ul și este același cu cel setat în client deja, dar încă `RED.uuid` este gol */
            sync = true; // setează la `true` pe `sync`
        } else if (uuid === 'undefined') {
            uuid = RED.uuid = token;                        /* cazul în care `uuid` nu a fost încă setat, înseamnă că ai de a face cu prima resursă încărcată, fie atașament, fie imagine */
            sync = true; // setează la `true` pe `sync`
        }
    });

    // Este obiectul de configurare al lui `attaches` din Editor.js
    let attachesCfg = {
        class: AttachesToolPlus,            
        config: {
            endpoint:     `${location.origin}/upload`,
            buttonText:   'Încarcă un fișier',
            errorMessage: 'Nu am putut încărca fișierul.',
            headers:      {'uuid': uuid}
        }
    };
    
    var cookie2obj = document.cookie.split(/; */).reduce((obj, str) => {
        if (str === "") return obj;
        const eq = str.indexOf('=');
        const key = eq > 0 ? str.slice(0, eq) : str;
        let val = eq > 0 ? str.slice(eq + 1) : null;
        if (val != null) try {
            val = decodeURIComponent(val);
        } catch(e) {
            if (e) console.error(e);
        }
        obj[key] = val;
        return obj;
    }, {});

    /* === Integrarea lui EditorJS === https://editorjs.io */
    const editorX = new EditorJS({
        placeholder: '',
        logLevel: 'VERBOSE', 
        /* VERBOSE 	Show all messages (default)
            INFO 	Show info and debug messages
            WARN 	Show only warn messages
            ERROR 	Show only error messages */

        /* onReady callback */
        onReady: () => {
            console.log('Editor.js e gata de treabă! UUID-ul resursei este: ', uuid);
        },

        /* id element unde se injectează editorul */
        holder: 'codex-editor',
        /* Activează autofocus */ 
        //autofocus: true,
        
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
            attaches: attachesCfg,
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
                         * ÎNCARCĂ FIȘIERUL DE PE HARD!!!
                         * Folosește sockets pentru comunicarea cu serverul. Evenimentul `resursa`
                         * @param {File} file - Fișierul încărcat ca prim parametru
                         * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                         */
                        uploadByFile(file){
                            // => construcția obiectul care va fi trimis către server
                            let objRes = {
                                user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                                name: RED.nameUser,      // este de forma "Nicu Constantinescu"
                                uuid: uuid,              // dacă deja a fost trimisă o primă resursă, înseamnă că în `uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                                resF: file,              // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                                numR: file.name,         // name: "Sandro_Botticelli_083.jpg"
                                type: file.type,         // type: "image/jpeg"
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
                                    imagini.add(path); // încarcă url-ul imaginii în Set-ul destinat ținerii evidenței acestora. Necesar alegerii copertei

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
                                    // pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                    console.log('[uploadByUrl::validateResponse] Am detectat o eroare: ', response.statusText);
                                }
                                // console.log('[uploadByUrl::validateResponse] fetch a adus: ', response); // response.body este deja un ReadableStream
                                // FIXME: Caută aici să detectezi dimensiunea iar dacă depășește o valoare, încheie aici orice operațiune cu throw Error!!!
                                return response;
                            }

                            // ADU RESURSA DE PE WEB înainte de a o trimite în server
                            return fetch(decodedURL)
                                .then(validateResponse)
                                .then(response => response.blob())
                                .then(response => {
                                    // obiectul care va fi trimis către server
                                    let objRes = {
                                        user: RED.idContributor,
                                        name: RED.nameUser,
                                        uuid: uuid,
                                        resF: response,                 // introdu fișierul ca blob
                                        numR: urlObj.afterLastSlash,    // completează obiectul care va fi trimis serverului cu numele fișierului
                                        type: response.type,            // completează cu extensia
                                        size: response.size             // completează cu dimensiunea 
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
                                })
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
        /**
         * Previously saved data that should be rendered
         */
        // data: {}
    });

    /**
     * Funcția este listener pentru modificările aduse conținutului din editor -> proprietatea `onChange` a obiectului `editorX`.
     * Apelează `check4url()` pentru a verifica dacă este url
     * Apelează `pickCover()` pentru a genera galeria imaginilor care trebuie selectate.
     */
    function changeContent () {
        // de fiecare dată când se modifică conținutul, actualizează `RED.content`.
        editorX.save().then((content) => {    
            /* === ACTUALIZEAZĂ `RED.content` cu noua valoare === */
            RED.content = null;    // Dacă există deja, mai întâi setează `content` la `null` 
            RED.content = content; // actualizează obiectul `content` la noua stare.

            /* === Logică de ștergere din server a imaginilor și fișierelor care au fost șterse din editor === */
            // PAS 1: constituie array-ul celor rămase
            let contentResArr = content.blocks.map((element) => {
                // imagini.clear(); // curăță setul imaginilor de cele anterioare pentru că altfel poluezi galeria

                /* 
                * trebuie făcută verificare pentru că la files, se consideră eveniment apariția selecției de pe disc
                * și astfel, se introduc elemente vide în `Set`-uri 
                * */
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
                            // break;
                    }
                }
            });
            

            let fileResArr = Array.from(fileRes);

            let differenceArr = fileResArr.filter((elem) => {
                if (!contentResArr.includes(elem)) return elem;
            });

            // console.group('Stare seturi resurse [`onchange`]');
            // console.log("În obiectul blocurilor de conținut sunt: ", content.blocks);
            // console.info("`contentResArr` care contine ce este în `content`; ", contentResArr);
            // console.info("`fileResArr` conține tot ce a fost încărcat anterior `onchange`: ", fileResArr);
            // console.info("`differenceArr` ar trebui să indice ce a dispărut după `onchange`", differenceArr);
            // console.info("Setul `imagini` ar trebui să fie actualizat `onchange`", imagini);
            // console.groupEnd();

            // PAS 2: compară fiecare înregistrare din `Set` cu cele ale array-ului `contentResArr`
            differenceArr.forEach((fpath) => {
                // dacă ai șters cu succes din `fileRes`, șterge imediat și din `imagini`
                if (fileRes.delete(fpath)) {
                    imagini.delete(fpath);
                    // extrage numele fișierului din `fileUrl`
                    let fileName = fpath.split('/').pop();
                    // emite un eveniment de ștergere a fișierului din subdirectorul resursei.
                    pubComm.emit('delfile', {
                        uuid,
                        idContributor: RED.idContributor,
                        fileName
                    });
                }
            });

            // console.log("Rămâne câte un rest în imagini? ", imagini);
            pickCover(); // formează galeria pentru ca utilizatorul să poată selecta o imagine
        }).catch((e) => {
            console.log(e);
        });
    }

    pubComm.on('delfile', (message) => {
        console.log("[form01adres.mjs] Am șters cu următoarele detalii: ", message);
    });

    // este setul opțiunilor pentru selecție de limbă în cazul minorităților
    let langsMin = new Map([
        ['rum', 'română'],
        ['ger', 'germana'],
        ['hun', 'maghiară'],
        ['srp', 'sârbă'],
        ['rom', 'rromani'],
        ['slo', 'slovenă'],
        ['cze', 'cehă'],
        ['ukr', 'ukraineană'],
        ['bul', 'bulgară'],
        ['hrv', 'croată'],
        ['ita', 'italiană'],
        ['gre', 'greacă'],
        ['rus', 'rusă'],
        ['tur', 'turcă'],
        ['eng', 'engleză'],
        ['fra', 'franceză']
    ]);

    /**
     * Funcția `encodeHTMLentities()` convertește un string în entități html.
     * @param {String} str Este un string de cod HTML care nu este escaped
     */
    function encodeHTMLentities (str) {
        var buf = [];			
        for (var i = str.length-1; i >= 0; i--) {
            buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
        }    
        return buf.join('');
    }

    /**
     * Funcția `selectOpts` generează opțiuni pentru un element `select`
     * @param {Object} insertie este elementul `<select>`
     * @param {Array} arrData este un set de date ca `Map` ce conține datele după care se va genera elementul `option`
     */
    function selectOpts (insertie, arrDate) {    
        arrDate.forEach((val, key) => {
            const optionElem = new createElement('option', '', '', {
                value: key
            }).creeazaElem(val);
            insertie.appendChild(optionElem);
        });
    }

    /**
     * Funcția `creeazaTitluAlternativ` generează mecanismul prin care se pot adăuga titluri alternative celui principal
     * Folosește funcția `creeazaTitluAlternativHelper` pentru a genera structura DOM
     */
    function creeazaTitluAlternativ () {
        // creează aceleași elemente de formular responsabile cu generarea unui titlu
        let insertie = document.querySelector('#langAlternative');  // punct de aclanșare în DOM pentru elementele generate dinamic
        let primulTitlu = document.querySelector('#title-work').id;   // extrage id-ul primului titlu pe baza căruia se vor construi restul în cele alternative
        let arrAlternative = document.querySelectorAll('#langAlternative > div'); // selectează toate elementele din titlurile alternative (dacă există)

        // verifică dacă există elemente ca titluri alternative
        if (arrAlternative.length !== 0) {
            let lastAlternativeTitle = Array.from(arrAlternative).slice(-1); // fă o referință către ultimul introdus în alternative
            let idOfLastElem = lastAlternativeTitle[0].id;  // extrage id-ul acelui element
            let contorIdxIds = parseInt(idOfLastElem.slice(-1)); // din id, extrage numarul de incrementare (pentru primul element adăugat în alternative este 1).

            creeazaTitluAlternativHelper(`${primulTitlu}-${++contorIdxIds}`, insertie); // adaugă titluri alternative după primul alternativ existent!!!
            
            // Pentru a atașa evenimentul, extrage id-ul ultimului element introdus în alternative
            var id2Nr = parseInt(idOfLastElem.slice(-1));
            let idElement = `#${primulTitlu}-${++id2Nr}`;
            let butRemove = document.querySelector(idElement);
            let butonLastElem = butRemove.querySelector('button');

            butonLastElem.addEventListener('click', (event) => {
                insertie.removeChild(document.querySelector(`${idElement}`));
            });
        } else {
            // dacă nu există titluri alternative, se va crea primul în această ramură
            let newId = `${primulTitlu}-1`;
            creeazaTitluAlternativHelper(newId, insertie);

            let butRemoveFirst = document.querySelector(`#${primulTitlu}-1-remove`);
            butRemoveFirst.addEventListener('click', (event) => {
                insertie.removeChild(document.querySelector(`#${newId}`));
            });
        }
    }
    globalThis.creeazaTitluAlternativ = creeazaTitluAlternativ;
    /**
     * Funcția `creeazaTitluAlternativHelper()` servește funcției `creeazaTitluAlternativ()`.
     * Are rolul de a genera întreaga structură DOM necesară inserării unui nou titlu alternativ.
     * Folosește funcția `selectOpts()` pentru a genera elementele `<option>`
     * @param {String} id Este id-ul elementului `<select>` căruia i se adaugă elementele `<option>`
     * @param {Object} insertie Este elementul la care se va atașa întreaga structură `<option>` generată
     */
    function creeazaTitluAlternativHelper (id, insertie) {
        const divInputGroup        = new createElement('div', `${id}`,        ['input-group'],         {}).creeazaElem();
        const divInputGroupPrepend = new createElement('div', '',             ['input-group-prepend'], {}).creeazaElem();
        const spanInputgroupText   = new createElement('span', `${id}-descr`, ['input-group-text'],    {}).creeazaElem('Titlul resursei');
        divInputGroupPrepend.appendChild(spanInputgroupText);
        divInputGroup.appendChild(divInputGroupPrepend);

        const inputTitle = new createElement('input', '', ['form-control'], {
            type: 'text',
            name: `${id}`,
            ['aria-label']: 'Titlul resursei',
            ['aria-describedby']: `${id}-descr`
        }).creeazaElem('', true);
        divInputGroup.appendChild(inputTitle);

        const divInputGroupPrepend2 = new createElement('div',    '', ['input-group-prepend'], {}).creeazaElem();        
        const langSelectLabel       = new createElement('span',   '', ['input-group-text'],    {}).creeazaElem('Indică limba');    
        divInputGroupPrepend2.appendChild(langSelectLabel);
        divInputGroup.appendChild(divInputGroupPrepend2);

        const elemSelect   = new createElement('select', `${id}-select`, ['custom-select', 'col-6', 'col-lg-4'], {}).creeazaElem();
        const deleteTitAlt = new createElement('button', `${id}-remove`, ['btn', 'btn-danger'],                  {}).creeazaElem("\u{1F5D1}");

        selectOpts(elemSelect, langsMin); // generează toate opțiunile de limbă ale select-ului
        divInputGroup.appendChild(elemSelect);
        divInputGroup.appendChild(deleteTitAlt);

        insertie.appendChild(divInputGroup);
    }


    /* === MECANISMUL DE AVANS AL FORMULARULUI */

    // let progressTxt1 = document.querySelector('#progressText1');
    // let progressTxt2 = document.querySelector('#progressText2');
    // let progressTxt3 = document.querySelector('#progressText3');
    // let progressTxt4 = document.querySelector('#progressText4');
    // let clsTxt1 = progressTxt1.classList;
    // let clsTxt2 = progressTxt2.classList;
    // let clsTxt3 = progressTxt3.classList;
    // let clsTxt4 = progressTxt4.classList;

    // Avans către pasul doi al formularului
    $('#next-1').click(function (e) {
        e.preventDefault();

        // arată divul cu id-ul `doi` și ascunde div-ul primului pas din formular `unu`
        $('#doi').show();
        $('#unu').hide();

        // setarea avansului indicatorului vizual [->pas2]
        let resTxt1 = clsTxt1.toggle('active'); // avansul la pasul 2 scoate clasa => `resTxt1` = `false`
        // dacă a fost scoasă clasa, activeaz-o în pasul doi
        if (!resTxt1) {
            let resTxt2 = clsTxt2.toggle('active');
        }

        /* === PAS 1 Formular === */
        // Validare pe titlul resursei
        // if ($('#titlu-res').val() == '') {
        //     // $('#titluErr').text('Trebuie neapărat să denumești resursa!!!'); // Folosește dacă revii la texte afișate
        //     // $('#titluErr').toast({
        //     $.toast({
        //         heading:'Lipsă nume',
        //         text: "Trebuie neapărat să denumești resursa!!!",
        //         position: 'top-center',
        //         showHideTransition: 'fade',
        //         icon: 'error'
        //     });
        //     return false;
        // } else if ($('#descriereRed').val() == '') {
        //     $.toast({
        //         text: "Introdu descrierea resursei. Este un pas necesar",
        //         position: 'top-center',
        //         showHideTransition: 'fade',
        //         icon: 'error'
        //     });
        // } else {
        //     pas1(); // funcție care culege datele introduse la pasul 1 (definită în form01adres.js)
        //     // console.log(RED);
        //     // arată divul cu id-ul `doi` și ascunde div-ul primului pas din formular `unu`
        //     $('#doi').show();
        //     $('#unu').hide();

        //     // setarea avansului indicatorului vizual [->pas2]
        //     let resTxt1 = clsTxt1.toggle('active'); // avansul la pasul 2 scoate clasa => `resTxt1` = `false`
        //     // dacă a fost scoasă clasa, activeaz-o în pasul doi
        //     if (!resTxt1) {
        //         let resTxt2 = clsTxt2.toggle('active');
        //     }
        // }
    });

    /* === PAS 2 Formular === */
    // Mergi înapoi la pasul unu al formularului
    $('#next-2').click(function () {
        // pas2(); // funcție care culege datele introduse la pasul 2
        // console.log(RED);
        // ascunde divul cu id-ul `doi și arată-l pe cel cu id-ul `unu`
        $('#doi').hide();
        $('#unu').show();

        // setarea avansului indicatorului vizual [pas1 <-]
        let resTxt1 = clsTxt1.toggle('active');
        if (resTxt1) {
            clsTxt2.toggle('active');
        }
    });

    // Avansează la pasul trei al formularului -> Validarea selectului cu arii curiculare l-am trecut direct în form01adres.js
    $('#next-3').click(function () {
        // testează dacă a fost selectată vreo opțiune din selectul ariilor curriculare
        // pas2(); // colectează datele de la pasul 2 al formularului.
        // console.log(RED);
        // ascunde divul cu id-ul `doi și arată-l pe cel cu id-ul `trei`
        $('#doi').hide();
        $('#trei').show();

        // setarea avansului indicatorului vizual [-> pas3]
        let resTxt3 = clsTxt3.toggle('active');
        if (resTxt3) {
            clsTxt2.toggle('active');
        }
    });

    /* ===PAS 3 Formular === */
    //Mergi înapoi la pasul doi al formularului
    $('#next-4').click(function () {
        // ascunde divul cu id-ul `trei și arată-l pe cel cu id-ul `doi`
        $('#trei').hide();
        $('#doi').show();

        // setarea avansului indicatorului vizual [pas2 <-]
        let clsTxt2 = progressTxt2.classList;
        let resTxt2 = clsTxt2.toggle('active');

        let clsTxt3 = progressTxt3.classList;
        if (resTxt2) {
            clsTxt3.toggle('active');
        }
    });

    //Mergi la pasul patru al formularului
    $('#next-5').click(function () {
        // pas3(); // colectează datele de la pasul 3 al formularului.
        // console.log(RED);
        // ascunde divul cu id-ul `trei și arată-l pe cel cu id-ul `patru`
        $('#trei').hide();
        $('#patru').show();

        // setarea avansului indicatorului vizual [-> pas4]
        let clsTxt3 = progressTxt3.classList;
        let clsTxt4 = progressTxt4.classList;
        let resTxt4 = clsTxt4.toggle('active');
        if (resTxt4) {
            clsTxt3.toggle('active');
        }
    });

    //Mergi înapoi la pasul trei al formularului
    $('#next-6').click(function () {
        // ascunde divul cu id-ul `patru și arată-l pe cel cu id-ul `trei`
        $('#patru').hide();
        $('#trei').show();

        // setarea avansului indicatorului vizual [pas3 <-]
        let clsTxt3 = progressTxt3.classList;
        let resTxt3 = clsTxt3.toggle('active');

        let clsTxt4 = progressTxt4.classList;
        if (resTxt3) {
            clsTxt4.toggle('active');
        }        
    });

    /* === COLECTAREA DATELOR DIN FORM === */

    /* === Pasul 1  [Necesar mecanismulu de avans al formularului] === */
    /**
     * Funcția are rolul de a popula obiectul `RED` cu datele din formular de la `Pas 1`.
     */
    function pas1 () {
        /* === RED.title === */
        // Gestionarea titlului și ale celor în alte limbi
        var title = document.querySelector('#titlu-res').value; // titlul în limba română
        RED.title = title; // adaugă valoarea titlului în obiect
        
        /* === RED.langRED === */
        // Stabilirea limbii RED-ului
        var limbaRed = document.querySelector('#langRED');
        var langRED = limbaRed.options[limbaRed.selectedIndex].value;
        RED.langRED = langRED;
        // verifică dacă nu cumva au fost adăugate titluri alternative. Dacă da, constituie datele necesare
        var titluriAltele = document.querySelector('#langAlternative');

        /* === RED.titleI18n === */
        if (titluriAltele) {
            // Creează un NodeList cu toate elementele input
            var inputs = titluriAltele.querySelectorAll('input');
            // Creează un NodeList cu toate elementele select
            var selects = titluriAltele.querySelectorAll('select');
            
            let index;
            for (index = 0; index < inputs.length; ++index) {
                // console.log(inputs[index]);
                var obi = {}; // obiect care să colecteze datele
                // Obține id-ul
                var nameInput = inputs[index].name;

                // Pentru fiecare input colectat, trebuie adusă și limba corespunzătoare din select.
                selects.forEach((selectElem) => {
                    // verifică dacă id-ul elementul select este egal cu id-ul elementului input plus `-select`
                    if (selectElem.id === `${nameInput}-select`) {
                        // constituie înregistrarea în obi
                        obi[`${selectElem.options[selectElem.selectedIndex].value}`] = inputs[index].value;
                    }
                });
                RED.titleI18n.push(obi); // adaugă obiectul care conține titlul alternativ.
            }
        }

        /* === RED.emailContrib === */
        // Adaugă emailul 
        var emailContrib  = document.querySelector('#emailContrib').value;
        RED.emailContrib  = emailContrib;

        /* === RED.idContributor === */
        // Adaugă id-ul utilizatorului care face propunerea
        var idUser        = document.querySelector('#idUser').value;    
        RED.idContributor = idUser;

        /* === RED.nameUser === */
        // Adaugă numele și prenumele utilizatorului
        let autor         = document.querySelector('#autor').value;
        RED.nameUser      = autor;

        /* === RED.description === */
        // Adaugă descrierea
        RED.description   = descriere.value;
        // FIXME: Trunchiază aici textul la 1000 de caractere. Fă sanetizare și în server!!!

        /* === RED.rol === */
        // Adaugă rolul pe care îl îndeplinește
        var rol           = document.querySelector('#roluri');
        var rolOpt        = rol.options[rol.selectedIndex].value;
        RED.rol           = rolOpt;

        /* === RED.licenta === */
        // Adaugă licența pentru care s-a optat
        var licenta       = document.querySelector('#licente');
        var licOpt        = licenta.options[licenta.selectedIndex].value;
        RED.licenta       = licOpt;
    }

    /* === Pasul 2 === */
    /**
     * Funcția are rolul de a completa cu date obiectul `RED` cu datele de la `Pas2`.
     */
    function pas2 () {

        // VERIFICĂ SELECTAREA ARIEI CURRICULARE
        existaAria();

        // === RED.level ===
        // Obținerea valorilor pentru clasele selectate
        var niveluriScolare = document.querySelector('#nivel');
        var noduriInputNiveluri = niveluriScolare.querySelectorAll('input');
        noduriInputNiveluri.forEach(input => {
            if (input.checked && RED.level.indexOf(input.value) === -1) {
                // console.log(input.value);
                switch (input.value) {
                    case 'cl0':
                        RED.level.push('Clasa pregătitoare');
                        break;
                    case 'cl1':
                        RED.level.push('Clasa I');
                        break;
                    case 'cl2':
                        RED.level.push('Clasa a II-a');
                        break;
                    case 'cl3':
                        RED.level.push('Clasa a III-a');
                        break;
                    case 'cl4':
                        RED.level.push('Clasa a IV-a');
                        break;
                    case 'cl5':
                        RED.level.push('Clasa a V-a');
                        break;
                    case 'cl6':
                        RED.level.push('Clasa a VI-a');
                        break;
                    case 'cl7':
                        RED.level.push('Clasa a VII-a');
                        break;
                    case 'cl8':
                        RED.level.push('Clasa a VIII-a');
                        break;
                    default:
                        break;
                }
            }
        });

        // === RED.etichete ===
        // document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value, dataset}) => {
        document.querySelectorAll("#v-pills-tabContent input[type='checkbox']:checked").forEach(({value, dataset}) => {
            if (RED.discipline.indexOf(dataset.nume) === -1) {
                // Verifică să nu se dubleze etichetele pentru cazul în care se întoarce userul și apasă din nou pe pas2()
                if (disciplineSelectate.has(dataset.nume)) {
                    if (RED.etichete.indexOf(dataset.nume) === -1) {
                        RED.etichete.push(dataset.nume); // introdu codul disciplinei ca tag
                    }
                    if (RED.etichete.indexOf(value) === -1) {
                        RED.etichete.push(value); // introdu numele întreg al disciplinei doar dacă nu există
                    }
                }
            }
        });

        // === RED.activitati ===
        // Dacă există date în Map-ul `activitatiFinal`,
        if (activitatiFinal) {
            activitatiFinal.forEach((value, key, map) => {
                var arr = [value, key];
                RED.activitati.push(arr);
            });
        }

        // === RED.competenteGen ===
        // introducerea valorilor din `Set`-ul `competenteGen`
        if (competenteGen) {
            competenteGen.forEach((v) => {
                RED.competenteGen.push(v);
            });
        }
        // === RED.competenteS ===
        // introducerea valorilor din `Set`-ul `competenteS`
        if (competenteS) {
            competenteS.forEach((v) => {
                RED.competenteS.push(v);
            }); 
        }
    }

    /**
     * Funcția se execută la intrarea în pasul 4 al formularului
     */
    function pas3 () {
        // introducerea grupurilor țintă selectare din options
        var grup = document.getElementById('valid-grup');
        RED.grupuri = getMeSelected(grup, false);
        // var domeniu = document.getElementById('valid-domeniu');
        // RED.domeniu = getMeSelected(domeniu, true);
        // var functii = document.getElementById('valid-functii');
        // RED.functii = getMeSelected(functii, true);
        // var demersuri = document.getElementById('valid-demersuri');
        // RED.demersuri = getMeSelected(demersuri, false);
        // var spatii = document.getElementById('valid-spatii');
        // RED.spatii = getMeSelected(spatii, true);
        // var invatarea = document.getElementById('valid-invatarea');
        // RED.invatarea = getMeSelected(invatarea, true);
        RED.dependinte = document.getElementById('dependinte').value;
        RED.componente = document.getElementById('componente').value;

        // Adaugă rolul pe care îl îndeplinește
        var abilitati           = document.querySelector('#valid-abil');
        var abilitatiOpt        = abilitati.options[abilitati.selectedIndex].value;
        RED.abilitati           = abilitatiOpt;

        // Adaugă materialele necesare pentru a reproduce, vizualiza, etc
        var materiale = document.getElementById('materiale');
        RED.materiale = getMeSelected(materiale, false);

        /* === Afișarea ETICHETELOR === */
        var tagsElems = document.getElementById('tags');
        RED.etichete.forEach((tag) => {
            var btnCloseWrapper = new createElement('button', '', ['tag', 'btn', 'btn-sm', 'badge', 'badge-pill', 'badge-info', 'm-1'], null).creeazaElem(`${tag}`);
            var elemBadge       = new createElement('span', '', ['closebtn', 'm-1'], null).creeazaElem(); // `×`
            btnCloseWrapper.appendChild(elemBadge);
            tagsElems.appendChild(btnCloseWrapper);
        });
    }

    /* Rolul funcției este să permită ștergerea de etichete care nu sunt considerate utile sau care au for introduse greșit*/
    function removeTags () {

    }

    /**
     * Funcția are rolul să prelucreze un element select cu opțiunea multiple activă
     * @param {Object} elem Este elementul DOM select din care se dorește returnarea unui array cu valorile celor selectate
     * @param {Boolean} eticheta Dacă valoarea este `true`, valorile vor fi adăugate ca etichete
     * @return {Array} Array cu valorile select-urilor pentru care utilizatorul a optat.
     */
    function getMeSelected (elem, eticheta) {
        // introdu un nivel de verificare compatibilitate. Dacă browserul nu are suport pentru `.selectedOptions`, optează pentru un nivel suplimentar de asigurare a compatibilității
        var selectedElems = elem.selectedOptions || [].filter.call(elem.options, option => option.selected);
        return [].map.call(selectedElems, option => {
            if (eticheta === true) {
                RED.etichete.push(option.value);
            }
            return option.value;
        });
    }

    /**
     * Funcția are rolul de a închide bagul după ce toate resursele au fost contribuite.
     * @param {Object} evt Este obiectul eveniment al butonului `#submit` 
     */
    function closeBag (evt) {
        evt.preventDefault();
        // Închide Bag-ul
        pubComm.emit('closeBag', true); // vezi routes.js ->  socket.on('closeBag'...)
        pubComm.on('closeBag', (mesaj) => {
            console.log("Am închis bag-ul cu următoarele detalii: ", mesaj);
        });
    }

    // Afișează selectorul de imagini - https://codepen.io/kskhr/pen/pRwKjg
    /**
     * Funcția este receptor pentru containerele imaginilor timbru
     * Funcția are rolul de a bifa și debifa imaginile din galeria celor expuse selecției.
     */
    function clickImgGal () {
        // selectează toate elementele care au clasa `.image-checkbox`
        let elementContainer = document.querySelectorAll('.image-checkbox'); // e o HTMLColection de div-uri care conțin fiecare următorii copii: img, input, svg
        // console.log(elementContainer.length); // 2
        // console.log(this);

        // caută între cei trei copii elementul <input>
        elementContainer.forEach( liveNode => {
            // caută primul element <input type="checkbox">, care este în mod normal și primul care are atributul `checked`
            let inputCollection = liveNode.querySelectorAll('input[type=checkbox]');
            inputCollection.forEach(element => {


                // adaugă-i acestui element clasa `image-checkbox-checked`
                if (element.checked) {
                    element.classList.add('image-checkbox-checked');
                    
                    // FIXME: Vezi dacă este selectat vreun alt element și dacă este, pune-le pe toate pe checked === false
                    // for (let sibling of elem.parentNode.children) {
                    //     // console.log(sibling);        
                    //     if (sibling !== checkbox) {
                    //         sibling.checkbox = false;
                    //         sibling.classList.remove('image-checkbox-checked');
                    //     }
                    // }

                } else {
                    // altfel, sterge-i clasa `image-checkbox-checked`
                    element.classList.remove('image-checkbox-checked');
                }
            });
        });

        this.classList.toggle('image-checkbox-checked');
        var checkbox = this.querySelector('input[type=checkbox]');
        // console.log(checkbox, checkbox.checked);

        if(checkbox.checked === false) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }

        if (checkbox.checked === true) {
            this.querySelector('svg').classList.add('d-block');
        } else {
            this.querySelector('svg').classList.add('d-none');
        }

        if(checkbox.checked === true){
            this.querySelector('svg').classList.remove('d-none');
            this.querySelector('svg').classList.toggle('d-block');
        }
    }

    var insertGal = document.getElementById('imgSelector');
    /**
     * Funcția generează toate elementele ce poartă imagini pentru a putea fi bifată cea care devine coperta resursei.
     */
    function pickCover () {
        insertGal.innerHTML = '';
        for (let img of imagini) {
            // console.log('imaginea selectată pentru copertă este: ', img);
            
            let container = new createElement('div', '', [`col-xs-4`, `col-sm-3`, `col-md-2`, `nopad`, `text-center`], null).creeazaElem();
            container.addEventListener('click', clickImgGal);
            let imgCheck  = new createElement('div', '', [`image-checkbox`], null).creeazaElem();
            
            let imgElem   = new createElement('img', '', [`img-responsive`], {src: `${img}`}).creeazaElem();
            let inputElem = new createElement('input', '', [`inputCheckGal`], {type: 'checkbox', value: `${img}`}).creeazaElem();
            let inputI    = new createElement('i', '', [`fa`, 'fa-check', 'd-none'], null).creeazaElem();

            imgCheck.appendChild(imgElem);
            imgCheck.appendChild(inputElem);
            imgCheck.appendChild(inputI);
            container.appendChild(imgCheck);
            insertGal.appendChild(container);
        }
        return insertGal;
    }

    /**
     * Funcția are rolul de a colecta care dintre imagini va fi coperta și de a colecta etichetele completate de contribuitor.
     */
    function pas4 () {
        /* === RED.relatedTo === */
        // vezi id-ul `tools` și introdu-le în array-ul `RED.relatedTo`
        var newRelReds = document.getElementById('tools');
        var arrNewRelReds = newRelReds.value.split(',');
        arrNewRelReds.forEach((relRed) => {
            relRed = relRed.trim();
            RED.relatedTo.push(relRed);
        });

        // colectarea etichetelor
        // TODO: Diferențiază-le pe cele care sunt redactate cu `[]` de celelalte. Cele cu `[]` trebuie să genereze în backend colecții!!! IMPLEMENTEAZĂ!
        var newTags = document.getElementById('eticheteRed'); // ref la textarea de introducere
        // detectează când s-a introdus o etichetă în momentul în care apare o virgulă
        newTags.addEventListener('input', (evt) => {
            // evt.preventDefault();
            // console.log(newTags.value);
            
            if (newTags.value.indexOf(',') > -1) {
                console.log('A apărut o virgulă');
            }
        });
        var arrNewTags = newTags.value.split(',');

        // Completează RED.coperta cu linkul către imaginea bifată din galerie
        var inputCheckGal = document.querySelectorAll('.inputCheckGal');
        inputCheckGal.forEach(input => {
            if (input.checked) {
                RED.coperta = `${input.value}`;
            }
        });

        // colectează bibliografia
        RED.bibliografie = document.getElementById('bibliografie').value;
    }

    /* === USERUL RENUNȚĂ === */
    // fă o referință către butonul de ștergere
    var deleteRes = document.querySelector('#delete');
    // la click, emite ordinul de ștergere
    deleteRes.addEventListener('click', function (evt) {
        evt.preventDefault();
        // șterge subdirectorul creat cu tot ce există
        if (uuid) {
            pubComm.emit('deldir', {
                content: {
                    idContributor: RED.idContributor,
                    uuid: uuid
                }
            });
            pubComm.on('deldir', (res) => {
                // alert(res);
                if (res) {
                    window.location = '/profile/resurse/';
                }
            });
        } else {
            window.location.href = '/profile/resurse';
        }
    });

    /* === TRIMITEREA DATELOR FORMULARULUI === */
    var submitBtn = document.querySelector('#submit');
    submitBtn.addEventListener('click', (evt) => {
        pas4();
        // FIXME: Mai întâi verifică dacă are o imagine la copertă. Dacă nu are, generează una cu https://github.com/imsky/holder  https://www.cssscript.com/generating-custom-image-placeholders-with-pure-javascript-placeholder-js/
        closeBag(evt); // ÎNCHIDE BAG-ul după ce ai verificat că ai o imagine la copertă, fie că este a utilizatorului, fie că este generată
        pubComm.emit('red', RED); // vezi în routes.js -> socket.on('red', (RED) => {...
        // aștept răspunsul de la server și redirecționez utilizatorul către resursa tocmai creată.
        pubComm.on('confirm', (redID) => {
            console.log("[form01adres::3599::pubcom.on('ingest')] Răspunsul de la server este: ", redID);
            if (redID) {
                setTimeout(() => {
                    window.location = '/profile/' + redID;
                }, 1000);
            } else {
                setTimeout(() => {
                    window.location = '/profile/resurse';
                }, 1000);
            }
        });
    });

/* === FUNCȚIILE HELPER === */

