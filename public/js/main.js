var socket = io();
var pubComm = io('/redcol');
var uuid = '';

// === MANAGEMENTUL COMUNICĂRII pe socketuri ===
pubComm.on('mesaje', (mess) => {
    // TODO: execută funcție care afișează mesajul
    // broadcastMes(mess);
    console.log(mess);
    $.toast({
        heading: 'Colectorul spune:',
        text: `${mess}`,
        position: 'top-center',
        showHideTransition: 'fade',
        hideAfter : 7000,
        icon: 'info'
    });
    //https://kamranahmed.info/toast
});

/**
 * Clasa `createElement` va creea elemente HTML
 * @param {String} tag este un și de caractere care indică ce tip de element va fi creat
 * @param {String} [id] este un șir de caractere care indică un id pentru element
 * @param {Array}  [cls] este un array ce cuprinde clasele elementului
 * @param {Object} [attrs] este un obiect de configurare a elementului care permite definirea de atribute
 */
class createElement {
    constructor(tag, id, cls, attrs){
        this.id = id;
        this.tag = tag;
        this.classes = [...cls];
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
        if (this.classes) element.classList.add(...this.classes);
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