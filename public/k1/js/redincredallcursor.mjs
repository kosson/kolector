import {pubComm, createElement, setWithExpiry, getWithExpiry, decodeCharEntities, datasetToObject} from './main.mjs';

// var csrfToken = '';

// if(document.getElementsByName('_csrf')[0].value) {
//     csrfToken = document.getElementsByName('_csrf')[0].value;
// }

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

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
var fragSearchDocs        = document.getElementById('fragSearchDocs');      // ref către input-ul căutării
var divBtnCautareFatetata = document.getElementById('btnCautaFatetat');     // referință către div-ul gazdă al butonului de căutare fațetată
var searchRes             = document.querySelector('#searchRes');           // referință către div-ul în care ar trebui să am rezultatele( FIXME: tot în `primare` ajung)
var butonCautareFatetata; // referință către butonul de căutare
var disciplineSelectate   = new Set();  // SETUL codurilor DISCIPLINELOR CARE AU FOST SELECTATE (pleacă la căutare în MongoDB pe câmpul `etichete`).
var claseleSelectate      = [];         // Lista disciplinelor după care facem restricționarea căutării. Trebuie să fie permisă menționarea unei clase de mai multe ori. Altfel, la ștergerea unei discipline a unei clase, rămâi fără mențiune de clasă pentru celelalte.
var disciplineNume        = new Set();  // SETUl este menit să repare cazul în care înregistrările au fost importate, nu create în aplicație, adică nu au etichete coduri disciplină.

// Atașează listeneri pe fiecare element din meniu
var clase = document.getElementsByClassName('dropdown-item'), i;
for (i of clase) {
    i.addEventListener('click', structureAriAndDiscs);
}

/* === Constituirea selectorului pentru disciplină === */
const DISCMAP = new Map(); // colector de structuri {nivel: "5", 5: {art5: [], bio5: []}} generate de `structDiscipline({cl:event.target.value, data});`

/**
 * Funcția este un helper pentru eliminarea tuturor
 * elementelor copil ale unei rădăcini pasate drept parametru
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
    // console.log('[generateUX4discs()] Am creat din obiectul dataset: ', Object.entries(dataset), `al doilea param este `, nocls);
    const tdata = Object.entries(dataset);
    // rând pe rând sunt create toate elementele achor pentru fiecare disciplină în parte
    let numeSet, arrSet;
    for ([numeSet, arrSet] of tdata) {

        // extrage clasa și adaug-o ca element data
        let clasa = '';
        switch (parseInt(nocls)) {
            case 0:
                clasa = `Clasa pregătitoare`
                break;
            case 1:
                clasa = `Clasa I`
                break;
            case 2:
                clasa = `Clasa a II-a`
                break;
            case 3:
                clasa = `Clasa a III-a`
                break;
            case 4:
                clasa = `Clasa a IV-a`
                break;
            case 5:
                clasa = `Clasa a V-a`
                break;
            case 6:
                clasa = `Clasa a VI-a`
                break;
            case 7:
                clasa = `Clasa a VII-a`
                break;
            case 8:
                clasa = `Clasa a VIII-a`
                break;
            default:
                break;
        }

        /* === CAZUL O DISCIPLINĂ, UN BUTON :: creezi câte un buton === */
        if (arrSet.length === 1) {
            let butn = new createElement('a', arrSet[0].codsdisc, ['btn', 'btn-sm', 'btn-light', 'facet', 'mansonry', arrSet[0].codsdisc], {href: "#", role: "button", 'data-clasa': clasa}).creeazaElem(arrSet[0].nume);
            butn.addEventListener('click', clickPeDisciplina); // atașează listener pentru tratarea selecție pe click
            discipline.appendChild(butn);
        } else {
            /* === CAZUL SETURILOR DE DISCIPLINE :: creezi câte un dropdown === */
            let drpDwn = new createElement('div', '', ['btn-group', 'dropright', 'facet'], {}).creeazaElem();
            let origNumeSet = numeSet;
            numeSet = codSeturiDisc[numeSet][nocls]; // Adu numele setului de discipline și înlocuiește codul setului
            // Construiește elementele Bootstrap pentru seturi și discipline individuale
            // console.log(`Setul disciplinelor este`, arrSet);

            // extrage numele generic al setului care va juca rolul de id lbcomRom0 => lbcom; muzmi0 => muzmi (la search returneaza `-1`, iar sliceul va tăia doar numarul)
            let primo = arrSet[0]; // `arrSet[0].primo.codsdisc` este numele setului
            let indxToCutTo = primo.codsdisc.search(/([A-Z])\w+/g);
            let genericsetname = primo.codsdisc.slice(0, indxToCutTo);

            let btnDrpDwn = new createElement('button', genericsetname, ['btn', 'btn-sm', 'btn-light', 'dropdown-toggle'], {'data-bs-toggle': 'dropdown', 'type': 'button', 'aria-expanded': 'false'}).creeazaElem(numeSet);
            let menuDrpDwn = new createElement('ul', '', ['dropdown-menu', 'drpdwnmenucontent'], {'aria-labeledby': genericsetname}).creeazaElem();
            
            let disciplina; // în cazul unui set, creează câte un drop down
            for (disciplina of arrSet) {
                let aelem = new createElement('a', disciplina.codsdisc, ['dropdown-item', 'facet', disciplina.codsdisc], {'href': '#', 'data-clasa': clasa}).creeazaElem(disciplina.nume);
                aelem.addEventListener('click', clickPeDisciplina); // atașează listener pentru tratarea selecție pe click
                menuDrpDwn.appendChild(aelem);
            }
            
            // asamblează construcția DOM și atașează la `discipline`
            drpDwn.appendChild(btnDrpDwn);
            drpDwn.appendChild(menuDrpDwn);
            discipline.appendChild(drpDwn);
        }
    }
}

