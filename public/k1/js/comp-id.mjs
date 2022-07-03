import {socket, pubComm, createElement, check4url, decodeCharEntities, datasetToObject} from './main.mjs';

// var f = document.getElementById('test_form');
// var data = new FormData(f);

// var lastName = data.get('last_name');
// var firstName = data.get('first_name');
// var dob = data.get('date_of_birth');

globalThis.createDynamicFields = createDynamicFields;

/* === Mecanism de management al obiectelor care au evenimente atașate === */ 
let domEventedObjs = new WeakMap();

/**
 * `addEvtElem` este o funcție care adaugă un eveniment unui element stocat într-un WeakMap
 * @param wkMap un obiect WeakMap cu care se gestionează elemente pentru fiecare este creat câte un `Set` care acumulează evenimentele elementului
 * @param elem  elementul DOM pentru care adaug evenimentul
 * @param listener funcția cu rol de listener
 */
function addEvt4Elem (wkMap, elem, listener) {
    // dacă obiectul nu există, va fi creat
    if(!wkMap.has(elem)){
        // pentru fiecare obiect element se creează un set dedicat stocării funcțiilor listener
        wkMap.set(elem, new Set([listener]));
    }
    // dacă elementul/obiect există, doar adaugă funcția listener
    wkMap.get(elem).add(listener);
};

/**
 * `exeEvt4Elem` are rolul de a executa toate funcțiile listener asociate unui element/obiect
 * @param wkMp instanța obiectului `WeakMap` folosită
 * @param elem elementul/obiectul pentru care se dorește declanșarea funcțiilor listener
 */
function exeEvt4Elem (wkMp, elem) {
    // verifică mai întâi să existe elementul
    if (wkMp.get(elem)) {
        // execută toate evenimentele pentru element
        let evt;
        for (evt of wkMp.get(elem)) {
            evt();
        }
    }
};

/**
 * `removeChild` are rol de listener pentru evenimentul click al butonului de ștergere
 *  este folosită de creeazaActivitateHelper la crearea elementelor buton
 * @param event obiect eveniment
 */
function removeChild (event) {
    let parentId = event.target.parentNode.id;
    insertie.removeChild(document.querySelector(`#${parentId}`));
}

/* === MECANISM DE CREARE A UNUI `TreeWalker` pentru un anumit arbore din DOM === */

// REVIEW: creează o funcție care generează un filtru
/**
 * `filterCreator()` oferă posibilitatea filtrării după tag, clasă sau conținut
 * Este apelată de funcția `createTW` care creează un `TreeWalker`
 * @param elemTypes {Object} un obiect care descrie după tipul elementului, părinte și clasă
 * @returns `filterByTags` {Function} care este filtrul
 */
