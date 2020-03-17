// Resurse afișate tabelar
var TblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var uResTbl = cloneTbl.querySelector('#resurseTab');       // ref către div-ul gazdă al tabelului 
let divResurseTabelare = document.createElement('table');  // creează tabel
divResurseTabelare.classList.add('userResTbl');            // adaugă clasă la tabel
uResTbl.appendChild(divResurseTabelare);                   // append tabel la div-ul gazdă

pubComm.emit('allUsers');
pubComm.on('allUsers', (resurse) => {
    // console.log(moment.locales());
    let newResultArr = []; // noul array al obiectelor resursă
    resurse.map(function clbkMapResult (obi) {
        obi.dataRo = moment(obi.date).locale('ro').format('LLL');
        newResultArr.push(obi);
    });
    // https://datatables.net/manual/data/orthogonal-data
    var table = $('.userResTbl').DataTable({
        responsive: true,
        data: newResultArr,
        ordering: true,
        info: true,
        columns: [
            {   
                title: 'Avatar',
                data: 'googleProfile.picture',
                render: function clbkGPic (data, type, set) {
                    return `<img src="${data}" height="80" width="80">`;
                }
            },
            {
                title: 'Id',
                data: '_id',
                render: function clbkId (data, type, row) {
                    return `<a href="/administrator/users/${data}" role="button" class="btn btn-primary btn-sm btn-block">${data}</a>`;
                }
            },
            {
                title: 'Data',
                data: {
                    _: 'dataRo',
                    sort: 'created'
                },
                render: function clbkTimeFormat (data, type, row) {
                    return `<p>${data}</p>`;
                }
            },
            {
                title: 'Admin',
                data: 'roles',
                render: function clbkExpertChk (data, type, row) {
                    // console.log(data);
                    if (data.admin) {
                        return "admin";
                    } else {
                        return "user";
                    }
                }
            },
            {
                title: 'Email',
                data: 'email',
                // render: function clblEmail (data, type, row) {
                    
                // }
            },
            {
                title: 'Nume',
                data: 'googleProfile.name',
                // render: function clbkEmail (data, type, row) {
                //     // console.log(data);
                //     return `<p>${data}</p>`;
                // }
            },
            {
                title: 'Roluri',
                data: 'roles.rolInCRED[, ]',
                // render: function clbkRole (data, type, full, meta) {
                //     console.log(data);
                //     if ( type === 'display'  || type === 'filter' ) {
                //         return data.rolInCRED;
                //     }
                // }
            },
            {
                title: 'Unități',
                data: 'roles.unit[, ]',
                // render: function clbkRole (data, type, row) {
                //     // console.log(data);
                //     if ( type === 'display'  || type === 'filter' ) {
                //         return data.unit;
                //     }
                // }
            }
        ],
        autofill: true,
        select: true,
        responsive: true,
        buttons: true,
        length: 10,
    
        /*exporting */
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
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