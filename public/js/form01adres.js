var csrftoken = document.getElementsByName('_csrf')[0].value;
var cookie2obj = document.cookie.split(/; */).reduce((obj, str) => {
    if (str === "") return obj;
    const eq = str.indexOf('=');
    const key = eq > 0 ? str.slice(0, eq) : str;
    let val = eq > 0 ? str.slice(eq + 1) : null;
    if (val != null) try { val = decodeURIComponent(val); } catch(ex) { e => console.error }
    obj[key] = val;
    return obj;
}, {});

// colectorul datelor din form
var RED = {
    expertCheck: false,
    uuid: '',
    emailContrib: '',
    langRED: '',
    title: '',
    titleI18n: [],
    idContributor: '',
    description: '',
    licenta: '',
    // pas 2
    arieCurriculara: [],
    level: [],
    discipline: [],
    competenteGen: [],
    competenteS: [],
    activitati: [],
    relatedTo: [],
    etichete: []
};

let imagini = new Set(); // un `Set` cu toate imaginile care au fost introduse în document.
let fisiere = new Set(); // un `Set` cu toate fișierele care au fost introduse în document la un moment dat (înainte de `onchange`).

// este necesar pentru a primi uuid-ul generat la încărcarea unui fișier mai întâi de orice în Editor.js. Uuid-ul este trimis din multer
pubComm.on('uuid', (id) => {
    // console.log('Pentru că a fost încărcat un fișier mai întâi de toate, a fost generat următorul uuid în server: ', id);
    RED.uuid = id;
});

/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    placeholder: 'Introdu conținut descriptiv nu mai mult de câteva paragrafe. Nu folosi editorul pentru crearea resursei decât în cazul în care aceasta este de foarte mică întindere. Pentru materiale de substanță, creează un fișier și încarcă-l aici. Este recomandabil să pui o imagine care să ilustreze conținutul. Dă click aici când dorești să începi.',
    logLevel: 'VERBOSE', 
    /* VERBOSE 	Show all messages (default)
        INFO 	Show info and debug messages
        WARN 	Show only warn messages
        ERROR 	Show only error messages */

    /* onReady callback */
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
    },

    /* id element unde se injectează editorul */
    holder: 'codex-editor',
    /* Activează autofocus */ 
    autofocus: true,
    
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
                data: {
                    uuid: RED.uuid,
                    id: RED.idContributor
                }
            },
            buttonText: 'Încarcă un fișier',
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
                     * ÎNCARCĂ FIȘIERUL DE PE HARD!!!
                     * @param {File} file - Fișierul încărcat ca prim parametru
                     * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                     */
                    uploadByFile(file){  
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)
                        // console.log(file.size);

                        // => construcția obiectul care va fi trimis către server
                        let objRes = {
                            user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                            name: RED.nameUser, // este de forma "Nicu Constantinescu"
                            uuid: RED.uuid,  // dacă deja a fost trimisă o primă resursă, înseamnă că în `RED.uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
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
                            // console.log('Cand încarc un fișier, trimit obiectul: ', objRes);
                            
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

                                /* Editor.js se așteaptă ca acesta să fie populat după ce fișierul a fost trimis. */                            
                                const obj4EditorJS = {
                                    success: respObj.success,
                                    file: {
                                        url: path,
                                        size: respObj.file.size
                                    }
                                };

                                // Adaugă imaginea încărcată în `Set`-ul `imagini`.
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
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)

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
                            // console.log(response); // response.body este deja un ReadableStream
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
                                        // console.log(respObj.file);
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
                                    pubComm.emit('messaje', `Am eșuat cu următoarele detalii: ${error}`);
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

    // de fiecare dată când se modifică conținutul, actualizează `RED.content`.
    onChange: () => {
        editorX.save().then((content) => {    
            // verifică dacă proprietatea `content` este populată.
            if (!('content' in RED)) {
                RED['content'] = content; // Dacă nu există introduc `content` drept valoare.
            } else if (typeof(RED.content) === 'object' && RED.content !== null) {
                RED.content = null; // Dacă există deja, mai întâi setează `content` la `null` 
                RED.content = content; // și apoi introdu noua valoare.
                
                // === Logică de ștergere de pe HDD a imaginilor care au fost șterse din editor ===
                // Pas 1 Fă un set cu imaginile care au rămas după ultimul `onchange`
                const imgsInEditor = RED.content.blocks.map((element) => {
                    if (element.type === 'image') {
                        const newUrl = new URL(element.data.file.url);
                        let path = newUrl.pathname;
                        // console.log("Am extras următoarea cale din url: ", path);
                        return path;
                    }
                });
                // console.log("Imaginile care au rămas în editor după ultima modificare: ", imgsInEditor);
                // Pas 2 Compară-le cu cu este în `Set`-ul `images`.
                const toDelete = Array.from(imagini).map((path) => {
                    // Caută în imaginile după ultima modificare
                    if (!imgsInEditor.includes(path)){
                        return path;
                    }
                });
                // console.log("Ce este în toDelete ", toDelete);
                
                if (toDelete.length > 0) {                    
                    toDelete.forEach(function clbk4Eac (path) {
                        if (path) {
                            imagini.delete(path);
                            // extrage numele fișierului din `fileUrl`
                            let fileName = path.split('/').pop();
                            // emite un eveniment de ștergere a fișierului din subdirectorul resursei.                            
                            pubComm.emit('delfile', {
                                uuid: RED.uuid,
                                idContributor: RED.idContributor,
                                fileName: fileName
                            });
                            pubComm.on('delfile', (mesagge) => {
                                console.log("Am șters cu următoarele detalii: ", message);
                            });
                        }
                    });
                }
                // === Logică de ștergere de pe HDD a fișierelor care nu mai există în client
                // Pas 1 Adaugă la căile existente în `fișiere` ulimele fișierele adăugate după ultimul `onchange`
                const filesInEditor = RED.content.blocks.map((element) => {
                    if (element.type === 'attaches') {
                        const newUrl = new URL(decodeURIComponent(element.data.file.url)); // decodează linkul
                        console.log("După folosirea lui decode, ai următorul link: ", newUrl);
                        
                        let path = newUrl.pathname; // extrage calea
                        console.log("Am extras următoarea cale a documentului din url: ", path);
                        fisiere.add(path); // adaugă calea în fisiere. Dacă există deja, nu va fi adăugat.
                        return path;
                    }
                });
                
                // Fă verificările dacă cel puțin un document a fost adăugat
                if(fisiere.size > 0) {
                    let FtoDelete = Array.from(fisiere).map((path) => {
                        // Caută în setul fișierelor după ultima modificare
                        if (!filesInEditor.includes(path)){
                            return path;
                        }
                    });
                    if (FtoDelete.length > 0) {                    
                        FtoDelete.forEach(function clbk4Eac2Del (path) {
                            if (path) {
                                fisiere.delete(path);
                                // extrage numele fișierului din `fileUrl`
                                let fileName = path.split('/').pop();
                                // emite un eveniment de ștergere a fișierului din subdirectorul resursei                                
                                pubComm.emit('delfile', {
                                    uuid: RED.uuid,
                                    idContributor: RED.idContributor,
                                    fileName: fileName
                                });
                                pubComm.on('delfile', (messagge) => {
                                    console.log("Am șters cu următoarele detalii ", messagge);
                                });
                            }
                        });
                    }
                }
            }
            pickCover(); // formează galeria pentru ca utilizatorul să poată selecta o imagine

        }).catch((e) => {
            console.log(e);
        });
    }
    /**
     * Previously saved data that should be rendered
     */
    // data: {}
});


/**
 * Clasa `createElement` va creea elemente HTML
 * @param {String} tag este un și de caractere care indică ce tip de element va fi creat
 * @param {String} [id] este un șir de caractere care indică un id pentru element
 * @param {Array}  [cls] este un array ce cuprinde clasele elementului
 * @param {Object} [attrs] este un obiect de configurare a elementului care permite definirea de atribute
 */
class createElement {
    constructor(tag, id, cls, attrs){
        this.id = id;
        this.tag = tag;
        this.classes = [...cls];
        this.attributes = attrs;    // va fi un un obiect de configurare, fiecare membru fiind un posibil atribut.
    }
    /**
     * Metoda `creeazaElem()` generează obiectul DOM
     * @param {String} textContent Este conținutul de text al elementului, dacă acest lucru este necesar
     * @param {Boolean} requiredElem Specifică dacă un element are atributul `required`
     */
    creeazaElem (textContent, requiredElem) {
        const element = document.createElement(this.tag);
        if (this.id) element.id = this.id;
        if (this.classes) element.classList.add(...this.classes);
        if (this.attributes) {
            for (let [key, val] of Object.entries(this.attributes)) {
                element.setAttribute(key, val);
            }
        }
        // if (textContent) element.textContent = textContent;
        if (textContent) {
            var text = '' + textContent;
            let encodedStr = decodeCharEntities(text); // decodifică entitățile 
            let txtN = document.createTextNode(encodedStr);
            element.appendChild(txtN);
        }
        if (requiredElem) element.required = true;
        return element;
    }
} 
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
 * Convertește un characterSet html în caracterul originar.
 * @param {String} str htmlSet entities
 **/
