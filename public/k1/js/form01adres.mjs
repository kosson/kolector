import {socket, pubComm, createBS5toast, deleteAllBS5toasts, createElement, check4url, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

// document.addEventListener("DOMContentLoaded", function clbkDOMContentLoaded () {});

/* === VARIABILE NECESARE LA NIVEL DE MODUL ȘI MAI DEPARTE === */
var uuid      = document.querySelector("meta[property='uuid']").getAttribute("content") || '',
    RED       = {},
    csrfToken = '',
    imagini   = new Set(), // un `Set` cu toate imaginile încărcate.
    fileRes   = new Set(); // un `Set` care unifică fișierele, fie imagini, fie atașamente.

// TOKEN-ul CSRF
if (document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

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

// var cookie2obj = document.cookie.split(/; */).reduce((obj, str) => {
//     if (str === "") return obj;
//     const eq = str.indexOf('=');
//     const key = eq > 0 ? str.slice(0, eq) : str;
//     let val = eq > 0 ? str.slice(eq + 1) : null;
//     if (val != null) try {
//         val = decodeURIComponent(val);
//     } catch(e) {
//         if (e) console.error(e);
//     }
//     obj[key] = val;
//     return obj;
// }, {});

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
                            uuid: uuid,              // uuid-ul setat de server
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
                            pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server. Serverul creează bag-ul și scrie primul fișier!!!

                            // RĂSPUNSUL SERVERULUI
                            pubComm.on('resursa', (respObj) => {
                                // constituie cale relativă de pe server
                                var urlAll = new URL(`${respObj.file}`);
                                var path = urlAll.pathname; // VERIFICĂ `path` SĂ FIE DE FORMA: "/repo/5e31bbd8f482274f3ef29103/5af78e50-5ebb-11ea-9dcc-f50399016f10/data/628px-European_Union_main_map.svg.png"

                                /* Editor.js așteaptă ca acesta să fie populat după ce fișierul a fost trimis. */                            
                                const obj4EditorJS = {
                                    success: respObj.success, // 1 succes, 0 eșec
                                    file: {
                                        url: path, // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                        size: respObj.size
                                    }
                                };

                                imagini.add(path);  // Adaugă url-ul imaginii încărcată în `Set`-ul `fileRes`destinat ținerii evidenței acestora. Necesar alegerii copertei.

                                resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                            });
                        }
                        // construiește promisiunea
                        var promise = new Promise(executor);
                        // REZOLVĂ PROMISIUNEA!!!                    
                        return promise.then((obi) => {
                            return obi; // returnează rezultatul promisiunii. Este ceea ce are nevoie Editor.js în caz de succes/eșec
                        }).catch((error) => {
                            if (error) {
                                console.error(`Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
                                // pubComm.emit('mesaje', `Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
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
                        decodedURL = decodeURIComponent(url); // Dacă nu faci `decode`, mușcă pentru linkurile HTML encoded cu escape squence pentru caracterele speciale și non latine
                        let urlObj = check4url(decodedURL);   // adună toate informațiile despre fișier
                        
                        /**
                         * Funcția validează răspunsul în funcție de headere și stare
                         * @param {Object} response 
                         */
                        function validateResponseAndSend (response) {
                            if (!response.ok) {
                                // pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                console.log('[editorX::uploadByUrl::validateResponse] Am încercat să „trag” imaginea de la URL-ul dat, dar: ', response.statusText);
                            }
                            // console.log('[uploadByUrl::validateResponse] fetch a adus: ', response); // response.body este deja un ReadableStream
                            //_ FIXME: Caută să detectezi dimensiunea iar dacă depășește o valoare, încheie aici orice operațiune. Investighează API-ul Editor.js
                            
                            let res = response.blob();

                            // obiectul care va fi trimis către server
                            let objRes = {
                                user: RED.idContributor,
                                name: RED.nameUser,
                                uuid: uuid,
                                resF: res,                   // introdu fișierul ca blob
                                numR: urlObj.afterLastSlash, // completează obiectul care va fi trimis serverului cu numele fișierului
                                type: res.type,              // completează cu extensia
                                size: res.size               // completează cu dimensiunea 
                            };

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
                                    console.error('Promisiunea așteptată de Editor.js a eșuat cu următoarele detalii: ', error);
                                }
                            });
                        }

                        // ADU RESURSA DE PE WEB înainte de a o trimite în server
                        return fetch(decodedURL)
                            .then(validateResponseAndSend)
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
});

/**
 * Funcția este listener pentru modificările aduse conținutului din editor -> proprietatea `onChange` a obiectului `editorX`.
 * De fiecare dată când se modifică conținutul, actualizează `RED.content`.
 * Apelează `check4url()` pentru a verifica dacă este url
 * Apelează `pickCover()` pentru a genera galeria imaginilor care trebuie selectate.
 */
function changeContent () {
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
};