function filterCreator (target) {
    return function filterByTags (node) {
        let state = node.tagName === target.tag;

        // verifică dacă există alte specificații de căutare
        if (target.parent) {
            state = state && node.parentNode.tagName === target.parent;
        } else if (target.cls) {
            state = state && node.classList.contains(target.cls);
        }

        return state ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
};

/**
 * `createTW()` este o funcție care generează un obiect `TreeWalker`
 * apelează `filterCreator()` care returnează creatorul de filtru în baza semnăturii:
 *  `{tag: 'nume_tag', parent: 'nume_tag_al_parintelui', cls: 'nume_clasă'}` (`cls` și `parent` sunt opționale)
 * 
 * NOTE: Nu uita să muți cursorul pe primul element (`iteratorTW.firstChild()`)
 * `while(iteratorTW.nextNode()){}` va parcurge efectiv toate elementele cu tipul de tag specificat
 * Nu uita de faptul că este adus arborele începând cu rădăcina menționată de `insertion`. De acolo faci căutări, etc...
 * @param insertion {Object} este un element *live* selectat cu `getElementById`
 * @param elemTypes {Array} este un array care trebuie să aibă precizat cel puțin un tag după care să se facă filtrarea
 * @returns {Object} de tip `TreeWalker`
 */
function createTW (insertion, target = {}) {
    let filter = filterCreator(target);
    return document.createTreeWalker(insertion, NodeFilter.SHOW_ELEMENT, filter, false);
};

/* === LOGICĂ SPECIFICĂ CĂII === */
let frm4loaded = document.getElementById('form04'); // ref la formular
let insertie = document.getElementById('compactivs'); // punct de aclanșare în DOM pentru elementele generate dinamic

// Pentru elementele de formular care există, li se atașează un eveniment
let objExistingDels = createTW(insertie, {tag: 'DIV'}); // iteratorul elementelor existente
let primul = objExistingDels.firstChild(); // mută cursorul pe primul copil
// atașează eveniment primului buton. Dacă primul buton există, se va continua și cu o buclă pentru restul
if (primul) {
    let primulDel = primul.getElementsByTagName('button');
    addEvt4Elem(domEventedObjs, primulDel[0], primulDel[0].addEventListener('click', removeChild));
    // atașează eveniment și celorlalte butoane
    while (objExistingDels.nextSibling()) {
        // console.log("Elementul ar fi: ", objExistingDels.currentNode.getElementsByTagName('button'));
        // dacă un element buton există
        if (!Array.isArray(objExistingDels.currentNode.getElementsByTagName('button'))) {
            let currentElem = objExistingDels.currentNode.getElementsByTagName('button')[0];
            // console.log('Elementul curent este: ', currentElem);
            addEvt4Elem(domEventedObjs, currentElem, currentElem.addEventListener('click', removeChild));
        }
    }
};

/**
 * Funcția `creeazaActivitateHelper()` servește funcției `creeazaActivitateNoua()`.
 * Are rolul de a genera întreaga structură DOM necesară inserării unei noi activități.
 * Folosește funcția `selectOpts()` pentru a genera elementele `<option>`
 * Este folosită de `createDynamicFields()`
 * @param {String} id Este id-ul elementului `<select>` căruia i se adaugă elementele `<option>`
 * @param {Object} insertie Este elementul la care se va atașa întreaga structură `<option>` generată
 */
function creeazaActivitateHelper (id, insertie) {
    // cazul în care deja există activități
    if (id !== 0) {
        // creează input-group
        const divInputGroup        = new createElement('div', `activitate-${id}`,  ['input-group', 'mb-2'], {}).creeazaElem();
        const divInputGroupPrepend = new createElement('div', '',                  ['input-group-prepend'], {}).creeazaElem();
        // creează input-group-prepend
        const divInputgroupText    = new createElement('div', '',                  ['input-group-text'],    {}).creeazaElem(`${id}`);

        // adaugă input-group-prepend la input-group
        divInputGroupPrepend.appendChild(divInputgroupText);
        divInputGroup.appendChild(divInputGroupPrepend);

        // creează elementul de input text
        const inputActivitate = new createElement('input', `act-${id}`, ['form-control'], {
            type: 'text',
            name: `activitate-${id}`
        }).creeazaElem('', true);
        divInputGroup.appendChild(inputActivitate); // adaugă la input-group form-control

        // creează butonul de ștergere
        const deleteNewActiv = new createElement('button', `act-${id}-remove`, ['btn', 'btn-warning', 'ml-2'], {type: 'button'}).creeazaElem("\u{1F5D1}");
        divInputGroup.appendChild(deleteNewActiv);
        insertie.appendChild(divInputGroup);

        // NOTE: evenimentul pentru butonul de ștergere se construiește și atașează în funcția apelantă (`createDynamicFields`)
        // let evtAtachRemoveChld = deleteNewActiv.addEventListener('click', removeChild);
        addEvt4Elem(domEventedObjs, deleteNewActiv, deleteNewActiv.addEventListener('click', removeChild));
    }
};

/**
 * `createDynamicFields` are rolul de a crea câmpurile dinamice necesare adăugării de activități noi
 * Apelează `creeazaActivitateHelper()`
 */
function createDynamicFields () {
    let objIterator = createTW(insertie, {tag: 'DIV'});
    let last = objIterator.lastChild();

    // Cazul în care deja avem activități
    if (last) {
        let lastIdNo = parseInt(last.id.slice(last.id.search(/(\d{1,})+/g)));
        // console.log('Numarul este ', lastIdNo);
        creeazaActivitateHelper(`${++lastIdNo}`, insertie);
    } else if (last === null) {
        // cazul în care nu sunt activități
        creeazaActivitateHelper('0', insertie);
    }
};

/* === ADUNĂ DATELE DIN FORMULAR === */
/**
 * Funcția are rol de receptor pentru butonul cu id=sendData
 */
function submitData () {
    const CS = {
        id:         '',
        nume:       '',
        cod:        '',
        activitati: [],
        disciplina: [],
        coddisc:    '',
        nivel:      [],
        parteA:     '',
        ref:        []
    };
    
    let frmObj = new FormData(frm4loaded);
    let part;

    // REVIEW: Vezi poate poți rafina și mai mult după: https://stackoverflow.com/questions/2896626/switch-statement-for-string-matching-in-javascript
    // parcurge structura elementelor de formular, fiecare fiind la rândul său un array, având primul element `name`-ul elementului.
    for (part of frmObj) {
        // console.log("Am componenta: ", part);
        switch (part[0]) {
            case 'id':
                CS.id = part[1];
            break;            
            case 'nume':
                CS.nume = part[1];
                //+ TODO: Declanșează aici apariția unei erori dacă nu există valoare.
            break;
            case 'parteA':
                CS.parteA = part[1];
            break;
            case 'cod':
                CS.cod = part[1];
            break;
            case (part[0].match(/^activ([a-z])\w+/) || {}).input:
                // console.log('Am gasit ', (part[0].match(/^activ([a-z])\w+/) || {}).input);
                CS.activitati.push(part[1]);
            break;
            case 'disciplina':
                CS.disciplina.push(part[1]);
            break;
            case 'coddisc':
                CS.coddisc = part[1];
            break;
            case 'nivel':
                CS.nivel.push(part[1]);
            break;
            case 'ref':
                CS.ref.push(part[1]);
            break;
        }
    }
    // console.log('Datele trimise la server sunt: ', CS);
    pubComm.emit('updateComp', CS);
    // doar dacă înregistrarea este una care există deja în bază faci reload pentru a reflecta modificările
    if (CS.id) {
        location.reload();
    } else {
        pubComm.on('updateComp', (id) => {
            // console.log('De la server am primit următorul id: ', id);
            location.href = `/administrator/compets/${id}`;
        });
    }
    
};

let idComp = document.getElementById('compid');

function clearFrm () {
    window.location.href = '/administrator/compets/new';
}

function delComp () {
    let id = idComp.value;
    if (id) {
        // console.log('Id-ul trimis spre ștergere este: ', id);
        pubComm.emit('delComp', id);
        pubComm.on('delComp', (result) => {
            if (id === result) {
                alert('Am șters competența!');
                window.location.href = '/administrator/compets';
            }
        });
    }
}

let sendData  = document.getElementById('sendData'); // ref buton send data
let adaugaAct = document.getElementById('adaugaAct');
addEvt4Elem(domEventedObjs, sendData,  sendData.addEventListener('click',  submitData));
addEvt4Elem(domEventedObjs, adaugaAct, adaugaAct.addEventListener('click', createDynamicFields));

// doar în cazul în care deschizi o competență existentă
if (idComp) {
    let clearData = document.getElementById('clearFrm'); // ref buton de curățare form
    let del1Comp  = document.getElementById('del1Comp'); // ref buton de ștergere competență
    addEvt4Elem(domEventedObjs, clearData, clearData.addEventListener('click', clearFrm));
    addEvt4Elem(domEventedObjs, del1Comp,  del1Comp.addEventListener('click',  delComp));
}

/*
# Obiectul care trebuie să plece în server are următoarele câmpuri
{
    nume:       <String>,
    cod:        <String>,
    activitati: <Array>,
    disciplina: <Array>,
    coddisc:    <String>,
    nivel:      <Array>,
    ref:        <Array>
}
*/