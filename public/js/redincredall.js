const RESULTS_PER_PAGE = 8;
let page = 1;
let frompg = (page - 1) * RESULTS_PER_PAGE;

const primare = document.getElementById('primare');
const searchResIntBtn = document.getElementById('searchResIntBtn');
searchResIntBtn.addEventListener('click', function clbkSeachBtn () {
    const fragSearch = document.getElementById('fragSearchDocs').value;
    // primul pas, curăță de conținut id-ul `primare`
    primare.innerHTML = '';
    pubComm.emit('searchres',  fragSearch);
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