pubComm.on('delfile', (message) => {
    if (imagini.has(message)) {
        imagini.delete(message);
    }
    console.info("[form01adres.mjs] Am șters cu următoarele detalii: ", message);
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
};

/**
 * Funcția `creeazaTitluAlternativ` generează mecanismul prin care se pot adăuga titluri alternative celui principal
 * Folosește funcția `creeazaTitluAlternativHelper` pentru a genera structura DOM
 */
function creeazaTitluAlternativ () {
    // creează aceleași elemente de formular responsabile cu generarea unui titlu
    let insertie = document.querySelector('#langAlternative');                // punct de aclanșare în DOM pentru elementele generate dinamic
    let primulTitlu = document.querySelector('#titlu-res').id;                // extrage id-ul primului titlu pe baza căruia se vor construi restul în cele alternative
    let arrAlternative = document.querySelectorAll('#langAlternative > div'); // selectează toate elementele din titlurile alternative (dacă există)

    // verifică dacă există elemente ca titluri alternative
    if (arrAlternative.length !== 0) {
        let lastAlternativeTitle = Array.from(arrAlternative).slice(-1); // fă o referință către ultimul introdus în alternative
        let idOfLastElem = lastAlternativeTitle[0].id;                   // extrage id-ul acelui element
        let contorIdxIds = parseInt(idOfLastElem.slice(-1));             // din id, extrage numarul de incrementare (pentru primul element adăugat în alternative este 1).

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
};

globalThis.creeazaTitluAlternativ = creeazaTitluAlternativ; // trimite în global funcția

/**
 * Funcția `creeazaTitluAlternativHelper()` servește funcției `creeazaTitluAlternativ()`.
 * Are rolul de a genera întreaga structură DOM necesară inserării unui nou titlu alternativ.
 * Folosește funcția `selectOpts()` pentru a genera elementele `<option>`
 * @param {String} id Este id-ul elementului `<select>` căruia i se adaugă elementele `<option>`
 * @param {Object} insertie Este elementul la care se va atașa întreaga structură `<option>` generată
 */
function creeazaTitluAlternativHelper (id, insertie) {
    const divInputGroup        = new createElement('div', `${id}`,        ['input-group', 'langalt'],         {}).creeazaElem();
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
};

/* === LIMITAREA NUMĂRULUI DE CARACTERE === */
var descriere = document.querySelector('#descriereRed');
// descriere.addEventListener("input", (event) => {
//     const target = event.currentTarget;
//     const maxLength = target.getAttribute("maxlength");
//     const currentLength = target.value.length;

//     if (currentLength >= maxLength) {
//         console.log(`${maxLength - currentLength} chars left`);
//         // Afișează eroare în cazul în care nu s-a făcut încadrarea curriculară.
//         if ((currentLength - maxLength) >= 1) {
//             $.toast({
//                 heading: 'Probleme la descriere',
//                 text: `Ai depășit numărul de caractere cu ${currentLength - maxLength}`,
//                 position: 'top-center',
//                 showHideTransition: 'fade',
//                 icon: 'error'
//             });
//         }
//         // return console.log("Ai trecut de limita de 1000 de caractere!"
//     }
// });

/** 
 * IERARHIA DISCIPILINELOR -> sunt luate în considerare și minoritățile
 * În baza acestui obiect sunt create vizual elementele de selecție
*/
const mapCodDisc = new Map();

/*
// La `parent` va fi codul care este precizat în `data-*` de la `Aria/arii curriculare` din pagina HTML încărcată
// REGULĂ: array-urile disciplinelor nu trebuie să aibă coduri copiate de la array-ul altei discipline (produce ghosturi și orfani pe ecran)
// REGULĂ: pentru a se face colocarea sub-disciplinelor la o disciplină, cele din array trebuie să pornească cu un fragment de caractere identic.
*/
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
            parent: ["cds"], 
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
            nume:   "Educație socială", // Educație interculturală
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
            parent: ["cds"], 
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
            nume:   "Educație socială", // Educație pentru cetățenie democratică
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
            parent: ["cds"], 
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
            nume:   "Educație socială", // Educație economico-financiară
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
            parent: ["cds"], 
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
 * pentru a extrage numele complet al (meta)disciplinei pentru a forma un element de meniu.
 * Este folosită în `clbkIncarcDiscipline()`
 * @param {Object} `obidisc` Primește numărul clasei și {nivel: n, cod: obi.codsdisc} 
 * @return {String} numele complet al disciplinei
 */
function extragNumeDisciplina (obidisc) {
    let disciplina;
    mapCodDisc.forEach ((v, idx) => {
        // caută în clasa specificată de valoarea lui obidisc.nivel, înregistrarea în map de tip Array cu obiecte
        if (obidisc.nivel === idx) {
            // pentru array-ul de la indexul respectiv ai la dispoziție obiecte reprezentând fiecare câte o metadisciplină
            let obi;
            for (obi of v) {  
                // caută în array-ul codurilor disciplinelor arondate unei metadiscipline pe cea menționată în `obidisc.cod`        
                if (obi.coduriDiscipline.includes(obidisc.cod)) {
                    // dacă am găsit-o, returnează numele complet al disciplinei
                    disciplina = obi.nume;
                }
            }
        }
    });
    return disciplina;
};

/* === SELECTORUL DISCIPLINEI [Bootstrap 4 Vertical pills] === */
var niveluri   = document.querySelectorAll('.nivel'); // array de clase selectate
var discipline = document.querySelector('#discipline');

// Constituirea FRAGMENTULUI de DOM [Bootstrap 4 Vertical pills](https://getbootstrap.com/docs/4.0/components/navs/#javascript-behavior)
let multilevdisc = new createElement('section', 'multilevdisc', ['flex-column'], '').creeazaElem();
// let tablist      = new createElement('div', 'v-pills-tab', ['nav', 'flex-column', 'nav-pills'], {role: "tablist", 'aria-orientation': "vertical"}).creeazaElem(); // BS4
let tablist      = new createElement('nav', 'v-pills-tab', ['nav', 'nav-tabs', 'nav-fill'], {role: "tablist", 'aria-orientation': "vertical"}).creeazaElem(); // BS5
let tabcontent   = new createElement('div', 'v-pills-tabContent', ['tab-content'], '').creeazaElem(); // Aici apar disciplinele de nivel doi - calificările principalei
multilevdisc.appendChild(tablist);      // #v-pills-tab
multilevdisc.appendChild(tabcontent);   // #v-pills-tabContent
discipline.appendChild(multilevdisc);   // #multilevdisc

// SETURI DE DATE NECESARE GESTIONĂRII INTERFEȚEI (Vertical Pillbox)
const DISCMAP = new Map(); // primește disciplinele aferente unei clase ca înregistrare unică => {nivel: "5", 5: {art5: [], bio5: []}} generate de `structDiscipline({cl:event.target.value, data});` 
var disciplineSelectate = new Set(); // SETUL DISCIPLINELOR CARE AU FOST BIFATE pentru a fi afișate în vederea unei evidențe vizuale.
var discSelected = document.querySelector('#disciplineselectate'); // zona de afișare a disciplinelor care au fost selectate

/**
 * Funcția e listener pentru fiecare checkbox de disciplină. 
 * Odată selectată disciplina, aceasta va fi afișată într-o zonă de confirmare vizuală prin badge-uri Bootstrap
 * @param {NodeElement} `evt` fiind chiar elementul obiect
 */
function clickPeDisciplina (evt) {
    // face ca butonul de selecție să fie evidențiat doar dacă a fost apăsată vreo disciplină
    if (compSpecPaginator.classList.contains('d-none')) {
        compSpecPaginator.classList.remove('d-none');
    } else {
        compSpecPaginator.classList.add('d-block');
    }

    let e = evt || window.event,
        dcode = e.dataset.nume,
        nrclasa = dcode.split('').pop();

    // DACĂ în `disciplineSelectate` nu există disciplina, adaug-o în Set, apoi construiește un badge Bootstrap 5 care să indice numele disciplinei și clasa
    if (!disciplineSelectate.has(dcode)) {
        disciplineSelectate.add(dcode); // adaugă disciplina în `Set`-ul `disciplineSelectate`
        
        // Creează un checkbox BS5
        let labelBtn = new createElement('button', '', ['discbtn','disciplina', dcode, `cl${nrclasa}`, 'btn', 'btn-sm'], {type: "button"}).creeazaElem(e.value);
        let spanInfo = new createElement('span', '', ['badge'], {'data-nume': e.dataset.nume}).creeazaElem(nrclasa); // adaugă numărul care indică clasa pentru care a apărut disciplina (vezi bootstrap badges)
        
        labelBtn.appendChild(spanInfo);    // injectează span
        discSelected.appendChild(labelBtn); // adaugă button în discselected
    } else {
        disciplineSelectate.delete(dcode); // șterge disciplina din set 
        let elemExistent = document.querySelector(`.${dcode}`);
        if (elemExistent) {
            discSelected.removeChild(elemExistent);
        }
    }
};

globalThis.clickPeDisciplina = clickPeDisciplina; // Expune funcția în obiectul global pentru a putea fi accesată la momentul declanșării unui eveniment click

/**
 * Funcția este callback pentru checkbox de clasă (input type checkbox)
 * Încarcă disciplinele aferente clasei selectate în Map-ul `DISCMAP`.
 * Folosită de `alegeClasa()`.
 * Folosește `existaAria()` pentru a verifica dacă a fost selectată aria curriculară
 * Folosește `structDiscipline()` pentru a coloca discipline în seturi, dacă primele trei caractere de codare sunt identice
 * Folosește `extragNumeDisciplina()`
 * @param event 
 */
function clbkIncarcDiscipline (event) { 
    existaAria();   // Dacă nu a fost selectată aria, afișează eroare

    // constituie un obiect `data` din `data=*` pentru fiecare clasă::<input class="form-check-input nivel" type="checkbox" id="inlineCheckbox0...8" value="cl0...8"
    const data = JSON.parse(JSON.stringify(event.target.dataset));

    /*  Remodelează disciplinele pe seturi. Pentru fiecare se creează o cheie ce definește o adevărată metadisciplină. 
        Metadisciplina este generată din primele trei caractere ale atributului data=* aferent fiecărui checkbox de clasă din pagină. */
    const STRUCTURE = structDiscipline({cl:event.target.value, data}); // `event.target.value` care este un string de tipul "cl5"

    // încărcarea setului de discipline aferente la momentul bifării checkbox-ului clasei
    if (!DISCMAP.has(STRUCTURE.nivel)) {
        DISCMAP.set(STRUCTURE.nivel, STRUCTURE.rezultat);
    } // prin bifararea mai multor clase, se vor încărca progresiv toate datele aferente disciplinelor.

    // Date primare pentru constituirea interfeței
    let n         = STRUCTURE.nivel,       // 8, reprezentând clasa a VIII-a, de exemplu
        objSeturi = STRUCTURE.rezultat[n], // 16 seturi -> {art5: [], bio5: []} => fiecare va fi un element de nav (BS5)
        clsCodes  = STRUCTURE.claseDisc,   // lista tuturor codurilor de disciplină pentru o anumită clasă
        menuSet   = new Set(),             // set pentru a evita cazul dublării elementelor de meniu
        elemSet   = new Set();             // set cu disciplinele selectabile după ce s-a selectat metadisciplina

    /*
    === O CLASĂ ESTE DEBIFATĂ!!! ===
    ===> șterge-i disciplinele asociate (cazul posibilei selecții anterioare) 
    ===> șterge-i tag-urile asociate 
    */
    if(event.target.checked === false) {
        // șterge din ierarhie tot ce este atribuit cheii `STRUCTURE.nivel`
        if (DISCMAP.has(STRUCTURE.nivel)) {
            DISCMAP.delete(STRUCTURE.nivel);
        }

        // Generează array cu numele metadisciplinelor ce formează fiecare câte un buton din nav (BS5). De ex: ['art5', 'bio5']
        let cheimetadiscipline = Object.keys(objSeturi),
            metadisc,
            dcode;

        // găsește elementul <input checkbox> pentru fiecare disciplină, iar dacă există, selectează-l după clasă și șterge-l din structura DOM (elemente nav BS5)
        for (metadisc of cheimetadiscipline) {
            let elemExistent = document.querySelector(`.${metadisc}`); // codul metadisciplinei a fost pus drept clasă pentru selecție și în vederea modelării cu CSS (culoare, etc)
            tablist.removeChild(elemExistent); // șterge disciplina din array-ul elementelor DOM
        }

        // pentru fiecare cod care este și clasă de element, șterge din set, dar și din interfață
        for (dcode of clsCodes) {
            if (disciplineSelectate.has(dcode)) {
                disciplineSelectate.delete(dcode); // șterge disciplina din set 
                let elemExistent = document.querySelector(`.${dcode}`);
                if (elemExistent) {
                    discSelected.removeChild(elemExistent);
                }
            }
        }
        // CURĂȚĂ ELEMENTELE VERTICALE DE MENIU prin ștergerea din DOM
        tabcontent.innerHTML = '';
        // Șterge datele din info primare
        n = undefined; // nivelul gol
        objSeturi = null; // obiectele disciplinelor la `null`
    /* === CLASA ESTE BIFATĂ!!! === */
    } else {
        /* === AFIȘEAZĂ DISCIPLINELE ARONDATE UNEI (META)DISCIPLINE (buton meniu) === */
    
        // REVIEW: Ai un BigO logaritmic (code smell pentru refactor A.S.A.P.).
        //for #1 -> pentru fiecare metadisciplină din `objSeturi`, generează disciplinele arondate
        let prop;            
        for (prop in objSeturi) {
            // asigură-te că nu sunt introduse și proprietăți moștenite
            if (objSeturi.hasOwnProperty(prop)) {
                const setArr = objSeturi[prop]; // constituie un array de array-uri cu discipline

        //for #2 --> pentru fiecare obiect, care reprezintă un set de (meta)discipline ale unui clase selectate, creează butonul de meniu aferent
                let obi;
                for (obi of setArr) {
                    /* === PENTRU TOATE DISCIPLINELE ARONDATE LA ACEEAȘI METADISCIPLINĂ, SE CREEAZĂ UN SINGUR ELEMENT DE MENIU === */
                    // caută numele întreg aș disciplinei care este afișată în locul codului `prop`. Valorile sunt extrase din `mapCodDisc` -> funcția `extragNumeArie`
                    let numeDisciplina = extragNumeDisciplina({nivel: n, cod: obi.codsdisc}); // Ex: { codsdisc: "artViz0", nume: "Arte vizuale și abilități practice"}
                    var dicpanes;

                    // === Creează un element de meniu pentru fiecare disciplină sau metadisciplină :: BOOTSTRAP 5 ===
                    if (!menuSet.has(numeDisciplina)) {
                        menuSet.add(numeDisciplina);                            
                        // generează elementele de nav (BS5) care fac parte din setul disciplinelor afișate (`prop` are primele trei sau patru caractere ale unui set de discipline)
                        var serdiscbtn = new createElement('a', `v-pills-${prop}-tab`, ['nav-link', `${prop}`, `disc-nav-${prop}`, `cl${STRUCTURE.nivel}`], {"data-bs-toggle":"pill", href: `#v-pills-${prop}`, role: "tab", "aria-controls": `v-pills-${prop}`}).creeazaElem(numeDisciplina);
                        // creează div-ul care ține disciplinele afișate ca butoane
                        dicpanes = new createElement('div', `v-pills-${prop}`, ['tab-pane', 'fade', 'show'], {role: "tabpanel", "aria-labelledby": `v-pills-${prop}-tab`}).creeazaElem();
                        // afișarea disciplinelor arondate este gestionată de Boostrap pentru că se folosește un element de navigare vertical pillbox
                        
                        // înjectează-le în DOM
                        tablist.appendChild(serdiscbtn);
                    }

        //for #3 ---> Pune checkbox pe fiecare disciplină
                    let obidisc;
                    // for (obidisc of objSeturi[prop]) {
                    for (obidisc of setArr) {
                        if (!elemSet.has(obidisc.codsdisc)) {
                            elemSet.add(obidisc.codsdisc); // introdu în `Set`-ul `elemSet` fiecare disciplină
                            //console.log(obidisc); // Object { codsdisc: "lbcomRom5", nume: "Limba și literatura română" }

                            // AICI SE CREEAZĂ ELEMENTELE CHECKBOX PENTRU FIECARE DISCIPLINĂ APARȚINÂND DE O METADISCIPLINĂ, DACĂ E CAZUL (Bootstrap 5)
                            let inputCheckBx      = new createElement('input', obidisc.codsdisc, ['form-check-input', 'discinput'], {type: "checkbox", autocomplete: "off", "data-nume": obidisc.codsdisc, name: obidisc.codsdisc, value: obidisc.nume, onclick:"clickPeDisciplina(this)"}).creeazaElem();
                            let labelBtn          = new createElement('label', '', ['disclabel'], {for: obidisc.codsdisc}).creeazaElem(obidisc.nume);
                            labelBtn.textContent += ` `; //adaugă un spațiu între numar și textul butonului.
                            let clasaInfo         = new createElement('span', '', ['badge','badge-secondary'], {}).creeazaElem(n);
                            let divBtnGroupToggle = new createElement('div', '', ['disciplina', obidisc.codsdisc, 'form-switch', `cl${STRUCTURE.nivel}`], {}).creeazaElem(); // creează div (.form-switch) care ține checkbox-ul
                            
                            
                            labelBtn.appendChild(clasaInfo);    // injectează span-ul -> adaugă numărul care indică clasa pentru care a apărut disciplina (vezi bootstrap badges)
                            divBtnGroupToggle.appendChild(inputCheckBx); // injectează checkbox-ul
                            divBtnGroupToggle.appendChild(labelBtn); // injectează label-ul

                            dicpanes.appendChild(divBtnGroupToggle);

                            tabcontent.appendChild(dicpanes);
                        }
                    }
                }
            }
        }
    }
};

/** Este funcția folosită de forEach-ul pe niveluri */
function alegeClasa (nivel) {
    /* === CLICK PE CLASĂ (bifează clasa) === */
    nivel.addEventListener('click', clbkIncarcDiscipline);
};

/**
 * Pentru fiecare clasă bifată, adaugă un listener la `click`, 
 * care va genera input checkbox-uri în baza datelor din dataset-ul `data=*` al checkboxului de clasă
 * Parcurge un array al claselor existente (var niveluri) și pentru fiecare selectată (checked), 
 * generează discipline așezate vertical și inputbox-uri care arată ca butoane [Bootstrap 4 Vertical pills].
 */
niveluri.forEach(alegeClasa);

/**
 * Funcția are rolul să structureze sub-disciplinele în raport cu Disciplina mare la care sunt arondate
 * Disciplina va fi codificată extrăgând un fragment din numele care este precizat în valorile setului extras din data=*
 * Este apelată `clbkIncarcDiscipline()` pentru a genera structura de date `STRUCTURE` la momentul generării elementelor nav
 * @param {Object} discs Este un obiect cu toate disciplinele din setul data=* aferent unei clase. Semnătura: `cl: "cl5", data: {artDansc5: "Dans clasic",  artDesen5: "Desen"} }`
 * @returns {Object} {nivel: <Number::nivel>, rezultat: <Object>, claseDisc: <Array> }
 */
function structDiscipline (discs = {}) {
    let arrOfarr = Object.entries(discs.data); // transformă înregistrările obiectului în array-uri
    // arrOfarr va avea semnătura `[ "lbcomRom5", "Limba și literatura română" ], [ "lbcomOpt5", "Opțional" ]`
    
    // redu înregistrarea `arrOfarr` la un obiect consolidat de forma lui `obj`:
    let nivelNo;
    // doar dacă obiectul discs este populat, extrage numărul corespondent clasei!
    if (discs.cl) {
        nivelNo = discs.cl.split('').pop(); // scoate numărul aferent clasei!!!
    }
    // structura obiectului returnat
    const obj = {
        nivel: nivelNo,
        rezultat: {}
    };
    let claseDisc = new Set(), // constituie un Set cu discipline a cărui cod a fost reformulat pentru a putea coloca (vezi reducer, mai jos)
        dcodes    = new Set(); // constituir un Set cu toate codurile complete pentru disciplină. Este necesar pentru a gestiona ștergerea din meniu și taguri   

    obj.rezultat = arrOfarr.reduce((ac, elem, idx, arr) => {
        let classNameRegExp = /[a-z]+((\d)?|[A-Z])/gm; // orice caracter mic urmat, fie de un număr, fie de o literă mare
        // console.log('Fără shift numele clasei de disciplină arată așa: ', elem[0].match(classNameRegExp));
        
        dcodes.add(elem[0]); // adaugă codul atribuit numelui disciplinei

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

    obj.claseDisc = Array.from(dcodes);

    return obj;
};

/* === Prezentarea competențelor specifice în formă tabelară (DataTables) === */
var compSpecPaginator = document.querySelector('#actTable'); // ref la butonul care declanșează încărcarea competențelor specifice

// Pentru a preveni orice erori izvorâte din apăsarea prematură a butonului *Alege competetențe specifice*, am ales să-l ascund până când nu este selectată o disciplină

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
};

/* === MAGIE PE RÂNDUL CREAT DINAMIC === */
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
};

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
};

/**
 *  Funcția este event handler pentru click-urile de pe input checkbox-urile create dinamic pentru fiecare activitate.
 *  Gestionează ce se întâmplă cu datele din `activitatiFinal`
 *  Are acces la obiectul `XY`, care oferă datele rândului.
 *  Aici se verifică bifele și se creează un `Map` cu datele care trebuie introduse în obiectul `RED`
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
    }
};

globalThis.manageInputClick = manageInputClick;

function addMeDeleteMe () {
    let rowData = XY.getData();
};
/* === MAGIA ESTE GATA, APLAUZE!!! === */

/** 
 * Funcția are rolul de a genera tabelul competențelor specifice și este callback pentru 
 * pubComm.on('csuri', clbkTabelGenerator); din `disciplineBifate()`
 * @param {Array} csuri este un array cu obiecte competențe specifice
 */
function clbkTabelGenerator (csuri) { 
    // console.log('[form01] Csuri aduse de la server? ', csuri);

    const CSlist = JSON.parse(csuri); // transformă stringul în array JS
    
    // modelarea tabelului 
    // $(document).ready(function() {
        // console.log(globalThis.$.fn.DataTable);
        // var table = $('#competenteS').DataTable({
        let table = new DataTable('#competenteS', {
            responsive: true,
            processing: true,
            info: true,
            order: [[ 0, "asc" ]],
            dom: '<"toolbar">frtip',
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
                processing: "Procesez volumul de date...",
                info: "Afișez pagina _PAGE_ din _PAGES_",
                sProcessing:   "Procesează...",
                sLengthMenu:   "Afișează _MENU_ înregistrări pe pagină",
                sZeroRecords:  "Nu am găsit nimic - ne pare rău",
                sInfo:         "Afișate de la _START_ la _END_ din _TOTAL_ înregistrări",
                sInfoEmpty:    "Afișate de la 0 la 0 din 0 înregistrări",
                sInfoFiltered: "(filtrate dintr-un total de _MAX_ înregistrări)",
                sInfoPostFix:  "",
                sSearch:       "Caută:",
                sUrl:          "",
                oPaginate: {
                    sFirst:    "Prima",
                    sPrevious: "Precedenta",
                    sNext:     "Următoarea",
                    sLast:     "Ultima"
                }
            }
        });
        // Adăugarea de informații în toolbar
        $("div.toolbar").html('<strong>Pentru a încadra corect activitățile (cunoștințe, abilități, atitudini) fiecărei competențe, apăsați semnul plus.</strong>');

        // _TODO: În cazul în care te decizi să introduci fontawesome
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
    // });
    // modelarea tabelului END
};

