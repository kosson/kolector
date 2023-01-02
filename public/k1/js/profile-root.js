// Verifică dacă browserul are suport pentru încărcarea de resurse.
if (window.File && window.FileReader && window.FileList && window.Blob) {

    /**
     * Funcția are rolul de a încărca o imagine în repo/iduser
     */
    async function uploadOneFile () {
        var imageResource = document.querySelector('#avatar');          // ref la elementul img care va găzdui resursa
        var file = document.querySelector('input[type=file]').files[0]; // creează un file din primul care este în array-ul acestora
        var reader = new FileReader();          // instanțiază obiectul `FileReader`
        reader.onload = function (event) {
           imageResource.src = reader.result;
        }
        reader.readAsDataURL(file);
        console.log('Fișierul este ', file);

        fetch('/avatar', {
         method: 'POST',
         body: file
        }).then((response) => {
         return response.json();
        }).then((success) => {
         console(`Am reușit: ${success}`);
        }).catch((error) => {
         console.log(error);
        });
     }
  } else {
    alert(`Browserul tău are o versiune care nu permite încărcarea de resurse.`);
  }