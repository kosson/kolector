import {pubComm} from './main.mjs';

// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

// ======== CĂUTAREA UNUI UTILIZATOR
var findUserBtn = document.querySelector("#findUserBtn");
findUserBtn.addEventListener('click', function clbkFindUser (evt) {
    evt.preventDefault();
    pubComm.emit('person', document.querySelector('#findUserField').value);
});

pubComm.on('person', (data) => {
    renderUsr.innerHTML = '';
    showUser(data.hits.hits);
    // console.log(data.hits.hits);
    // Afișează eroare în cazul în care înregistrarea nu este indexată.
    if (data.length === 0) {
        $.toast({
            heading: 'Neindexat, poate?',
            text: "Utilizatorul căutat fie nu există, fie nu a fost indexat. Acum îl voi căuta în baza de date și încerc o reindexare",
            position: 'top-center',
            showHideTransition: 'fade',
            icon: 'error',
            hideAfter: 7000
        });
        // TODO: reindexează userul!
        // pubComm.emit('person', {'reindex': '1'});
    }
});

var userTmpl = document.querySelector('#usertpl'); // Pas 1 - Fă o referință către template
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

var userFile;
// Primirea detaliilor privind utilizatorul ales
pubComm.on('personrecord', function clblPersReds (resurse) {
    // console.log(resurse); //FIXME: dezactivează la final!!!
    renderUsrDetails.innerHTML = '';
    userFile = resurse;
    showUserDetails(resurse);
});

// Referință către template
var usrDetailsTmpl = document.querySelector('#userdetailtpl');
var renderUsrDetails = document.querySelector('#showusrdetails');

/**
 * Funcția are rolul de a afișa detaliile despre un utilizator [roluri în sistem, ultimele 5 contribuții]
 * @param {Object} descriere 
 */
function showUserDetails (descriere) {

    // clonează conținutul din template
    var cloneContent = usrDetailsTmpl.content.cloneNode(true); // clonarea template-ului

    // injectează datele primite în elementele template-ului
    // ===== AVATAR =====
    var userAvatar = cloneContent.querySelector('.admUdesc__avatar'); // Numele utilizatorului
    userAvatar.src = descriere.googleProfile.picture;
    userAvatar.alt = descriere.googleProfile.name;

    // ===== ID =====
    var userID = cloneContent.querySelector('.admUdesc__admUid');
    userID.textContent = descriere._id;

    // ===== ROLES =====
    var uRoles = cloneContent.querySelector('.admUsesc__admUroles');
    descriere.roles.rolInCRED.map(function clbkRolesTmpl (rol) {
        let rolTag = document.createElement('span');
        rolTag.classList.add('badge');
        rolTag.classList.add('badge-success');
        rolTag.classList.add('admUsesc__admUroles--role');
        rolTag.textContent = rol;
        uRoles.appendChild(rolTag);
    });

    // ==== UNITS =====
    var uUnits = cloneContent.querySelector('.admUsesc__admUunits');
    descriere.roles.unit.map(function clbkUnitsTmpl (unit) {
        let unitTag = document.createElement('span');
        unitTag.classList.add('badge');
        unitTag.classList.add('badge-warning');
        unitTag.classList.add('admUsesc__admUroles--unit');
        unitTag.textContent = unit;
        uUnits.appendChild(unitTag);
    });

    // ===== RESURSE AFIȘARE =====
    var uResurse = cloneContent.querySelector('.resurseUser');
    descriere.resurse.map( function clbkResUser (resursa) {
        // Creează containerul cardului
        let divCard = document.createElement('div');
        divCard.classList.add('card');

        // Creează headerul cardului
        let divCardHeader = document.createElement('div');
        divCardHeader.classList.add('card-header');
        let h5CardHeader = document.createElement('h5');
        h5CardHeader.classList.add('card-title');
        let aH5CardHeader = document.createElement('a');
        aH5CardHeader.href = `/profile/resurse/${resursa._id}`;
        aH5CardHeader.role = 'button';
        aH5CardHeader.classList.add('btn');
        aH5CardHeader.classList.add('btn-dark');
        aH5CardHeader.textContent = resursa.title;
        h5CardHeader.appendChild(aH5CardHeader); // injectează elementul a în h5
        divCardHeader.appendChild(h5CardHeader); // injectează elementul h5 în .card-header
        divCard.appendChild(divCardHeader); // inkectează .card-header în .card

        // Creează body-ul card-ului
        let divCardBody = document.createElement('div');
        divCardBody.classList.add('card-body');
        divCard.appendChild(divCardBody);

        // creează descriere în card
        let resDescr = document.createElement('p');
        resDescr.textContent = resursa.description;
        divCardBody.appendChild(resDescr);

        // injectează
        uResurse.appendChild(divCard);
    });

    // injectează template-ul în DOM
    renderUsrDetails.appendChild(cloneContent);
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