/**
 * Funcția `diciplineBifate` este listener pentru butonul *Afișează competențele* - `#actTable`
 * Are rolul de a aduce competențele specifice pentru disciplinele bifate pe `csuri`.
 * Apelează funcțiile `clbkTabelGenerator()`
 * @return {Array} `values`
 */
function disciplineBifate () {
    // Ascunde restul elementelor de selecție pentru a elimina tentația de a reveni. Data Tables se dă peste cap
    document.getElementById("arrileC").style.display    = "none";
    document.getElementById("claseleSel").style.display = "none";
    document.getElementById("discsSel").style.display   = "none";

    // un array necesar pentru a captura valorile input checkbox-urilor bifate
    // let values = [];
    let values = Array.from(disciplineSelectate);
    values.forEach((elem) => {
        // === RED.discipline ===
        RED.discipline.push(elem);        
    });
    // console.log('[form01] Valorile care pleaca in server', values);

    // ori de câte ori va fi apăsată o disciplină, se emite apel socket către baza de date și extrage conform selecției, un subset  (ex: [ "matexpmed2", "comlbrom2" ]). 
    pubComm.emit('csuri', values);

    // const tabelComps = document.querySelector('#competenteS'); // selectează tabelul țintă
    
    /* === GENEREAZA TABELUL === */
    pubComm.on('csuri', clbkTabelGenerator);

    return values;
};