/**
 * Funcția e listener pentru fiecare element disciplină. Odată selectată disciplina, aceasta va fi afișată într-o zonă de selecție
 * Afișarea în zona de selecție implică automat adăugarea codului disciplinei într-un array.
 * Este generat și afișat butonul de căutare după selectarea primei discipline. Id-ul este `searchF`.
 * Butonul va trimite interogare în server către Mongoose pentru deschiderea unui cursor. TODO: trimite căutarea către ES.
 * Adaugă un listener pentru stergere, care atrage după sine și ștergerea keyword-ului din array-ul de secție
 * @param {NodeElement} `evt` fiind chiar elementul obiect
 */
function clickPeDisciplina (evt) {
    // evt.preventDefault(); // este necesar pentru că la click pe disciplină individuală, nu pe set, anchor va pleca pe `#` și va face reflow -> interfața dispare
    let dataset = evt.target.dataset || evt.target.parentElement.dataset;
    let id = evt.target.id || evt.target.parentElement.id; // este cazul în care userul dă click pe `span`, nu pe elementul părinte `button`, care are id
    
    // injectează butonul de căutare fațetată dacă Set-ul este 0
    if (disciplineSelectate.size === 0) {
        let btnSearchF = new createElement('button', 'searchF', ['btn', 'btn-success'], {}).creeazaElem("Caută după selecție");
        divBtnCautareFatetata.appendChild(btnSearchF);
        btnSearchF.addEventListener('click', getPagedResults);      // adaugă evenimentul care va pagina rezultatele.
        butonCautareFatetata = document.getElementById('searchF');  // fă referința la butonul de căutare după ce l-ai creat.
    }

    // DACĂ NU EXISTĂ CODUL ÎN `disciplineSelectate`, adaugă-l!
    if (disciplineSelectate.has(id) == false) {
        disciplineSelectate.add(id); // adaugă codul disciplinei în `Set`-ul `disciplineSelectate`

        // CAZUL în care resursa a fost importată fără etichete/codurile disciplinei sau pur și simplu userul a șters codul disciplinei din înregistrare.
        if (disciplineNume.has(evt.target.innerText) == false) {
            disciplineNume.add(evt.target.innerText); // adaugă numele complet al disciplinei în `Set`-ul `disciplineNume`
        }

        // Pune informația privind clasa pentru care s-a selectat disciplina
        claseleSelectate.push(dataset.clasa);
            
        // creează butonul disciplinei (TAGUL MARTOR) pe care a selectat-o user-ul
        // console.log(`tagid la momentul creării este `, `tag-${id}`);
        let aTag = new createElement('a', '', ['disctag', id, `tag-${id}`], {href: '#'}).creeazaElem(evt.target.textContent); // `id` este necesar în clase pentru a fi colorat specific clasei
        let bTag = new createElement('button', '', ['btn-close', 'btn-close-white'], {'type': 'button', 'aria-label': "Close", "data-disc": id, "data-clasa": dataset.clasa, "data-disciplina": evt.target.innerText}).creeazaElem();
        aTag.appendChild(bTag);
        bTag.addEventListener('click', delKeyword); // adaugă listener de ștergere keyword
        discSelected.appendChild(aTag);
    }
    // console.log(`Seturile actualizate arată astfel: claseSelectate`, claseleSelectate, ` disciplineNume `, disciplineNume , ` și discipline selectate `, disciplineSelectate );
}

