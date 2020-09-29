import {createElement, decodeCharEntities, datasetToObject} from './main.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

var pubComm = io('/redcol', {
    query: {['_csrf']: csrfToken}
});

var primare = document.getElementById('primare'); // zona în care se încarcă ultimele resurse contribuite
const codSeturiDisc = {
    "art": {
        "0": "Arte",
        "1": "Arte",
        "2": "Arte",
        "3": "Arte",
        "4": "Arte"
    },
    "bio": {
        "5": "Biologie",
        "6": "Biologie",
        "7": "Biologie",
        "8": "Biologie"
    },
    "cds": {
        "5": "Curriculum la decizia școlii",
        "6": "Curriculum la decizia școlii",
        "7": "Curriculum la decizia școlii",
        "8": "Curriculum la decizia școlii"
    },
    "chim": {
        "7": "Chimie",
        "8": "Chimie"
    },
    "cons": {
        "5": "Consiliere",
        "6": "Consiliere",
        "7": "Consiliere",
        "8": "Consiliere"
    },
    "dansc": {
        "5": "Dans clasic",
        "6": "Dans clasic",
        "7": "Dans clasic",
        "8": "Dans clasic"
    },
    "desen": {
        "5": "Desen",
        "6": "Desen",
        "7": "Desen",
        "8": "Desen"
    },
    "dezv": {
        "0": "Dezvoltare personală",
        "1": "Dezvoltare personală",
        "2": "Dezvoltare personală"
    },
    "edar": {
        "4": "Dans, ritmică"
    },
    "edart": {
        "1": "Educație artistică"
    },
    "edciv": {
        "3": "Educație civică",
        "4": "Educație civică"
    },
    "edmz": {
        "1": "Instrument, teorie",
        "2": "Instrument, teorie",
        "3": "Instrument, teorie",
        "4": "Instrument, teorie"
    },
    "edmuz": {
        "5": "Educație muzicală",
        "6": "Educație muzicală",
        "7": "Educație muzicală",
        "8": "Educație muzicală"
    },
    "edpl": {
        "5": "Educație plastică",
        "6": "Educație plastică",
        "7": "Educație plastică",
        "8": "Educație plastică"
    },
    "edusoc": {
        "5": "Educație socială",
        "6": "Educație interculturală",
        "7": "Educație ptr. cetățenie",
        "8": "Educație ptr. cetățenie"
    },
    "ellat": {
        "7": "Elem. lb. latină"
    },
    "fiz": {
        "6": "Fizică",
        "7": "Fizică",
        "8": "Fizică"
    },
    "fizic": {
        "0": "Educație fizică",
        "1": "Educație fizică",
        "2": "Educație fizică",
        "3": "Educație fizică",
        "4": "Educație fizică",
        "5": "Educație fizică",
        "6": "Educație fizică",
        "7": "Educație fizică",
        "8": "Educație fizică"
    },
    "fizicp": {
        "1": "Pregătire sportivă",
        "2": "Pregătire sportivă",
        "3": "Pregătire sportivă",
        "4": "Pregătire sportivă"
    },
    "geo": {
        "4": "Geografie",
        "5": "Geografie",
        "6": "Geografie",
        "7": "Geografie",
        "8": "Geografie"
    },
    "instr": {
        "5": "Instrument principal",
        "6": "Instrument principal",
        "7": "Instrument principal",
        "8": "Instrument principal"
    },
    "ist": {
        "4": "Istorie",
        "5": "Istorie",
        "6": "Istorie",
        "7": "Istorie",
        "8": "Istorie"
    },
    "jocmi": {
        "3": "Joc și mișcare",
        "4": "Joc și mișcare"
    },
    "lb": {
        "3": "Limbă modernă",
        "4": "Limbă modernă"
    },
    "lbcom": {
        "0": "Comunicare în limba română",
        "1": "Comunicare în limba română",
        "2": "Comunicare în limba română",
        "3": "Limba și literatura română",
        "4": "Limba și literatura română",
        "5": "Limba și literatura română",
        "6": "Limba și literatura română",
        "7": "Limba și literatura română",
        "8": "Limba și literatura română"
    },
    "lbmat": {
        "0": "Comunicare în limba maternă",
        "1": "Comunicare în limba maternă",
        "2": "Comunicare în limba maternă",
        "3": "Limba și literatura maternă",
        "4": "Limba și literatura maternă",
        "5": "Limba și literatura maternă",
        "6": "Limba și literatura maternă",
        "7": "Limba și literatura maternă",
        "8": "Limba și literatura maternă"
    },
    "lbmod": {
        "0": "Comunicarea în limba modernă",
        "1": "Comunicarea în limba modernă",
        "2": "Comunicarea în limba modernă"
    },
    "lbmod1": {
        "5": "Limba modernă 1",
        "6": "Limba modernă 1",
        "7": "Limba modernă 1",
        "8": "Limba modernă 1"
    },
    "lbmod2": {
        "5": "Limba modernă 2",
        "6": "Limba modernă 2",
        "7": "Limba modernă 2",
        "8": "Limba modernă 2"
    },
    "mate": {
        "0": "Matematică și explorarea mediului",
        "1": "Matematică și explorarea mediului",
        "2": "Matematică și explorarea mediului",
        "3": "Matematică",
        "4": "Matematică"    
    },
    "mat": {
        "5": "Matematică",
        "6": "Matematică",
        "7": "Matematică",
        "8": "Matematică"
    },
    "model": {
        "5": "Modelaj",
        "6": "Modelaj",
        "7": "Modelaj",
        "8": "Modelaj"
    },
    "muzmi": {
        "0": "Muzică și mișcare",
        "1": "Muzică și mișcare",
        "2": "Muzică și mișcare",
        "3": "Muzică și mișcare",
        "4": "Muzică și mișcare"
    },
    "opt": {
        "0": "Opționale",
        "1": "Opționale",
        "2": "Opționale",
        "3": "Opționale",
        "4": "Opționale"
    },
    "pfiz": {
        "5": "Pregătire fizică",
        "6": "Pregătire fizică",
        "7": "Pregătire fizică",
        "8": "Pregătire fizică"
    },
    "piaux": {
        "5": "Pian com./aux.",
        "6": "Pian com./aux.",
        "7": "Pian com./aux.",
        "8": "Pian com./aux."
    },
    "pictr": {
        "5": "Pictură",
        "6": "Pictură",
        "7": "Pictură",
        "8": "Pictură"
    },
    "rel": {
        "0": "Religie",
        "1": "Religie",
        "2": "Religie",
        "3": "Religie",
        "4": "Religie",
        "5": "Religie",
        "6": "Religie",
        "7": "Religie",
        "8": "Religie"
    },
    "ritm": {
        "5": "Ritmică",
        "6": "Ritmică",
        "7": "Ritmică",
        "8": "Ritmică"
    },
    "st": {
        "2": "Științe ale naturii",
        "3": "Științe ale naturii",
        "4": "Științe ale naturii"
    },
    "tec": {
        "5": "Ed. tehnologică/TIC",
        "6": "Ed. tehnologică/TIC",
        "7": "Ed. tehnologică/TIC",
        "8": "Ed. tehnologică/TIC"
    },
    "tsd": {
        "5": "Teorie/Solfegiu/Dicteu",
        "6": "Teorie/Solfegiu/Dicteu",
        "7": "Teorie/Solfegiu/Dicteu",
        "8": "Teorie/Solfegiu/Dicteu"
    }
}; // matcher între codul de set de discipline și numele setului. Este necesar pentru a genera drop-down-urile dseturilor de discipline