function decodeCharEntities (str) {
    let decomposedStr = str.split(' ');
    // FIXME: Nu acoperă toate posibilele cazuri!!! ar trebui revizuit la un moment dat.
    var entity = /&(?:#x[a-f0-9]+|#[0-9]+|[a-z0-9]+);?/igu;
    // var codePoint = /\\u(?:\{[0-9A-F]+|[A-F0-9]+)\}?/igu;
    
    let arrNew = decomposedStr.map(function (word, index, arr) {
        let newArr = [];
        if (word.match(entity)) {
            let fragment = [...word.match(entity)];

            for (let ent of fragment) {
                var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
                var translate = {
                    "nbsp" : " ",
                    "amp"  : "&",
                    "quot" : "\"",
                    "apos" : "\'",
                    "cent" : "¢",
                    "pound": "£",
                    "yen"  : "¥",
                    "euro" : "€",
                    "copy" : "©",
                    "reg"  : "®",
                    "lt"   : "<",
                    "gt"   : ">"
                };
                return ent.replace(translate_re, function (match, entity) {
                    return translate[entity];
                }).replace(/&#(\d+);/gi, function (match, numStr) {
                    var num = parseInt(numStr, 10);
                    return String.fromCharCode(num);
                });
            }
            return arrNew;
        } else {
            newArr.push(word);
        }
        return newArr.join('');
    });
    return arrNew.join(' ');
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
    let primulTitlu = document.querySelector('#titluRes').id;   // extrage id-ul primului titlu pe baza căruia se vor construi restul în cele alternative
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

//FIXME: Generează automat datele din data=* dacă se poate!!!
const mapCodDisc = new Map();

// La `parent` va fi codul care este precizat în `data-*` de la `Aria/arii curriculare` din HTML - client
// REGULĂ: array-urile disciplinelor nu trebuie să aibă coduri copiate de la array-ul altei discipline (produce ghosturi și orfani pe ecran)
// REGULĂ: pentru a se face colocarea sub-disciplinelor la o disciplină, cele din array trebuie să pornescă cu un fragment de caractere identic.
// CLASA 0
mapCodDisc.set("0", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom0", 
                "lbcomGermana0", 
                "lbcomMaghiara0", 
                "lbcomRroma0", 
                "lbcomSarba0", 
                "lbcomSlovaca0"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara0', 
                'lbmatCeha0', 
                'lbmatCroata0', 
                'lbmatGermana0', 
                'lbmatGerinrom0', 
                'lbmatItaliana0', 
                'lbmatMaghiara0', 
                'lbmatMaginrom0', 
                'lbmatMinlbmag0',
                'lbmatMinlbrom0',
                'lbmatNeogreaca0', 
                'lbmatPolona0', 
                'lbmatRroma0', 
                'lbmatRusa0', 
                'lbmatSarba0', 
                'lbmatSlovaca0', 
                'lbmatSlolbcl0',
                'lbmatTurca0', 
                'lbmatUcraina0',
                'lbmatUcrarom0'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod0"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ["mateMed0"]
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv0', 
                'relBapt0', 
                'relEvca0',
                'relCrdev0', 
                'relGrcat0',
                'relOrt0', 
                'relOrtucr0', 
                'relPen0', 
                'relRef0', 
                'relRomcatmg0', 
                'relRomcatro0', 
                'relUnit0',
                'relMus0',
                'relOrtritv0'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic0"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi0",
                "muzmiBg0",
                "muzmiCh0",
                "muzmiHr0",
                "muzmiDe0",
                "muzmiDero0",
                "muzmiIt0",
                "muzmiMg0",
                "muzmiMgro0",
                "muzmiGr0",
                "muzmiRr0",
                "muzmiSr0",
                "muzmiSl0",
                "muzmiTr0",
                "muzmiUa0",
                "muzmiUaro0"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz0']            
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers0']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optEds0',
                'optTra0'
            ]            
        }
    ]
);
mapCodDisc.set("1", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom1", 
                "lbcomGermana1", 
                "lbcomMaghiara1", 
                "lbcomRroma1", 
                "lbcomSarba1", 
                "lbcomSlovaca1"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara1', 
                'lbmatCeha1', 
                'lbmatCroata1', 
                'lbmatGermana1', 
                'lbmatGerinrom1', 
                'lbmatItaliana1', 
                'lbmatMaghiara1', 
                'lbmatMaginrom1', 
                'lbmatMinlbmag1',
                'lbmatMinlbrom1',
                'lbmatNeogreaca1', 
                'lbmatPolona1', 
                'lbmatRroma1', 
                'lbmatRusa1', 
                'lbmatSarba1', 
                'lbmatSarbinrom1', 
                'lbmatSlovaca1', 
                'lbmatSlolbcl1',
                'lbmatTurca1', 
                'lbmatUcraina1',
                'lbmatUcrarom1'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod1"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ["mateMed1"]
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv1', 
                'relBapt1', 
                'relEvca1',
                'relCrdev1', 
                'relGrcat1',
                'relOrt1', 
                'relOrtucr1', 
                'relPen1', 
                'relRef1', 
                'relRomcatmg1', 
                'relRomcatro1', 
                'relUnit1',
                'relMus1',
                'relOrtritv1'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic1"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică practică",
            coduriDiscipline: ["fizicp1"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi1",
                "muzmiBg1",
                "muzmiCh1",
                "muzmiHr1",
                "muzmiDe1",
                "muzmiDero1",
                "muzmiIt1",
                "muzmiMg1",
                "muzmiMgro1",
                "muzmiGr1",
                "muzmiRr1",
                "muzmiSr1",
                "muzmiSl1",
                "muzmiTr1",
                "muzmiUa1",
                "muzmiUaro1"
            ]
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr1', 'edmzTeoafdi1']            
        },
        {
            parent:           ["arte"], 
            nume:             "Educație artistică și abilități practice",
            coduriDiscipline: ['edart1']            
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz1']           
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers1']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optEds1', 
                'optTra1'
            ]            
        }
    ]
);
mapCodDisc.set("2", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom2", 
                "lbcomGermana2", 
                "lbcomMaghiara2", 
                "lbcomRroma2", 
                "lbcomSarba2", 
                "lbcomSlovaca2"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara2', 
                'lbmatCeha2', 
                'lbmatCroata2', 
                'lbmatGermana2', 
                'lbmatGerinrom2', 
                'lbmatItaliana2', 
                'lbmatMaghiara2', 
                'lbmatMaginrom2', 
                'lbmatMinlbmag2',
                'lbmatMinlbrom2',
                'lbmatNeogreaca2', 
                'lbmatPolona2', 
                'lbmatRroma2', 
                'lbmatRusa2', 
                'lbmatSarba2', 
                'lbmatSarbinrom2', 
                'lbmatSlovaca2', 
                'lbmatSlolbcl2',
                'lbmatTurca2', 
                'lbmatUcraina2',
                'lbmatUcrarom2'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod2"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ['mateMed2']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat2"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv2', 
                'relBapt2', 
                'relEvca2',
                'relCrdev2', 
                'relGrcat2',
                'relOrt2', 
                'relOrtucr2', 
                'relPen2', 
                'relRef2', 
                'relRomcatmg2', 
                'relRomcatro2', 
                'relUnit2',
                'relMus2',
                'relOrtritv2'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic2"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp2"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi2",
                "muzmiBg2",
                "muzmiCh2",
                "muzmiHr2",
                "muzmiDe2",
                "muzmiDero2",
                "muzmiIt2",
                "muzmiMg2",
                "muzmiMgro2",
                "muzmiGr2",
                "muzmiRr2",
                "muzmiSr2",
                "muzmiSl2",
                "muzmiTr2",
                "muzmiUa2",
                "muzmiUaro2"
            ]
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr2', 'edmzTeoafdi2']            
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz2']           
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers2']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: ['optEds2']            
        }
    ]
);
mapCodDisc.set("3", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom3", 
                "lbcomGermana3", 
                "lbcomMaghiara3", 
                "lbcomRroma3", 
                "lbcomSarba3", 
                "lbcomSlovaca3",
                "lbcomCeha3"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara3', 
                'lbmatCeha3', 
                'lbmatCroata3', 
                'lbmatGermana3', 
                'lbmatGerinrom3', 
                'lbmatItaliana3', 
                'lbmatMaghiara3', 
                'lbmatMaginrom3', 
                'lbmatNeogreaca3', 
                'lbmatPolona3', 
                'lbmatRroma3', 
                'lbmatRusa3', 
                'lbmatSarba3', 
                'lbmatSlovaca3', 
                'lbmatTurca3', 
                'lbmatUcraina3'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Limbă modernă",
            coduriDiscipline: ['lbMod3']            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică",
            coduriDiscipline: ['mateMed3']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat3"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Educație civică",
            coduriDiscipline: ["edciv3"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv3', 
                'relBapt3', 
                'relEvca3',
                'relCrdev3', 
                'relGrcat3',
                'relOrt3', 
                'relOrtucr3', 
                'relPen3', 
                'relRef3', 
                'relRomcatmg3', 
                'relRomcatro3', 
                'relUnit3',
                'relMus3',
                'relOrtritv3'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic3"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Joc și mișcare",
            coduriDiscipline: ["jocmi3"]
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp3"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi3",
                "muzmiBg3",
                "muzmiCh3",
                "muzmiHr3",
                "muzmiDe3",
                "muzmiDero3",
                "muzmiIt3",
                "muzmiMg3",
                "muzmiMgro3",
                "muzmiGr3",
                "muzmiRr3",
                "muzmiSr3",
                "muzmiSl3",
                "muzmiTr3",
                "muzmiUa3"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz3']            
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr3', 'edmzTeoafdi3']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            cod:              "opt3", 
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optMed3',
                'optEds3'
            ]            
        }
    ]
);
mapCodDisc.set("4", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom4", 
                "lbcomGermana4", 
                "lbcomMaghiara4", 
                "lbcomRroma4", 
                "lbcomSarba4", 
                "lbcomSlovaca4",
                "lbcomCeha4"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara4', 
                'lbmatCeha4', 
                'lbmatCroata4', 
                'lbmatGermana4', 
                'lbmatGerinrom4', 
                'lbmatItaliana4', 
                'lbmatMaghiara4', 
                'lbmatMaginrom4', 
                'lbmatNeogreaca4', 
                'lbmatPolona4', 
                'lbmatRroma4', 
                'lbmatRusa4', 
                'lbmatSarba4', 
                'lbmatSlovaca4', 
                'lbmatTurca4', 
                'lbmatUcraina4'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Limbă modernă",
            coduriDiscipline: ['lbMod4']            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică",
            coduriDiscipline: ['mateMed4']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat4"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Educație civică",
            coduriDiscipline: ["edciv4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Geografie",
            coduriDiscipline: ["geo4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Istorie",
            coduriDiscipline: ["ist4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv4', 
                'relBapt4', 
                'relEvca4',
                'relCrdev4', 
                'relGrcat4',
                'relOrt4', 
                'relOrtucr4', 
                'relPen4', 
                'relRef4', 
                'relRomcatmg4', 
                'relRomcatro4', 
                'relUnit4',
                'relMus4',
                'relOrtritv4'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic4"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Joc și mișcare",
            coduriDiscipline: ["jocmi4"]
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp4"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi4",
                "muzmiBg4",
                "muzmiCh4",
                "muzmiHr4",
                "muzmiDe4",
                "muzmiDero4",
                "muzmiIt4",
                "muzmiMg4",
                "muzmiMgro4",
                "muzmiGr4",
                "muzmiRr4",
                "muzmiSr4",
                "muzmiSl4",
                "muzmiTr4",
                "muzmiUa4"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz4']            
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr4', 'edmzTeoafdi4']            
        },
        {
            parent:           ["arte"], 
            nume:             "Educație artistică specializată",
            coduriDiscipline: ['edarDans4', 'edarRitm4']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optMed4',
                'optEds4'
            ]            
        }
    ]
);
mapCodDisc.set("5", 
    [
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom5', 
                'lbcomRomMag5'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara5', 
                'lbmatCeha5', 
                'lbmatCroata5', 
                'lbmatGermana5', 
                'lbmatGeringer5', 
                'lbmatItaliana5', 
                'lbmatMaghiara5', 
                'lbmatMaginmag5', 
                'lbmatNeogreaca5', 
                'lbmatPolona5', 
                'lbmatRroma5', 
                'lbmatRusa5', 
                'lbmatSarba5', 
                'lbmatSlovaca5', 
                'lbmatTurca5', 
                'lbmatUcraina5'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza5', 
                'lbmod1EngInt5', 
                'lbmod1Franceza5', 
                'lbmod1FraInt5', 
                'lbmod1Italiana5', 
                'lbmod1ItaInt5', 
                'lbmod1Spaniola5', 
                'lbmod1SpanInt5', 
                'lbmod1Ebraica5', 
                'lbmod1Germana5', 
                'lbmod1GerInt5', 
                'lbmod1Rusa5', 
                'lbmod1RusInt5', 
                'lbmod1Japoneza5', 
                'lbmod1JapInt5'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza5', 
                'lbmod2Engleza5', 
                'lbmod2Franceza5', 
                'lbmod2Italiana5', 
                'lbmod2Spaniola5', 
                'lbmod2Turca5', 
                'lbmod2Germana5', 
                'lbmod2Japoneza5', 
                'lbmod2Rusa5', 
                'lbmod2Portugheza5'
            ]           
        },
        {
            parent: ["lbcom"], 
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: [
                'ellatRom5'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom5']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat5']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio5']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Gândire critică și drepturile copilului
            coduriDiscipline: ['edusoc5']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist5']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo5']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz5', 
                'relBapt5', 
                'relCrdev5', 
                'relEvca5', 
                'relGrcat5', 
                'relMus5', 
                'relOrt5', 
                'relOrtritv5', 
                'relOrtucr5', 
                'relPen5', 
                'relRef5', 
                'relRefmag5', 
                'relRomcatro5', 
                'relRomcatmg5', 
                'relRomcatlbmg5', 
                'relUnit5'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz5',
                'edmuzGer5',
                'edmuzIta5',
                'edmuzMag5',
                'edmuzMagr5',
                'edmuzPol5',
                'edmuzRrm5',
                'edmuzSrb5',
                'edmuzSlv5',
                'edmuzTur5',
                'edmuzUcr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model5'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp5"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic5']            
        },
        {
            parent: ["edfizsp5"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl5', 
                'pfizBad5', 
                'pfizBas5', 
                'pfizBab5', 
                'pfizCan5', 
                'pfizDns5', 
                'pfizFot5', 
                'pfizGif5', 
                'pfizGim5', 
                'pfizGir5', 
                'pfizHal5', 
                'pfizHan5', 
                'pfizHok5', 
                'pfizHoi5', 
                'pfizInt5', 
                'pfizJud5', 
                'pfizKca5', 
                'pfizKrt5', 
                'pfizGro5', 
                'pfizLpl5', 
                'pfizOsp5', 
                'pfizPar5', 
                'pfizPav5', 
                'pfizPpa5', 
                'pfizRgb5', 
                'pfizSne5', 
                'pfizSia5', 
                'pfizSap5', 
                'pfizSbi5', 
                'pfizSfd5', 
                'pfizSor5', 
                'pfizSsr5', 
                'pfizScr5', 
                'pfizSfb5', 
                'pfizSae5', 
                'pfizSah5', 
                'pfizTen5', 
                'pfizTem5', 
                'pfizVol5', 
                'pfizYht5'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap5', 
                'tecInfo5', 
                'tecEd5'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd5']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst5', 
                'cdsLect5', 
                'cdsGrne5', 
                'cdsMicr5', 
                'cdsMatsc5', 
                'cdsEdvit5', 
                'cdsRadlt5',
                'cdsMed5',
                'cdsCiv5',
                'cdsArm5',
                'cdsEco5',
                'cdsFin5',
                'cdsIcu5',
                'cdsEds5',
                'cdsMag5',
                'cdsGrm5',
                'cdsSah5'
            ]            
        }
    ]
);
mapCodDisc.set("6", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom6', 
                'lbcomRomMag6'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara6', 
                'lbmatCeha6', 
                'lbmatCroata6', 
                'lbmatGermana6', 
                'lbmatGeringer6', 
                'lbmatItaliana6', 
                'lbmatMaghiara6', 
                'lbmatMaginmag6', 
                'lbmatNeogreaca6', 
                'lbmatPolona6', 
                'lbmatRroma6', 
                'lbmatRusa6', 
                'lbmatSarba6', 
                'lbmatSlovaca6', 
                'lbmatTurca6', 
                'lbmatUcraina6'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza6', 
                'lbmod1EngInt6', 
                'lbmod1Franceza6', 
                'lbmod1FraInt6', 
                'lbmod1Italiana6', 
                'lbmod1ItaInt6', 
                'lbmod1Spaniola6', 
                'lbmod1SpanInt6', 
                'lbmod1Ebraica6', 
                'lbmod1Germana6', 
                'lbmod1GerInt6', 
                'lbmod1Rusa6', 
                'lbmod1RusInt6', 
                'lbmod1Japoneza6', 
                'lbmod1JapInt6'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza6', 
                'lbmod2Engleza6', 
                'lbmod2Franceza6', 
                'lbmod2Italiana6', 
                'lbmod2Spaniola6', 
                'lbmod2Turca6', 
                'lbmod2Germana6', 
                'lbmod2Japoneza6', 
                'lbmod2Rusa6', 
                'lbmod2Portugheza6'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom6']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat6']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz6']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio6']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Gândire critică și drepturile copilului
            coduriDiscipline: ['edusoc6']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist6']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo6']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz6', 
                'relBapt6', 
                'relCrdev6', 
                'relEvca6', 
                'relGrcat6', 
                'relMus6', 
                'relOrt6', 
                'relOrtritv6', 
                'relOrtucr6', 
                'relPen6', 
                'relRef6', 
                'relRefmag6', 
                'relRomcatro6', 
                'relRomcatmg6', 
                'relRomcatlbmg6', 
                'relUnit6'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz6',
                'edmuzGer6',
                'edmuzIta6',
                'edmuzMag6',
                'edmuzMagr6',
                'edmuzPol6',
                'edmuzRrm6',
                'edmuzSrb6',
                'edmuzSlv6',
                'edmuzTur6',
                'edmuzUcr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model6'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp6"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic6']            
        },
        {
            parent: ["edfizsp6"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl6', 
                'pfizBad6', 
                'pfizBas6', 
                'pfizBab6', 
                'pfizCan6', 
                'pfizDns6', 
                'pfizFot6', 
                'pfizGif6', 
                'pfizGim6', 
                'pfizGir6', 
                'pfizHal6', 
                'pfizHan6', 
                'pfizHok6', 
                'pfizHoi6', 
                'pfizInt6', 
                'pfizJud6', 
                'pfizKca6', 
                'pfizKrt6', 
                'pfizGro6', 
                'pfizLpl6', 
                'pfizOsp6', 
                'pfizPar6', 
                'pfizPav6', 
                'pfizPpa6', 
                'pfizRgb6', 
                'pfizSne6', 
                'pfizSia6', 
                'pfizSap6', 
                'pfizSbi6', 
                'pfizSfd6', 
                'pfizSor6', 
                'pfizSsr6', 
                'pfizScr6', 
                'pfizSfb6', 
                'pfizSae6', 
                'pfizSah6', 
                'pfizTen6', 
                'pfizTem6', 
                'pfizVol6', 
                'pfizYht6'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap6', 
                'tecInfo6', 
                'tecEd6'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd6']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsAba6',
                'cdsMed6',
                'cdsIst6', 
                'cdsLect6', 
                'cdsGrne6', 
                'cdsMicr6', 
                'cdsMatsc6', 
                'cdsEdvit6', 
                'cdsRadlt6',
                'cdsMed6',
                'cdsCiv6',
                'cdsArm6',
                'cdsEco6',
                'cdsGec6',
                'cdsFin6',
                'cdsIcu6',
                'cdsEds6',
                'cdsMag6',
                'cdsGrm6',
                'cdsSah6'
            ]            
        }
    ]
);
mapCodDisc.set("7", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom7', 
                'lbcomRomMag7'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara7', 
                'lbmatCeha7', 
                'lbmatCroata7', 
                'lbmatGermana7', 
                'lbmatGeringer7', 
                'lbmatItaliana7', 
                'lbmatMaghiara7', 
                'lbmatMaginmag7', 
                'lbmatNeogreaca7', 
                'lbmatPolona7', 
                'lbmatRroma7', 
                'lbmatRusa7', 
                'lbmatSarba7', 
                'lbmatSlovaca7', 
                'lbmatTurca7', 
                'lbmatUcraina7'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza7', 
                'lbmod1EngInt7', 
                'lbmod1Franceza7', 
                'lbmod1FraInt7', 
                'lbmod1Italiana7', 
                'lbmod1ItaInt7', 
                'lbmod1Spaniola7', 
                'lbmod1SpanInt7', 
                'lbmod1Ebraica7', 
                'lbmod1Germana7', 
                'lbmod1GerInt7', 
                'lbmod1Rusa7', 
                'lbmod1RusInt7', 
                'lbmod1Japoneza7', 
                'lbmod1JapInt7'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza7', 
                'lbmod2Engleza7', 
                'lbmod2Franceza7', 
                'lbmod2Italiana7', 
                'lbmod2Spaniola7', 
                'lbmod2Turca7', 
                'lbmod2Germana7', 
                'lbmod2Japoneza7', 
                'lbmod2Rusa7', 
                'lbmod2Portugheza7'
            ]           
        },
        {
            parent: ["lbcom"], 
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: [
                'ellatRom7'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom7']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Chimie",
            coduriDiscipline: ['chim7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio7']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Gândire critică și drepturile copilului
            coduriDiscipline: ['edusoc7']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist7']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo7']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz7', 
                'relBapt7', 
                'relCrdev7', 
                'relEvca7', 
                'relGrcat7', 
                'relMus7', 
                'relOrt7', 
                'relOrtritv7', 
                'relOrtucr7', 
                'relPen7', 
                'relRef7', 
                'relRefmag7', 
                'relRomcatro7', 
                'relRomcatmg7', 
                'relRomcatlbmg7', 
                'relUnit7'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz7',
                'edmuzGer7',
                'edmuzIta7',
                'edmuzMag7',
                'edmuzMagr7',
                'edmuzPol7',
                'edmuzRrm7',
                'edmuzSrb7',
                'edmuzSlv7',
                'edmuzTur7',
                'edmuzUcr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model7'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp7"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic7']            
        },
        {
            parent: ["edfizsp7"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl7', 
                'pfizBad7', 
                'pfizBas7', 
                'pfizBab7', 
                'pfizCan7', 
                'pfizDns7', 
                'pfizFot7', 
                'pfizGif7', 
                'pfizGim7', 
                'pfizGir7', 
                'pfizHal7', 
                'pfizHan7', 
                'pfizHok7', 
                'pfizHoi7', 
                'pfizInt7', 
                'pfizJud7', 
                'pfizKca7', 
                'pfizKrt7', 
                'pfizGro7', 
                'pfizLpl7', 
                'pfizOsp7', 
                'pfizPar7', 
                'pfizPav7', 
                'pfizPpa7', 
                'pfizRgb7', 
                'pfizSne7', 
                'pfizSia7', 
                'pfizSap7', 
                'pfizSbi7', 
                'pfizSfd7', 
                'pfizSor7', 
                'pfizSsr7', 
                'pfizScr7', 
                'pfizSfb7', 
                'pfizSae7', 
                'pfizSah7', 
                'pfizTen7', 
                'pfizTem7', 
                'pfizVol7', 
                'pfizYht7'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap7', 
                'tecInfo7', 
                'tecEd7'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd7']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst7', 
                'cdsLect7', 
                'cdsGrne7', 
                'cdsMicr7', 
                'cdsMatsc7', 
                'cdsEdvit7', 
                'cdsRadlt7',
                'cdsMed7',
                'cdsArm7',
                'cdsEco7',
                'cdsGec7',
                'cdsFin7',
                'cdsIcu7',
                'cdsEds7',
                'cdsLat7',
                'cdsMag7'
            ]            
        }
    ]
);
mapCodDisc.set("8", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom8', 
                'lbcomRomMag8'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara8', 
                'lbmatCeha8', 
                'lbmatCroata8', 
                'lbmatGermana8', 
                'lbmatGeringer8', 
                'lbmatItaliana8', 
                'lbmatMaghiara8', 
                'lbmatMaginmag8', 
                'lbmatNeogreaca8', 
                'lbmatPolona8', 
                'lbmatRroma8', 
                'lbmatRusa8', 
                'lbmatSarba8', 
                'lbmatSlovaca8', 
                'lbmatTurca8', 
                'lbmatUcraina8'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza8', 
                'lbmod1EngInt8', 
                'lbmod1Franceza8', 
                'lbmod1FraInt8', 
                'lbmod1Italiana8', 
                'lbmod1ItaInt8', 
                'lbmod1Spaniola8', 
                'lbmod1SpanInt8', 
                'lbmod1Ebraica8', 
                'lbmod1Germana8', 
                'lbmod1GerInt8', 
                'lbmod1Rusa8', 
                'lbmod1RusInt8', 
                'lbmod1Japoneza8', 
                'lbmod1JapInt8'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza8', 
                'lbmod2Engleza8', 
                'lbmod2Franceza8', 
                'lbmod2Italiana8', 
                'lbmod2Spaniola8', 
                'lbmod2Turca8', 
                'lbmod2Germana8', 
                'lbmod2Japoneza8', 
                'lbmod2Rusa8', 
                'lbmod2Portugheza8'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom8']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Chimie",
            coduriDiscipline: ['chim8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio8']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Gândire critică și drepturile copilului
            coduriDiscipline: ['edusoc8']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist8']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo8']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz8', 
                'relBapt8', 
                'relCrdev8', 
                'relEvca8', 
                'relGrcat8', 
                'relMus8', 
                'relOrt8', 
                'relOrtritv8', 
                'relOrtucr8', 
                'relPen8', 
                'relRef8', 
                'relRefmag8', 
                'relRomcatro8', 
                'relRomcatmg8', 
                'relRomcatlbmg8', 
                'relUnit8'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz8',
                'edmuzGer8',
                'edmuzIta8',
                'edmuzMag8',
                'edmuzMagr8',
                'edmuzPol8',
                'edmuzRrm8',
                'edmuzSrb8',
                'edmuzSlv8',
                'edmuzTur8',
                'edmuzUcr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model8'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp8"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic8']            
        },
        {
            parent: ["edfizsp8"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl8', 
                'pfizBad8', 
                'pfizBas8', 
                'pfizBab8', 
                'pfizCan8', 
                'pfizDns8', 
                'pfizFot8', 
                'pfizGif8', 
                'pfizGim8', 
                'pfizGir8', 
                'pfizHal8', 
                'pfizHan8', 
                'pfizHok8', 
                'pfizHoi8', 
                'pfizInt8', 
                'pfizJud8', 
                'pfizKca8', 
                'pfizKrt8', 
                'pfizGro8', 
                'pfizLpl8', 
                'pfizOsp8', 
                'pfizPar8', 
                'pfizPav8', 
                'pfizPpa8', 
                'pfizRgb8', 
                'pfizSne8', 
                'pfizSia8', 
                'pfizSap8', 
                'pfizSbi8', 
                'pfizSfd8', 
                'pfizSor8', 
                'pfizSsr8', 
                'pfizScr8', 
                'pfizSfb8', 
                'pfizSae8', 
                'pfizSah8', 
                'pfizTen8', 
                'pfizTem8', 
                'pfizVol8', 
                'pfizYht8'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap8', 
                'tecInfo8', 
                'tecEd8'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd8']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst8', 
                'cdsLect8', 
                'cdsGrne8', 
                'cdsMicr8', 
                'cdsMatsc8', 
                'cdsEdvit8', 
                'cdsRadlt8',
                'cdsArm8',
                'cdsFin8',
                'cdsIcu8',
                'cdsEds8',
                'cdsMag8'
            ]            
        }
    ]
);

