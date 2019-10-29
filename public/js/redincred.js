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