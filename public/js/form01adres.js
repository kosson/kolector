// colectorul datelor din form
var RED = {
    expertCheck: false,
    uuid: '',
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
    etichete: []
};

let imagini = new Set(); // un array cu toate imaginile care au fost introduse în document.

// este necesar pentru a primi uuid-ul generat la încărcarea unui fișier mai întâi de orice în Editor.js. Uuid-ul este trimis din multer
pubComm.on('uuid', (id) => {
    console.log('Pentru că a fost încărcat un fișier mai întâi de toate, a fost generat următorul uuid în server: ', id);
    RED.uuid = id;
});

/* ======== Integrarea lui EditorJS ======== https://editorjs.io */
const editorX = new EditorJS({
    placeholder: 'Introdu conținutul nou sau copiază-l pe cel pe care îl ai într-un material.',
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
    /** 
   * Available Tools list. 
   * Pass Tool's class or Settings object for each Tool you want to use 
   */ 
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
            },
            inlineToolbar: true
        },
        image: {
            class: ImageTool,
            config: {
                // endpoints: {
                //     byFile: 'http://localhost:8080/repo', // Your backend file uploader endpoint
                //     byUrl: 'http://localhost:8080/fetch', // Your endpoint that provides uploading by Url
                // }
                uploader: {
                    uploadByFile(file){
                        // obiectul trimis către server
                        let objRes = {
                            user: RED.idContributor,
                            name: RED.nameUser,
                            uuid: RED.uuid,
                            resF: file,
                            numR: file.name,
                            type: file.type
                        };  // dacă deja a fost trimisă o primă resursă, înseamnă că în RED.uuid avem valoare

                        // obiectul necesar lui Editor.js
                        let obj4EditorJS = {
                            success: '',
                            file: {
                                url: ''
                            }
                        };
                        /* ====== FUNCȚIA EXECUTOR ===== */
                        function executor (resolve, reject) {
                            console.log('Cand încarc un fișier, trimit următorul obiect: ', objRes);
                            // TRIMITE RESURSA către server
                            pubComm.emit('resursa', objRes);
                            // trimite obiectul către server
                            pubComm.on('resursa', (respObj) => {
                                // în cazul în care nu există nicio resursă, aceasta va fi creată și se va primi uuid-ul generat de server
                                if (!RED.uuid) {
                                    RED.uuid = respObj.uuid;
                                }
                                // console.log('În urma încărcării fișierului de imagine am primit de la server: ', respObj);
                                obj4EditorJS.success = respObj.success;
                                obj4EditorJS.file.url = respObj.file;

                                // constituie calea către imagine
                                console.log(respObj.file);
                                var urlAll = new URL(`${respObj.file}`);
                                var path = urlAll.pathname;
                                imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora. Necesar alegerii copertei

                                resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                            });
                        }
                        // construiește promisiunea
                        var promise = new Promise(executor);
                        // returnează rezultatul promisunii. Este ceea ce are nevoie Editor.js
                        return promise.then((obi) => {
                            // console.log(obi);
                            return obi;
                        }).catch((error) => {
                            if (error) throw error;
                        }); // returnează promisiunea de care are nevoie Editor.js
                    },
                    uploadByUrl(url){
                        url = decodeURIComponent(url); // Din nou m-a mușcat rahatul ăsta pentru URL-urile care sunt afișate în browser encoded deja... Flying Flamingos!!!
                        /**
                         * Funcția validează răspunsul în funcție de headere și stare
                         * @param {Object} response 
                         */
                        function validateResponse(response) {
                            if (!response.ok) {
                                throw Error(response.statusText);
                            }
                            return response;
                        }                        

                        // Extrage numele fișierului
                        // let nameF = url.split('/').pop().split('#')[0].split('?')[0];

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

                        // /**
                        //  * Funcția are rolul de a obține extensia fișierului de imagine
                        //  * @param {String} url Este chiar URL-ul de pe care va veni resursa
                        //  */
                        // function getExtension(url) {
                        //     var extStart = url.indexOf('.',url.lastIndexOf('/')+1);
                        //     if (extStart==-1) return false;
                        //     var ext = url.substr(extStart+1),
                        //         // finalul numelui extensiei începe după următoarele: end-of-string ori question-mark or hash-mark
                        //         extEnd = ext.search(/$|[?#]/);
                        //     return ext.substring (0,extEnd);
                        // }
                        // // extrage extensia fișierului
                        // let extF = getExtension(url);

                        // adu-mi fișierul de pe net!!!
                        return fetch(url)
                            .then(validateResponse)
                            .then(response => response.blob())
                            .then(response => {
                                // completează proprietățile necesare pentru a-l face `File` like.
                                response.lastModifiedDate = new Date();
                                response.name = fileNameFromUrl(decodeURI(url)); // WARNING: Bits like fucking shit!!!
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
                                // La imaginea https://kosson.ro/images/Autori/Doina_Hendre_Biro/identite_collective/SP01.jpg
                                // dă eroare de CORS.
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
                                    });
                                });
                                // returnează promisiunea așteptată de Editor.js
                                return promissed.then((obi) => {
                                    // console.log('Înainte de a returna promisiunea care se rezolvă cu obiectul: ', obi);
                                    return obi;
                                }).catch(error => {
                                    if (error) throw error;
                                });
                            })
                            .catch((error) => {
                                if (error) throw error;
                            });
                    }
                },
                captionPlaceholder: 'Legendă:',
                buttonContent: 'Selectează fișierul pe care vrei să-l încarci!'
            }
        }
    },
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
    ['tur', 'turcă']
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