/**
 * Funcția este listener pentru butoanele disciplinelor selectate
 * care au fost alese în scopul eliminării din DOM
 * @param evt Object tip eveniment
 */
function delKeyword (evt) {
    let dataset = evt.target.dataset || evt.target.parentElement.dataset;
    // setează id-ul elementului pentru ștergere
    let id = dataset.disc;

    let tgt = document.querySelector(`.tag-${id}`); // țintește elementul `achor` prin țintirea unei clase construite special pentru a fi selectată aici (`svg${id}`)

    // șterge din Set-ul disciplinelor selectate
    if (disciplineSelectate.has(id) === true) {
        disciplineSelectate.delete(id); // șterge din Set
    }

    // CAZUL în care resursa a fost importată fără etichete/codurile disciplinei sau pur și simplu userul a șters codul disciplinei din înregistrare.
    if (disciplineNume.has(dataset.disciplina) === true) {
        disciplineNume.delete(dataset.disciplina); // adaugă numele complet al disciplinei în `Set`-ul `disciplineNume`
    }

    // Extrage informația privind clasa din dataset
    if (claseleSelectate.find(elem => dataset.clasa)) {
        let index = claseleSelectate.findIndex(elem => elem === dataset.clasa);
        if (index !== -1) {
            claseleSelectate.splice(index, 1);
        }
    }

    if (disciplineSelectate.length === 0 || disciplineNume.size === 0 || claseleSelectate.size === 0) {
        butonCautareFatetata.remove();  // în cazul în care ai șters și ultima disciplină din selecție, șterge și butonul de căutare
    }

    discSelected.removeChild(tgt);
    // console.log(`După ștergere datele actualizate arată astfel: claseSelectate`, claseleSelectate, ` disciplineNume `, disciplineNume , ` și discipline selectate `, disciplineSelectate );
}

let tplRec = document.querySelector('#record').content;
let tplNav = document.querySelector('#paginator').content;

/* === SETAREA OBIECTULUI DE CĂUTARE PENTRU MONGODB === */
let limitNr = 10;
let selectObi = {
    query: {
        projection: {},
        select: '',
        exclude: [],
        sortby: [],
        sortDefaultField: 'date'
    },
    pagination: {},
    limitNr
};
// Construiește un dicționar de seturi pentru că este posibil ca în viitor să fie adăugate și alte criterii de selecție cum ar fi metrici.
// Numele proprietăților să fie cel al câmpurilor din modelul de date
var searchSets = Object.create(null);
// searchSets.etichete = disciplineSelectate;  // trimite în obiectul `searchSets` un atribut nou `etichete`
searchSets.level = claseleSelectate;        // este setul claselor care va limita căutarea doar la clasele selectate
searchSets.discipline = disciplineNume;     // este setul disciplinelor selectate chiar ca nume

