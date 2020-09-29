var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

var pubComm = io('/redcol', {
    query: {['_csrf']: csrfToken}
});


// === CĂUTAREA UNUI UTILIZATOR ===
pubComm.emit('personrecord', window.location.pathname.split('/').pop());

var userTmpl = document.querySelector('#usertpl');    // Pas 1 - Fă o referință către template
var renderUsr = document.getElementById('showusers'); // Pas 2 - Fă o referință către elementul din DOM unde va fi inserat conținutul rezultat din compilarea template-ului

/**
 * Rolul funcției este de a popula un template Handlebars cu datele din backend
 * @param {Array} resurse 
 */
function showUser (resurse) {
    resurse.map(user => {
        var cloneContent = userTmpl.content.cloneNode(true); // Pas 3 -  Clonează conținutul din template
        
        // Injectează datele în elemente
        var title = cloneContent.querySelector('.card-title');
        title.textContent = user._source.email;
        var family_name = cloneContent.querySelector('.userProfileBtn');
        family_name.name = user._id;
        family_name.textContent = user._source.googleProfile.name;

        // Injectează rezultatul în DOM
        renderUsr.appendChild(cloneContent);
    });
}

/**
 * Funcția are rolul de a aduce toate datele despre utilizator și ultimele 5 contribuții RED.
 * Este un listener pe butoanele cu numele de familie.
 * Emite pe `personrecord`.
 */
function exposeUser () {
    // console.log(event.target.name);
    // adu toate datele despre user (administrative și contribuții)
    pubComm.emit('personrecord', event.target.name);
}

// Referință către fișa de utilizator.
var userFile; // (userFile.resurse)
var tmlOptions = {
    // height: 350,
    // timenav_height: 200,
    // timenav_height_percentage: 22,
    zoom_sequence: 5,
    scale_factor: 2
};

// opțiuni necesare obiectului Timeline
TimelineObj = {
    // scale: "human",
    title: {
        media: {
            url: '',
            caption: '',
            credit: ''
        },
        text: {
            headline: '',
            text: ''
        }
    },
    events: [],
};

/**
 * Funcția are rolul de a elimina toate nodurile copil ale unei rădăcini din DOM
 * @param {Node} element 
 */