/**
 * Funcția este un helper și are rolul de a face o căutare în `Map`-ul `mapCodDisc` 
 * pentru a extrage numele disciplinei pilon
 * @ param {Object} `obidisc` //{nivel: n, cod: obi.codsdisc} 
 */
function extragNumeDisciplina (obidisc) {
    let disciplina;
    mapCodDisc.forEach ((v, k, m) => {
        // caută în clasa specificată de obidisc.nivel, înregistrarea în map de tip Array cu obiecte
        if (obidisc.nivel === k) {
            // pentru setul găsit
            for (let obi of v) {  
                // caută în array-ul codurilor disciplinelor arondate unei arii a unui an              
                if (obi.coduriDiscipline.includes(obidisc.cod)) {
                    // dacă am găsit-o, returnează!
                    disciplina = obi.nume;                    
                }
            }
        }
    });
    return disciplina;
};

/* === Constituirea selectorului pentru disciplină === */
var niveluri   = document.querySelectorAll('.nivel'); // array de clase selectate
var discipline = document.querySelector('#discipline');
// Constituirea FRAGMENTULUI de DOM [Bootstrap 4 Vertical pills](https://getbootstrap.com/docs/4.0/components/navs/#javascript-behavior)
let multilevdisc = new createElement('section', 'multilevdisc', '', '').creeazaElem();
let tablist      = new createElement('div', 'v-pills-tab', ['nav', 'flex-column', 'nav-pills'], {role: "tablist", 'aria-orientation': "vertical"}).creeazaElem();
let tabcontent   = new createElement('div', 'v-pills-tabContent', ['tab-content'], '').creeazaElem();
multilevdisc.appendChild(tablist);
multilevdisc.appendChild(tabcontent);
discipline.appendChild(multilevdisc);

