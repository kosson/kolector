import {pubComm} from './main.mjs';

// var csrfToken = '';

// if(document.getElementsByName('_csrf')[0].value) {
//     csrfToken = document.getElementsByName('_csrf')[0].value;
// }

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });


// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

var resVisuals = document.querySelector('#visuals');
resVisuals.innerHTML = ''; // reset!
// Resurse afișate tabelar
var TblTmpl = document.querySelector('#compsTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var competsTbl = cloneTbl.querySelector('#compsTab');       // ref către div-ul gazdă al tabelului 
let divCompetsTabelare = document.createElement('table');  // creează tabel
divCompetsTabelare.classList.add('competsTbl', 'display', 'table', 'table-striped', 'table-bordered');            // adaugă clasă la tabel
competsTbl.appendChild(divCompetsTabelare);                   // append tabel la div-ul gazdă

/* === AFIȘAREA TABELARĂ A RESURSELOR === */
pubComm.emit('allComps'); // adu-mi resursele 
pubComm.on('allComps', (compets) => {
    // console.log('[comps-visuals.js] competențele aduse sunt ', compets);
    let newResultArr = []; // noul array al obiectelor copmpetență specifică

    //_ WORKING: Verifici dacă fiecare obiect are toate proprietățile. 
    let arrPropsNeeded = ['nume', 'ids', 'cod', 'activitati', 'disciplina', 'coddisc', 'nivel', 'nrREDuri'];
    compets.map(function clbkMapResult (obi) {
        obi.dataRo = moment(obi.date).locale('ro').format('LLL');
        // verifică dacă toate proprietățile există. Dacă nu, adaugă-le cu valoarea zero
        let keys = Object.keys(obi),
            diff = arrPropsNeeded.filter(k => !keys.includes(k)),
            k;
        for (k of diff){
            if (obi[k] === undefined) {
                console.log('Nu am proprietatea: ', k);
                obi[k] = 0;
            }
        }
        newResultArr.push(obi);
    });
    // RANDEAZĂ TABELULresurse
    // https://datatables.net/manual/data/orthogonal-data
    $('.competsTbl').DataTable({
        processing: true,
        info: true,
        responsive: true,
        data: newResultArr,
        order: [[2, 'desc']],
        ordering: true,
        info: true,
        lengthChange: true,
        dom: 'Bfrtip',
        buttons: [
            'colvis',
            'copy',
            'excel',
            'print',
            {
                extend: 'csv',
                text: 'toate datele',
                exportOptions: {
                    modifier: {
                        search: 'none'
                    }
                }
            }
        ],
        columns: [
            {
                title: 'Introdus la',
                data: {
                    _: 'dataRo'
                },
                render: function clbkTimeFormat (data, type, row) {
                    return `<p>${data}</p>`;
                }
            },
            {
                title: 'Accesează',
                data: '_id',
                render: function clbkId (data, type, row) {
                    data = `<a href="${window.location.origin}/administrator/compets/${data}" class="btn btn-primary btn-sm active" role="button" aria-pressed="true">${data.slice(0,5)}...</a>`; //idRED,ids,activitati,disciplina,nivel,ref,REDuri,_id,nume,cod,coddisc,parteA,__v,dataRo
                    return data;
                }
            },
            {
                title: 'RED-uri',
                data: 'nrREDuri'
            },
            {
                title: 'Denumire',
                data: 'nume'
            },
            {
                title: 'ID',
                data: 'ids'
            },
            {
                title: 'Cod',
                data: 'cod',
            },
            {
                title: 'Activități',
                data: 'activitati',
                render: function clbkActc (data, type, row) {
                    data = `<ul>${data.map(elem => `<li>${elem}</li>`).join(' ')}</ul>`;
                    return data;
                },
                width: "40%"
            },
            {
                title: 'Disciplină',
                data: 'disciplina'
            },
            {
                title: 'Cod disciplină',
                data: 'coddisc'
            },
            {
                title: 'Clasă',
                data: 'nivel'
            }
        ],
        language: {
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
});
resVisuals.appendChild(competsTbl); // injectează tabelul resurselor tabelare

/**
 * Funcția este apelată pentru fiecare fișier din array-ul `FileList`
 *
 */
function fileSender (file) {
    pubComm.emit('loadCompSet', file);
}
pubComm.on('loadCompSet', (r) => {
    if (r == false) {
        alert("Nu am încărcat setul. Are erori!");
    }
    alert(`Am încărcat ${r} competențe specifice cu activitățile lor`);
    location.reload();
});
/* === TRIMITE CSV LA SERVER === */
/**
 * Funcția joacă rol de listener pentru butonul de trimitere a fișierului către server
 * Apelează `fileSender()` pentru fiecare file din `FileList`
 */
function sendCsv () {
    let files = document.getElementById('fileloadercs').files;
    Array.from(files).forEach(fileSender);
}

globalThis.sendCsv = sendCsv;