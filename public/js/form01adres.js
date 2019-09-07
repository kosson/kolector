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
            inlineToolbar: true
        }, 
        list: List,
        table: {
            class: Table,
        },
        attaches: {
            class: AttachesTool,
            config: {
                endpoint: 'http://localhost:8080/uploadFile'
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
 * @param {String} [cls] este un array ce cuprinde clasele elementului
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
                let divBtnGroupToggle = new createElement('div',   '', ['btn-group-toggle', key], {"data-toggle": "buttons"}).creeazaElem();          
                labelBtn.appendChild(inputCheckBx);
                divBtnGroupToggle.appendChild(labelBtn);
                discipline.appendChild(divBtnGroupToggle);
            }
        }
    });
});

/* === Prezentarea competențelor specifice === */
// Locul de inserție a tabeleului
var compSpecPaginator = document.querySelector('#paginatorSec04');
var activitatiSelectate = []; // array-ul care va colecta activitățile selectate.
/**
 * Funcție helper pentru prezentarea informațiilor privind activitățile în row separat
 * De funcția aceasta are nevoie `disciplineBifate()`
 * singura formulă de a adăuga interactivtate inputurilor este prin atașarea unui listener cu `onclick`
 * FIXME: Vreodată dacă ai timp, curăță JQuery-ul
 * @param {Object} data sunt datele originale ale tabelului
 */
