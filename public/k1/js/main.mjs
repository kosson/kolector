var csrfToken = '',
    socket    = null,
    pubComm   = null;

globalThis.socket = socket;
globalThis.pubComm = pubComm;

// var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

if (document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
    socket = io({
        query: {
            ['_csrf']: csrfToken
        },
        transports: [ "websocket", "polling" ]
    });

    // socket.on("connect", (data) => {
    //     console.log(socket.id);
    // });

    pubComm = io('/redcol', {
        withCredentials: true,
        extraHeaders: {
            "_csrf": csrfToken
        },
        query: {
            ['_csrf']: csrfToken
        },
        transports: [ "websocket", "polling" ]
    });
}

// === MANAGEMENTUL COMUNICĂRII pe socketuri ===
// pubComm.on('mesaje', (mess) => {
//     //- TODO: execută funcție care afișează mesajul

//     $.toast({
//         heading: 'Colectorul spune:',
//         text: `${mess}`,
//         position: 'top-center',
//         showHideTransition: 'fade',
//         hideAfter : 7000,
//         icon: 'info'
//     });
//     //https://kamranahmed.info/toast
// });

/** ACTIVAREA TUTUROR TOOLTIP-urilor */
document.addEventListener("DOMContentLoaded", function clbkDOMContentLoaded () {
    if (bootstrap) {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          // tooltipTriggerEl.addEventListener('show.bs.tooltip', function () {
          //   alert('Am fost activat');
          // })
          // tooltipTriggerEl.addEventListener('shown.bs.tooltip', function () {
          //   alert('Am fost afișat');
          // })
          // tooltipTriggerEl.addEventListener('hide.bs.tooltip', function () {
          //   alert('Sunt pe cale sa fiu pitit');
          // })
          // tooltipTriggerEl.addEventListener('hidden.bs.tooltip', function () {
          //   alert('Am fost ascuns');
          // })
          // tooltipTriggerEl.addEventListener('inserted.bs.tooltip', function () {
          //   alert('Am fost introdus în DOM');
          // })
          let t = new bootstrap.Tooltip(tooltipTriggerEl, {
            container: 'body', 
            animation: true, 
            html: true, 
            placement: "left", 
            trigger: 'hover focus',
            delay: { "show": 500, "hide": 100 }
          });
          tooltipTriggerEl.addEventListener('mouseover', function () {
            t.show();
          });
          tooltipTriggerEl.addEventListener('mouseleave', function () {
            t.hide();
          })
          return t;   
        });
    }
});


/**
 * Clasa `createElement` va crea elemente HTML
 * @param {string} tag este un șir de caractere care indică ce tip de element va fi creat
 * @param {string} [id] este un șir de caractere care indică un id pentru element
 * @param {Array | null}  [cls] este un array ce cuprinde clasele elementului. Dacă valoare este `null`, nu crea atributul.
 * @param {Object} [attrs] este un obiect de configurare a elementului care permite definirea de atribute
 */
class createElement {
    constructor(tag, id, cls, attrs){
        this.tag = tag;
        this.id = id;
        if (cls === null){
            this.classes = [];
        } else {
            this.classes = [...cls];
        };        
        this.attributes = attrs;    // va fi un un obiect de configurare, fiecare membru fiind un posibil atribut.
    }
    /**
     * Metoda `creeazaElem()` generează obiectul DOM
     * @param {String} textContent Este conținutul de text al elementului, dacă acest lucru este necesar
     * @param {Boolean} requiredElem Specifică dacă un element are atributul `required`
     */
    creeazaElem (textContent, requiredElem) {
        const element = document.createElement(this.tag);
        if (this.id) element.id = this.id;
        if (this.classes !== '' || this.classes.length > 0) {
            element.classList.add(...this.classes);
        };
        if (this.attributes) {
            for (let [key, val] of Object.entries(this.attributes)) {
                element.setAttribute(key, val);
            }
        }
        // if (textContent) element.textContent = textContent;
        if (textContent) {
            var text = '' + textContent;
            let encodedStr = decodeCharEntities(text); // decodifică entitățile 
            let txtN = document.createTextNode(encodedStr);
            element.appendChild(txtN);
        }
        if (requiredElem) element.required = true;
        return element;
    }
}

/**
 * Funcția are rolul de a șterge toate div-urile care au clasa .toast
 * Folosit de createBS5toast()
 * @param {Object} data 
 */