const DISCMAP = new Map(); // colector de structuri {nivel: "5", 5: {art5: [], bio5: []}} generate de `structDiscipline({cl:event.target.value, data});`

/**
 * Pentru fiecare clasă bifată, adaugă un listener la `click`, 
 * care va genera input checkbox-uri în baza datelor din dataset-ul `data=*` al checkboxului de clasă
 * Parcurge un array al claselor existente (var niveluri) și pentru fiecare selectată, 
 * generează discipline așezate vertical și inputbox-uri care arată ca butoane [Bootstrap 4 Vertical pills].
 */
niveluri.forEach(function cbNiveluri (nivel) {
    // pentru fiecare element checkbox al unei clase, adaugă un listener
    nivel.addEventListener('click', (event) => {
        // constituie un obiect `data` cu toate datele din `data=*` a checkbox-ului de clasă.
        const data = JSON.parse(JSON.stringify(event.target.dataset));
        // remodelează disciplinele după seturi aparținând unei discipline generate din primele trei caractele ale data=*
        const STRUCTURE = structDiscipline({cl:event.target.value, data}); // event.target.value este value="cl5"
        // console.log("Structure este: ",STRUCTURE);

        // încărcarea setului de discipline pentru input-ul unei clase pentru care s-a dat click
        if (!DISCMAP.has(STRUCTURE.nivel)) {
            DISCMAP.set(STRUCTURE.nivel, STRUCTURE.rezultat);
        } // prin click pe clase, se vor încărca progresiv toate, dacă se va da click pe toate.

        // Info primare pentru constituire interfață
        let n = STRUCTURE.nivel; // -> 8, de exemplu
        let objSeturi = STRUCTURE.rezultat[n]; //16 seturi -> {art5: [], bio5: []}
        // console.dir("S-au generat următoarele seturi pentru fiecare disciplină ", objSeturi);
        
        // Dacă elementul target este debifat, șterge-i disciplinele asociate!
        if(event.target.checked === false) {
            let cheiclase = Object.keys(objSeturi);
            for (let dicscls of cheiclase) {;
                // console.log("Am șters din elemente pe cel cu clasa: ", dicscls);
                
                let elemExistent = document.querySelector(`.${dicscls}`); // k este codul disciplinei care a fost pus drept clasă în vederea modelării cu CSS (culoare, etc)
                if (elemExistent) {
                    tablist.removeChild(elemExistent); // șterge disciplina din array-ul elementelor DOM
                }
            }
            // șterge conținutul din DOM
            tabcontent.innerHTML='';
            // Șterge datele din info primare
            n = '';
            objSeturi = null;
        } else {
            
            // FIXME: gestionează cazul în care formularul a fost reîncărcat și au rămas bifate clasele, 
            // dar disciplinele nu s-au încărcat pentru că nu s-a dat niciun click 

            // pentru fiecare proprietate din `objSeturi`
            for (let prop in objSeturi) {
                // asigură-te că nu sunt introduse și proprietăți moștenite
                if (objSeturi.hasOwnProperty(prop)) {
                    const setArr = objSeturi[prop]; // constituie un array de array-uri cu discipline

                    let menuSet = new Set(); // set pentru a evita cazul dublării elementelor de meniu
                    let elemSet = new Set();
                    
                    for (let obi of setArr) {
                        // console.log(prop); // 16 bucăți
                        /* === PENTRU TOATE SUB-DISCIPLINELE CARE AU ACEEAȘI DISCIPLINĂ, SE CREEAZĂ UN SINGUR ELEMENT DE MENIU === */
                        // caută numele disciplinei și afișează în locul codului `prop`. Valorile sunt extrase din `mapCodDisc` -> funcția `extragNumeArie`
                        let numeDisciplina = extragNumeDisciplina({nivel: n, cod: obi.codsdisc}); //{ codsdisc: "artViz0", nume: "Arte vizuale și abilități practice"}

                        // obi -> { codsdisc: "lbcomRom5", nume: "Limba și literatura română" }
                        // Creează un element de meniu vertical acum că ai numele ariei/disciplinei
                        if (!menuSet.has(numeDisciplina)) {
                            menuSet.add(numeDisciplina);                            
                            // generează linkurile care stau vertical(`prop` are primele trei sau patru caractere ale unui set de discipline)
                            var serdiscbtn = new createElement('a', `v-pills-${prop}-tab`, ['nav-link', `${prop}`], {"data-toggle":"pill", href: `#v-pills-${prop}`, role: "tab", "aria-controls": `v-pills-${prop}`}).creeazaElem(numeDisciplina);
                            // creează div-ul care ține disciplinele afișate ca butoane
                            var dicpanes = new createElement('div', `v-pills-${prop}`, ['tab-pane', 'fade', 'show'], {role: "tabpanel", "aria-labelledby": `v-pills-${prop}-tab`}).creeazaElem();
                        }
                        // console.log(menuSet);
                        tablist.appendChild(serdiscbtn);
                        // generează checkbox-urile
                        for (let obidisc of objSeturi[prop]) {
                            if (!elemSet.has(obidisc.codsdisc)) {
                                elemSet.add(obidisc.codsdisc);
                                //console.log(obidisc); // Object { codsdisc: "lbcomRom5", nume: "Limba și literatura română" }
                                let inputCheckBx      = new createElement('input', '', ['form-check-input'], {type: "checkbox", 'data-nume': obidisc.codsdisc, autocomplete: "off", value: obidisc.nume}).creeazaElem();
                                let labelBtn          = new createElement('label', '', ['discbtn','btn', 'btn-info', 'btn-sm'], {}).creeazaElem(obidisc.nume);
                                labelBtn.textContent += ` `; //adaugă un spațiu între numar și textul butonului.
                                let clasaInfo         = new createElement('span', '', ['badge','badge-light'], {}).creeazaElem(n);
                                labelBtn.appendChild(clasaInfo);
                                let divBtnGroupToggle = new createElement('div',   '', ['disciplina', 'btn-group-toggle', obidisc.codsdisc], {"data-toggle": "buttons", onclick: "actSwitcher()"}).creeazaElem();           
                                labelBtn.appendChild(inputCheckBx);
                                divBtnGroupToggle.appendChild(labelBtn);
                                dicpanes.appendChild(divBtnGroupToggle);
                            }
                        }
                        tabcontent.appendChild(dicpanes);
                    }
                }
            }
        }
    });
});