/**
 * Funcția are rolul de a adăuga obiectului `selectObi.query.projection` o proprietate nouă cu un array de valori după care se va face căutarea.
 * Numele proprietății este cel al unei proprietăți din dicționarul `searchSets`, iar valoarea este setul transformat în array
 * De fiecare dată când se apasă butonul de căutare, această funcție este apelată pentru a construi obiectul de filtrare a rezultatelor
 * @param numeSet referință către un obiect `Set` care culege cuvinte cheie ce vor fi utilizate în căutare (valoarea din dicționarul `searchSets`)
 * @param numeCamp este un `String` cu numele unui câmp din modelul de date pentru care se face interogarea (cheia din dicționarul `searchSets`)
 */
function dataAggregator4Search (numeCamp, value) {
    // decorarea obiectului de selecție adăugând câmpurile de interes
    // console.log('[redincredall] disciplinele selectate din set sunt ', [...numeSet]);

    // Asigură-te că există deja array-ul selecțiilor
    // if (!selectObi.query.projection['$and']) {
    //     selectObi.query.projection['$and'] = [];
    // };

    // Constituie aici un filtru în funcție de numele câmpului
    switch (numeCamp) {
        case 'discipline':
            if (value.size > 0) {
                selectObi.query.projection[numeCamp] = {"$in": Array.from(value)};
            }
            break;
        case 'level':
            if (value.length > 0) {
                let unqs = new Set(value); // redu la un set de clase unice
                selectObi.query.projection[numeCamp] = {"$in": Array.from(unqs)};
                // _FIXME: Aici trimite o sintaxă $or -> { $or:[ {'_id':objId}, {'name':param}, {'nickname':param} ]
                // userModel.find({$or: [{email: req.body.email}, {username: req.body.username}]})
                // https://stackoverflow.com/questions/7382207/mongooses-find-method-with-or-condition-does-not-work-properly
                // https://stackoverflow.com/questions/21467697/how-do-you-utilize-and-or-exists-in-the-same-mongoose-js-query
            }
            break;
    
        default:
            // în cazul în care nu este un `Set`, ci o simplă valoare a unei chei
            selectObi.query.projection['$and'].push({[numeCamp]: value});
            break;
    }
}

/**
 * === BUTONUL DE CĂUTARE FAȚETATĂ === *
 * Funcția are rol de callback pentru evenimentul `click` al butonului de căutare fațetată (id `searchF`)
 * Este apelată de `pgNavRequest` și lister pentru butonul `Caută`.
 * Apelează `dataAggregator4Search()`
 * @param evt obiectul eveniment al butonului de căutare fațetată
 */
function getPagedResults (evt) {
    // Adăugarea setărilor fixe
    if (!selectObi.query.projection['expertCheck']) {
        selectObi.query.projection['expertCheck'] = true;
    }
    // pentru fiecare proprietate din dicționarul `searchSets`, apelează `dataAggregator4Search` pentru a completa obiectul de căutare `selectObi` trimis serverului
    let prop, val;
    for ([prop, val] of Object.entries(searchSets)) {
        dataAggregator4Search(prop, val);
    }
    // console.log('[redincredall] obiectul care pleacă în server este: ', selectObi);

    // afișează un set de câmpuri pe care userul să le aleagă pentru a aduce un subset din întreaga înregistrare. Acum, hard codată
    selectObi.query.select = 'date level title autori description etichete';
    // console.log(`Datele care vor pleca în server după apasarea butoanelor prev sau next: `, selectObi);

    /* === EMIT CERERE DATE === */
    pubComm.emit('pagedRes', selectObi);
}

/**
 * Funcția aduce rezultate de căutare din ElasticSearch care vor fi paginate
 * @param evt obiectul event al butonului `searchF`
 */
function getPagedResultsES7 (evt) {

}

/* === PRIMESC DATELE DIN SERVER === */
pubComm.on('pagedRes', function clbkPagedRes (dataset) {
    removeAllChildren(primare);
    paginare(dataset);
});

var currentPg = 0; // este pagina curentă. Actualizat din `paginare()`

/**
 * Tratarea cazului PREVIOUS page
 * @param {Object} evt 
 */
