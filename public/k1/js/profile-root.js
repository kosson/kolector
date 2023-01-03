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

         // verificarea tipului de fișier
         if (!['image/jpeg', 'image/gif', 'image/png', 'image/svg+xml'].includes(file.type)) {
            console.log('Doar imaginile sunt permise');
            return;
         }

         // verificarea dimensiunii: < 2MB
         if (file.size > 2 * 1024 * 1024) {
            console.log('Fișierul trebuie să fie sub 2MB.');
            return;
         }
         // Creează condițiile pentru a trimite fișierul
         const formdata = new FormData(); // creează o instanță Form
         formdata.append('avatar', file); // adaugă un câmp având conținutul fișierului

         fetch('/avatar', {
            method: 'POST',
            body: formdata
         }).then((response) => {
            return response.json();
         }).then((jsonobj) => {
            console(`Am reușit: ${jsonobj}`);
         }).catch((error) => {
            console.log(error);
         });
     }
  } else {
    alert(`Browserul tău are o versiune care nu permite încărcarea de resurse.`);
  }