/* === Constituirea selectorului pentru disciplină === */
var niveluri = document.querySelectorAll('.nivel');
var discipline = document.querySelector('#discipline');
niveluri.forEach(function (checkbox) {
    // pentru fiecare nivel de școlarizare apăsat, se vor genera butoane pentru fiecare disciplină
    checkbox.addEventListener('click', (event) => {
        // FIXME: La un moment dat, adu-mi dinamic datele, nu din `data=*`. Gândește-te la numărul de atingeri ale bazei. Merită?!
        var data = JSON.parse(JSON.stringify(event.target.dataset)); // constituie un obiect cu toate datele din `data=*` a checkbox-ului

        // verifică dacă nu cumva bifa nu mai este checked. În cazul acesta șterge toate disciplinele asociate
        if(event.target.checked === false) {
            // Pentru fiecare valoare din data, șterge elementul din discipline
            for (let [k, v] of Object.entries(data)) {
                let elemExistent = document.querySelector(`.${k}`); // k este codul disciplinei care a fost pus drept clasă pentru discipline
                discipline.removeChild(elemExistent); // șterge disciplina
            }
        } else {
            // dacă event.target.checked a fost bifat - avem `checked`, vom genera elementele checkbox.
            for (let [key, val] of Object.entries(data)) {
                // crearea checkbox - urilor
                let inputCheckBx      = new createElement('input', '', ['form-check-input'],      {type: "checkbox", autocomplete: "off", value: key}).creeazaElem();
                let labelBtn          = new createElement('label', '', ['btn', 'btn-success'],    {}).creeazaElem(val);
                let divBtnGroupToggle = new createElement('div',   '', ['btn-group-toggle', key], {"data-toggle": "buttons", onclick: "actSwitcher()"}).creeazaElem();          
                labelBtn.appendChild(inputCheckBx);
                divBtnGroupToggle.appendChild(labelBtn);
                discipline.appendChild(divBtnGroupToggle);
            }
        }
    });
});

/* === Prezentarea competențelor specifice === */
// Locul de inserție al tabelului
var compSpecPaginator = document.querySelector('#actTable');
// Pentru a preveni orice erori izvorâte din apăsarea prematură a butonului „Alege comptetențe specifice”, am ales să-l ascund până când nu este selectată o disciplină
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

