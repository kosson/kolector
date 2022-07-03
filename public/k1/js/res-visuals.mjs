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

// Resurse afișate tabelar
var TblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var uResTbl = cloneTbl.querySelector('#resurseTab');       // ref către div-ul gazdă al tabelului 
let divResurseTabelare = document.createElement('table');  // creează tabel
divResurseTabelare.classList.add('userResTbl', 'display', 'table', 'table-striped', 'table-bordered'); // adaugă clase la tabel
uResTbl.appendChild(divResurseTabelare);                   // append tabel la div-ul gazdă

pubComm.emit('allRes'); // adu-mi resursele 
pubComm.on('allRes', (resurse) => {
    // console.log('[res-visuals.js] resursele aduse sunt ', resurse);
    let newResultArr = []; // noul array al obiectelor resursă
    resurse.map(function clbkMapResult (obi) {
        obi.dataRo = moment(obi.date).locale('ro').format('LLL');
        newResultArr.push(obi);
    });
    // RANDEAZĂ TABELUL
    // https://datatables.net/manual/data/orthogonal-data
    $('.userResTbl').DataTable({
        responsive: true,
        data: newResultArr,
        ordering: true,
        info: true,
        columns: [
            {
                title: 'Data',
                data: {
                    _: 'dataRo',
                    sort: 'date'
                },
                render: function clbkTimeFormat (data, type, row) {
                    return `<p>${data}</p>`;
                }
            },
            {
                title: 'Accesează',
                data: '_id',
                render: function clbkId (data, type, row) {
                    return `<a href="${window.location.origin}/administrator/reds/${data}" class="btn btn-primary btn-sm active" role="button" aria-pressed="true">${data.slice(0,5)}...</a>`;
                }
            },
            {
                title: 'Validare',
                data: 'expertCheck',
                render: function clbkExpertChk (data, type, row) {
                    if (data) {
                        return `<p class="resvalid">validată</p>`;
                    } else {
                        return `<p class="resinvalid">nevalidată</p>`;
                    }
                }
            },
            { 
                title: 'Publică',
                data: 'generalPublic',
                render: function clbkGenPub (data, type, row) {
                    if (data) {
                        return `<p class="respublic">public</p>`;
                    } else {
                        return `<p class="resinvalid">internă</p>`;
                    }
                }
            },
            {
                title: 'Title',
                data: 'title'
            },
            {
                title: 'Autori',
                data: 'autori'
            },
            {
                title: 'Descriere',
                data: 'description'
            },
            {
                title: 'Licență',
                data: 'licenta'
            }
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
});

var resVisuals = document.querySelector('#visuals');
resVisuals.appendChild(uResTbl); // injectează tabelul resurselor tabelare