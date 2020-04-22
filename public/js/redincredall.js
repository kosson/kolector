const primare = document.getElementById('primare');

// === BUTONUL DE SEARCH ===
const searchResIntBtn = document.getElementById('searchResIntBtn'); // butonul de search
let index = searchResIntBtn.dataset.idx; // extrage indexul din atributul data.
searchResIntBtn.addEventListener('click', function clbkSeachBtnResInterne () {
    const fragSearch = document.getElementById('fragSearchDocs').value;
    if (fragSearch.length > 250) {
        fragSearch = fragSearch.slice(0, 250);
    }
    console.log(fragSearch, "pe", index);
    
    // primul pas, curăță de conținut id-ul `primare`
    primare.innerHTML = '';
    pubComm.emit('searchres', {index, fragSearch}); // emite eveniment în backend
});

/* === afișarea rezultatelor === */
// ref la ancora la care se atașează elementele generate
const containerFoundRes = document.getElementById('primare');
// ref la template de doc găsit
const tmplrec = document.getElementById('searchresult');
pubComm.on('searchres', (documents) => {
    console.log(documents);
    // primul pas, curăță de conținut id-ul `primare`
    primare.innerHTML = '';
    // pentru fiecare element din array-ul rezultatelor generează câte o înregistrare
    for (let doc of documents) {
        // clonează conținutul
        const clonedTmpl = tmplrec.content.cloneNode(true);
        let title = clonedTmpl.querySelector('#restitlelnk')
        title.textContent = doc._source.title;
        title.href=`/resurse/${doc._id}`;
        clonedTmpl.querySelector('#cardtext').textContent = doc._source.description;
        containerFoundRes.appendChild(clonedTmpl);
    }
});