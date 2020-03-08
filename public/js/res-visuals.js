console.log('M-am încărcat');

// Resurse afișate tabelar
var TblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var uResTbl = cloneTbl.querySelector('#resurseTab');       // ref către div-ul gazdă al tabelului 
let divResurseTabelare = document.createElement('table');  // creează tabel
divResurseTabelare.classList.add('userResTbl');            // adaugă clasă la tabel
uResTbl.appendChild(divResurseTabelare);                   // append tabel la div-ul gazdă

pubComm.emit('allRes');
pubComm.on('allRes', (resurse) => {
    // RANDEAZĂ TABELUL
    // console.log(resurse.resurse);
    // https://datatables.net/manual/data/orthogonal-data
    $('.userResTbl').DataTable({
        data: resurse,
        columns: [
            {
                data: '_id',
                render: function clbkId (data, type, row) {
                    return `<a href="${window.location.origin}/profile/resurse/${data}">Deschide</a>`;
                }
            },
            {
                data: 'expertCheck',
                render: function clbkExpertChk (data, type, row) {
                    // if ( type === 'display' || type === 'filter' ) {

                    // }
                    console.log(data);
                    if (data) {
                        return "validată";
                    } else {
                        return "nevalidată";
                    }
                }
            },
            {data: 'title'},
            {data: 'autori'},
            {data: 'description'},
            {data: 'licenta'}
        ]
    });
});

var resVisuals = document.querySelector('#visuals');
resVisuals.appendChild(uResTbl); // injectează tabelul resurselor tabelare