var activitatiFinal = new Map();    // mecanism de colectare al activităților bifate sau nu
var competenteGen   = new Set();    // este un set necesar colectării competențelor generale pentru care s-au făcut selecții de activități în cele specifice
var competenteS     = new Set();    // este setul competențelor specifice care au avut câte o activitate bifată sau completată.
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

    // constituie un array al tuturor activităților arondate unei competențe specifice pentru a genera elementele li din acestea
    data.activitati.forEach((elem) => {
        // pentru fiecare activitate, generează câte un `<li>` care să fie in form check a cărui valoare este chiar textul activității
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
    var btnAdd    = $(`<buton type="button" id="${data.cod}-add" class="btn btn-warning">Adaugă o nouă activitate</div>`).wrap(`<div class="input-group-append">`);
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

    var ancoraID = document.getElementById(rowData._id); // FIXME:
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
/* ======== MAGIA ESTE GATA, APLAUZE pentru o mare măgărie, care... FUNCȚIONEAZĂ :)))))) ======= */

/**
 * Funcția `diciplineBifate` este listener pentru butonul „Alege competențele specifice”
 * Are rolul de a aduce competențele specifice pentru disciplinele bifate folosind socketurile.
 * Apelează funcțiile `tabelFormater(data)` și `activitatiRepopulareChecks()` la momentul când se apasă pe butonu plus
 * Încarcă și obiectul `RED` care colectează datele de formular: `RED.discipline` și `RED.etichete`
 */
function disciplineBifate () {
    // un array necesar pentru a captura valorile input checkbox-urilor bifate
    let values = [];

    // trimite în `values` valorile din input checkboxurile bifate în elementul părinte #discipline
    document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value}) => {
        values.push(value);
    });
    console.log(values);

    // ori de câte ori va fi apăsată o disciplină, se emite apel socket către baza de date și extrage conform selecției, un subset  (ex: [ "matexpmed2", "comlbrom2" ]). 
    pubComm.emit('csuri', values);

    // const tabelComps = document.querySelector('#competenteS'); // selectează tabelul țintă
    
    /* ==== GENEREAZA TABELUL ===== */
    pubComm.on('csuri', (csuri) => {        
        const CSlist = JSON.parse(csuri);   // transformă stringul în array JS
        
        // modelarea tabelului 
        $(document).ready(function() {
            var table = $('#competenteS').DataTable({
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
                ]
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

/* ====== Pasul 1 ====== */
/**
 * Funcția are rolul de a popula obiectul `RED` cu datele din formular de la `Pas 1`.
 */
function pas1 () {
    // Gestionarea titlului și ale celor în alte limbi
    var title = document.querySelector('#titlu-res').value; // titlul în limba română
    RED.title = title; // adaugă în obiect
    // Stabilirea limbii RED-ului
    var limbaRed = document.querySelector('#langRED');
    var langRED = limbaRed.options[limbaRed.selectedIndex].value;
    RED.langRED = langRED;
    // verifică dacă nu cumva au fost adăugate titluri alternative. Dacă da, constituie datele necesare
    var titluriAltele = document.querySelector('#langAlternative');
    if (titluriAltele) {
        // var inputs = titluriAltele..getElementsByTagName('input'); // modul tradițional de a crea un NodeList
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
    var email         = document.querySelector('#emailUser').value;    
    RED.idContributor = email;
    // Adaugă numele și prenumele utilizatorului
    let nameUser      = document.querySelector('#nameUser').value;
    RED.nameUser      = nameUser;
    // Adaugă descrierea
    var descriere     = document.querySelector('#descriereRed').value;
    RED.description   = descriere;
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
    // RED.arieCurriculara = [].map.call(optSelectate, option => option.value);

    // Verifică dacă valorile din array-ul `RED.arieCurriculara`. Dacă valoarea există deja, nu o mai adăuga de fiecare dată când `pas2()` este executat.
    valAriiSelectate.forEach((valoare) => {
        // Verifica cu indexOf existența valorii. Dacă nu e, adaug-o!
        if (RED.arieCurriculara.indexOf(valoare) === -1) {
            RED.arieCurriculara.push(valoare);
        }
    });

    if (RED.arieCurriculara.length === 0) {
        $('#currErr').toastmessage('showToast', {
            text: "Fă alegerea corectă în ariile curriculare. Este un element absolut necesar!!!",
            position: 'top-center', 
            type: 'error', 
            sticky: true,
            stayTime: 10000,
        });
    }

    // ==== RED.level ==== 
    // Obținerea valorilor pentru clasele selectate
    var niveluriScolare = document.querySelector('#nivel');
    var noduriInputNiveluri = niveluriScolare.querySelectorAll('input');
    noduriInputNiveluri.forEach(input => {
        if (input.checked && RED.level.indexOf(input.value) === -1) {
            console.log(input.value);
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

    // ==== RED.discipline RED.etichete ====
    // disciplinele și etichetele sunt încărcate din funcția `disciplineBifate()`; selectează toate checkbox-urile checked.
    document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach((element) => {
        if (RED.discipline.indexOf(element.value) === -1) {
            RED.discipline.push(element.value);
            RED.etichete.push(element.value);
        }
    });

    // ==== RED.activitati ====
    RED.activitati = [];
    function pushActivitate (value, key, map) {
        var arr = [value, key];
        RED.activitati.push(arr);
    }
    if (activitatiFinal) {
        activitatiFinal.forEach(pushActivitate);
    }
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

function pas3 () {
    // introducerea grupurilor țintă selectare din options
    var grup = document.getElementById('valid-grup');
    RED.grupuri = getMeSelected(grup, false);
    var domeniu = document.getElementById('valid-domeniu');
    RED.domeniu = getMeSelected(domeniu, true);
    var functii = document.getElementById('valid-functii');
    RED.functii = getMeSelected(functii, true);
    var demersuri = document.getElementById('valid-demersuri');
    RED.demersuri = getMeSelected(demersuri, false);
    var spatii = document.getElementById('valid-spatii');
    RED.spatii = getMeSelected(spatii, true);
    var invatarea = document.getElementById('valid-invatarea');
    RED.invatarea = getMeSelected(invatarea, true);
    RED.dependinte = document.getElementById('dependinte').value;
    RED.bibliografie = document.getElementById('bibliografie').value;

    var tagsElems = document.getElementById('tags');
    RED.etichete.forEach((tag) => {
        var elemBadge = new createElement('span', '', ['badge', 'badge-info', 'm-1'], null).creeazaElem(`${tag}`);
        tagsElems.appendChild(elemBadge);
    });
    
}

/**
 * Funcția are rolul să prelucreze un element select cu opțiunea multiple activă
 * @param {Object} elem Este elementul DOM select din care se dorește returnarea unui array cu valorile celor selectate
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
    pubComm.emit('closeBag', true);
    pubComm.on('closeBag', (mesaj) => {
        console.log(mesaj);
    });
}


// Afișează selectorul de imagini - https://codepen.io/kskhr/pen/pRwKjg
/**
 * Funcția are rolul de a bifa și debifa imaginile din galeria celor expuse selecției.
 */
function clickImgGal ()  {
    $(".image-checkbox").each(function () {
        if ($(this).find('input[type="checkbox"]').first().attr("checked")) {
            $(this).addClass('image-checkbox-checked');
        }
        else {
            $(this).removeClass('image-checkbox-checked');
        }
    });
    $(this).toggleClass('image-checkbox-checked');
    var checkbox = $(this).find('input[type="checkbox"]');
    checkbox.prop("checked",!checkbox.prop("checked"));

    $(this).find('svg').toggleClass(function () {
        if (checkbox.prop("checked")) {
            return 'd-block';
        } else {
            return 'd-none';
        }
    });

    if(checkbox.prop('checked')){
        $(this).find('svg').removeClass('d-none');
        $(this).find('svg').toggleClass('d-block');
    }
}
var insertGal = document.getElementById('imgSelector');
/**
 * Funcția generează toate elementele ce poartă imagini pentru a fi bifată cea care devine coperta resursei.
 */
function pickCover () {
    insertGal.innerHTML = '';
    for (let img of imagini) {
        console.log(img);    
        
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
 * Funcția are rolul de a colecta care dintre imagini va fi coperta.
 */
function pas4 () {
    var inputCheckGal = document.querySelectorAll('.inputCheckGal');
    inputCheckGal.forEach(input => {
        if (input.checked) {
            RED.coperta = input.value;
        }
    });
    var newTags = document.getElementById('eticheteRed');
    var arrNewTags = newTags.value.split(',');
    arrNewTags.forEach((tag) => {
        RED.etichete.push(tag);
    });
}

// fă o referință către butonul de trimitere a conținutului
var saveContinutRes = document.querySelector('#continutRes');
// la click, introdu conținutul în obiectul marea RED.
saveContinutRes.addEventListener('click', function (evt) {
    evt.preventDefault();
    editorX.save().then((content) => {
        RED.content = content;
        pickCover();
    }).catch((e) => {
        console.log(e);
    });
});

/* ========== TRIMITEREA DATELOR FORMULARULUI ============== */
var submitBtn = document.querySelector('#submit');
submitBtn.addEventListener('click', (evt) => {
    pas4();
    closeBag(evt);
    pubComm.emit('red', RED);
    // aștept răspunsul de la server:
    pubComm.on('red', (red) => {
        console.log(red);
        window.location.href = '/profile/resurse/' + red._id;
    });
});