// globalThis.disciplineBifate = disciplineBifate; //Expunere în global

/**
 * Populează cu date reprezentând competențele specifice pentru disciplinele selectate
 * Listenerul pur și simplu are rolul de a apela funcția disciplineBifate();
 */
compSpecPaginator.addEventListener('click', (ev) => {
    disciplineBifate();
});

/* === MECANISMUL DE AVANS AL FORMULARULUI === */
let progressTxt1 = document.querySelector('#progressText1');
let progressTxt2 = document.querySelector('#progressText2');
let progressTxt3 = document.querySelector('#progressText3');
let progressTxt4 = document.querySelector('#progressText4');
let clsTxt1 = progressTxt1.classList;
let clsTxt2 = progressTxt2.classList;
let clsTxt3 = progressTxt3.classList;
let clsTxt4 = progressTxt4.classList;

let toast_tmpl = document.querySelector("#bs5toast").content; // creează o referință la template-ul pentru toast-uri (mesaje date utilizatorului <Boostrap 5 toast>)
let toast_cont = document.querySelector("#bs5toastcontainer");// punctul de inserție pentru toast-uri
        
/* === PAS 1 <hide> -> Avans PAS 2 <show> :: Colectare date din PAS 1 === */
function clbk_next_1 (evt) {
    evt.preventDefault();

    // Validare pe titlul resursei
    if (document.querySelector('#titlu-res').value == '') {
        // trecere pe Boostrap 5 Toast
        createBS5toast({
            tmpl: toast_tmpl,
            insertion: toast_cont,
            bs5toastcontainer: {
                classes: [],
                css: {
                    // zIndex: 11
                }
            },
            header: "Lipsește titlul",
            message: "Titlul resursei trebuie introdus"
        });
        return false;
    } else if (document.querySelector('#descriereRed').value == '') {
        // validare descriere
        createBS5toast({
            tmpl: toast_tmpl,
            insertion: toast_cont,
            bs5toastcontainer: {
                classes: [],
                css: {
                    //zIndex: 11
                }
            },
            header: "Lipsește descrierea",
            message: "Introdu descrierea resursei."
        });
    } else {
        pas1(); // funcție care culege datele introduse la pasul 1 (definită în form01adres.js)

        // curăță toate div-urile care au clasa toast
        deleteAllBS5toasts({insertion: toast_cont}); // este dIn main.mjs

        $('#doi').show(); // metodă ale lui jQuery - https://api.jquery.com/hide/
        $('#unu').hide(); // metodă ale lui jQuery - https://api.jquery.com/hide/

        // setarea avansului indicatorului vizual [progress bar->pas2]
        let resTxt1 = clsTxt1.toggle('active'); // avansul la pasul 2 scoate clasa => `resTxt1` = `false`
        // dacă a fost scoasă clasa, activeaz-o în pasul doi
        if (!resTxt1) {
            clsTxt2.toggle('active');
        }
    }
};
document.querySelector('#next-1').addEventListener('click', clbk_next_1);