/**
 * Funcția are rolul să structureze sub-disciplinele în raport cu Disciplina mare la care sunt arondate
 * Disciplina va fi codificată extrăgând un fragment din numele care este precizat în valorile setului extras din data=*
 * @param {Object} discs Este un obiect cu toate disciplinele din setul data=* aferent unei clase
 */
function structDiscipline (discs = {}) {
    // discs are semnătura `cl: "cl5", data: {artDansc5: "Dans clasic",  artDesen5: "Desen"} }`
    let arrOfarr = Object.entries(discs.data); // transformă înregistrările obiectului în array-uri
    // arrOfarr va avea semnătura `[ "lbcomRom5", "Limba și literatura română" ], [ "lbcomOpt5", "Opțional" ]`
    
    // redu înregistrarea `arrOfarr` la un obiect consolidat de forma lui `obj`:
    const obj = {
        nivel: discs.cl.split('').pop(),
        rezultat: {}
    };
    let claseDisc = new Set(); // constituie un Set cu discipline

    obj.rezultat = arrOfarr.reduce((ac, elem, idx, arr) => {
        let classNameRegExp = /[a-z]+((\d)?|[A-Z])/gm; // orice caracter mic urmat, fie de un număr, fie de o literă mare
        // console.log('Fără shift numele clasei de disciplină arată așa: ', elem[0].match(classNameRegExp));
        
        let className = elem[0].match(classNameRegExp).shift(); // Generează numele claselor extrăgând din elementul 0 al touple-ului, fragmentul ce corespunde șablonului RegExp

        if (className.slice(-1) !== obj.nivel) {
            className += obj.nivel;
        }
        claseDisc.add(className);

        // definirea structurii de date când `ac` la început este `undefined`
        if (Object.keys(ac).length === 0 && ac.constructor === Object) {
            // dacă obiectul este gol, introdu prima înregistrare, care dă astfel și structura
            ac[obj.nivel] = {};
            ac[obj.nivel][className] = [
                {codsdisc: elem[0], nume: elem[1]}
            ];            
        } else {
            // în cazul în care obiectul este deja populat, verifică dacă setul de discipline (`className`) există deja
            if(className in ac[obj.nivel]) {
                ac[obj.nivel][className].push({codsdisc: elem[0], nume: elem[1]}); // dacă există, adaugă disciplina array-ului existent
            } else {
                // dacă nu avem set de discipline pentru `className`-ul descoperit, se va constitui unul și se va introduce prima înregistrare în array
                ac[obj.nivel][className] = className;
                ac[obj.nivel][className] = [
                    {codsdisc: elem[0], nume: elem[1]}
                ]; 
            }
        }
        return ac;
    },{});

    return obj;
}