/* === TRATAREA DISCIPLINELOR */
// punctul din DOM unde vor fi injectate disciplinele
var discipline            = document.querySelector('#discipline');          // toate disciplinele unei clase
var discSelected          = document.querySelector('#disciplineselectate'); // zona de afișare a disciplinelor care au fost selectate
var divBtnCautareFatetata = document.getElementById('btnCautaFatetat');     // referință către div-ul gazdă al butonului de căutare fațetată
var searchRes             = document.querySelector('#searchRes');
var butonCautareFatetata; // referință către butonul de căutare
var disciplineSelectate   = new Set(); // SETUL DISCIPLINELOR CARE AU FOST SELECTATE

// Construiește un dicționar de seturi pentru că este posibil ca în viitor să fie adăugate și alte criterii de selecție cum ar fi metrici.
// Numele proprietăților să fie cel al câmpurilor din modelul de date
var searchSets = {
    etichete: disciplineSelectate
};

// Atașează listeneri pe fiecare element din meniu
var clase = document.getElementsByClassName('dropdown-item'), i;
for (i of clase) {
    i.addEventListener('click', structureAriAndDiscs);
}

/* === Constituirea selectorului pentru disciplină === */
const DISCMAP = new Map(); // colector de structuri {nivel: "5", 5: {art5: [], bio5: []}} generate de `structDiscipline({cl:event.target.value, data});`

