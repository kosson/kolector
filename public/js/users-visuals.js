var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

var pubComm = io('/redcol', {
    query: {['_csrf']: csrfToken}
});

// Resurse afișate tabelar
var TblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var uResTbl = cloneTbl.querySelector('#resurseTab');       // ref către div-ul gazdă al tabelului 
let divResurseTabelare = document.createElement('table');  // creează tabel
divResurseTabelare.classList.add('userResTbl');            // adaugă clasă la tabel
uResTbl.appendChild(divResurseTabelare);                   // append tabel la div-ul gazdă

pubComm.emit('allUsers');
pubComm.on('allUsers', (resurse) => {
    // TODO: Pentru resursele existente în sistem, deschide un cursor și fă paginare cât mai curând!!!
    // console.log(moment.locales());
    let newResultArr = []; // noul array al obiectelor resursă

    // reformatează câmpuri din fiecare obiect resursă
    resurse.map(function clbkMapResult (obi) {
        obi.dataRo = moment(obi.date).locale('ro').format('LLL');
        // în cazul în care nu ai conturi google, injectează obiectul profilului în datele care nu-l au
        if (obi.hasOwnProperty('googleProfile') === false) {
            obi.googleProfile = {
                picture: `/img/karl-magnuson-85J99sGggnw-unsplash-small.jpg`,
                // Sursa: https://unsplash.com/photos/85J99sGggnw
                name: obi.username 
            };
        }
        newResultArr.push(obi);
    });

    // https://stackoverflow.com/questions/55647364/datatables-columns-columndefs-and-rowcallback-html5-initialisation
    // https://datatables.net/manual/data/orthogonal-data
    var table = $('.userResTbl').DataTable({
        responsive: true,
        data: newResultArr,
        order: [[ 2, "desc" ]],
        ordering: true,
        info: true,
        columnDefs: [
            {
                "targets": 0,
                "searchable": false,
                "className": "habib",
                "data": function (row, type, val, meta) {
                    console.log('Datele din rând arată așa: ', row, ' iar datele din val arată așa ', val);
                    if (type === 'set') {
                        if(!row.googleProfile.picture) {
                            // console.log('Un rând care nu are googleProfile arata asa: ', row);
                            row.googleProfile.picture = `<i class="fas fa-user"></i>`;
                            return;
                        } else {
                            row.googleProfile.picture = `<img src="${row.googleProfile.picture}" height="80" width="80">`;
                        }
                        return;                                                
                    } else if (type === 'display') {
                        return row.googleProfile.picture;   
                    }
                    return row.googleProfile.picture;
                }
            },
            {
                targets: [1,2,3,4,5,6,7],
                className: "beastie",
                data: null
            }
        ],
        columns: [
            {   
                title: 'Avatar',
                // data: null
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