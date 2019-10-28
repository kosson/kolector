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

// #2
function deleteRes () {
    var resObi = {id: dataRes.id, contribuitor: dataRes.contribuitor};
    pubComm.emit('delresid', resObi);
    console.log('Am trimis obiectul: ', resObi);
    pubComm.on('delresid', (res) => {
        console.log(res);
    });
    window.location.href = '/profile/resurse/';
}

// #3
// Adu resursele pentru un utilizator
function getUserRes () {
    var userEmail = document.getElementById('useremail').value;
}