function prevPgNavRequest (evt) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare
    let dataset = evt.target.dataset;
    // console.log(`Setul de date extras de pe butonul PREVIOUS este: `, dataset);
    let cursor2send = dataset.pg; // trebuie să fie timestamp-ul corespondent cursorului
    selectObi.pagination.cursor = cursor2send;
    getPagedResults();
}

/**
 * Tratarea cazului NEXT page
 * @param {Object} evt 
 */
function nextPgNavRequest (evt) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare
    let dataset = evt.target.dataset;
    // console.log(`Setul de date extras de pe butonul de NEXT este: `, dataset);
    let cursor2send = dataset.pg; // trebuie să fie timestamp-ul corespondent cursorului
    selectObi.pagination.cursor = cursor2send;
    getPagedResults();
}

let queryTracker = new WeakMap(); // Acesta este structura cu ajutorul căreia voi ține evidența query-urilor și implicit a paginației: obiectQuery: [timestampSegment1, timestampSegment2, ...]
/**
 * === CĂUTAREA după CLASĂ-DISCIPLINĂ ===
 * Funcția are rolul de a crea zona de afișare a rezultatelor și 
 * de a popula cu rezultate formatate în baza template-ului `record`.
 * Este apelată de callback-ul butonului `Caută după selecție`
 * @param dataset {Object} datele primite de la MongoDB
 */
