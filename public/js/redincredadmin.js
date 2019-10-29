/* ======== Integrarea lui EditorJS ======== https://editorjs.io */
// const editorX = new EditorJS({
//     placeholder: 'Introdu conținutul nou sau copiază-l pe cel pe care îl ai într-un material.',
//     /**
//     * onReady callback
//     */
//     onReady: () => {
//         console.log('Editor.js is ready to work!');
//     },
//     /**
//      * Id of Element that should contain Editor instance
//      */
//     holder: 'codex-editor',
//     /**
//      * Enable autofocus
//      */ 
//     autofocus: true
// });

// Introdu mecanismul de ștergere
// #1 Culege id-ul
// #2 Trimite un event „delresid” in server::serverul șterge înregistrarea din MongoDB și din Elasticsearch și directorul de pe HDD.
// #3 serverul trimite înapoi pe același eveniment confirmarea că a șters tot și face redirectare către /profile/resurse

// #1
var resurse = document.getElementsByClassName('resursa');
var resArr = Array.from(resurse);
var dataRes = resArr[0].dataset;

// Managementul modalului
$( document ).on( "click", "#delete", function() {
    $('#exampleModal').modal('hide');
});

// detaliile resursei
var resObi = {id: dataRes.id, contribuitor: dataRes.contribuitor};

// #2
function deleteRes () {
    pubComm.emit('delresid', resObi);
    console.log('Am trimis obiectul: ', resObi);
    pubComm.on('delresid', (res) => {
        console.log(res);
    });
    window.location.href = '/profile/resurse/';
}

// #3
var validateCheckbox = document.getElementById('valid');
validateCheckbox.addEventListener('click', validateResource);
var resursa = document.getElementById(dataRes.id);

// setează clasele în funcție de starea resursei
if (validateCheckbox.checked) {
    resursa.classList.add('validred');
} else {
    resursa.classList.add('invalidred');
}

/**
 * Funcția are rolul de listener pentru input checkbox-ul pentru validare
 * Modifică documentul în bază, declarându-l valid
 * @param {Object} evt 
 */
function validateResource (evt) {
    var queryObj = {_id: dataRes.id};
    // se va trimite valoarea true sau false, depinde ce valoarea are checkbox-ul la bifare sau debifare
    if (validateCheckbox.checked) {
        // verifică dacă există clasa 'invalidred' (resursa pornește nevalidată)
        if (resursa.classList.contains('invalidred')) {
            resursa.classList.replace('invalidred', 'validred');
        }
        queryObj.expertCheck = true;
        pubComm.emit('validateRes', queryObj);
    } else {
        if (resursa.classList.contains('validred')) {
            resursa.classList.replace('validred', 'invalidred');
        }
        queryObj.expertCheck = false;        
        pubComm.emit('validateRes', queryObj);
    }
    pubComm.on('validateRes', (response) => {
        // TODO: modifică backgroundul galben în verde pal
        if (response.expertCheck) {
            console.log('Schimb culoarea background-ului din galben în verde pal');
        } else {
            console.log('Schimb culoarea background-ului din verde pal în galben');
        }
    });
}