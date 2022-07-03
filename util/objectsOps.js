/**
 * Funcție helper pentru a determina daca o valoare poate
 * fi convertită cu succes la un numar
 * Sursa: https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
 * Folosită de:
 * - `pathOfProps()`
 * @param {String} str 
 * @returns 
 */
function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

// https://stackoverflow.com/questions/50538060/javascript-in-an-array-of-objects-returns-objects-where-any-value-matches-a-s/50538352#50538352

const deepFindOne = (f, obj = {}) => {
    // Dacă este pasat un obiect sau un array
    if (Object(obj) === obj) {
        // Dacă evaluarea funcției pasate este true, returnează primul obiect găsit care corespunde testului
        if (f(obj) === true) {
            // Atenție, este obiectul curent de pe ramură pornind cu rădăcina
            return obj;
        }
        // tratăm fiecare ramură (obiect în adâncime)
        let k, v;
        for ([k, v] of Object.entries(obj)) {
            // constituie un array de array-uri și pentru fiecare valoare care este obiect
            const res = deepFindOne(f, v); // aplică din nou funcția
            // dacă rezultatul evaluării funcției este o valoare validă
            if (res !== undefined) {
                // return res; // este returnat obiectul de pe ramură
                return {idxDataSet: k, resultObj: res};
            }
        }
    }
    return undefined;
};

const deepFindAll = function* (f, obj = {}) {
    // Dacă este pasat un obiect sau un array
    if (Object(obj) === obj) {
        // Dacă evaluarea funcției pasate este true,
        // returnează primul obiect găsit care corespunde testului
        if (f(obj) === true) {
            // Atenție, este obiectul curent de pe ramură pornind cu rădăcina
            yield obj;
        }
        // tratăm fiecare ramură (obiect în adâncime)
        let k, v;
        for ([k, v] of Object.entries(obj)) {
            // constituie un array de array-uri și pentru fiecare valoare care este obiect
            yield* deepFindAll (f, v);
        }
    }
};

const oriceString = f => obi => Object.values(obi).some(v => String(v) === v && f(v));
const cautaCaseInsensitive = (x, y) => x.toLowerCase().includes(y.toLowerCase());

exports.searchAll = (decautat = '', obi = {}) => {
    return Array.from(deepFindAll(oriceString(v => cautaCaseInsensitive(v, decautat)), obi));
};

// sau cazul căutării unice
exports.searchOne = (decautat = '', obi) => {
    return deepFindOne(oriceString(v => cautaCaseInsensitive(v, decautat)), obi);
};

exports.pathOfProps = function addpath2O (entity, path = '') {
    let k, v, newpath;
    let arrOfarr = Object.entries(entity);

    // fiecare v este un obiect al array-ului sau o valoare simpla
    for ([k, v] of arrOfarr) {
        // newpath = path + (Number(k) === Number(k) ? `[${Number(k)}]` : `['${k}']`);
        newpath = path + (isNumeric(k) ? `[${+k}]` : `['${k}']`);
        // cazul obiect => obiecte si array-uri
            if(Object(v) === v){
                addpath2O(v, newpath);
                // array
                if(Array.isArray(v)) {
                    v.push(newpath);
                }
            // obiect
            v.path = newpath;
        }  
    }
    return entity;
};