function paginare (dataset) {
    // console.log(`de la server am primit `, dataset);
    removeAllChildren(searchRes); // șterge rezultatele anterioare

    /* 
        === AFIȘAREA REZULTATELOR DE CĂUTARE === 
        Pentru fiecare înregistrare, introdu în div-ul `searchRes` template-ul `record` populat
    */
    let rec, result, title, titleLnk, leftlimit = Math.floor(new Date(dataset.segmentdata[0].date) / 1000);;
    for (rec of Object.entries(dataset.segmentdata)) {
        // console.log("[redincredall] am următorul set de date ce urmează a fi paginate ", rec);
        result = tplRec.cloneNode(true); // ref la template

        // Generează titlul
        title = result.querySelector(`.title`);
        titleLnk = new createElement('a', '', [], {href: `/resurse/${rec[1]._id}`}).creeazaElem(`${rec[1].title}`);
        title.appendChild(titleLnk);
        
        result.querySelector(`.autori`).textContent = rec[1].autori;    // populează autorii
        result.querySelector(`.description`).innerHTML = `<span class="srecdescr">Descriere: </span>${rec[1].description}`;  // populează descrierea
        
        // Tratează etichetele
        let formatedTags = '', tag;
        for (tag of rec[1].etichete) {
            formatedTags += `<p class="tag">
                <span class="fa fa-tag text-warning mr-2"></span>
                <span class="text-secondary">
                    <a itemprop="keywords" href="/tag/${tag}">${tag}</a>
                </span>
            </p>`
        }
        result.querySelector(`.etichete`).innerHTML = formatedTags; // populează etichetele

        // Tratează clasele `level`.
        let formatedLevels = 'Clasa: ', levelinfo;
        for (levelinfo of rec[1].level) {
            formatedLevels += `<span>${levelinfo}</span> `;
        }
        result.querySelector(`.levels`).innerHTML = formatedLevels;

        searchRes.appendChild(result); // inserează rezultat de căutare
    }

    /* === CREEAZĂ ELEMENTELE DE NAVIGARE - Bootstrap 5 === */
    let paginator    = tplNav.cloneNode(true);              // clonează template-ul navigatorului de pagini
    let insetPgElems = paginator.querySelector('#noPg');    // referință la elementul `ul`
    let cursorAnterior, cursorNext;                         // acestea sunt cursoarele care trebui puse pe PREV și pe NEXT
    let totalPg = Math.ceil(dataset.total / limitNr);       // află numărul total de pagini cu date;
    let cursorArr;

    if (dataset.pagination.moredata) {
        /* === SEEDING `queryTracker` === */
        if (!queryTracker.has(selectObi.query)) {
            queryTracker.set(selectObi.query, [leftlimit]);
            // console.log(`querytracker moment 0 `,queryTracker);
        };

        /* === REF LA ARRAY CURSOARE === */
        cursorArr = queryTracker.get(selectObi.query);  // Obține array-ul cursoarelor primite pentru obiectul de interogare

        // adaugă în array doar dacă nu există. este necesar pentru cazul în care butoanele anterior sunt apăsate -> noi cursoare false sunt adăugate în array
        if (cursorArr.indexOf(dataset.pagination.nextCursor) == -1) {
            cursorArr.push(dataset.pagination.nextCursor);      // Introdu în array cursorul primit de la server
        }        
        ++currentPg;                                            // Incrementează pagina

        /* === AI CEL PUȚIN DOUĂ CURSOARE === */
        if (queryTracker.get(selectObi.query).length >= 2) {
            let idxInTracker = cursorArr.indexOf(dataset.pagination.nextCursor);
            currentPg = idxInTracker;                   // dacă l-am găsit, setează numărul paginii curente cu valoarea indexului
            cursorNext = dataset.pagination.nextCursor; // setează butonul next la valoarea primită `nextCursor` după ce a fost băgată în array
            cursorAnterior = cursorArr[idxInTracker-2]; // setează butonul prev la valoarea indexului elementului anterior introdus în array
        }
    } else {
        cursorArr = queryTracker.get(selectObi.query);  // Obține array-ul cursoarelor primite pentru obiectul de interogare
        currentPg = cursorArr.length;
        cursorAnterior = cursorArr.slice(-2).shift();
        // console.log(`La final, cursorul anterior este: `, cursorAnterior);
        cursorNext = undefined;
    }

    /* === PREV [ANTERIOR]=== */
    let prevBtn = new createElement('li', '', ["page-item"], {'data-pg': cursorAnterior}).creeazaElem();
    let prevAelem = new createElement('a', '', ['page-link'], {href: "#", tabindex: -1, 'data-pg': cursorAnterior}).creeazaElem('Anterioare');    
    prevBtn.appendChild(prevAelem);// inserează în li a-ul
    prevBtn.addEventListener('click', prevPgNavRequest);// adu-mi datele din pagina anterioară
    // suntem chiar în primul segment de date, ceea ce înseamnă că primul `li` cu child `a` -> `Anterior`, va fi disabled
    if (currentPg == 1) {
        prevBtn.classList.toggle("disabled");
        prevAelem.setAttribute('aria-disabled', true);        
    }
    insetPgElems.appendChild(prevBtn); /* == INSERT ÎN UL ==*/

    /* === INFORMATIE DESPRE SEGMENTUL DE DATE AFISAT === */
    let liElemNr = new createElement('li', '', ['page-item'], {}).creeazaElem();
    let aElemMid = new createElement('a', '', ['page-link'], {href: "#"}).creeazaElem();
    let aElemNr = new createElement('span', '', ['pgcurent'], {}).creeazaElem(' ' + currentPg);
    let aElemOf = new createElement('span', '', [], {}).creeazaElem(' / ');
    let aElemPg = new createElement('span', '', ['allpages'], {}).creeazaElem(totalPg + ' ');
    aElemMid.appendChild(aElemNr);
    aElemMid.appendChild(aElemOf);
    aElemMid.appendChild(aElemPg);
    liElemNr.appendChild(aElemMid);
    insetPgElems.appendChild(liElemNr); /* == INSERT ÎN UL ==*/
    searchRes.appendChild(paginator);

    /* === NEXT [Următoarele] === */
    let nextBtn = new createElement('li', '', ["page-item"], {'data-pg': cursorNext}).creeazaElem(); // Creează `li` pentru butonul PREVIOUS (`Anterior`).
    let nextAelem = new createElement('a', '', ['page-link'], {href: "#", 'data-pg': cursorNext}).creeazaElem('Următoarele');    
    nextBtn.appendChild(nextAelem); // inserează în li a-ul    
    nextBtn.addEventListener('click', nextPgNavRequest); // adu-mi datele din pagina următoare
    if (!dataset.pagination.moredata) {
        nextBtn.classList.toggle("disabled"); // preferabil pentru a extinde suportul și pentru browsere mai vechi
        nextAelem.setAttribute('aria-disabled', true);
    }
    insetPgElems.appendChild(nextBtn); /* == INSERT ÎN UL ==*/
}

