import {pubComm} from './main.mjs';

// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

var resVisuals = document.querySelector('#visuals');
resVisuals.innerHTML = ''; // reset!

// Resurse afișate tabelar
var TblTmpl = document.querySelector('#redClaimTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);    // clonarea template-ului pentru afișare tabelară

var redClaimTbl = cloneTbl.querySelector('#redClaimTab');       // ref către div-ul gazdă al tabelului 
let divCompetsTabelare = document.createElement('table');       // creează tabel
divCompetsTabelare.classList.add('redClaimTbl', 'display', 'table', 'table-striped', 'table-bordered'); // adaugă clasă la tabel
redClaimTbl.appendChild(divCompetsTabelare);                    // append tabel la div-ul gazdă

/* === AFIȘAREA TABELARĂ A RESURSELOR === */
pubComm.emit('allUnclaimedReds'); // adu-mi resursele care au valoarea `false` la claimed. Valoarea `false` apare doar dacă userul nu a fost găsit în sistem [pubComm.emit('allComps');]
pubComm.on('allUnclaimedReds', (unclaimed) => {
    // console.log('[comps-visuals.js] competențele aduse sunt ', compets);
    let newResultArr = []; // noul array al obiectelor red care nu au fost revendicate

    //_ WORKING: Verifici dacă fiecare obiect are toate proprietățile. 
    let arrPropsNeeded = ['_id', 'emailContrib', 'uuid', 'title', 'claimed', 'generalPublic']; // _id emailContrib uuid title claimed generalPublic
    unclaimed.map(function clbkMapResult (obi) {
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

    // console.log(`Datele obținute sunt`, newResultArr);
    // RANDEAZĂ TABELUL resurse
    // https://datatables.net/manual/data/orthogonal-data
    $('.redClaimTbl').DataTable({
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
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        columns: [
            {
                title: 'ID',
                data: '_id',
                render: function clbkId (data, type, row) {
                    data = `<a href="${window.location.origin}/administrator/reds/${data}" class="btn btn-primary btn-sm active" role="button" aria-pressed="true">${data.slice(0,5)}...</a>`;
                    return data;
                }
            },
            {
                title: 'email',
                data: 'emailContrib'
            },
            {
                title: 'uuid',
                data: 'uuid'
            },
            {
                title: 'title',
                data: 'title'
            },
            {
                title: 'claimed',
                data: 'claimed'
            },
            {
                title: 'public',
                data: 'generalPublic'
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
resVisuals.appendChild(redClaimTbl); // injectează tabelul resurselor tabelare

/**
 * Funcția este apelată pentru fiecare fișier din array-ul `FileList`
 *
 */
function fileSender (file) {
    pubComm.emit('loadRedSet', file);
}
pubComm.on('loadRedSet', (r) => {
    if (r == false) {
        alert("Nu am încărcat setul. Are erori!");
    }
    alert(`Am încărcat ${r} competențe specifice cu activitățile lor`);
    // location.reload();
});
function sendRedCsv () {
    let files = document.getElementById('fileloadercs').files;
    Array.from(files).forEach(fileSender);
}

globalThis.sendRedCsv = sendRedCsv;

// let importredsbtn = document.getElementById('importreds');
// importredsbtn.addEventListener('click', sendRedCsv);


// function tryme(){
//     let data = {
//         title: 'Tehnica presării frunzelor și florilor',
//         description: 'Resursa prezintă procesul tehnologic de realizare a unui colaj bidimensional_mărul confecționat prin tehnici de lucru combinate: desenare, decupare, înnodare, lipire, pliere din hârtii',
//         autori: 'Florentina Vartosu, Nicolaie Constantinescu',
//         emailContrib: 'florentina.vartosu@educred.ro',
//         re_luna: 'Decembrie 2021',
//         re_competentapropusa: 'Manifestarea curiozității față de explorarea de mesaje artistice simple, exprimate vizual',
//         re_linkonline: 'https://www.youtube.com/embed/vG1Sty0jH4I',
//         re_incarcarematerial: 'https://drive.google.com/open?id=1BMn-WLzEZ7lG-XSAYZQ2kyOCvZvlUMmO',
//         re_adresadescriptor: 'https://drive.google.com/open?id=13d8qt4dT3Su1Cd-vctK4T3WIBTFeXGUr',
//         discipline: 'Arte vizuale și abilități practice',
//         level: 'Clasa pregătitoare',
//         re_competentaspecifica: 'Manifestarea curiozității față de explorarea de mesaje artistice simple, exprimate vizual',
//         re_competentaspecificacod: 'artViz0-1.3',
//         competenteGen: 'Realizarea de creații funcționale și/sau estetice folosind materiale și tehnici elementare diverse',
//         angel: '5e9832fcf052494338584d92'
//     }
//     pubComm.emit('tryme', data);
// };
// document.getElementById('tryme').addEventListener('click', (evt) => {
//     tryme();
// });

/* === TRIMITE CSV LA SERVER === */
/**
 * Funcția joacă rol de listener pentru butonul de trimitere a fișierului către server
 * Apelează `fileSender()` pentru fiecare file din `FileList`
 */
