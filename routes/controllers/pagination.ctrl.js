/**
 * Funcție de paginare a rezultatelor obținute din MongoDB
 * @param {Object} req 
 * @param {Object} model 
 * @returns 
 */
exports.pagination = async function pagination (req, model) {
    try {
        // https://cloudnweb.dev/2021/04/pagination-nodejs-mongoose/
        // req trebuie să fie un obiect care să aibă următoarea semnătură
        /*
        {
            "query": {
                "projection": {
                "expertCheck": true,
                "level": {
                    "$in": [
                    "Clasa a IV-a",
                    "Clasa a V-a",
                    "Clasa a VI-a"
                    ]
                },
                "discipline": {
                    "$in": [
                    "Istorie",
                    "Biologie"
                    ]
                }
                },
                "select": "date level title autori description etichete",
                "exclude": [],
                "sortby": [],
                "sortDefaultField": "date"
            },
            "pageNr": 1,
            "limitNr": 10,
            "skipNr": 20
        }
        */

        console.log(`Am primit următoarea cerere: `, JSON.stringify(req, null, 2));

        /* === TRATAREA OBIECTULUI CERERII === */
        let queryStr = JSON.stringify(req.query.projection);    // serializează obiectul cerere
        req.query.projection = JSON.parse(queryStr);            // reatribuirea obiectului după prelucrare
        let obi = req.query.projection ?? {};                   // pentru fiecare cheie valoare din projection, adaugă într-un find
        // console.log('[pagination.ctrl] obiectul criteriilor de selectie ptr Mongoose ', JSON.stringify(obi, null, 2));

        /* === INSTANȚIEREA OBIECTULUI QUERY === */
        let query = model.find(obi);    // https://mongoosejs.com/docs/tutorials/query_casting.html -> Implicit $in
        query.select(req.query.select); // Adu-mi doar câmpurile dorite din înregistrare
        if (req.query.exclude.length > 0) {
            req.query.exclude.forEach(field => delete query[field]);    // Șterge câmpurile menționate de client din obiectul `Query`
        }
        
        /* === NUMARUL TOTAL DE ÎNREGISTRĂRI GĂSITE === */
        let total = await model.where(obi).countDocuments();
        // console.log("[pagination.ctrl] Numarul datelor este: ", total);

        /* === PAGINAREA === */
        let pagination = {
            next: {},
            prev: {}
        };  // obiect de gestiune al paginării
        let page     = Math.max(0, req.pageNr) === 0 ? 1  : Math.max(0, req.pageNr);     // pagina 1 va fi din oficiu, dacă nu avem valoare precizată pentru pagină; `Math.max(0, req.pageNr)` acoperă cazul `null` din client
        let limit    = Math.max(0, req.limitNr) === 0 ? 10 : Math.max(0, req.limitNr);   // dacă nu este precizat numărul de rezultate afișat de pagină, trimite din oficiu 10
        console.log(`Valoarea lui page este `, page, ` iar valoarea limit este `, limit);

        let startIdx = (page - 1) * limit;  // calculează câte rezultate trebuie sărite pentru a ajunge la fereastra de date necesare
        let endIdx   = page * limit;
        console.log("[pagination.ctrl] indexul de start este ", startIdx, " iar indexul de final este ", endIdx);

        // dacă ești pe prima pagină, nu vrei să apară `previous`, iar dacă ești pe ultima, nu vrei să apară `next`.
        /* ==== NEXT page ==== */
        if (endIdx < total) {
            pagination.next['page'] = page++;
            pagination.next['limit'] = limit;
        }

        /* ==== PREVIOUS page ==== */
        if (startIdx > 0) {
            pagination.prev['page'] = page--;
            pagination.prev['limit'] = limit;
        }

        /* === SETARE SKIP și LIMIT pe obiectul QUERY === */
        query.skip(startIdx).limit(limit);

        /* === EXTAGE DOCUMENTELE ===*/
        let date = await query.exec();

        // datele necesare clientului
        return {date, total, pagination}; 
    } catch (error) {
        console.log(error);
    }
};