require('dotenv').config();
const config = require('config');

// MODELE
const Resursa     = require('../../models/resursa-red');        // Adu modelul resursei
const Mgmtgeneral = require('../../models/MANAGEMENT/general'); // Adu modelul management

// HELPERE
const logger = require('../../util/logger');

// UTILS
const calcAverageRating = require('../../util/rating'); // încarcă funcția de rating pentru resursă

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/**
 * Funcția are rolul de a randa resursele care sunt publice în pagina de landing.
 * - Numărul resurselor afișat este hardcodat la 9
 * - fii foarte atent la ordinea elementelor din `resurse`: `[scripts, modules, styles]`
 * 
 * @param {Object} req Obiectul `request`
 * @param {Object} res Obiectul `response`
 * @param {Function} next Funcția `next()`
 */
// exports.renderPublic = async function renderPublic (req, res, next, gensettings, Model, modelOpts, resurse, tabtitle) {
exports.renderPublic = async function renderPublic (req, res, next) {    
    try {
        // Adu-mi setările în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        // scripts, modules, styles
        const files = [
            [
                // MOMENT.JS
                {script: `moment/min/moment-with-locales.min.js`},
                // HOLDERJS
                {script: `holderjs/holder.min.js`},
                // FONTAWESOME
                {script: `${gensettings.template}/lib/npm/all.min.js`},
                {script: `${gensettings.template}/js/custom.js`}
                // {script: `${gensettings.template}/js/IndexInfotoken.js`}
            ],
            [
                {module: `${gensettings.template}/lib/npm/popper.min.js`},
                {module: `${gensettings.template}/js/main.mjs`},
                {module: `${gensettings.template}/js/resources-exposed.mjs`}
            ],
            [
                {style: `${gensettings.template}/lib/npm/all.min.css`},
                {style: `${gensettings.template}/css/resource_unit_exposed.css`},
                {style: `${gensettings.template}/css/rating.css`}
            ]
        ];
        let [scripts, modules, styles] = files;  // fii foarte atent la ordinea din array

        /* 
        * Configurări pentru `Resursa.find`
        * Adu ultimele 8 RESURSE pe landing cu ultimele resurse introduse afișate primele
        */
        modelOpts = {
            projection: {generalPublic: true},
            queryOpts: {
                sort: {date: -1},
                limit: 9
            }
        };
        // creează obiectul de interogare obținând o promisiune
        let findQuery = Resursa.find(modelOpts.projection).lean();
        
        // Parametrizează obiectul Query. A înlocuit Model.find(modelOpts.projection).sort({"date": -1}).limit(8)
        for (let [opt, val] of Object.entries(modelOpts.queryOpts)) {
            findQuery[opt](val);
        }
        let resurse = await findQuery;

        // console.log(findQuery instanceof mongoose.Query);
        // console.log(findQuery.getFilter());

        let newResultArr = [],
        user = req.user,
        csrfToken = req.csrfToken();

        newResultArr = resurse.map((obi) => {
            // [ÎNREGISTRAREA ÎN ÎNTREGIME]
            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
            obi.editorContent = JSON.stringify(resurse);

            obi['template'] = `${gensettings.template}`;
            obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;

            // pentru fiecare resursă, fă calculul rating-ului de cinci stele și trimite o valoare în client
            if (obi?.metrics?.fiveStars) {
                // console.log(`Datele găsite sunt: ${obi.metrics.fiveStars}, de tipul ${Array.isArray(obi.metrics.fiveStars)}`);
                obi['rating5stars'] = calcAverageRating(obi.metrics.fiveStars.map(n => Number(n)), config?.metrics?.values4levels);
            } else if (obi?.metrics?.fiveStars === undefined || obi.metrics.fiveStars.reduce((v) => v += v) === 0) {
                // în cazul în care nu există propritățile în obiect sau array-ul are numai zero, crează un array de inițializare cu toate valorile la zero
                obi['rating5stars'] = 0;
                // completează înregistrarea cu valori goale în array
            }

            // [ACTIVITĂȚI]
            obi.activitati = obi.activitati.map((elem) => {
                let sablon = /^([aA-zZ])+\d/g;
                let cssClass = elem[0].match(sablon);
                let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
                return composed;
            });
            
            return obi;
        });

        res.render(`index_${gensettings.template}`, {
            template:  `${gensettings.template}`,
            activeResLnk: true,
            title:     `Acasă`,
            user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,            
            resurse:   newResultArr,
            csrfToken,
            modules,
            scripts,
            styles,
            creator: gensettings.creator,
            publisher: gensettings.publisher,
            brandname: gensettings.brand,
            description: gensettings.description,
            publisher: gensettings.publisher,
            author: gensettings.contact
        });
    } catch (error) {
        logger.error(error);
        next(error); 
    }
    // execută Query-ul și randează pagina
    // findQuery.exec().then(renderRED).catch((err) => {
    //     if (err) {
    //         console.log(err);
    //         logger.error(err);
    //         next(err);
    //     }
    // });
};

/* AFIȘAREA UNEI SINGURE RESURSE / ȘTERGERE / EDITARE :: /resurse/:id */
exports.renderOnePublic = async function renderOnePublic (req, res, next) {
    try {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        let scripts = [
            // vendor_moment_js,
            {script: `${gensettings.template}/js/check4url.js`},
            // DOWNLOADFILE
            {script: `${gensettings.template}/lib/downloadFile.js`}
        ];

        let modules = [
            // LOCALE
            {module: `${gensettings.template}/js/resource-internal.js`}           
        ];

        let styles = [
            {style: `${gensettings.template}/css/rating.css`}
        ];

        let obi = await Resursa.findById(req.params.id).populate({path: 'competenteS'}).lean();

        // creează din `resursa` un alt POJO
        // const obi = Object.assign({}, resursa);
        console.log(`Obiectul primit este`, obi);

        obi['template'] = `${gensettings.template}`;
        obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;
        
        // pentru fiecare resursă, fă calculul rating-ului de cinci stele și trimite o valoare în client
        if (obi?.metrics?.fiveStars) {
            // console.log(`Datele găsite sunt: ${obi.metrics.fiveStars}, de tipul ${Array.isArray(obi.metrics.fiveStars)}`);
            obi['rating5stars'] = calcAverageRating(obi.metrics.fiveStars.map(n => Number(n)), config.metrics.values4levels);
        }

        // obiectul competenței specifice cu toate datele sale trebuie curățat.
        // obi.competenteS = obi.competenteS.map(obi => {
        //     return Object.assign({}, obi);
        // });

        // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
        obi.editorContent = JSON.stringify(obi);

        // resursa._doc.content = editorJs2html(resursa.content);       

        // Array-ul activităților modificat
        let activitatiRehashed = obi.activitati.map((elem) => {
            let sablon = /^([aA-zZ])+\d/g;
            let cssClass = elem[0].match(sablon);
            let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
            return composed;
        });
        
        obi.activitati = activitatiRehashed;

        let data = {
            uuid: obi.uuid,
            publisher: gensettings.publisher
        };            

        return res.render(`resursa-publica_${gensettings.template}`, {   
            template: `${gensettings.template}`,             
            title:     obi.title,
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            resursa:   obi,
            data,
            scripts,
            modules,
            styles,
            creator: gensettings.creator,
            publisher: gensettings.publisher,
            brandname: gensettings.brand,
            description: gensettings.description,
            publisher: gensettings.publisher,
            author: gensettings.contact
        });
    } catch (error) {
        if (error) {
            // console.log(JSON.stringify(err.body, null, 2));
            logger.error(error);
            next(error);
        }       
    }
};