/**
 * Funcția este un helper pentru eliminarea tuturor
 * elementelor copil a unei rădăcini pasate drept parametru
 * @param element 
 */
function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Funcția trebuie să genereze clasele și să atașeze un eveniment pentru 
 * încarcarea disciplinelor aferente fiecărui element copil
 * @param {Object} elem este elementul pe care a fost atașat listener-ul
 */
function structureAriAndDiscs (elem) {
    // #1 șterge elementele anterioare
    removeAllChildren(discipline); // alternativă la [discipline.innerHTML = '';]

    // #2 creează un obiect din dataset-ul aferent elementului din dropdown-ul claselor
    const clsdata = {...elem.target.dataset}; // constituie un obiect din setul data-*
    // #3 generează o structură consolidată a datelor prin generarea subseturilor disciplinelor.
    const STRUCTURE = structDiscipline({cl:elem.target.id, clsdata}); // event.target.id este id-ul elementului din dropdown-ul claselor:: id="cl5"
    
    // Info primare pentru constituire interfață
    let n = STRUCTURE.nivel; // -> 8, de exemplu
    let objSeturi = STRUCTURE.rezultat; //16 seturi -> {art5: [], bio5: []}

    // #4 populează progresiv structura de date
    if (!DISCMAP.has(n)) {
        DISCMAP.set(n, objSeturi);
    }

    // #5 generează UI pentru elementele corespondente `STRUCTURE.nivel`
    generateUX4discs(DISCMAP.get(n), n);
}

/**
 * Funcția are rolul de a genera toate elementele vizuale necesare pentru structurarea
 * disciplinelor arondate ariilor curiculare
 * Este apelată de `structureAriAndDiscs`
 * @param {Object} dataset este setul de date
 */
function generateUX4discs (dataset, nocls) {
    // console.log('Am creat din obiectul dataset: ', Object.entries(dataset));
    const tdata = Object.entries(dataset);
    // rând pe rând sunt create toate elementele achor pentru fiecare disciplină în parte
    let numeSet, arrSet;
    for ([numeSet, arrSet] of tdata) {

        /* === CAZUL O DISCIPLINĂ, UN BUTON :: creezi câte un buton === */
        if (arrSet.length === 1) {
            let butn = new createElement('a', arrSet[0].codsdisc, ['btn', 'btn-sm', 'btn-warning', 'facet', 'mansonry', arrSet[0].codsdisc], {href: "#", role: "button"}).creeazaElem(arrSet[0].nume);
            butn.addEventListener('click', clickPeDisciplina); // atașează listener pentru tratarea selecție pe click
            discipline.appendChild(butn);
        } else {
            /* === CAZUL SETURILOR DE DISCIPLINE :: creezi câte un dropdown === */
            let drpDwn = new createElement('div', '', ['btn-group', 'dropright', 'facet'], {}).creeazaElem();
            let origNumeSet = numeSet;
            numeSet = codSeturiDisc[numeSet][nocls]; // Adu numele setului de discipline și înlocuiește codul setului
            // Construiește elementele Bootstrap pentru seturi și discipline individuale
            let btnDrpDwn = new createElement('button', '', ['btn', 'btn-sm', 'btn-warning', 'dropdown-toggle'], {'data-toggle': 'dropdown', 'aria-haspopup':'true', 'aria-expanded': 'false'}).creeazaElem(numeSet);
            let menuDrpDwn = new createElement('div', '', ['dropdown-menu', 'drpdwnmenucontent'], {}).creeazaElem();
            let disciplina;
            // în cazul unui set, creează câte un drop down
            for (disciplina of arrSet) {
                let aelem = new createElement('a', disciplina.codsdisc, ['dropdown-item', 'facet', disciplina.codsdisc], {'href': '#'}).creeazaElem(disciplina.nume);
                aelem.addEventListener('click', clickPeDisciplina); // atașează listener pentru tratarea selecție pe click
                menuDrpDwn.appendChild(aelem);
            }
            // asamblează construcția DOM și atașează la `discipline`
            btnDrpDwn.appendChild(menuDrpDwn);
            drpDwn.appendChild(btnDrpDwn);
            discipline.appendChild(drpDwn);
        }
    }
}