/* ==== Prezentarea competențelor specifice ==== */
// Locul de inserție al tabelului
var compSpecPaginator = document.querySelector('#actTable');

// Pentru a preveni orice erori izvorâte din apăsarea prematură a butonului „Alege competetențe specifice”, am ales să-l ascund până când nu este selectată o disciplină
/**
 * Rolul funcției este de a face ca butonul de selecție să apară doar dacă a fost apăsată vreo disciplină
 */
function actSwitcher () {
    if (compSpecPaginator.classList.contains('d-none')) {
        compSpecPaginator.classList.remove('d-none');
    } else {
        compSpecPaginator.classList.add('d-block');
    }
}

var activitatiFinal = new Map(); // mecanism de colectare al activităților bifate sau nu
var competenteGen   = new Set(); // este un set necesar colectării competențelor generale pentru care s-au făcut selecții de activități în cele specifice
var competenteS     = new Set(); // este setul competențelor specifice care au avut câte o activitate bifată sau completată.
/**
 * Funcție helper pentru prezentarea informațiilor privind activitățile în row separat.
 * De funcția aceasta are nevoie `disciplineBifate()`.
 * singura formulă de a adăuga interactivtate input-urilor este prin atașarea unui listener `manageInputClick()` pe `onclick`.
 * @param {Object} data sunt datele unei Competențe Specifice. Acestea au fost aduse din baza de date
 */
function tabelFormater (data) {
    // constituie o secțiune în care vor sta activitățile
    var sectionW   = $('<section></section>');
    var activitati = $(`<ul id="${data._id}"></ul>`);

    // constituie un array al tuturor activităților arondate unei competențe specifice pentru a genera elementele `<li>` din acestea
    data.activitati.forEach((elem) => {
        // pentru fiecare activitate, generează câte un `<li>` care să aibă corespondent un input check a cărui valoare este chiar textul activității
        let divElem = $('<div class="form-check"></div>').wrap('<li class="list-group-item"><li>');
        divElem.append(`<input class="activitate form-check-input position-static" type="checkbox" value="${elem}" onclick="manageInputClick()"> ${elem}`);
        // am introdus clasa activitate pentru ușura mecanismul de selecție ulterior în funcția manageInputClick()
        activitati.append(divElem);
    });

    // generarea formului folosit la adăugarea de activități arbitrare
    var wrapper   = $(`<div class="input-group mb-3">`);
    var frmAddAct = $(`<input type="text" aria-label="descrierea noii activități propuse" class="form-control ${data.cod}-add" placeholder="Aici vei introduce descrierea noii activități propuse" aria-describedby="basic-addon2"></input>`);
    // adăugarea butonul necesar introducerii de activități arbitrare
    var btnWrap   = $('<div class="input-group-append">');
    var btnAdd    = $(`<buton type="button" id="${data.cod}-add" class="btn btn-warning">Adaugă o nouă activitate de învățare</div>`).wrap(`<div class="input-group-append">`);
    btnWrap.append(btnAdd); // adaugă elementul buton
    wrapper.append(frmAddAct);
    wrapper.append(btnWrap);

    // aici se creează butonul care permite adăugarea de elemente noi la lista de activități și se atașează și listener-ul
    $(btnAdd).on('click', function (evt) {
        // la apăsarea butonului „Adaugă o nouă activitate”, se va genera un element nou input checkbox, deja bifat
        let divElem = $('<div class="form-check"></div>').wrap('<li class="list-group-item"><li>');
        divElem.append(`<input class="activitate form-check-input position-static" type="checkbox" value="${$(frmAddAct).val()}" checked onclick="manageInputClick()"> ${$(frmAddAct).val()}`);
        // am introdus clasa activitate pentru ușura mecanismul de selecție ulterior în funcția manageInputClick()

        // Introdu de la momentul în care se constituie elementul input checkbox valoarea în activitatiFinal
        // console.log(data);
        activitatiFinal.set(`${$(frmAddAct).val()}`, `${data.cod}`);
        activitati.append(divElem);
    });

    // Adaugă în wrapper cele două zone: activitati și formul de introducere activități
    sectionW.append(activitati);
    sectionW.append(wrapper);

    // Inițializează cu date instanța clasei Act --> scoate datele caracteristice zonei populate!!!
    watchRow(data);

    // trebuie returnat lui Data Table, alfel nu se populează datele.
    return sectionW;
}

/* ======== MAGIE PE RÂNDUL CREAT DINAMIC ====== */
// O clasă menită să ofere datele rândului activ care cuprinde toate activitățile
class Act {
    constructor (row) {
        this.row = row;
    }
    getData () {
        return this.row;
    }
}
// referință către obiectul care înmagazinează datele. Inițial null.
var XY = null;

/**
 *  Funcția are rolul să creeze un obiect în baza clasei `Act`. Acesta va înmagazina datele rândului creat pentru activități.
 *  Funcția este apelată în `tabelFormater()`.
 *  @param {Obiect} data 
 */