function tabelFormater (data) {
    // constituie un array al tuturor activităților arondate unei competențe specifice pentru a genera o listă din acestea
    var sectionW   = $('<section></section>');
    var activitati = $(`<ul id="${data.cod}"></ul>`);
    // populare cu activitățile aferente competenței specifice
    data.activitati.forEach((elem) => {
        // pentru fiecare activitate, generează câte un `<li>` care să fie in form check a cărui valoare este chiar textul activității
        let divElem = $('<div class="form-check"></div>').wrap('<li class="list-group-item"><li>');
        divElem.append(`<input class="activitate form-check-input position-static" type="checkbox" value="${elem}" onclick="manageInputClick()"> ${elem}`);
        // am introdus clasa activitate pentru ușura mecanismul de selecție ulterior în funcția manageInputClick()
        activitati.append(divElem);
    });

    // generarea formului folosit la adăugarea de activități
    var wrapper   = $(`<div class="input-group mb-3">`);
    var frmAddAct = $(`<input type="text" aria-label="descrierea noii activități propuse" class="form-control ${data.cod}-add" placeholder="Aici vei introduce descrierea noii activități propuse" aria-describedby="basic-addon2"></input>`);
    var btnWrap   = $('<div class="input-group-append">');
    var btnAdd    = $(`<buton type="button" id="${data.cod}-add" class="btn btn-warning">Adaugă o nouă activitate</div>`).wrap(`<div class="input-group-append">`);
    btnWrap.append(btnAdd);
    wrapper.append(frmAddAct);
    wrapper.append(btnWrap);
    // aici se creează butonul care permite adăugarea de elemente noi la lista de activități
    $(btnAdd).on('click', function () {
        let divElem = $('<div class="form-check"></div>').wrap('<li class="list-group-item"><li>');
        divElem.append(`<input class="activitate form-check-input position-static" type="checkbox" value="${$(frmAddAct).val()}" checked onclick="manageInputClick()"> ${$(frmAddAct).val()}`);
        // am introdus clasa activitate pentru ușura mecanismul de selecție ulterior în funcția manageInputClick()
        activitati.append(divElem);
        activitatiSelectate.set($(frmAddAct).val(), data.cod); // introdu deja activitatea în mecanismul construit cu Map
        console.log(activitatiSelectate);
    });

    // Adaugă în wrapper cele două zone: activitati și introducere activități
    sectionW.append(activitati);
    sectionW.append(wrapper);

    // Inițializează cu date instanța clasei Act --> scoate datele caracteristice zonei populate!!!
    watchRow(data);
    // FIXME: Dă-i drumu când e gata!!!
    //activitatiRepopulareChecks(); // restabilirea stării de dinaintea închiderii rândului cu lista de activități
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
 *  Funcția are rolul să creeze un obiect în baza clasei `Act`. Acesta va înmagazina datele rândului creat pentru activități
 *  @param {Obiect} data 
 */
function watchRow (data) {
    // instanțiază obiectul inception prin pasarea datelor curente în constructorul clasei.
    let inception = new Act(data);
    XY = inception;
}

// mecanism de colectare al activităților bifate sau nu
var activitatiSelectate = new Map();

/** 
 * Funcția are rolul de a restabili starea de dinainte de a scoate din DOM activitățile unei competențe
 */
function activitatiRepopulareChecks () {
    let rowData = XY.getData();

    // array-ul activităților care vin din bază
    var arr = Array.from(document.getElementsByClassName('activitate'));
    // pentru fiecare element care se află în array, caută în Map, dacă are un obiect corespondent. Dacă da, setează atributul la checked

    // selectează doar elementele care au valoarea codului competenței și fă-le să apară bifate.
    const existing = arr.map((element) => {
        if ((activitatiSelectate.has(element.value))) {
            element.checked = true;
        }
    });

    /* ====== Popularea cu activitățile create de user ======*/
    var contentMap = activitatiSelectate.entries();
    // creează punctul de inserție pentru activitățile care au fost dorite opțional
    var ancora = document.getElementById(XY.getData().cod);

    // constituie un array al activităților care se încarcă din bază
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
 *  Funcția este event handler pentru click-urile de pe inputurile create dinamic în rândul, care la rândul său este creat dinamic.
 *  Are acces la obiectul `XY`, care oferă datele rândului.
 *  Aici se verifică bifele și se crează un `Map` cu datele care trebuie inroduse în obiectul `RED`
 */
function manageInputClick () {
    let rowData = XY.getData();
    // $(`#arteviz3\\-1\\.1`).show(); MEMENTO!!!! Bittes like fuckin sheet!
    // $(`#arteviz3\\-1\\.1`).css('background-color', 'salmon');

    // selectează `<ul>`-ul care ține toate inputurile
    // var listaID = document.getElementById(`${rowData.cod}`);
    // constituie un array cu toate elementele input
    // var arr = Array.from(listaID.getElementsByTagName('input')); // OLD!!! FIXME: Șterge-mă!
    var arr = Array.from(document.getElementsByClassName('activitate'));

    // pentru fiecare dintre elementele din array, verifică dacă a fost bifat.
    // dacă a fost bifat, adaugă-l în Map
    var existing = arr.filter((elem) => {
        if (elem.checked) {
            return true; // dacă e true, adaugă element bifat în rezultat
        } else if (activitatiSelectate.has(elem.value)) { // dacă nu e bifat, verifică dacă nu cumva se află în Map de la o bifare anterioară
            activitatiSelectate.delete(elem.value); // STERGE-L!!!
        }
    });
    // console.log(existing);
    // pentru array-ul inputurilor bifate, 
    existing.forEach((elem) => {// verifică dacă valorile sunt în Map
        activitatiSelectate.set(elem.value, rowData.cod);
    });

    // selectează tabelul mare din care vei ținti checkboxul de pe rândul competenței specifice
    // ceea ce se dorește este ca atunci când există cel puțin un element bifat, să fie bifat și rândul competenței specifice
    if (activitatiSelectate.size) {
        document.getElementById('competenteS').querySelector(`input[value="${rowData.cod}"]`).checked = true;
        console.log(activitatiSelectate);
    } else {
        document.getElementById('competenteS').querySelector(`input[value="${rowData.cod}"]`).checked = false;
    }
    // TODO: cazul în care este bifată competența specifică dar niciuna dintre activități. În cazul acesta va fi adaugata doar referința către competență considerandu-se ca include toate activitățile.

    // TODO: Fă prepopulare la redeschidere? AIASTA-I cam MAAAAAAD! Dar ține-o acolo pe vine.

    console.log(activitatiSelectate.size);
}

function addMeDeleteMe () {
    let rowData = XY.getData();
} 
/* ======== MAGIA ESTE GATA, APLAUZE pentru o mare măgărie, care... FUNCȚIONEAZĂ :)))))) ======= */

/**
 * Funcția `diciplineBifate` are rolul de a extrage datele pentru disciplinele existente în vederea
 * constituirii obiectului mare care să fie trimis spre baza de date. 
 * Pentru că se folosește Bootstrap 4, aceasta este soluția corectă în cazul checkbox-urilor.
 * TODO: Extinde suportul și pentru celelalte situații de checkbox-uri pentru concizie!!! (arii în relații, și niveluri în relație)
 * Încarcă și obiectul `RED` care colectează datele de formular: `RED.discipline` și `RED.etichete`
 */
function disciplineBifate () {
    let values = [];
    // selectează toate checkbox-urile checked.
    document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value}) => {
        values.push(value);
    });

    // ori de câte ori va fi apăsată o disciplină, se vor aduce date noi. Deficiența este că baza de date este atinsă la fiecare selecție
    pubComm.emit('csuri', values);
    // TODO: emite apel socket către baza de date și extrage conform selecției, un subset  (ex: [ "matexpmed2", "comlbrom2" ])
    // FIXME: șterge conținutul tabelului la apel
    const tabelComps = document.querySelector('#competenteS'); // selectează tabelul țintă
    
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
                var row = table.row(tr); // row() este o metodă de-a lui data table. Transformă tr-ul JQuery în row de data-table
        
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

                    // pune check-urile pe cele care au fost deja selectate.
                    activitatiRepopulareChecks();
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
// let form = document.getElementById('form01adres');
// var dateRED = new FormData(form);
var RED = {
    langRED: '',
    title: '',
    titleI18n: [],
    idContributor: '',
    description: '',
    licenta: '',
    // pas 2
    arieCurriculara: '',
    level: [],
    discipline: [],
    etichete: []
};

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
            selects.forEach( selectElem => {
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
    var email = document.querySelector('#emailUser').value;
    RED.idContributor = email;
    // Adaugă descrierea
    var descriere = document.querySelector('#descriereRed').value;
    RED.description = descriere;
    // Adaugă licența pentru care s-a optat
    var licenta = document.querySelector('#licente');
    var licOpt = licenta.options[licenta.selectedIndex].value;
    RED.licenta = licOpt;
}

/* ====== Pasul 2 ====== */
/**
 * Funcția are rolul de a completa cu date obiectul `RED` cu datele de la `Pas2`.
 */
function pas2 () {
    // introducerea arie curiculare selectare din options
    var arie = document.querySelector('#arii-curr');
    var optArie = arie.options[arie.selectedIndex].value;
    RED.arieCurriculara = optArie;
    // Obținerea valorilor pentru nivel
    var niveluriScolare = document.querySelector('#nivel');
    var noduriInputNiveluri = niveluriScolare.querySelectorAll('input');
    noduriInputNiveluri.forEach(input => {
        if (input.checked) {
            RED.level.push(input.value);
        }
    });
    // disciplinele și etichetele sunt încărcate din funcția `disciplineBifate()`
    // selectează toate checkbox-urile checked.
    document.querySelectorAll("#discipline input[type='checkbox']:checked").forEach(({value}) => {
        RED.discipline.push(value);
        RED.etichete.push(value);
    });
}

// var primaDisciplina = [];
// var disCS = document.getElementById('discipline');
// discipline.addEventListener('click', adaugPrimaDisciplina);
// var disInputuri = disCS.getElementsByTagName('input');
// console.log(disInputuri);
// var disCSchildren = disCS.childNodes;
// disInputuri.forEach((dis) => {
//     console.log(dis);
//     dis.addEventListener('click', adaugPrimaDisciplina);
// });