/* === PAS 2 <hide> -> Întoarcere PAS 1 <show> :: Colectare date din PAS 2 === */
function clbk_next_2 () {
    // curăță toate div-urile care au clasa toast
    deleteAllBS5toasts({insertion: toast_cont}); // este dIn main.mjs

    pas2(); // funcție care culege datele introduse la pasul 2

    $('#doi').hide();
    $('#unu').show(); // Mergi înapoi la pasul unu al formularului

    // setarea avansului indicatorului vizual [pas1 <-]
    let resTxt1 = clsTxt1.toggle('active');
    if (resTxt1) {
        clsTxt2.toggle('active');
    }
}
document.querySelector('#next-2').addEventListener('click', clbk_next_2);

/* === PAS 2 <hide> -> Avans PAS 3 <show> :: Colectare date din PAS 2 === */
function clbk_next_3 () {
    // testează dacă a fost selectată vreo opțiune din selectul ariilor curriculare
    pas2(); // colectează datele de la pasul 2 al formularului.

    // console.log(`[form01adres.mjs::line 3228] Obiectul populat la acest moment `, RED);
    $('#doi').hide();
    $('#trei').show();

    // setarea avansului indicatorului vizual [-> pas3]
    let resTxt3 = clsTxt3.toggle('active');
    if (resTxt3) {
        clsTxt2.toggle('active');
    }
}
document.querySelector('#next-3').addEventListener('click', clbk_next_3);

