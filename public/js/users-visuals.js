console.log('M-am încărcat');

// Resurse afișate tabelar
var TblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var cloneTbl = TblTmpl.content.cloneNode(true);      // clonarea template-ului pentru afișare tabelară

var uResTbl = cloneTbl.querySelector('#resurseTab');       // ref către div-ul gazdă al tabelului 
let divResurseTabelare = document.createElement('table');  // creează tabel
divResurseTabelare.classList.add('userResTbl');            // adaugă clasă la tabel
uResTbl.appendChild(divResurseTabelare);                   // append tabel la div-ul gazdă

pubComm.emit('allUsers');
pubComm.on('allUsers', (resurse) => {
    // RANDEAZĂ TABELUL
    console.log(resurse);
    // https://datatables.net/manual/data/orthogonal-data
    var table = $('.userResTbl').DataTable({
        data: resurse,
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
                    // return `<a href="${window.location.origin}/profile/resurse/${data}">Deschide</a>`;
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
                data: 'email'
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
                data: 'roles.rolInCRED',
                // render: function clbkRole (data, type, full, meta) {
                //     console.log(data);
                //     if ( type === 'display'  || type === 'filter' ) {
                //         return data.rolInCRED;
                //     }
                // }
            },
            {
                title: 'Unități',
                data: 'roles.unit',
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
        ]
    });
});

var resVisuals = document.querySelector('#visuals');
resVisuals.appendChild(uResTbl); // injectează tabelul resurselor tabelare