function deleteAllBS5toasts (data = {}) {
        // dacă există element copil, șterge-l
        const siblings = data?.insertion.querySelectorAll(".toast");
        let sibling;
        for (sibling of siblings) {
            data?.insertion.removeChild(sibling);
        }
}

/**
 * Funcția are rolul de a crea un toast specific Boostrap 5
 * @param {Object} config 
 */
function createBS5toast (config) {
    // console.log(`Obiectul care configureaza toastul este `, config);
    //_ FIXME: Mai întâi de orice, șterge orice alt toast care există în dom. Selectează orice div care are id-ul începând cu secvența `tbs5_`
    let insertion = config?.insertion; // selectează div-ul container

    // șterge toți copii care au clasa .toast
    deleteAllBS5toasts({insertion});

    let toastTmpl = config?.tmpl.cloneNode(true); // clonează întreg nodul template-ului
    let idtoast = "tbs5_" + Math.random().toString(36).slice(2); // creează id unic toast-ului
    toastTmpl.querySelector('.toast').id = idtoast; // atribuie id-ul

    let bs5toast = toastTmpl.querySelector(`#${idtoast}`); // referință la div-ul toast-ului
    bs5toast.classList.add(...config?.bs5toastcontainer?.classes); // setez clasele primite la apelul funcției
    bs5toast.style.zIndex = config?.bs5toastcontainer?.css?.zIndex; // setez x-index-ul la apelul funcției

    toastTmpl.querySelector('.toast-body').innerText = config?.message;
    toastTmpl.querySelector('.me-auto').innerText = config?.header;

   insertion.appendChild(toastTmpl); // atașează în DOM toast-ul

    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl, {
            animation: true,
            autohide: true,
            delay: 10000
        })
    });
    let elem;
    for(elem of toastList) {
        elem.show();
    }
};

/**
 * Convertește un characterSet html în caracterul original.
 * @param {String} str htmlSet entities
 **/
function decodeCharEntities (str) {
    let decomposedStr = str.split(' ');
    //+ FIXME: Nu acoperă toate posibilele cazuri!!! ar trebui revizuit la un moment dat.
    var entity = /&(?:#x[a-f0-9]+|#[0-9]+|[a-z0-9]+);?/igu;
    
    let arrNew = decomposedStr.map(function (word, index, arr) {
        let newArr = [];
        if (word.match(entity)) {
            let fragment = [...word.match(entity)];

            for (let ent of fragment) {
                var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
                var translate = {
                    "nbsp" : " ",
                    "amp"  : "&",
                    "quot" : "\"",
                    "apos" : "\'",
                    "cent" : "¢",
                    "pound": "£",
                    "yen"  : "¥",
                    "euro" : "€",
                    "copy" : "©",
                    "reg"  : "®",
                    "lt"   : "<",
                    "gt"   : ">"
                };
                return ent.replace(translate_re, function (match, entity) {
                    return translate[entity];
                }).replace(/&#(\d+);/gi, function (match, numStr) {
                    var num = parseInt(numStr, 10);
                    return String.fromCharCode(num);
                });
            }
            return arrNew;
        } else {
            newArr.push(word);
        }
        return newArr.join('');
    });
    return arrNew.join(' ');
}

/**
 * Funcția `encodeHTMLentities()` convertește un string în entități html.
 * @param {String} str Este un string de cod HTML care nu este escaped
 */
function encodeHTMLentities (str) {
    var buf = [];			
    for (var i = str.length-1; i >= 0; i--) {
        buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
    }    
    return buf.join('');
}

/**
 * Funcția are rolul de a extrage setul de date atașat unui element prin data-*
 * @param {Object} elem 
 */
function datasetToObject(elem){
    var data = {};
    [].forEach.call(elem.attributes, function(attr) {
        if (/^data-/.test(attr.name)) {
            var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
            data[camelCaseName] = attr.value;
        }
    });
    return data;
}

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

/*
* MECANISM DE EXPIRAREA A CHEILOR DIN LOCALSTORAGE
* https://www.sohamkamani.com/blog/javascript-localstorage-with-ttl-expiry/
*/

/**
 * Setează o cheie în `localStorage`
 * @param key nume cheie
 * @param value valoarea care trebuie stocată
 * @param ttl valoarea în milisecunde
 */
function setWithExpiry(key, value, ttl) {
    // creează un obiect `Date`
	const now = new Date();

	// obiectul `item` este un obiect pe care îl vom serializa
	const item = {
		value,
		expiry: now.getTime() + ttl,
	};

    // și apoi îl introducem în `localStorage`
	localStorage.setItem(key, JSON.stringify(item)); 
    // trebuie convertite la string pentru că atât putem stoca în localstorage
}