/* === PAS 3 <hide> -> Întoarcere PAS 2 <show> === */
function clbk_next_4 () {

    $('#trei').hide();
    $('#doi').show(); // Mergi înapoi la pasul doi al formularului

    // setarea avansului indicatorului vizual [pas2 <-]
    let clsTxt2 = progressTxt2.classList;
    let resTxt2 = clsTxt2.toggle('active');

    let clsTxt3 = progressTxt3.classList;
    if (resTxt2) {
        clsTxt3.toggle('active');
    }
}
document.querySelector('#next-4').addEventListener('click', clbk_next_4);

/* === PAS 4 <show> -> PAS 3 <hide> :: Colectare date din PAS 3 === */
function clbk_next_5 () {
    pas3(); // colectează datele de la pasul 3 al formularului.

    $('#trei').hide();
    $('#patru').show(); //Mergi la pasul patru al formularului

    // setarea avansului indicatorului vizual [-> pas4]
    let clsTxt3 = progressTxt3.classList;
    let clsTxt4 = progressTxt4.classList;
    let resTxt4 = clsTxt4.toggle('active');
    if (resTxt4) {
        clsTxt3.toggle('active');
    }
}
document.querySelector('#next-5').addEventListener('click', clbk_next_5);

/* === PAS 4 <hide> -> Întoarcere la PAS 3 <show> === */
function clbk_next_6 () {
    
    $('#patru').hide();
    $('#trei').show();

    // setarea avansului indicatorului vizual [pas3 <-]
    let clsTxt3 = progressTxt3.classList;
    let resTxt3 = clsTxt3.toggle('active');

    let clsTxt4 = progressTxt4.classList;
    if (resTxt3) {
        clsTxt4.toggle('active');
    }        
}
document.querySelector('#next-6').addEventListener('click', clbk_next_6);

/* === COLECTAREA DATELOR DIN FORM === */

/**
 * === PAS 1 :: Colectare date ===
 * Funcția are rolul de a popula obiectul `RED` cu datele din formular de la `Pas 1`.
 */