function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Primirea detaliilor privind utilizatorul ales
pubComm.on('personrecord', function clbkPersReds (resurse) {
    // TODO: La un moment dat, va trebui schimbat sistemul de afișare pentru a acomoda mii de resurse individuale
    // console.log(resurse.resurse);
    // renderUsrDetails.innerHTML = '';
    removeAllChildren(renderUsrDetails);

    userFile = resurse;

    showUserDetails(resurse); // AFIȘEAZĂ detaliile utilizatorului

    if(resurse.resurse.length > 0) {

        // Tratează cazul existenței avatarului în profilul Google!!!
        if (resurse.hasOwnProperty('googleProfile')) {
            TimelineObj.title.text.headline = resurse.googleProfile.name;
        } else {
            TimelineObj.title.text.headline = resurse.username;
        }

        // TimelineObj.title.text.headline = resurse.googleProfile.name;
        TimelineObj.title.text.text = `Acestea sunt resursele contribuite afișate temporal`;

        resurse.resurse.map(function clbkResursa2Timeline (resursa) {
            let discipline = resursa.discipline.join(', '); // flat-out discipline
            let images = [];

            // doar dacă ai blocuri, alimentezi array-ul imaginilor
            if (resursa.blocks) {
                resursa.content.blocks.map( part => {
                    if (part.type === 'image') {
                        images.push(part);
                    }
                });
            }
            let data = new Date(`${resursa.date}`);
            let transformedObject = {
                media: {
                    url: images.length ? `${images[0].data.file.url}` : '',
                    caption: images.length ? `${images[0].data.file.caption}` : '',
                    credit: '',
                    thumbnail: '',
                    alt: images.length ? `${images[0].data.file.caption}` : '',
                    title: `${resursa.title}`,
                    link: `/resurse/${resursa._id}`,
                    link_target: '_blank'
                },
                unique_id: resursa._id,
                start_date: {
                    year: data.getFullYear(),
                    month: data.getMonth(),
                    day: data.getDay(),
                    hour: data.getHours(),
                    minute: data.getMinutes(),
                    second: data.getSeconds(),
                    millisecond: ''
                },
                text: {
                    headline: `${resursa.title}`,
                    text: `
                        <p class="tmlAuth">${resursa.autori}</p>
                        <p class="tmlDescr">Descriere: ${resursa.description}</p>
                        <p class="tmlDisc">Discipline: ${discipline}</p>
                        <p class="tmlLic">${resursa.licenta}</p>
                    `
                },
                background: {
                    url: `${resursa.coperta}`
                }
            };
            TimelineObj.events.push(transformedObject);
        });

        // RANDEAZA TIMELINE_UL
        new TL.Timeline('timeline-embed', TimelineObj, tmlOptions);

        // RANDEAZĂ TABELUL
        // console.log(resurse.resurse);
        // https://datatables.net/manual/data/orthogonal-data
        $('.userResTbl').DataTable({
            data: resurse.resurse,
            columns: [
                {
                    title: 'Accesează',
                    data: '_id',
                    render: function clbkId (data, type, row) {
                        return `<a href="${window.location.origin}/profile/${data}">Deschide</a>`;
                    }
                },
                {
                    title: 'Validare',
                    data: 'expertCheck',
                    render: function clbkExpertChk (data, type, row) {
                        // if ( type === 'display' || type === 'filter' ) {

                        // }
                        if (data) {
                            return "validată";
                        } else {
                            return "nevalidată";
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
                {title: 'Titlu',data: 'title'},
                {title: 'Autori',data: 'autori'},
                {title: 'Descriere',data: 'description'},
                {title: 'Licența',data: 'licenta'}
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
    }
});

// Referință către template
var usrDetailsTmpl = document.querySelector('#userdetailtpl'); // ref către template-ul detaliilor
var usrResTblTmpl = document.querySelector('#userResTbl'); // ref către template-ul resurselor în format tabelar
var renderUsrDetails = document.querySelector('#showusrdetails'); // ref către ancora din DOM unde se va face injectarea resurselor

/**
 * Funcția are rolul de a afișa detaliile despre un utilizator [roluri în sistem, ultimele 5 contribuții]
 * @param {Object} descriere Este un array de obiecte cu resurse
 */
function showUserDetails (descriere) {
    // clonează conținutul din template
    var cloneContent = usrDetailsTmpl.content.cloneNode(true); // clonarea template-ului pentru detalii user
    var cloneTbl = usrResTblTmpl.content.cloneNode(true); // clonarea template-ului pentru afișare tabelară

    // injectează datele primite în elementele template-ului
    // === AVATAR ===
    var userAvatar = cloneContent.querySelector('.admUdesc__avatar'); // Numele utilizatorului

    // Tratează cazul existenței avatarului în profilul Google!!!
    if (descriere.hasOwnProperty('googleProfile')) {
        userAvatar.src = descriere.googleProfile.picture;
        userAvatar.alt = descriere.googleProfile.name;
    } else {
        userAvatar.src = '/img/karl-magnuson-85J99sGggnw-unsplash-small.jpg';
        userAvatar.alt = descriere.username;
    }

    // === ID ===
    var userID = cloneContent.querySelector('.admUdesc__admUid');
    userID.textContent = descriere._id;

    // === ROLES ===
    var uRoles = cloneContent.querySelector('.admUsesc__admUroles');
    descriere.roles.rolInCRED.map(function clbkRolesTmpl (rol) {
        let rolTag = document.createElement('span');
        rolTag.classList.add('badge');
        rolTag.classList.add('badge-success');
        rolTag.classList.add('admUsesc__admUroles--role');
        rolTag.textContent = rol;
        uRoles.appendChild(rolTag);
    });

    // === UNITS ===
    var uUnits = cloneContent.querySelector('.admUsesc__admUunits');
    descriere.roles.unit.map(function clbkUnitsTmpl (unit) {
        let unitTag = document.createElement('span');
        unitTag.classList.add('badge');
        unitTag.classList.add('badge-warning');
        unitTag.classList.add('admUsesc__admUroles--unit');
        unitTag.textContent = unit;
        uUnits.appendChild(unitTag);
    });

    // === RESURSE AFIȘARE ultimele cinci resurse contribuite [CARD-uri Bootstrap 4] ===
    var uResurse = cloneContent.querySelector('.resurseUser');

    // Extrage ultimele 5 resurse
    var last5REDs = descriere.resurse.slice().sort((a, b) => b.date - a.date).slice(0,5);
    // console.log(last5REDs.length, last5REDs);

    last5REDs.map( function clbkResUser (resursa) {
        // Creează containerul cardului
        let divCard = document.createElement('div');
        // divCard.classList.add('card');
        divCard.classList.add('last_contributed');

        // Creează headerul cardului
        // let divCardHeader = document.createElement('div');
        let divCardHeader = document.createElement('p');
        // divCardHeader.classList.add('card-header');
        let h5CardHeader = document.createElement('h5');
        // h5CardHeader.classList.add('card-title');
        let aH5CardHeader = document.createElement('a');
        aH5CardHeader.href = `/profile/${resursa._id}`;
        aH5CardHeader.role = 'button';
        aH5CardHeader.classList.add('btn');
        aH5CardHeader.classList.add('btn-dark');
        aH5CardHeader.textContent = resursa.title;
        h5CardHeader.appendChild(aH5CardHeader); // injectează elementul a în h5
        divCardHeader.appendChild(h5CardHeader); // injectează elementul h5 în .card-header
        divCard.appendChild(divCardHeader); // inkectează .card-header în .card

        // Creează body-ul card-ului
        // let divCardBody = document.createElement('div');
        // divCardBody.classList.add('card-body');
        // divCard.appendChild(divCardBody);

        // creează descriere în card
        let resDescr = document.createElement('p');
        resDescr.textContent = resursa.description;
        // divCardBody.appendChild(resDescr);
        divCard.appendChild(resDescr);

        // injectează
        uResurse.appendChild(divCard);
    });

    // === SET ADMIN ===
    var admCheck = cloneContent.querySelector('#adminSet');
    if (descriere.roles.admin) {admCheck.checked = true; }

    // Resurse afișate tabelar
    var uResTbl = cloneTbl.querySelector('#resurseTab'); // ref către div-ul gazdă al tabelului 
    let divResurseTabelare = document.createElement('table'); // creează tabel
    divResurseTabelare.classList.add('userResTbl'); // adaugă clasă la tabel
    uResTbl.appendChild(divResurseTabelare); // append tabel la div-ul gazdă

    // injectează template-urile în DOM
    renderUsrDetails.appendChild(cloneContent);
    renderUsrDetails.appendChild(uResTbl); // injectează tabelul resurselor tabelare
}

/**
 * Funcția are rolul de a trimite pe Socket modificarea rolului de Administrator de aplicație
 * @param {String} userId 
 */
function mkAdmin (userId) {
    // console.log(userFile);
    // console.log(event.target.checked);
    if(event.target.checked){
        pubComm.emit('mkAdmin', {
            id: userFile._id,
            admin: true
        });
    } else {
        pubComm.emit('mkAdmin', {
            id: userFile._id,
            admin: false
        });
    }
}

pubComm.on('mkAdmin', (result) => {
    console.log(result);
});

// === ADAUGĂ ROLURI ===
var rolesSet = new Set(); // setul rolurilor care vor fi adăugate în profilul utilizatorului
var unitsSet = new Set(); // setul unit-urilor care vor fi adăugate în profil.

/**
 * Funcția are rolul de a colecta rolurile selectare din `options` și de a constitui un set unic definit prin variabila `rolesSet`
 */
function colectRoles () {
    // culege ce valori au fost selectate
    var element = document.querySelectorAll('#existingRoles option:checked');
    const values = Array.from(element).map(val => {
        if(!rolesSet.has(val.value)) {
            rolesSet.add(val.value);
        }
        return val.value;
    });
    // Șterge din set restul valorilor care diferă de cele din array-ul `values`. P1 - transformă setul în array
    for (let r of rolesSet.values()) {
        // dacă valoarea din set nu se află în array-ul celor selectate, ȘTERGE-L din set. E în plus.
        if (!values.includes(r)) {
            rolesSet.delete(r);
        }
    }
}

/**
 * Funcția are rol de listener al butonului care adaugă roluri suplimentare noi
 */
function addNewRole () {
    pubComm.emit('addRole', {
        id: userFile._id,
        roles: Array.from(rolesSet)
    });
}

/**
 * Funcția are rolul de a adăuga unit-uri
 */
function colectUnits () {
    var unitsString = document.querySelector('#units').value;
    var arrUnits = unitsString.split(",");
    // console.log(arrUnits);
    arrUnits.map(val => {
        if(!unitsSet.has(val)) {
            unitsSet.add(val);
        }
    });
    // Șterge din set restul valorilor care diferă de cele din array-ul `arrUnits`. P1 - transformă setul în array
    for (let r of unitsSet.values()) {
        // dacă valoarea din set nu se află în array-ul celor selectate, ȘTERGE-L din set. E în plus.
        if (!arrUnits.includes(r)) {
            unitsSet.delete(r);
        }
    }
    // console.log(Array.from(unitsSet));
    pubComm.emit('addUnit', {
        id: userFile._id,
        units: Array.from(unitsSet)
    });
}

pubComm.on('addUnit', (resurce) => {
    console.log(resurce);
});

pubComm.on('addRole', (resurce) => {
    console.log(resurce);
});