/**
 * Funcția e listener pentru fiecare element disciplină. Odată selectată disciplina, aceasta va fi afișată într-o zonă de selecție
 * Afișarea în zona de selecție implică automat adăugarea codului disciplinei într-un array
 * Adaugă un listener pentru stergere care artrage după sine și ștergerea keyword-ului din array-ul de secție
 * La primul element care apare în array-ul de selecție, apare un buton de căutare, care va trimite interogare în server către Mongooge pentru deschiderea unui cursor
 * @param {NodeElement} `evt` fiind chiar elementul obiect
 */
function clickPeDisciplina (evt) {
    // evt.preventDefault(); // este necesar pentru că la click pe disciplină individuală, nu pe set, anchor va pleca pe `#` și va face reflow -> interfața dispare

    let id = evt.target.id || evt.target.parentElement.id; // este cazul în care userul dă click pe `span`, nu pe elementul părinte `button`, care are id
    
    // injectează butonul de căutare fațetată dacă Set-ul este 0
    if (disciplineSelectate.size === 0) {
        let btnSearchF = new createElement('button', 'searchF', ['btn', 'btn-success'], {}).creeazaElem("Caută"); // TODO: Funcția listener pentru căutare fațetată
        divBtnCautareFatetata.appendChild(btnSearchF);
        btnSearchF.addEventListener('click', getPagedResults);
        butonCautareFatetata = document.getElementById('searchF'); // fă referința la butonul de căutare după ce l-ai creat.
    }

    // DACĂ NU EXISTĂ CODUL ÎN `disciplineSelectate`, adaugă-l!
    if (disciplineSelectate.has(id) == false) {
        disciplineSelectate.add(id); // adaugă disciplina în `Set`-ul `disciplineSelectate`
        
        // creează butonul discilinei pe care a selectat-o user-ul
        let aTag = new createElement('a', '', ['disctag', id, `svg${id}`], {href: '#', "data-disc": id}).creeazaElem(); // `id` este necesar în clase pentru a fi colorat specific clasei
        let pTag = new createElement('p', '', [], {}).creeazaElem(evt.target.textContent);
        let faRemove = new createElement('i', id, ['iconATag', 'fa', 'fa-times'], {}).creeazaElem(); // pasezi id-ul ca informație în svg-ul generat de Fontawesome
        aTag.appendChild(pTag);
        aTag.appendChild(faRemove);
        aTag.addEventListener('click', delKeyword); // adaugă listener de ștergere keyword
        discSelected.appendChild(aTag);
    }
}

/**
 * Funcția este listener pentru butoanele disciplinelor care au fost alese în scopul eliminării din DOM
 * @param evt Object tip eveniment
 */
function delKeyword (evt) {
    // setează id-ul elementului pentru ștergere
    let id = evt.target.id || evt.target.parentElement.id; // când se dă click, fie pe `path`, fie pe `svg` (generat de Fontawesome).
    let tgt = document.querySelector(`.svg${id}`); // țintește elementul `achor` prin țintirea unei clase construite special pentru a fi țintită aici (`svg${id}`)

    // șterge din Set-ul disciplinelor selectate
    if (disciplineSelectate.has(id) == true) {
        disciplineSelectate.delete(id); // șterge din Set
        
        if (disciplineSelectate.size === 0) {
            // în cazul în care ai șters și ultima disciplină din selecție, șterge și butonul de căutare
            butonCautareFatetata.remove();
        }

        discSelected.removeChild(tgt);
    }
}