function pas1 () {
    /* === RED.title [Gestionarea titlului și ale celor în alte limbi] === */
    var title = document.querySelector('#titlu-res').value; // titlul în limba română <input>
    RED.title = title;
    
    /* === RED.langRED [Stabilirea limbii RED-ului] === */
    var limbaRed = document.querySelector('#langRED'); // <select>
    var langRED = limbaRed.options[limbaRed.selectedIndex].value;
    RED.langRED = langRED;
    // verifică dacă nu cumva au fost adăugate titluri alternative. Dacă da, constituie datele necesare
    var titluriAltele = document.querySelector('#langAlternative'); // conținutul div-ului este generat dinamic de `creeazaTitluAlternativ()`

    /* === RED.titleI18n [Colectarea titlurilor care sunt în altă limbă] === */
    if (titluriAltele) {
        
        var inputs  = titluriAltele.querySelectorAll('input'); // Creează un NodeList cu toate elementele input
        var selects = titluriAltele.querySelectorAll('select'); // Creează un NodeList cu toate elementele select
        
        let index;
        for (index = 0; index < inputs.length; ++index) {
            // console.log(inputs[index]);
            var obi = {}; // obiect care să colecteze datele
            var nameInput = inputs[index].name; // Obține id-ul

            // Pentru fiecare input colectat, trebuie adusă și limba corespunzătoare din select-ul alăturat.
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

    /* === RED.emailContrib  [Adaugă emailul] === */
    var emailContrib  = document.querySelector('#emailContrib').value;
    RED.emailContrib  = emailContrib;

    /* === RED.idContributor [Adaugă id-ul utilizatorului care face propunerea] === */
    var idUser        = document.querySelector('#idUser').value;    
    RED.idContributor = idUser;

    /* === RED.nameUser      [Adaugă numele și prenumele utilizatorului] === */
    let autor         = document.querySelector('#autor').value;
    RED.nameUser      = autor;

    /* === RED.description   [Adaugă descrierea] === */
    RED.description   = descriere.value;

    /* === RED.rol           [Adaugă rolul pe care îl îndeplinește] === */
    var rol           = document.querySelector('#roluri');
    var rolOpt        = rol.options[rol.selectedIndex].value;
    RED.rol           = rolOpt;

    /* === RED.licenta       [Adaugă licența pentru care s-a optat] === */
    var licenta       = document.querySelector('#licente');
    var licOpt        = licenta.options[licenta.selectedIndex].value;
    RED.licenta       = licOpt;
};


/**
 * Funcția `existaAria` are rolul de a completa RED.arieCurriculară cu selecția făcută
 * În cazul în care nu există niciun element selectat, va afișa o eroare.
 */
function existaAria () {
    /* === RED.arieCurriculara <Array> === */
    // introducerea arie curiculare selectare din options
    var arie = document.getElementById('arii-curr'); // ref la <select>
    // RED.arieCurriculara = arie.options[arie.selectedIndex].value; // aduce doar ultima care a fost selectată

    // introdu un nivel de verificare compatibilitate. Dacă browserul nu are suport pentru .selectedOptions, optează pentru un nivel suplimentar de asigurare a compatibilității
    var optSelectate = arie.selectedOptions || [].filter.call(arie.options, option => option.selected);
    var valAriiSelectate = [].map.call(optSelectate, option => option.value);

    // Verifică dacă valorile din array-ul `RED.arieCurriculara`. Dacă valoarea există deja, nu o mai adăuga de fiecare dată când `pas2()` este executat.
    valAriiSelectate.forEach((valoare) => {
        // Verifica cu indexOf existența valorii. Dacă nu e, adaug-o!
        if (RED.arieCurriculara.indexOf(valoare) === -1) {
            RED.arieCurriculara.push(valoare);
        }
    });

    // Afișează eroare în cazul în care nu s-a făcut încadrarea curriculară.
    if (RED.arieCurriculara.length === 0) {
        createBS5toast({
            tmpl: toast_tmpl,
            insertion: toast_cont,
            bs5toastcontainer: {
                classes: [],
                css: {
                    // zIndex: 11
                }
            },
            header: "Fără curriculă",
            message: "Alege aria curriculară."
        });
    }
};
/**
 * === Pasul 2 :: Colectare date===
 * Funcția are rolul de a completa cu date obiectul `RED` cu datele de la `Pas2`.
 */
function pas2 () {
    // VERIFICĂ SELECTAREA ARIEI CURRICULARE
    existaAria();

    // === RED.level ===
    // Obținerea valorilor pentru clasele selectate
    var niveluriScolare = document.querySelector('#nivel');
    var noduriInputNiveluri = niveluriScolare.querySelectorAll('input');
    noduriInputNiveluri.forEach((input) => {
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

    // === RED.etichete colectează disciplinele ===
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
};

/* === ETICHETE :: Colectarea etichetelor === */
var tagsUnq   = new Set(RED.etichete); // construiește un set cu care să gestionezi etichetele constituite din tot ce a colectat `RED.etichete`
var newTags   = document.getElementById('eticheteRed'); // ref la textarea de introducere a etichetelor
var tagsElems = document.getElementById('tags');

/**
 * Funcția are rolul de a crea un element vizual de tip etichetă
 * @param {String} tag Numele tagului
 */
function createTag (tag) {
    // https://stackoverflow.com/questions/22390272/how-to-create-a-label-with-close-icon-in-bootstrap
    var spanWrapper = new createElement('h5', `${tag}`, ['tag'], null).creeazaElem();
    var tagIcon     = new createElement('span', '', ['fa', 'fa-tag', 'text-warning', 'mr-2'], null).creeazaElem();
    var spanText    = new createElement('span', '', ['text-secondary'], null).creeazaElem(`${tag}`);
    var aClose      = new createElement('a', '', null, null).creeazaElem();
    var aGlyph      = new createElement('i', '', ['remove', 'fa', 'fa-times', 'ml-1'], null).creeazaElem();

    aClose.appendChild(aGlyph);
    spanWrapper.appendChild(tagIcon);
    spanWrapper.appendChild(spanText);
    spanWrapper.appendChild(aClose);
    tagsElems.appendChild(spanWrapper);

    aClose.addEventListener('click', removeTag);
};

/* Rolul funcției este să permită ștergerea de etichete care nu sunt considerate utile sau care au fost introduse greșit */
function removeTag (evt) {
    evt.preventDefault();
    // console.log(`Obiectul eveniment`, evt, `target este`, evt.target, `iar current este`, evt.currentTarget);
    let targetElem = document.getElementById(evt.currentTarget.parentNode.id);
    // console.log(`Id-ul căutat este`, evt.currentTarget.parentNode.id);
    tagsUnq.delete(evt.currentTarget.parentNode.id);
    tagsElems.removeChild(targetElem);
    // console.log(`După ștergere setul este `, tagsUnq);
};

// Adaugă event pentru a detecta Enter in inputul de introducere
newTags.addEventListener('keypress', (evt) => {
    let charCodeNr = typeof evt.charCode == "number" ? evt.charCode : evt.keyCode;
    let identifier = evt.key || evt.keyIdentifier; // compatibilitate cu Safari
    if (identifier === "Enter" || charCodeNr === 13) {
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
    RED.etichete.forEach(createTag);
};

/**
 * Funcția are rolul să prelucreze un element `select` cu opțiunea `multiple` activă și valorile să le introducă ca etichete în `RED.etichete`
 * @param {Object} elem Este elementul DOM `select` din care se dorește returnarea unui array cu valorile celor selectate
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
};

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
};

// Afișează selectorul de imagini - https://codepen.io/kskhr/pen/pRwKjg
/**
 * Funcția este receptor pentru containerele imaginilor timbru
 * Funcția are rolul de a bifa și debifa imaginile din galeria celor expuse selecției.
 */
function clickImgGal (evt) {
    // selectează toate elementele care au clasa `.image-checkbox`
    let elementContainer = document.querySelectorAll('.image-checkbox'); // e o HTMLColection de div-uri care conțin fiecare următorii copii: img, input, svg

    elementContainer.forEach( (liveNode) => {
        // verifică dacă copilul img are clasa `image-checkbox-checked` și șterge-o
        let imgelem = liveNode.querySelector('img');
        if (imgelem.classList.contains(`image-checkbox-checked`)) {
            imgelem.classList.toggle(`image-checkbox-checked`);
        }

        // verifică dacă copilul svg are clasa `d-block` și șterge-o
        let svgelem = liveNode.querySelector('svg');
        if (svgelem.classList.contains('d-block')) {
            svgelem.classList.toggle('d-block');
        }

        // caută elementul input și setează-i `checked` la `false`
        let inputCollection = liveNode.querySelector('input[type=checkbox]');
        inputCollection.checked = false;
    });

    // this.classList.toggle('image-checkbox-checked');
    evt.target.classList.toggle('image-checkbox-checked');
    var checkbox = this.querySelector('input[type=checkbox]');
    // console.log(checkbox, checkbox.checked);

    if (checkbox.checked === false) {
        checkbox.checked = true;
        // verifică dacă mai sunt alte elemente input cu checked true
        this.querySelector('svg').classList.toggle('d-block');
    } else {
        this.querySelector('svg').classList.add('d-none');
        this.querySelector('svg').classList.toggle('d-block');
    }
};

var insertGal = document.getElementById('imgSelector');
/**
 * Funcția generează toate elementele ce poartă imagini pentru a putea fi bifată cea care devine coperta resursei.
 */
function pickCover () {
    insertGal.innerHTML = '';
    let img;
    for (img of imagini) {
        // console.log('imaginea selectată pentru copertă este: ', img);
        
        let container = new createElement('div', '', [`col-xs-4`, `col-sm-3`, `col-md-2`, `nopad`, `text-center`], null).creeazaElem();
        container.addEventListener('click', clickImgGal);
        let imgCheck  = new createElement('div', '', [`image-checkbox`], null).creeazaElem();
        
        let imgElem   = new createElement('img', '', [`img-responsive`], {src: `${img}`}).creeazaElem();
        let inputElem = new createElement('input', '', [`inputCheckGal`], {type: 'checkbox', value: `${img}`}).creeazaElem();
        let inputI    = new createElement('i', '', [`fas`, 'fa-check-circle', 'fa-3x', 'd-none'], null).creeazaElem();

        imgCheck.appendChild(imgElem);
        imgCheck.appendChild(inputElem);
        imgCheck.appendChild(inputI);
        container.appendChild(imgCheck);
        insertGal.appendChild(container);
    }
    return insertGal;
};

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

    // Completează RED.coperta cu linkul către imaginea bifată din galerie
    var inputCheckGal = document.querySelectorAll('.inputCheckGal');
    inputCheckGal.forEach(input => {
        if (input.checked) {
            RED.coperta = `${input.value}`;
        }
    });

    /* === colectarea etichetelor === */ 
    //_ TODO: Diferențiază-le pe cele care sunt redactate cu `[]` de celelalte. Cele cu `[]` trebuie să genereze în backend colecții!!! IMPLEMENTEAZĂ!
    let arrNewTags = RED.etichete.concat(...tagsUnq);
    alert(arrNewTags.join());
    // în cazul în care au fost introduse etichete în ultimul pas, se va înlocui array-ul ariginal cu cel generat din Set
    if (RED.etichete.length < arrNewTags.length) {
        RED.etichete = arrNewTags;
    }

    // colectează bibliografia
    RED.bibliografie = document.getElementById('bibliografie').value;
};

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
    //_ FIXME: Mai întâi verifică dacă are o imagine la copertă. Dacă nu are, generează una cu https://github.com/imsky/holder  https://www.cssscript.com/generating-custom-image-placeholders-with-pure-javascript-placeholder-js/
    closeBag(evt); // ÎNCHIDE BAG-ul după ce ai verificat că ai o imagine la copertă, fie că este a utilizatorului, fie că este generată
    pubComm.emit('red', RED); // vezi în routes.js -> socket.on('red', (RED) => {...
});

// aștept răspunsul de la server și redirecționez utilizatorul către resursa tocmai creată.
pubComm.on('confirm', (redID) => {
    // console.log("[form01adres::3599::pubcom.on('ingest')] Răspunsul de la server este: ", redID);
    if (redID) {
        setTimeout(() => {
            window.location = '/profile/' + redID;
        }, 2000);
    } else {
        setTimeout(() => {
            window.location = '/profile/resurse';
        }, 2000);
    }
});

