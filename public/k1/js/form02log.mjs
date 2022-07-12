import {socket, pubComm, createElement, check4url, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

// Obiectul record
let log = {};

/**
 * Funcția creează alias-uri din textele titlurilor are au diaritice.
 * https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript 
 * @param {String} txt 
 * @returns {String} Fără diacritice cu toate cuvintele despărțite prin minusuri
 */
function toLatinSnake(txt) {
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(' ').join('-');
};

// TITLE <log.title>
let title = document.querySelector('#titlelog');
let alias = document.querySelector('#aliaslog');
title.addEventListener('change', (evt) => {
    evt.preventDefault();
    log['title'] = evt.target.value;
    log['alias'] = toLatinSnake(log.title);
    alias.value = log.alias;
    console.log('Acum log.alias are valoarea ', log.alias);
});

// ALIAS
alias.addEventListener('change', (evt) => {
    evt.preventDefault();
    log['alias'] = evt.target.value;
    console.log('După modificare directă log.alias are valoarea ', log.alias);
});

// AUTOR <log.autor>
let autor = document.querySelector('#autor');
autor.addEventListener('change', (evt) => {
    evt.preventDefault();
    log.autor = evt.target.value;
});

// USER ID (necesar upload-ului imaginilor, vezi metodele editorului)
let userId = document.querySelector('#userId').value;

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
    },
    /**
     * Id of Element that should contain Editor instance
     */
    holder: 'codex',
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

/* === ETICHETE === */
var tagsUnq = new Set(); // construiește un set cu care să gestionezi etichetele
var newTags = document.getElementById('eticheteLog'); // ref la textarea de introducere a etichetelor
var tagsElems = document.getElementById('tags');

/**
 * Funcția are rolul de a crea un element vizual de tip etichetă
 * @param {String} tag 
 */
function createTag (tag) {
    // https://stackoverflow.com/questions/22390272/how-to-create-a-label-with-close-icon-in-bootstrap
    var spanWrapper = new createElement('h5', `${tag}`, ['tag'], null).creeazaElem();
    var tagIcon = new createElement('span', '', ['fa', 'fa-tag', 'text-warning', 'mr-2'], null).creeazaElem();
    var spanText = new createElement('span', '', ['text-secondary'], null).creeazaElem(`${tag}`);
    var aClose = new createElement('a', '', null, null).creeazaElem();
    var aGlyph = new createElement('i', '', ['remove', 'fa', 'fa-times', 'ml-1'], null).creeazaElem();

    aClose.appendChild(aGlyph);
    spanWrapper.appendChild(tagIcon);
    spanWrapper.appendChild(spanText);
    spanWrapper.appendChild(aClose);
    tagsElems.appendChild(spanWrapper);

    aClose.addEventListener('click', removeTag);
};

/**
 * Rolul funcției este să permită ștergerea de etichete care nu sunt considerate utile sau care au fost introduse greșit
 * @param {Object} evt 
 */
function removeTag (evt) {
    // console.log(`Obiectul eveniment`, evt, `target este`, evt.target, `iar current este`, evt.currentTarget);
    let targetElem = document.getElementById(evt.currentTarget.parentNode.id);
    // console.log(`Id-ul căutat este`, evt.currentTarget.parentNode.id);
    tagsUnq.delete(evt.currentTarget.parentNode.id);
    tagsElems.removeChild(targetElem);
    // console.log(`După ștergere setul este `, tagsUnq);
};

// Adaugă event pentru a detecta Enter in input-ul de introducere
newTags.addEventListener('keypress', (evt) => {
    let charCodeNr = typeof evt.charCode == "number" ? evt.charCode : evt.keyCode;
    let identifier = evt.key || evt.keyIdentifier; // compatibilitate cu Safari
    if (identifier === "Enter" || charCodeNr === 13) {
        evt.preventDefault();
        let existingValues = newTags.value.split(','), i; // sparge stringul în elemente
        if (existingValues.length > 0) {
            for(i = 0; i < existingValues.length; i++) {
                let newtag = existingValues[i].trim();
                tagsUnq.add(newtag); // curăță elementul și introdu-l în Set.
                createTag(newtag);
            }
        }
        newTags.value = '';
    };
    // console.log(`Setul acum este `, tagsUnq);
});