function watchRow (data) {
    // instanțiază obiectul inception prin pasarea datelor curente în constructorul clasei.
    let inception = new Act(data);
    XY = inception;
}

/** 
 * Funcția are rolul de a restabili starea de dinainte de a scoate din DOM activitățile unei competențe
 * Este apelată din `disciplineBifate()`
 */
function activitatiRepopulareChecks () {
    let rowData = XY.getData();

    // array-ul activităților
    var arr = Array.from(document.getElementsByClassName('activitate'));
    // pentru fiecare element care găsit cu clasa `activitate`, caută în Map, dacă are un obiect corespondent. Dacă da, setează atributul la checked

    // selectează doar elementele care au valoarea codului competenței și fă-le să apară bifate.
    const existing = arr.map((element) => {
        if ((activitatiFinal.has(element.value))) {
            element.checked = true;
        }
    });

    /* ====== Popularea cu activitățile create de user ======*/
    var contentMap = activitatiFinal.entries();
    // creează punctul de inserție pentru activitățile care au fost dorite opțional
    var ancora = document.getElementById(XY.getData()._id); // FIXME:

    // constituie un array al tuturor activităților (valoarea inputului) care se încarcă din bază
    var activitati = [];
    for (let el of arr) {
        activitati.push(el.value);
    }

    // parcurge înregistrările din Map și caută dacă valoarea activității există în array-ul activităților generate de bază.
    for (let val of contentMap) {
        // dacă în activități nu ai niciun index cu valoarea activității care există în Map, înseamnă că-i în plus și trebuie generat element cu acea valoare.
        if (activitati.indexOf(val[0]) === -1) {
            var nouDiv   = new createElement('div', '', ['form-check'], {}).creeazaElem();
            var nouInput = new createElement('input', '', ['activitate', 'form-check-input', 'position-static'], {
                type: 'checkbox',
                value: val[0],
                onclick: 'manageInputClick()',
                checked: true
            }).creeazaElem();
            var textVal = document.createTextNode(`${val[0]}`);
            nouDiv.appendChild(nouInput);
            nouDiv.appendChild(textVal);
            ancora.appendChild(nouDiv);
        }
    }
}

/**
 *  Funcția este event handler pentru click-urile de pe input checkbox-urile create dinamic pentru fiecare activitate.
 *  Gestionează ce se întâmplă cu datele din `activitatiFinal`
 *  Are acces la obiectul `XY`, care oferă datele rândului.
 *  Aici se verifică bifele și se crează un `Map` cu datele care trebuie introduse în obiectul `RED`
 */
function manageInputClick () {
    let rowData = XY.getData(); // referință către datele rândului de tabel pentru o anumită competență specifică
    // $(`#arteviz3\\-1\\.1`).show(); MEMENTO!!!! Bittes like fuckin sheet!

    var ancoraID = document.getElementById(rowData._id);
    var activitChildren = Array.from(ancoraID.querySelectorAll('.activitate'));

    // pentru fiecare dintre elementele din array, verifică dacă a fost bifat. Dacă a fost bifat, adaugă-l în Map
    var existing = activitChildren.filter((elem) => {
        if (elem.checked) {
            return true; // dacă e true, adaugă element bifat în `existing`
        } else if (activitatiFinal.has(elem.value)) { 
            // dacă nu e bifat, verifică dacă nu cumva se află în Map de la o bifare anterioară. Atenție, valoarea nu este codul CS-ului, este chiar descierea activității
            activitatiFinal.delete(elem.value); // STERGE-L!!!
        }
    });

    // adaugă în Map-ul `activitatiFinal` activitățile bifate 
    existing.forEach((elem) => {
        activitatiFinal.set(elem.value, rowData.cod);
    });

    // selectează tabelul mare din care vei ținti checkboxul de pe rândul competenței specifice
    // ceea ce se dorește este ca atunci când există cel puțin un element bifat, să fie bifat și rândul competenței specifice
    if (activitatiFinal.size) {
        document.getElementById('competenteS').querySelector(`input[value="${rowData.cod}"]`).checked = true;
        // Adaugă informațiile utile privind Competența Generală adăugată
        competenteGen.add(rowData.parteA);  // introdu în set Competența Generală pentru care s-a făcut o selecție
        competenteS.add(rowData._id);       // introdu în set Compențele Specifice pentru care au fost bifate sau introduse activități
    } else {
        document.getElementById('competenteS').querySelector(`input[value="${rowData.cod}"]`).checked = false;
        // elimină din array-ul competențelorGen codul celi care nu mai are nicio selecție în activități
        // for( let i = 0; i < RED.competenteGen; i++){ 
        //     if ( RED.competenteGen[i] === 5) {
        //         RED.competenteGen.splice(i, 1); 
        //         i--;
        //     }
        // }
    }
    // console.log(activitatiSelectate.size);
}

function addMeDeleteMe () {
    let rowData = XY.getData();
} 
/* ======== MAGIA ESTE GATA, APLAUZE!!! ======= */

/**
 * Funcția `diciplineBifate` este listener pentru butonul „Alege competențele specifice” - `#actTable`
 * Are rolul de a aduce competențele specifice pentru disciplinele bifate folosind socketurile.
 * Apelează funcțiile `tabelFormater(data)` și `activitatiRepopulareChecks()` la momentul când se apasă pe butonul plus
 */
function disciplineBifate () {
    // un array necesar pentru a captura valorile input checkbox-urilor bifate
    let values = [];

    // trimite în `values` valorile din input checkboxurile bifate în elementul părinte #discipline
    document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value, dataset}) => {
        // console.log("dataset este ", dataset, "iar value este ", value);
        values.push(dataset.nume);

        // ==== RED.discipline ====
        RED.discipline.push(value);
        RED.etichete.push(value);
    });
    // console.log(values);

    // ori de câte ori va fi apăsată o disciplină, se emite apel socket către baza de date și extrage conform selecției, un subset  (ex: [ "matexpmed2", "comlbrom2" ]). 
    pubComm.emit('csuri', values);

    // const tabelComps = document.querySelector('#competenteS'); // selectează tabelul țintă
    
    /* ==== GENEREAZA TABELUL ===== */
    pubComm.on('csuri', (csuri) => {        
        const CSlist = JSON.parse(csuri);   // transformă stringul în array JS
        
        // modelarea tabelului 
        $(document).ready(function() {
            var table = $('#competenteS').DataTable({
                responsive: true,
                "order": [[ 0, "asc" ]],
                "dom": '<"toolbar">frtip',
                data: CSlist,
                columnDefs: [{
                    orderable: false,
                    targets: [1]
                }],
                columns: [
                    {
                        "className":      'details-control',
                        "orderable":      false,
                        "data":           null,
                        "defaultContent": ''
                    },
                    {
                        "title":          "alege",
                        "className":      'select-control',
                        "orderable":      false,
                        "data":           "cod",
                        "render": function (data, type, row, meta) {
                            return '<input type="checkbox" value="' + data + '"></input>';
                        }
                    },
                    {title: "cod", data: "cod"},
                    {title: "disciplina", "data": "disciplina"},
                    {title: "Competența specifică", "data": "nume"},
                    {title: "Competența generală", "data": "parteA" }
                    // {title: "activitati", "data": "activitati[, * ]"}
                ],
                language: {
                    "sProcessing":   "Procesează...",
                    "sLengthMenu":   "Afișează _MENU_ înregistrări pe pagină",
                    "sZeroRecords":  "Nu am găsit nimic - ne pare rău",
                    "sInfo":         "Afișate de la _START_ la _END_ din _TOTAL_ înregistrări",
                    "sInfoEmpty":    "Afișate de la 0 la 0 din 0 înregistrări",
                    "sInfoFiltered": "(filtrate dintr-un total de _MAX_ înregistrări)",
                    "sInfoPostFix":  "",
                    "sSearch":       "Caută:",
                    "sUrl":          "",
                    "oPaginate": {
                        "sFirst":    "Prima",
                        "sPrevious": "Precedenta",
                        "sNext":     "Următoarea",
                        "sLast":     "Ultima"
                    }
                }
            });
            // Adăugarea de informații în toolbar
            $("div.toolbar").html('<strong>Pentru a încadra corect activitățile (cunoștințe, abilități, atitudini) fiecărei competențe, apăsați semnul plus.</strong>');

            // TODO: În cazul în care te decizi să introduci fontawesome
            // $(this).find('[data-fa-i2svg]').toggleClass('fa-minus-square').toggleClass('fa-plus-square');

            // Adaugă eveniment pe deschiderea detaliilor și închidere (butonul verde)
            $('#competenteS tbody').on('click', 'td.details-control', function (evt) {
                evt.preventDefault();

                var tr = $(this).closest('tr'); // this este butonul. closest('tr') este randul în care se află. Caută rândul pe care este butonul și fă-i o referință
                var row = table.row(tr); // row() este o metodă de-a lui Data Table. Transformă tr-ul JQuery în row de data-table
        
                if ( row.child.isShown() ) {
                    // Rândul cu detaliile activităților este deschis. Închide-l!
                    row.child.hide();
                    // tr.find('svg').attr('data-icon', 'plus-circle');    // FontAwesome 5
                    tr.removeClass('shown');
                } else {
                    // evt.stopPropagation(); // oprește propagarea evenimentului original pe buton.
                    // Open this row
                    row.child(tabelFormater(row.data())).show(); // apelează funcția helper `tabelFormater()` căreia îi trimiți datele din row
                    tr.addClass('shown');
                    // tr.find('svg').attr('data-icon', 'minus-circle'); // FontAwesome 5

                    activitatiRepopulareChecks(); // restabilirea stării de dinaintea închiderii rândului cu lista de activități
                }
            });
        });
        // modelarea tabelului END
    });
    return values;
}