/* === SETAREA OBIECTULUI DE CĂUTARE === */
let pageNr = 0, limitNr = 10, skipNr = 0;
const selectObi = {
    query: {
        projection: {},
        select: '',
        exclude: [],
        sortby: [],
        sortDefaultField: 'date'
    },
    pageNr: pageNr,
    limitNr: limitNr,
    skipNr: skipNr
};

/**
 * Funcția are rolul de a adăuga obiectului `selectObi.query.select` o proprietate nouă cu un array de valori după care se va face căutarea.
 * Numele proprietății este cel al unei proprietăți din dicționarul `searchSets`, iar valoarea este setul transformat în array
 * @param numeSet referință către un obiect `Set` care culege cuvinte cheie ce vor fi utilizate în căutare (valoarea din dicționarul `searchSets`)
 * @param numeCamp este un `String` cu numele unui câmp din modelul de date pentru care se face interogarea (cheia din dicționarul `searchSets`)
 */
function dataAggregator4Search (numeCamp, numeSet) {
    // decorarea obiectului de selecție adăugând câmpurile de interes
    // console.log('[redincredall] disciplinele selectate din set sunt ', [...numeSet]);
    // #1 Selecție discipline!
    if (numeSet.size > 0) {
        selectObi.query.projection[numeCamp] = Array.from(numeSet);
    }
}

/**
 * === BUTONUL DE CĂUTARE FAȚETATĂ === *
 * Funcția are rol de callback pentru evenimentul `click` al butonului de căutare fațetată
 * Este apelată de `pgNavRequest` și lister pentru butonul `Caută`.
 * @param evt obiectul eveniment al butonului de căutare fațetată
 */
function getPagedResults (evt) {
    // pentru fiecare proprietate din dicționarul `searchSets`, apelează `dataAggregator4Search` pentru a completa obiectul de căutare trimis serverului
    let prop, val;
    for ([prop, val] of Object.entries(searchSets)) {
        dataAggregator4Search(prop, val);
    }
    // console.log('[redincredall] obiectul care pleacă în server este: ', selectObi);

    // TODO: afișează un set de câmpuri pe care userul să le aleagă pentru a aduce un subset din întreaga înregistrare. Acum, hard codată
    selectObi.query.select = 'title autori description etichete';

    // Evenimentul folosit va fi `pagedRes` pentru aducerea resurselor paginate
    pubComm.emit('pagedRes', selectObi);
}

/* === TRATAREA DATELOR CU RESURSE PAGINATE === */
pubComm.on('pagedRes', function clbkPagedRes (dataset) {
    removeAllChildren(primare);
    paginare(dataset);
});

var currentPg = 1; // este pagina curentă. Actualizat din `paginare()`

// Această funcție va modifica `pageNr` și `skipNr` și va apela `getPagedResults`
// pentru fiecare buton apăsat din navigatorul de paginare a setului de rezultate de căutare
function pgNavRequest (evt) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare
    // console.log("[redincredall.mjs] obiectul evt este ", evt.target.innerText);
    selectObi.skipNr = parseInt(evt.target.innerText) * parseInt(limitNr);  // setează noua valoare a lui `skipNr`
    selectObi.pageNr = parseInt(evt.target.innerText);            // va fi valoarea paginii pentru care s-a apăsat butoul navigatorului
    // console.log("[redincredall.js] noile valori ale lui skipNr și pageNr sunt: ", skipNr, pageNr);
    // console.log("[redincredall.js] În server va pleca pentru o pagină nouă de date ", selectObi);
    getPagedResults();
}