/**
 * Funcția are rolul de a lua o valoare din `localStore`, a vedea dacă este expirată,
 * Dacă timpul a expirat, și nu există valoare în parametrul `exp` o șterge.
 * Dacă există valoare în parametrul `exp`, timpul va fi prelungit cu valoarea primită
 * @param key numele cheii din `localStore`
 * @param exp este valoarea în milisecunde a timpului cu care își extinde durata de viață cheia
 * @returns valoarea cheii
 */
function getWithExpiry(key, exp) {
	const itemStr = localStorage.getItem(key);

	// dacă valoarea nu există, returnează `null`.
	if (!itemStr) {
		return null;
	}
	const item = JSON.parse(itemStr);
	const now = new Date(); // creează obiectul `Date`

	// compară timpul de expirare a elementului cu timpul curent
	if (now.getTime() > item.expiry && !exp) {
		// Dacă timpul curent este mai mare decât cel din obiect, șterge elementul din storage
		localStorage.removeItem(key);
		return null; // și returnează valoarea `null`
	} else {
        let preexisting = parseInt(item.expiry),
            addedtime = parseInt(exp);
        item.expiry = preexisting += addedtime;
        // actualizează valoarea cheii
        localStorage.setItem(key, JSON.stringify(item));
    }
	return item.value; // Dacă este în timpul setat, returnează valoarea
}

/**
 * Funcția transformă datele dintr-un obiect DataForm într-un POJO
 * Sursa: https://stackoverflow.com/questions/41431322/how-to-convert-formdata-html5-object-to-json
 * https://javascript.info/formdata
 * @param dataform Este obiectul DataForm
 * @returns 
 */
function frm2obj(dataform) {
    let object = {};
    dataform.forEach((value, key) => {
        if (!Reflect.has(object, key)) {
            object[key] = value;
            return;
        }
        if (!Array.isArray(object[key])) {
            object[key] = [object[key]];
        }
        object[key].push(value);
    });
    return object;
};

/**
 * Funcția are rolul de a elimina proprietățile care nu au valoare dintr-un obiect.
 * Sursa: https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript/57625661#57625661
 * @param obj Obiect care trebuie curățat de proprietățile fără valori sau null
 * @returns 
 */