/**
 * Populează cu date reprezentând competențele specifice pentru disciplinele selectate
 */
compSpecPaginator.addEventListener('click', (ev) => {
    disciplineBifate();
});

/* ========== COLECTAREA DATELOR DIN FORM ============= */

/* === Pasul 1 === */
/**
 * Funcția are rolul de a popula obiectul `RED` cu datele din formular de la `Pas 1`.
 */
function pas1 () {
    // Gestionarea titlului și ale celor în alte limbi
    var title = document.querySelector('#titlu-res').value; // titlul în limba română
    RED.title = title; // adaugă valoarea titlului în obiect
    // Stabilirea limbii RED-ului
    var limbaRed = document.querySelector('#langRED');
    var langRED = limbaRed.options[limbaRed.selectedIndex].value;
    RED.langRED = langRED;
    // verifică dacă nu cumva au fost adăugate titluri alternative. Dacă da, constituie datele necesare
    var titluriAltele = document.querySelector('#langAlternative');
    if (titluriAltele) {
        // Creează un NodeList cu toate elementele input
        var inputs = titluriAltele.querySelectorAll('input');
        // Creează un NodeList cu toate elementele select
        var selects = titluriAltele.querySelectorAll('select');
        
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
    // Adaugă emailul 
    var emailContrib  = document.querySelector('#emailContrib').value;
    RED.emailContrib  = emailContrib;
    // Adaugă id-ul utilizatorului care face propunerea
    var idUser        = document.querySelector('#idUser').value;    
    RED.idContributor = idUser;
    // Adaugă numele și prenumele utilizatorului
    let autor         = document.querySelector('#autor').value;
    RED.nameUser      = autor;
    // Adaugă descrierea
    var descriere     = document.querySelector('#descriereRed').value;
    RED.description   = descriere;
    // Adaugă rolul pe care îl îndeplinește
    var rol           = document.querySelector('#roluri');
    var rolOpt        = rol.options[rol.selectedIndex].value;
    RED.rol           = rolOpt;
    // Adaugă licența pentru care s-a optat
    var licenta       = document.querySelector('#licente');
    var licOpt        = licenta.options[licenta.selectedIndex].value;
    RED.licenta       = licOpt;
}

/* ====== Pasul 2 ====== */
/**
 * Funcția are rolul de a completa cu date obiectul `RED` cu datele de la `Pas2`.
 */
function pas2 () {
    // introducerea arie curiculare selectare din options
    var arie = document.getElementById('arii-curr');
    // RED.arieCurriculara = arie.options[arie.selectedIndex].value; // aduce doar ultima care a fost selectată

    // introdu un nivel de verificare compatibilitate. Dacă browserul nu are suport pentru .selectedOptions, optează pentru un nivel suplimentar de asigurare a compatibilității
    var optSelectate = arie.selectedOptions || [].filter.call(arie.options, option => option.selected);
    var valAriiSelectate = [].map.call(optSelectate, option => option.value);

    // ==== RED.arieCurriculara ====
    // Verifică dacă valorile din array-ul `RED.arieCurriculara`. Dacă valoarea există deja, nu o mai adăuga de fiecare dată când `pas2()` este executat.
    valAriiSelectate.forEach((valoare) => {
        // Verifica cu indexOf existența valorii. Dacă nu e, adaug-o!
        if (RED.arieCurriculara.indexOf(valoare) === -1) {
            RED.arieCurriculara.push(valoare);
        }
    });
    // Afișează eroare în cazul în care nu s-a făcut încadrarea curriculară.
    if (RED.arieCurriculara.length === 0) {
        $.toast({
            heading: 'Curricula',
            text: "Mergi înapoi și fă alegerea corectă în ariile curriculare. Este un element absolut necesar!!!",
            position: 'top-center',
            showHideTransition: 'fade',
            icon: 'error'
        });
    }

    // ==== RED.level ==== 
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
            // RED.level.push(input.value);
        }
    });

    // === RED.etichete ===
    // document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value, dataset}) => {
    document.querySelectorAll("#v-pills-tabContent input[type='checkbox']:checked").forEach(({value, dataset}) => {

        if (RED.discipline.indexOf(dataset.nume) === -1) {
            // RED.discipline.push(element.value);
            RED.etichete.push(value);
            RED.etichete.push(dataset.nume);
        }
    });

    // ==== RED.activitati ====
    /**
     * Funcția are rolul de a alimenta array-ul activităților din obiectul colector RED
     */
    function pushActivitate (value, key, map) {
        var arr = [value, key];
        RED.activitati.push(arr);
    }
    // Dacă există date în Map-ul `activitatiFinal`,
    if (activitatiFinal) {
        activitatiFinal.forEach(pushActivitate);
    }

    // ==== RED.competenteGen ====
    // introducerea valorilor din Set-ul competenteGen
    if (competenteGen) {
        competenteGen.forEach((v) => {
            RED.competenteGen.push(v);
        });
    }
    // introducerea valorilor din Set-ul competenteS
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

    var tagsElems = document.getElementById('tags');
    RED.etichete.forEach((tag) => {
        var elemBadge = new createElement('span', '', ['badge', 'badge-info', 'm-1'], null).creeazaElem(`${tag}`);
        tagsElems.appendChild(elemBadge);
    });
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
        console.log('imaginea selectată pentru copertă este: ', img);
        
        let container = new createElement('div', '', [`col-xs-4`, `col-sm-3`, `col-md-2`, `nopad`, `text-center`], null).creeazaElem();
        container.addEventListener('click', clickImgGal);
        let imgCheck = new createElement('div', '', [`image-checkbox`], null).creeazaElem();
        //FIXME: trebuie doar căi relative!!!! Repară stringurile care sunt culese în `imagini`.
        
        let imgElem = new createElement('img', '', [`img-responsive`], {src: `${img}`}).creeazaElem();
        let inputElem = new createElement('input', '', [`inputCheckGal`], {type: 'checkbox', value: `${img}`}).creeazaElem();
        let inputI = new createElement('i', '', [`fa`, 'fa-check', 'd-none'], null).creeazaElem();

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

    // vezi id-ul `tools` și introdu-le în array-ul `RED.relatedTo`
    var newRelReds = document.getElementById('tools');
    var arrNewRelReds = newRelReds.value.split(',');
    arrNewRelReds.forEach((relRed) => {
        relRed = relRed.trim();
        RED.relatedTo.push(relRed);
    });

    // colectarea etichetelor
    // TODO: Diferențiază-le pe cele care sunt redactate cu `[]` de celelalte. Cele cu `[]` trebuie să genereze în backend colecții!!! IMPLEMENTEAZĂ!
    var newTags = document.getElementById('eticheteRed');
    var arrNewTags = newTags.value.split(',');

    // AICI fă diferența între taguri și colecții.
    arrNewTags.forEach((tag) => {
        tag = tag.trim(); // curăță de posibilele spații.
        RED.etichete.push(tag);
    });

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
var saveContinutRes = document.querySelector('#submitWrap');
// la click, emite ordinul de ștergere
saveContinutRes.addEventListener('click', function (evt) {
    evt.preventDefault();
    // șterge subdirectorul creat cu tot ce există
    if (RED.uuid) {
        pubComm.emit('deldir', {
            content: {
                idContributor: RED.idContributor,
                identifier: RED.uuid
            }
        });
        pubComm.on('deldir', (detalii) => {
            alert(detalii);
            window.location.href = '/profile/resurse';
        })
    }
});

/* === TRIMITEREA DATELOR FORMULARULUI === */
var submitBtn = document.querySelector('#submit');
submitBtn.addEventListener('click', (evt) => {
    pas4();
    closeBag(evt); // ÎNCHIDE BAG-ul
    pubComm.emit('red', RED); // vezi în routes.js -> socket.on('red', (RED) => {...
    // aștept răspunsul de la server și redirecționez utilizatorul către resursa tocmai creată.
    pubComm.on('red', (red) => {
        if (red) {
            setTimeout(() => {
                window.location = '/profile/resurse';
            }, 1000);
        }
    });
});