// varianta pentru prev
function prevPgNavRequest (evt) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare
    let dataset = evt.target.dataset;
    let pageP = dataset.pg; // trebuie să fie `prev`
    selectObi.skipNr = parseInt(currentPg--) * parseInt(limitNr);  // setează noua valoare a lui `skipNr`
    selectObi.pageNr = parseInt(currentPg--);            // va fi valoarea paginii pentru care s-a apăsat butoul navigatorului
    // console.log("[redincredall.js] noile valori ale lui skipNr și pageNr sunt: ", skipNr, pageNr);
    // console.log("[redincredall.js] În server va pleca pentru o pagină nouă de date ", selectObi);
    getPagedResults();
}

// varianta pentru next
function nextPgNavRequest (evt) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare
    let dataset = evt.target.dataset;
    let pageP = dataset.pg; // trebuie să fie `next`
    selectObi.skipNr = parseInt(currentPg++) * parseInt(limitNr);  // setează noua valoare a lui `skipNr`
    selectObi.pageNr = parseInt(currentPg++);            // va fi valoarea paginii pentru care s-a apăsat butoul navigatorului
    getPagedResults();
}

let tplRec = document.querySelector('#record').content;
let tplNav = document.querySelector('#paginator').content;
/**
 * Funcția are rolul de a crea zona de afișare a rezultatelor.
 * Este apelată de callback-ul butonului `Caută`
 */
function paginare (dataset) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare

    /* === REZULTATELE DE CĂUTARE === */
    // #2 Pentru fiecare înregistrare, introdu în div-ul `searchRes` template-ul populat
    let rec, result, title, titleLnk;
    for (rec of Object.entries(dataset.date)) {
        // console.log("[redincredall] am următorul set de informații din înregistrare ", rec);
        result = tplRec.cloneNode(true); // ref la template

        // Generează titlul
        title = result.querySelector(`.title`);
        titleLnk = new createElement('a', '', [], {href: `/resurse/${rec[1]._id}`}).creeazaElem(`${rec[1].title}`);
        title.appendChild(titleLnk);
        
        result.querySelector(`.autori`).textContent = rec[1].autori;            // generează autorii
        result.querySelector(`.description`).textContent = rec[1].description;  // generează descrierea
        result.querySelector(`.etichete`).textContent = rec[1].etichete;        // generează etichetele

        searchRes.appendChild(result); // inserează rezultat de căutare
    }
    
    /* === CREEZĂ ELEMENTELE DE NAVIGARE - Bootstrap4 === */
    let paginator    = tplNav.cloneNode(true);           // clonează template-ul navigatorului de pagini
    let insetPgElems = paginator.querySelector('#noPg'); // referință la elementul `ul`

    console.log("[redincredall.mjs] Setul de date primit de la server la momentul paginării este ", dataset);

    // stabilește valoarea limitei numărului de înregistrări returnate
    let getLimit;
    if (dataset.pagination.hasOwnProperty('next')) {
        getLimit = dataset.pagination.next.limit;
    } else {
        getLimit = dataset.pagination.prev.limit;
    }

    let totalPg = Math.ceil(dataset.total / getLimit); // află numărul total de pagini cu date pentru a ști câte butoane corespondente creezi;
    // referință la pagina curentă. Actualizată la momentul apăsării butonului unei pagini
    let pag;
    if (dataset.pagination.hasOwnProperty('next')) {
        pag = parseInt(dataset.pagination.next.page); 
        currentPg = --pag;
    } else {
        pag = parseInt(dataset.pagination.prev.page);
        currentPg = ++pag;
    }

    /* === PREV === */
    // Creează butonul PREVIOUS -> `Anterior` în UI
    let prevBtn = new createElement('li', '', ["page-item"], {'data-pg': 'prev'}).creeazaElem(); // Creează `li` pentru butonul PREVIOUS (`Anterior`).
    // în cazul în care nu avem proprietatea `prev` în obiect, suntem chiar pe prima pagină, ceea ce înseamnă că primul `li` cu child `a` -> `Anterior`, va fi disabled
    if (!dataset.pagination.hasOwnProperty('prev')) {
        prevBtn.className = "page-item disabled"; // preferabil pentru a extinde suportul și pentru browsere mai vechi
    } else {
        prevBtn.className = "page-item";
    }
    // creează elementul a
    let prevAelem = new createElement('a', '', ['page-link'], {href: "#", tabindex: -1}).creeazaElem('Anterior');
    // inserează în li a-ul
    prevBtn.appendChild(prevAelem);
    // adu-mi datele din pagina anterioară
    prevBtn.addEventListener('click', prevPgNavRequest);
    // inserează li-ul în ul.
    insetPgElems.appendChild(prevBtn);

    /* === PAGES === */
    // Creează restul li-urilor care fiecare este comandă către a aduce o pagină nouă cu rezultate
    let pgElem;
    for (pgElem = 1; pgElem <= totalPg; ++pgElem) {
        let liElem = new createElement('li', '', ['page-item'], {}).creeazaElem();
        let aElem = new createElement('a', '', ['page-link'], {href: "#"}).creeazaElem(pgElem);

        // dacă `pgElem`este egal cu `currentPg` [elementul este egal cu pagina corespondentă]
        if (pgElem == currentPg) {
            let active = new createElement('span', '', ['sr-only'], {}).creeazaElem(`(current)`);
            liElem.className = 'page-item active';
            aElem.appendChild(active);
        } else {
            // pentru restul butoanelor corespondente celorlalte pagini cu date, atașăm eveniment de aducere a datelor corespondente
            liElem.addEventListener('click', pgNavRequest);
        }

        liElem.appendChild(aElem);
        insetPgElems.appendChild(liElem);
        // paginator.appendChild(insetPgElems);
    }
    // adaugă la `ul` elementele de legătură ale paginilor
    searchRes.appendChild(paginator);

    /* === NEXT === */
    // Creează butonul NEXT -> `Următoarele` în UI
    let nextBtn = new createElement('li', '', ["page-item"], {'data-pg': 'next'}).creeazaElem(); // Creează `li` pentru butonul PREVIOUS (`Anterior`).
    // în cazul în care nu avem proprietatea `next` în obiect, suntem chiar pe ultima pagină, ceea ce înseamnă că ultimul `li` cu child `a` -> `Următoarele`, va fi disabled
    if (dataset.pagination.hasOwnProperty('prev')) {
        nextBtn.className = "page-item disabled"; // preferabil pentru a extinde suportul și pentru browsere mai vechi
    } else {
        nextBtn.className = "page-item";
    }
    let nextAelem = new createElement('a', '', ['page-link'], {href: "#"}).creeazaElem('Următoarele');
    // inserează în li a-ul
    nextBtn.appendChild(nextAelem);
    // adu-mi datele din pagina următoare
    nextBtn.addEventListener('click', nextPgNavRequest);
    // inserează li-ul în ul.
    insetPgElems.appendChild(nextBtn);
}