const cleanEmptyPropsInObj = function(obj, defaults = [undefined, null, NaN, '']) {
    if (!defaults.length) {
        return obj;
    }

    if (defaults.includes(obj)) {
        return;
    }

    if (Array.isArray(obj)) {
        return obj.map(v => v && typeof v === 'object' ? cleanEmptyPropsInObj(v, defaults) : v).filter(v => !defaults.includes(v));
    }

    return Object.entries(obj).length ? Object.entries(obj)
        .map(([k, v]) => ([k, v && typeof v === 'object' ? cleanEmptyPropsInObj(v, defaults) : v]))
        .reduce((a, [k, v]) => (defaults.includes(v) ? a : { ...a, [k]: v}), {}) : obj;
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

/**
 * Clasa permite managementul elementelor care primesc receptori pe diferite evenimente
 * Este utilă ținerii evidenței și mai mult, declanșării execuției receptorilor.
 * Avantajul ar fi evitarea unor identificatori care să țină obiectele „în viață” inutil.
 */
class EventedElementsMgmt {
    constructor () {
        this.elements = new WeakMap();
    }

    /**
     * Metoda `add` permite adăugarea unui element cu un Set pentru
     * toți receptorii pe care îi poate avea pentru un eveniment
     * @param {Object} elem Obiectul din DOM care primește listener pe event
     * @param {String} eventname numele evenimentului
     * @param {Function} listener obiectul funcție cu rol de receptor
     */
    add (elem, eventname, listener) {
        let listeners = this.elements.get(elem); // încarcă cheia/obiectul element

        // inițializare cheie nouă în WeakMap dacă nu există
        if (listeners === undefined) {
            listeners = {}; // de ex: {click: Set[fnc1, fnc2]}
        }

        // accesează proprietatea cu numele evenimentului -> ref la Set
        let listenersSet4evt = listeners[eventname];

        // inițializarea primului eveniment cu listenerul său
        if (listenersSet4evt === undefined) {
            listenersSet4evt = new Set();
        }

        listenersSet4evt.add(listener); // ai grijă, că lucrezi pe ref!!!

        listeners[eventname] = listenersSet4evt; // actualizează cheia WeakMap-ului cu datele nou adăugate

        this.elements.set(elem, listeners); // actualizează valoarea cheii din `WeakMap`.
    }

    /**
     * Metoda are rolul de a elimina receptorul 
     * @param {Object} elem 
     * @param {String} eventname 
     * @param {String} listener 
     * @returns {Boolean} true pentru reușita ștergerii, false în caz contrar
     */
    remove (elem, eventname, listener) {
        let listeners = this.elements.get(elem); // încarcă cheia/obiectul element
        if (!listeners) return false;
        // accesează proprietatea cu numele evenimentului -> ref la Set
        let listenersSet4evt = listeners[eventname]; // este Set-ul cu toți receptorii asociați unui eveniment

        // verifică dacă există un Set asociat tipului de eveniment.
        if (!listenersSet4evt) {
            return false;
        } else if (listenersSet4evt.delete(listener)) {
            // dacă ștergerea a returnat `true`, returnează `true`
            return true;
        }
    }

    /**
     * Metoda declanșează execuția tuturor funcțiilor receptor pentru un tip de eveniment
     * @param {Object} evt 
     * @returns {Boolean} `false` în cazul în care nu există funcțiie receptor
     */
     fire (evt) {
        // console.log(this.elements.has(evt.currentTarget));
        let elem = evt.currentTarget, eventname = evt.type, listener; //srcElement
        // console.log("dE LUCRU ", elem, eventname);
        let listeners = this.elements.get(elem); // încarcă cheia/obiectul element
        if (!listeners) return false;
        // accesează proprietatea cu numele evenimentului -> ref la `Set`
        let listenersSet4evt = listeners[eventname];
        if (!listenersSet4evt) return false;
        for (listener of listenersSet4evt) {
            setTimeout(listener, 0, evt); // execuția trebuie să fie asincronă.
        }
     }
}
/**
 * Mai întâi instanțiezi clasa, apoi pentru fiecare listener pe care vrei să-l adaugi, faci câte o intrare înainte de a atașa metoda care le execută
 * Observă faptul că pentru posibilele elemente pe care la un moment dat le vei elimina, referința este construită dinamic (`document.querySelector('#a')`)
 * fără legarea acesteia la vreun identificator
 * 
    EVTM.add(document.querySelector('#a'), 'click', (evt) => {
        // codul listener-ului
        console.log(EVTM);
    });

 * Apoi atașezi un listener pe element al cărui singur jos este să execute metoda `fire`
    document.querySelector('#a').addEventListener('click', (evt) => {
        VTM.fire(evt);
    });

 * Pentru ștergerea unui element, vezi să nu faci nicio referință către părinte legată de un identificator precum în: `let parinte = document.querySelector('#a').parentNode;`
 * Făcând acest lucru, vei ține o legătură și la elementul copil care te-a ajutat să găsești părintele.
 * Soluția este referirea directă: `document.querySelector('#a').parentNode.removeChild(document.querySelector('#a'));`

    let dela = document.querySelector('#dela');

    EVTM.add(dela, 'click', () => {
        document.querySelector('#a').parentNode.removeChild(document.querySelector('#a')); //sau
        document.querySelector('#a').remove();
    });

    dela.addEventListener('click', (evt) => {
        EVTM.fire(evt);
    })
 */

/**
 * Funcția are rolul de a genera un element template pe care îl vom folosi în construcția paginilor
 * @param {String} html Un template literal de Javascript cu structura componentei 
 * @returns 
 */
function generateTemplateElement (html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}

/**
 * Funcția are rolul de a crea un array cu toate nodurile siblings
 * Sursa: https://www.javascripttutorial.net/javascript-dom/javascript-siblings/
 * @param {Event} e 
 * @returns 
 */
function getSiblings (e) {
    // for collecting siblings
    let siblings = []; 
    // if no parent, return no sibling
    if(!e.parentNode) {
        return siblings;
    }
    // first child of the parent node
    let sibling  = e.parentNode.firstChild;
    
    // collecting siblings
    while (sibling) {
        if (sibling.nodeType === 1 && sibling !== e) {
            siblings.push(sibling);
        }
        sibling = sibling.nextSibling;
    }
    return siblings;
};

export {
    socket, 
    pubComm,
    generateTemplateElement,
    EventedElementsMgmt, 
    createBS5toast, 
    deleteAllBS5toasts, 
    setWithExpiry, 
    getWithExpiry, 
    check4url, 
    createElement, 
    decodeCharEntities, 
    datasetToObject, 
    frm2obj, 
    cleanEmptyPropsInObj
};