/**
 * Funcția are rolul de a aranja spațiul (`searchRes`) pentru afișarea datelor primite.
 * @param dataset {Object} este setul de rezultate primit de la ES7
 */
function afisareDateES7 (dataset) {
    removeAllChildren(searchRes); // #1 șterge rezultatele anterioare

    //_ TODO: Creează infinitescroll-ul.
}

// === BUTONUL DE SEARCH (folosește MongoDB)===
const searchResIntBtn = document.getElementById('searchResIntBtn'); // butonul de search
let index = searchResIntBtn.dataset.idx; // extrage indexul din atributul data.

// Proiecția necesară regăsirii datelor în MongoDB
let searchCriteria = {
    index, 
    fragSearch: '', 
    fields: [
        ["expertCheck", true]
    ]
};


/* === Căutarea în ELASTICSEARCH === */

// Obiectul de interogare necesar lui ES7
let es7query = {
    query: {
        bool: {
            must: [{multi_match: {query: '', fields: []}}],
            must_not: [],
            should: [
                {match: {}},
                {terms: {etichete: []}},
            ],
            filter: [
                {term: {expertCheck: true}},
                {range: {date: {gte: '', lt: ''}}}
            ]
        }
    },
    aggs: {
        arie_curriculara: {
            terms: {
                field: "arieCurriculara.raw"
            },
            aggs: {
                discipline: {
                    terms: {
                        field: "discipline.raw",
                        missing: "neprecizat",
                        min_doc_count: 0,
                        order: {
                            _key: "asc"
                        }
                    }
                }
            }
        },
        ultimii_ani: {
            date_histogram: {
                field: "date",
                fixed_interval: "3m"
            }
        }
    },
    pit: {
        id: '',
        keep_alive: '1m'
    },
    sort: [
        {"@timestamp": {order: "asc", "format": "strict_date_optional_time_nanos"}},
        {"_shard_doc": "desc"}
    ],
    search_after: [],
    track_total_hits: false
};

/**
 * Funcția are rolul de a face interogarea pe clusterul ES7
 * Verifică dacă există PIT, iar dacă nu, trimite o cerere pentru a-l crea.
 */
function searchES7 (delPIT) {
    // Verifică dacă ai PIT și în caz contrar, solicită crearea unuia
    let pit = getWithExpiry('pitb');
    if (pit) {
        es7query.pit.id = pit; // setează PIT-ul cu valoarea existentă în `localStorage`. E posibil să se fi schimbat pe server.
        // În cazul în care ai deja alt PIT pe server, vei primi setul de date rezultat în urma căutării având alt PIT, pe care va trebui să-l suprascrii în `localStorage`.
        // console.log(`[redincredall.mjs] Am să trimit cererea de căutare. În client este PIT-ul:`, pit);

        // COMPLETEAZĂ obiectul de căutare și emite pe `search`.
    } else {
        // solicită crearea unui pit.
        pubComm.emit('pit', {
            del: false,
            conf: {
                index,
                keep_alive: '1m'
            }
        });
    }
    // https://www.sohamkamani.com/blog/javascript-localstorage-with-ttl-expiry/

    // dacă este solicitată ștergerea PIT-ului
    if (delPIT === true) {
        pubComm.emit('pit', {
            del: true,
            pit
        });
    }
}

/**
 * Funcția are rol de handler pentru evenimentele `click`.
 * Aceasta este funcția care trimite evenimentul pe `searchres` și proiecția după care
 * se face căutarea în MongoDB
 * @param evt Object evenimentul
 */
function clbkSeachBtnResInterne (evt) {
    evt.preventDefault();

    // limitează stringul de căutare la 50
    let frag = fragSearchDocs.value;
    if (frag.length > 50) {
        frag = frag.slice(0, 50);
    }
    searchCriteria.fragSearch = frag;

    removeAllChildren(primare);     // old stuff: `primare.innerHTML = '';
    removeAllChildren(searchRes);   // șterge rezultatele anterioare de căutare din `searchRes`.

    // crearea și primirea unui PIT
    searchES7(); // Apel la funcția care creează PIT și trimite obiectul de interogare.

    pubComm.emit('searchres', searchCriteria); // emite eveniment în backend
}