// === BUTONUL DE SEARCH ===
const searchResIntBtn = document.getElementById('searchResIntBtn'); // butonul de search
let index = searchResIntBtn.dataset.idx; // extrage indexul din atributul data.
searchResIntBtn.addEventListener('click', function clbkSeachBtnResInterne (evt) {
    evt.preventDefault();
    let fragSearch = document.getElementById('fragSearchDocs').value;
    if (fragSearch.length > 250) {
        fragSearch = fragSearch.slice(0, 250);
    }
    // console.log(fragSearch, "pe", index);
    
    // primul pas, curăță de conținut id-ul `primare`
    removeAllChildren(primare); // old stuff: `primare.innerHTML = '';`
    pubComm.emit('searchres', {
        index, 
        fragSearch, 
        fields: [
            ["expertCheck", true]
        ]
    }); // emite eveniment în backend
});

/* === afișarea rezultatelor === */
// ref la ancora la care se atașează elementele generate
const containerFoundRes = document.getElementById('primare');
// ref la template de doc găsit
const tmplrec = document.getElementById('searchresult');
pubComm.on('searchres', (documents) => {
    // console.log(documents);
    // primul pas, curăță de conținut id-ul `primare`
    removeAllChildren(primare); // old stuff: `primare.innerHTML = '';`
    // pentru fiecare element din array-ul rezultatelor generează câte o înregistrare
    for (let doc of documents) {
        // clonează conținutul
        const clonedTmpl = tmplrec.content.cloneNode(true);
        let title = clonedTmpl.querySelector('#restitlelnk');
        title.textContent = doc._source.title;
        title.href=`/resurse/${doc._id}`;
        clonedTmpl.querySelector('#cardtext').textContent = doc._source.description;
        containerFoundRes.appendChild(clonedTmpl);
    }
});

