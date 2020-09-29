// Funcție de paginare

exports.pagination = async function pagination (req, model) {
    try {
        // req trebuie să fie un obiect care să aibă următoarea semnătură
        /*
        {
            query: {
                projection: {},
                select: <string>,
                exclude: <array>,
                sortby: <array>,    
                sortDefaultField: <string>
            },
            pageNr: <number>,
            limitNr: <number>,
            skipNr: <number>
        }
        */

        let query; // construiește obiectul de interogare pentru Mongoose
        // serializează obiectul cerere
        let queryStr = JSON.stringify(req.query.projection);
        // creează operatorii dacă aceștia apar în obiectul cerere -> `$gt`, `$gte`, etc.
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)/g, match => `$${match}`);

        // reatribuirea obiectului după prelucrare
        req.query.projection = JSON.parse(queryStr);

        // pentru fiecare cheie valoare din projection, adaugă într-un find
        let k, v, obi = {};
        for ([k, v] of Object.entries(req.query.projection)) {
            if (Array.isArray(v)) {
                obi[`${k}`] = {$in: v}; // https://stackoverflow.com/questions/18148166/find-document-with-array-that-contains-a-specific-value FRACK $all!!!
            } else {
                obi[`${k}`] = v; // dacă nu e array, ai o singură valoare string
            }
        }
        // console.log('[pagination.ctrl] obiectul criteriilor de selectie ptr Mongoose ', obi);

        query = model.find(obi); // FIXME: Vezi cum se poate face căutare în cazul în care un câmp are drept valoare un array
        // https://mongoosejs.com/docs/tutorials/query_casting.html -> Implicit $in
        
        let total; 
        model.where(obi).countDocuments((err, nr) => {
            if (err) {
                console.error(err);
            }
            total = nr;
        });
        // console.log("Numarul datelor este: ", model.where(obi).countDocuments()); 

        // Adu-mi doar următorul subset:
        query.select(req.query.select);

        // Șterge câmpurile care nu vrei să aterizeze în obiectul `Query`
        if (req.query.exclude) {
            req.query.exclude.forEach(field => delete query[field]);
        }
        
        // query.countDocuments(function clbkCount (err, count) {
        //     if (err) {
        //         console.error(err);
        //         console.log("Numărul documentelor găsite este ", count);
        //         total = count;
        //     }
        // }); // numărul total de documente găsite

        /* === PAGINAREA === */
        const page     = parseInt(req.pageNr, 10) || 1;   // pagina 1 va fi din oficiu, dacă nu avem valoare precizată pentru pagină
        const limit    = parseInt(req.limitNr, 10) || 10; // dacă nu este precizat numărul de rezultate afișat de pagină, trimite din oficiu 10
        const startIdx = (page -1 ) * limit;              // calculează câte rezultate trebuie sărite pentru a ajunge la fereastra de date necesare
        const endIdx   = page * limit;
        const allDocs  = await model.countDocuments();
        // console.log("[pagination] indexul de start este ", startIdx, " iar limita este ", limit);

        // Setează indexul de la care culegi setul de date și care este limita de înregistrări
        query.skip(startIdx).limit(limit);

        // execută interogarea bazei și adu rezultatele (se creează și cursorul cu această ocazie)
        let date = await query.exec();
        // console.log("[pagination.ctrl] datele aduse din Mongo sunt: ", date.length, " dintr-un total de ", total);
    
        // rezultatul paginării
        const pagination = {};
    
        // dacă ești pe prima pagină, nu vrei să apară `previous`, iar dacă ești pe ultima, nu vrei să apară `next`.
        /* === NEXT page === */
        if (endIdx < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        /* === PREVIOUS page === */
        if (startIdx > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }
    
        // console.log("Număr total documente găsite: ", total, " din ", allDocs);
        // constituie pachetul de date necesar clientului
        return {date, total, allDocs, pagination}; 
    } catch (error) {
        console.log(error);
    }
};