/**
 * Funcția are rol de handler pentru evenimentul `keypress`.
 * @param evt {Object} Obiectul eveniment
 */
function clbkSeachBtnResInterneEnter (evt) {
    let charCodeNr = typeof evt.charCode == "number" ? evt.charCode : evt.keyCode;
    // console.log('Caracter ', charCodeNr);
    let identifier = evt.key || evt.keyIdentifier; // compatibilitate cu Safari
    if (identifier === "Enter" || charCodeNr === 13) {
        evt.preventDefault();
        searchES7(); // Apel la funcția care creează PIT și trimite obiectul de interogare
        removeAllChildren(searchRes);
    };
}
// cazul în care se dă Enter
fragSearchDocs.addEventListener('keypress', clbkSeachBtnResInterneEnter);

searchResIntBtn.addEventListener('click', clbkSeachBtnResInterne);  // Adaugă handler pe butonul de căutare

/**
 * Funcția are rol de callback pentru evenimentul `pit` la primire
 * @param data {Object} datele primite de la server care conțin id-ul pit-ului
 */
function clbkOnPitEvt (id) {
    // console.log(`De la server (Elasticearsch) am primit următoarele date`, id);
    // primul pas este să fixezi o referință la PIT în `localStorage`
    setWithExpiry('pitb', id, 10000); // setează PIT pentru căutările din backend
    // Acum că avem PIT, reintrâm în logica de formulare a cererii de căutare prin apel la `searchES7`
    // searchES7();
    // console.log(`Id-ul PIT-ului setat în localStorage este: `, getWithExpiry('pitb'));
}

// Ascultă datele care vin privind pit-ul și populează localStorage cu valoarea setată să expire exact ca în backend
// Ai nevoie de acest reper de timp pentru a ști dacă trebuie să emiți o nouă cerere de PIT sau încă ești în interval
pubComm.on('pit', clbkOnPitEvt);

/* === REZULTATE DE LA MONGODB pentru căutarea la liber === */
// ref la template de doc găsit
let tmplfound = document.querySelector('#searchresults');

pubComm.on('searchres', (documents) => {
    console.log(`De la serverul MongoDB am primit următoarele `, documents);
    removeAllChildren(searchRes); // șterge rezultatele anterioare

    // pentru fiecare element din array-ul rezultatelor generează câte un rezultat de căutare afișat
    let rec, result, title, titleLnk;
    for (rec of documents) {
        // console.log(`Continutul unei înregistrări găsite este `, doc._source);
        result = tplRec.cloneNode(true); // ref la template

        // Generează titlul
        title = result.querySelector(`.title`);
        titleLnk = new createElement('a', '', [], {href: `/resurse/${rec._id}`}).creeazaElem(`${rec._source.title}`);
        title.appendChild(titleLnk);
        
        result.querySelector(`.autori`).textContent = rec._source.autori;    // populează autorii
        result.querySelector(`.description`).innerHTML = `<span class="srecdescr">Descriere: </span>${rec._source.description}`;  // populează descrierea
        
        // Tratează etichetele
        let formatedTags = '', tag;
        for (tag of rec._source.etichete) {
            formatedTags += `<p class="tag">
                <span class="fa fa-tag text-warning mr-2"></span>
                <span class="text-secondary">
                    <a itemprop="keywords" href="/tag/${tag}">${tag}</a>
                </span>
            </p>`
        }
        result.querySelector(`.etichete`).innerHTML = formatedTags; // populează etichetele

        // Tratează clasele `level`.
        let formatedLevels = 'Clasa: ', levelinfo;
        for (levelinfo of rec._source.level) {
            formatedLevels += `<span>${levelinfo}</span> `;
        }
        result.querySelector(`.levels`).innerHTML = formatedLevels;

        searchRes.appendChild(result); // inserează rezultat de căutare
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
