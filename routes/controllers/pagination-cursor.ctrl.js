/**
 * Funcție de paginare a rezultatelor obținute din MongoDB
 * este handler pentru evenimentul `pagedRes` din sockets
 * @param {Object} req 
 * @param {Object} model 
 * @returns 
 */
 exports.pagination_cursor = async function pagination_cursor (req, model) {
    try {
        // https://cloudnweb.dev/2021/04/pagination-nodejs-mongoose/
        // console.log(`Am primit următoarea cerere: `, JSON.stringify(req, null, 2));

        let query;                                              // construiește obiectul de interogare pentru Mongoose
        let queryStr = JSON.stringify(req.query.projection);    // serializează obiectul cerere
        req.query.projection = JSON.parse(queryStr);            // reatribuirea obiectului după prelucrare
        let obi = req.query.projection ?? {};                   // pentru fiecare cheie valoare din projection, adaugă într-un `.find()`
        
        /* === NUMARUL TOTAL DE ÎNREGISTRĂRI GĂSITE === */
        let total = await model.where(obi).countDocuments();

        /* === LIMIT === */
        let limit  = Math.max(0, req.limitNr) === 0 ? 10 : Math.max(0, req.limitNr);   // dacă nu este precizat numărul de rezultate afișat de pagină, setează din oficiu 10
        
        /* === ACTUALIZEAZĂ OBIECTUL QUERY CU UN CURSOR DIN CLIENT === */
        let cursor = req.pagination.cursor;
        if(cursor !== undefined){
            let sec2milisec = new Date(cursor * 1000);      // din secunde în milisecunde;
            obi['date'] = {'$lte': new Date(sec2milisec)};  // completezi obiectul query cu un criteriu nou legat de data înregistrărilor (în bază 2021-07-29T00:00:00.000+00:00)  
        }

        /* === CÂMPURI PE CARE CLIENTUL LE VREA EXCLUSE === */
        if (req.query.exclude.length > 0) {
            req.query.exclude.forEach(field => delete query[field]);
        }

        /* === ADUCEREA SEGMENTULUI DE DATE + ÎNREGISTRARE CU ROL DE CURSOR === */
        let newlimit = ++limit;
        let segmentdata = await model.find(obi).select(req.query.select).sort({date: -1}).limit(newlimit).exec(); // execută și obține datele din segmentul de 10 + 1 (`segmentdata` va avea o lungime de 11)

        /* === VERIFICĂ SĂ AI UN SET DE ÎNREGISTRĂRI EGAL CU LIMITA + 1 === */
        let moredata = segmentdata.length === newlimit; // verifică dimensiunea setului de date aduse să fie 11

        /* === STABILIREA NOULUI CURSOR === */
        let nextCursor;
        if (moredata) {
            let nextcursorrec = segmentdata[--limit]; // fă o referință la ultimul document care va juca rol de cursor, adică al 11-lea document (index 10)
            let timeref = new Date(nextcursorrec['date']); // new Date('2021-07-29T00:00:00.000+00:00') => `Thu Jul 29 2021 03:00:00 GMT+0300 (Eastern European Summer Time)`
            nextCursor = Math.floor(timeref.getTime() / 1000); // trimite drept cursor numărul de secunde scurs (Epoch Time)
            segmentdata.pop();
        }

        // datele necesare clientului
        return {segmentdata, total, pagination: {moredata, nextCursor}}; 
    } catch (error) {
        console.log(error);
    }
};