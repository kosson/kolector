const moment = require('moment');
const logger = require('../../util/logger');
const mongoose = require('mongoose');

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/**
 * Funcția are rolul de a randa resursele care sunt publice.
 * - Numărul resurselor afișat este hardcodat la 9
 * - fii foarte atent la ordinea elementelor din `resurse`: `[scripts, modules, styles]`
 * 
 * @param {Object} req Obiectul `request`
 * @param {Object} res Obiectul `response`
 * @param {Function} next Funcția `next()`
 * @param {Object} gensettings obiectul rezultat al promisiunii - setările generale ale aplicației
 * @param {Object} Model Modelul mongoose care va fi folosit
 * @param {Object} modelOpts este proiecția necesară lui `find`
 * @param {Array} resurse Array de array-uri cu toate resursele necesare randării (`script`, `module`, `style`) 
 * @param {String} tabtitle Numele care apare în tab
 */
async function renderPublic (req, res, next, gensettings, Model, modelOpts, resurse, tabtitle) {
    
    let [scripts, modules, styles] = resurse;  // fii foarte atent la ordinea din array

    // creează obiectul `Query`
    let findQuery = Model.find(modelOpts.projection).lean();

    // Parametrizează obiectul Query. A înlocuit Model.find(modelOpts.projection).sort({"date": -1}).limit(8)
    for (let [opt, val] of Object.entries(modelOpts.queryOpts)) {
        findQuery[opt](val);
    }

    // console.log(findQuery instanceof mongoose.Query);
    // console.log(findQuery.getFilter());

    /**
     * Funcția este callback pe căutarea care aduce ultimele 9 cele mai noi înregistrări
     * Are rolul de a crea array-ul de date `newResultArr` care va randa resursele
     * @param {Array} resurse 
     */
    function renderRED (resurse) {
        let newResultArr = [],
            user = req.user,
            csrfToken = req.csrfToken();

        let fullstar = `<i class="bi bi-star-fill"></i>`,
            emptystart = `<i class="bi bi-star"></i>`,
            halfempty = `<i class="bi bi-star-half"></i>`;

        newResultArr = resurse.map((obi) => {
            // [ÎNREGISTRAREA ÎN ÎNTREGIME]
            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
            obi.editorContent = JSON.stringify(resurse);
            
            // [DATA CALENDARISTICĂ]
            obi.dataRo = moment(obi.date).locale('ro').format('LLL');   // formatarea datei pentru limba română.

            obi['template'] = `${gensettings.template}`;
            obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;

            obi['ratingrepresentation'] = '';
            let kontor = obi.contorRating ?? 0;
            let lastRating = obi.rating ?? 0;
            let ratingTotal = obi.ratingTotal ?? 0;
            let presentRating = ratingTotal / kontor;

            // 0 - 0.5 | 0.5 - 1 | 1 - 1.5 | 1.5 - 2 | 2 - 2.5 | 2.5 - 3 | 3 - 3.5 | 3.5 - 4 | 4 - 4.5 | 4.5 - 5
            if (isNaN(presentRating)) {
                obi.ratingrepresentation = `${emptystart}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0 && presentRating < 0.5) {
                obi.ratingrepresentation = `${halfempty}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0.6 && presentRating <= 1) {
                obi.ratingrepresentation = `${fullstar}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1 && presentRating <= 1.5) {
                obi.ratingrepresentation = `${fullstar}${halfempty}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1.6 && presentRating <= 2) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 2 && presentRating <= 2.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${halfempty}${emptystart}${emptystart}`;
            } else if (presentRating > 2.6 && presentRating <= 3) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${emptystart}${emptystart}`;
            } else if (presentRating > 3 && presentRating <= 3.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${halfempty}${emptystart}`;
            } else if (presentRating > 3.6 && presentRating <= 4) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${emptystart}`;
            } else if (presentRating > 4 && presentRating <= 4.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${halfempty}`;
            } else if (presentRating > 4.6 && presentRating <= 5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${fullstar}`;
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
            title:     `${tabtitle}`,
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
    };

    findQuery.exec().then(renderRED).catch((err) => {
        if (err) {
            console.log(err);
            logger.error(err);
            next(err);
        }
    });
};

module.exports = renderPublic;