/**
 * Funcția este un helper și are rolul de a face o căutare în `Map`-ul `mapCodDisc` 
 * pentru a extrage numele disciplinei pilon
 * @param {Object} `obidisc` //{nivel: n, cod: obi.codsdisc} 
 */
function extragNumeDisciplina (obidisc) {
    let disciplina;
    mapCodDisc.forEach ((v, k, m) => {
        // caută în clasa specificată de obidisc.nivel, înregistrarea în map de tip Array cu obiecte
        if (obidisc.nivel === k) {
            // pentru setul găsit
            let obi;
            for (obi of v) {  
                // caută în array-ul codurilor disciplinelor arondate unei arii a unui an              
                if (obi.coduriDiscipline.includes(obidisc.cod)) {
                    // dacă am găsit-o, returnează!
                    disciplina = obi.nume;                    
                }
            }
        }
    });
    return disciplina;
}

/**
 * Funcția are rolul să structureze sub-disciplinele în raport cu Disciplina mare la care sunt arondate
 * Disciplina va fi codificată extrăgând un fragment din numele care este precizat în valorile setului extras din data=*
 * Este apelată de `structureAriAndDiscs()`
 * @param {Object} discs Este un obiect cu toate disciplinele din setul data=* aferent unei clase
 * @returns {Object} Returnează {nivel: <nivel>, rezultat: <Object> }
 */
function structDiscipline (discs = {}) {
    // console.log('Datele primite în `structDiscipline` sunt: ', discs);
    let arrOfarr = Object.entries(discs.clsdata); // #A :: transformă înregistrările obiectului în array-uri
    
    // redu înregistrarea `arrOfarr` la un obiect consolidat de forma lui `obj`:
    let nivelNo;
    // doar dacă obiectul discs este populat, extrage numărul corespondent clasei!
    if (discs.cl) {
        nivelNo = discs.cl.split('').pop(); // scoate numărul aferent clasei!!!
    }
    // constituie obiectul rezultat
    const obj = {
        nivel: nivelNo,
        rezultat: {}
    };

    let claseDisc = new Set(); // constituie un Set cu discipline (are comportament de reducer)

    obj.rezultat = arrOfarr.reduce((ac, elem, idx, arr) => {
        let classNameRegExp = /[a-z]+((\d)?|[A-Z])/gm; // orice caracter mic urmat, fie de un număr, fie de o literă mare        
        let className = elem[0].match(classNameRegExp).shift(); // Generează numele claselor extrăgând din elementul 0 al touple-ului, fragmentul ce corespunde șablonului RegExp

        // obtine numele setului fără numărul clasei. Este necesar pentru a face matching-ul cu numele setului
        if (className.slice(-1) !== obj.nivel) {
            claseDisc.add(className);
        } else {
            className = className.slice(0, -1);
            claseDisc.add(className);
        }

        // #1 --> definirea structurii de date când `ac` la început este `undefined`
        if (Object.keys(ac).length === 0 && ac.constructor === Object) {
            // #2 --> dacă obiectul este gol, introdu prima înregistrare, care dă astfel și structura
            ac[className] =  [
                {codsdisc: elem[0], nume: elem[1]}
            ];            
        } else {
            // #3 --> în cazul în care obiectul este deja populat, verifică dacă setul de discipline (`className`) există deja
            if(className in ac) {
                ac[className].push({codsdisc: elem[0], nume: elem[1]}); // dacă există, adaugă disciplina array-ului existent
            } else {
                // #4 --> dacă nu avem set de discipline pentru `className`-ul descoperit, se va constitui unul și se va introduce prima înregistrare în array
                ac[className] = className;
                ac[className] = [
                    {codsdisc: elem[0], nume: elem[1]}
                ]; 
            }
        }
        return ac;
    },{});

    return obj;
}
