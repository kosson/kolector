/**
 * Funcția are rolul de a oferi calea către un fișier, numele fișierului și un obiect URL, dacă stringul este detectat a fi un URL.
 * Funcția face wrapping peste API-ul `URL`, fiind cel care oferă obiectul `uri` ca membru al obiectului returnat. 
 * În cazul în care ai o cale, în `afterLastSlash` ai numele fișierului; în cazul URL-urilor vei avea ultimul segment din cale
 * În cazul URL-urilor, numele fișierului îl poți extrage din obiectul `uri.pathname` sau din `afterLastSlash`.
 * Atenție, `path2file` oferă calea completă către fișier fără domeniu și fără protocol.
 * În cazul căilor care nu au un fișier, `path2file` va avea aceeași valoare precum `path`.
 * @param {String} url Poate fi un URL întreg sau poate fi o cale
 * @returns {Object} Obiectul are semnătura `{err, path, path2file, afterLastSlash, uri}`
 */
function check4url (url) {
    url = decodeURI(url); // facem decode, să nu avem surprize

    let err, uri;
    let path = '';
    let path2file = '';

    // extrage indexul la care apare pentru prima dată slash-ul
    let idx4first = url.indexOf('/');
    let lastidx   = url.lastIndexOf('/');
    let protoP    = url.substr(0, idx4first); // extrage posibilul protocol
    let trail     = url.substr(lastidx); // file sau query string sau fragment locator
    // Verifică dacă ceea ce este după ultimul slash este un fișier
    let fileDetector = new RegExp('(^[aA-zZ]\d\/)?([;&aA-zZ\d%_.~+=-]*\.[aA-zZ]?)\w+$','g');

    // dacă indexul primei apariții este poziția 0 sau 1 înseamnă că avem de-a face cu o cale relativă (`/`, `./`)
    switch (idx4first) {
        case 0:
            path = url.substr(idx4first, lastidx);
            path2file = path + trail;
            break;
        case 1:
            path = url.substr(idx4first, lastidx);
            path2file = path + trail;
            break;
        case 5:
            // http:/ -> Este cazul în care chiar avem de-a face cu un URL
            let regP = new RegExp('^(http?:\/\/)?', 'g');   // șablon căutare
            if (regP.test(protoP)) {
                uri =  new URL(url);
                path = uri.pathname.substr(0, uri.pathname.lastIndexOf('/'));
                // testează dacă după ultimul slash este un fișier; Dacă este un fișier/domeniu/query/fragment, scrie path ca mai sus, dar dacă nu, ține path ca uri.pathname
                if (fileDetector.test(trail)) {
                    let arrMatched = fileDetector.exec(trail);
                    afterLastSlash = arrMatched[0];
                }
                path2file = uri.pathname;
            } else {
                err = new Error('În locul protocolului http am primit ceva neobișnuit!');
            }
        case 6:
            // https:/
            let regPS = new RegExp('^(https?:\/\/)?', 'g');
            if (regPS.test(protoP)) {
                uri =  new URL(url);
                path = uri.pathname.substr(0, uri.pathname.lastIndexOf('/'));
                // testează dacă după ultimul slash este un fișier; Dacă este un fișier/domeniu/query/fragment, scrie path ca mai sus, dar dacă nu, ține path ca uri.pathname
                if (fileDetector.test(trail)) {
                    let arrMatched = fileDetector.exec(trail);
                    afterLastSlash = arrMatched[0];
                }
                path2file = uri.pathname;
            } else {
                err = new Error('În locul protocolului https am primit ceva neobișnuit!');
            }
        default:
            break;
    }

    return {
        err,
        path,
        path2file,
        afterLastSlash: trail.substr(1),
        uri
    };
}

// let ocalecufis = '/test/ceva/ceva.jpg';
// let ocale      = '/test/ceva/';
// let unurl      = 'http://www.ceva.ro/cale1/cale2';
// let unurlS     = 'https://www.ceva.ro/cale1/cale2';
// let unurlfis   = 'http://www.ceva.ro/cale1/cale2/imagine.jpg';
// let unurlfisS  = 'https://www.ceva.ro/cale1/cale2/imagine.jpg';
// let real01     = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Moscow%2C_Russia.svg/800px-Flag_of_Moscow%2C_Russia.svg.png';
// let real02     = 'https://en.wikipedia.org/wiki/File:Flag_of_Moscow,_Russia.svg'

// check4url(ocalecufis); //?
// check4url(ocale);      //?
// check4url(unurl);      //?
// check4url(unurlS);     //?
// check4url(unurlfis);   //?
// check4url(unurlfisS);  //?
// check4url(real01);     //?
// check4url(real02);     //?