/**
 * Funcția `creeazaTitluAlternativ` generează mecanismul prin care se pot adăuga titluri alternative celui principal
 * Folosește funcția `creeazaTitluAlternativHelper` pentru a genera structura DOM
 */
 function creeazaBody () {
    // creează aceleași elemente de formular responsabile cu generarea unui titlu
    let insertie = document.querySelector('#detailBody');// punct de aclanșare în DOM pentru elementele generate dinamic

    const divInputGroup        = new createElement('div', '', ['input-group', 'bodiesfrm'], {}).creeazaElem();
    const divInputGroupPrepend = new createElement('div', '', ['input-group-prepend'], {}).creeazaElem();
    const spanInputgroupText   = new createElement('span','', ['input-group-text'],    {}).creeazaElem('Persoană');
    divInputGroupPrepend.appendChild(spanInputgroupText);
    divInputGroup.appendChild(divInputGroupPrepend);

    const inputName = new createElement('input', 'namePerson', ['form-control'], {
        type: 'text',
        placeholder: 'Numele persoanei fizice sau juridice',
        ['aria-label']: 'Nume',
        ['aria-describedby']: `nume`
    }).creeazaElem('', true);
    divInputGroup.appendChild(inputName);

    const divInputGroupPrepend2 = new createElement('div',  '', ['input-group-prepend'], {}).creeazaElem();        
    const emailLabel            = new createElement('span', '', ['input-group-text'],    {}).creeazaElem('email');    
    divInputGroupPrepend2.appendChild(emailLabel);
    divInputGroup.appendChild(divInputGroupPrepend2);

    const inputEmail = new createElement('input', 'bodyEmail', ['form-control'], {
        type: 'text',
        placeholder: 'email contact',
        ['aria-label']: 'Email',
        ['aria-describedby']: `bodyEmail`
    }).creeazaElem('', true);
    divInputGroup.appendChild(inputEmail);

    const divInputGroupPrepend3 = new createElement('div', '', ['input-group-prepend'], {}).creeazaElem();        
    const idLabel               = new createElement('span','', ['input-group-text'],    {}).creeazaElem('id');    
    divInputGroupPrepend2.appendChild(idLabel);
    divInputGroup.appendChild(divInputGroupPrepend3);

    const inputId = new createElement('input', 'bodyId', ['form-control'], {
        type: 'text',
        placeholder: 'identificatori separați prin virgule',
        ['aria-label']: 'Id',
        ['aria-describedby']: `bodyId`
    }).creeazaElem('', true);
    divInputGroup.appendChild(inputId);

    const addBodyBtn = new createElement('button', `addbody`, ['btn', 'btn-info'], {}).creeazaElem("Adaugă");
    divInputGroup.appendChild(addBodyBtn);

    let bodies = document.querySelector('#bodies');
    if (!bodies) {
        const bodyPlace   = new createElement('div', 'bodyplace', ['d-flex'], {}).creeazaElem();
        const bodyentries = new createElement('section',  'bodyentries', ['personul'], {}).creeazaElem();
        bodyPlace.appendChild(bodyentries);
        divInputGroup.appendChild(bodyPlace);
    }

    insertie.appendChild(divInputGroup);

    addBodyBtn.addEventListener('click', addPerson); // funcția callback este mai jos
};

globalThis.creeazaBody = creeazaBody; // trimite în global funcția

// structura de 
const personMapper = new Map();


/**
 * funcție callback pentru creeazaBody ()
 * @param {Object} event 
 */
function addPerson (event) {
    //#1 culege datele din elemente
    let personEl = document.querySelector('#namePerson').value,
        bodyEmEl = document.querySelector('#bodyEmail').value,
        bodyIdEl = document.querySelector('#bodyId').value,
        persUUID = crypto.randomUUID(),
        persOb   = {personEl, bodyEmEl, bodyIdEl};
    
    if(!personMapper.has(persUUID)) {
        personMapper.set(persUUID, persOb);
    }

    // console.log(`Mapul are valorile`, personMapper);

    //#3 creează o intrare nouă în div-ul de evidență al persoanelor
    const bentries = document.querySelector('#bodyentries');

    //#4 creează un hash uni din email si nume persoana care să fie id-ul
    const bodyplus = new createElement('div', `${persUUID}`, ['text-warning', 'mr-2'], {}).creeazaElem(`${persOb.personEl} ${persOb.bodyEmEl} ${persOb.bodyIdEl}`);
    var aClose = new createElement('a', '', null, null).creeazaElem();
    var aGlyph = new createElement('i', '', ['remove', 'fa', 'fa-times', 'ml-1'], null).creeazaElem();
    aClose.appendChild(aGlyph);
    bodyplus.appendChild(aClose);
    bentries.appendChild(bodyplus);

    document.querySelector('#namePerson').value = '';
    document.querySelector('#bodyEmail').value = '';
    document.querySelector('#bodyId').value = '';

    aClose.addEventListener('click', function removePerson (evt) {
        let targetElem = document.getElementById(evt.currentTarget.parentNode.id);
        personMapper.delete(evt.currentTarget.parentNode.id);
        bentries.removeChild(targetElem);
        // console.log(`După ștergere setul este `, personMapper);
    });

    // let test2arr = Array.from(personMapper, ([persUUID, obi]) => ({ name: obi.personEl, email: obi.bodyEmEl, id: obi.bodyIdEl }));
    let test2arr =  [...personMapper].map((x) => (x[1]));
    console.log(`testul de transformare este `, test2arr);
}


// SALVEAZĂ ÎNREGISTRAREA
let submitBtn = document.querySelector('#enterlog');
let idContributor = document.querySelector('#idContributor');
submitBtn.addEventListener('click', (evt) => {
    evt.preventDefault();

    // colectează etichetele <log.tags>
    log['tags'] = [...tagsUnq];
    
    // ID CONTRIBUTOR <log.content>
    log['idContributor'] = idContributor.value;

    // colectează creatorii
    log['creator'] = [...personMapper].map((x) => ({name: x[1].personEl, email: x[1].bodyEmEl, id: x[1].bodyIdEl.split(',')}));

    editorX.save().then((content) => {
        log['content'] = content;

        // EMITE EVENT `log`
        pubComm.emit('log', log);
    }).catch((e) => {
        console.log('[form02log.js] submitBtn', e);
    });
});

// aștept răspunsul de la server și redirecționez utilizatorul către articolul creat.
pubComm.on('log', (entry) => {
    window.location.href = '/log';
});