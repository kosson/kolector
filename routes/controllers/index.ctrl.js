require('dotenv').config();
const config = require('config');

const logger = require('../../util/logger');
const mongoose = require('mongoose');

const calcAverageRating = require('../../util/rating'); // încarcă funcția de rating pentru resursă

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