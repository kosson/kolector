var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

var pubComm = io('/redcol', {
    query: {['_csrf']: csrfToken}
});


// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

// var discipline = new Map([
//     ['0', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română", "Religie cultul ortodox", "Religie Cultul Romano-Catolic de limba română"]],
//     ['1', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română", "Religie cultul ortodox", "Religie Cultul Romano-Catolic de limba română"]],
//     ['2', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română", "Religie cultul ortodox", "Religie Cultul Romano-Catolic de limba română"]],
//     ['3', ["Arte vizuale și abilități practice", "Științele naturii", "Limba și literatura română", "Educaţie civică", "Joc și mișcare", "Religie cultul ortodox", "Religie Cultul Romano-Catolic de limba română"]],
//     ['4', ["Arte vizuale și abilități practice", "Științele naturii", "Limba și literatura română", "Educaţie civică", "Geografie", "Istorie", "Joc și mișcare", "Religie cultul ortodox", "Religie Cultul Romano-Catolic de limba română"]],
//     ['5', []],
//     ['6', []],
//     ['7', []],
//     ['8', []]
// ]);

// $('#selectclasa').on('change', function () {
//     // console.log("Valoarea aleasă pentru clasă este", $(this).val());
//     // În momentul în care se alege clasa, se aduc toate resursele pentru clasa respectivă
//     var clasa = $(this).val() || 0;

//     // De fiecare dată când se schimbă valoarea, șterge toate elementele din dom pentru div-ul respubselected.
//     $('#respubselected').empty();
//     // var resurseExistente = document.getElementById('respubselected');
//     // while (resurseExistente.firstChild) {
//     //     resurseExistente.firstChild.remove();
//     // }

//      // Populează selectorul disciplinelor cu opțiunile posibile. 
//     createDisciplineSelector(clasa);

//     // În momentul în care se aleg și disciplinele (select cu multi), se vor selecta toate resursele pentru respectivele discipline
// });

/**
 * Funcția are rolul să creeze elementul de selecție în funcție de alegerea clasei
 * @param {Number} nr 
 */
// function createDisciplineSelector (nr) {
//     $('#selectordisc').empty();
//     var ancora = document.getElementById('selectordisc');
//     var sel = $('<select>');
//     // sel.addClass("custom-select").attr('required').prop('required');
//     sel.attr({
//         "id": "discselection",
//         "class": "custom-select",
//         "required": "true",
//         "multiple": "true"
//     });
//     sel.appendTo(ancora);
//     // console.log(nr);
//     // adu-mi toate disciplinele pentru clasa din nr
//     var discs = discipline.get(`${nr}`);
//     $(discs).each(function () {
//         sel.append($('<option>').attr('value', this).text(this));
//     });
//     // console.log(discs);
//     // bagă disciplinele ca opțiuni într-un select multi
//     // $('#example').append('<option value="foo" selected="selected">Foo</option>');
//     $('<select class="custom-select" required>');
// }

// LISTENER pentru multiselectul disciplinelor; 
// $('#selectordisc').on('change', function () {
//     var delayAct = setTimeout(function () {
//         var discArr = $('#discselection option:selected').map(function () {
//             // acesta este array-ul disciplinelor alese pentru o anumită clasă. În cazul în care este aleasă doar clasa si este apasat butonul, sunt aduse primele 10 resurse 
//             return this.value;
//         }).get();
//         // console.log(discArr);
//         pubComm.emit('searchresdisc', discArr);
//     }, 1300);
//     pubComm.on('searchresdisc', populeazaCuRes);
// });

// === BUTONUL DE SEARCH ===
// const searchGenBtn = document.getElementById('generalsearch'); // butonul de search
// let index = searchGenBtn.dataset.idx; // extrage indexul din atributul data.
// searchGenBtn.addEventListener('click', function clbkSearchGenBtn (evt) {
//     evt.preventDefault();
//     const fragSearch = document.getElementById('searchterms').value;
//     if (fragSearch.length > 250) {
//         fragSearch = fragSearch.slice(0, 250);
//     }
//     pubComm.emit('searchres', {
//         index, 
//         fragSearch, 
//         fields: [
//             ["generalPublic", true]
//         ]
//     }); // emite eveniment în backend
// });
// searchGenBtn.addEventListener('keyup', function clbkKupGenBtn () {
//     if (event.keyCode === 13) {
//         $('#generalsearch').click();
//     }
// });

/**
 * Rolul funcției este de a popula un template Handlebars cu datele din backend
 * @param {Object} resurse
 */
function populeazaCuRes (resurse) {
    var template = document.getElementById('resurse-selected').innerHTML;
    var renderResurse = Handlebars.compile(template);
    document.getElementById('respubselected').innerHTML = renderResurse({
        resurse
    });
}

// pubComm.on('searchres', function populeazaCuResES (resurse) {
//     $('#selectordisc').empty(); 
//     $('#respubselected').empty();

//     var sablon = document.getElementById('resursa-template');
    
//     resurse.forEach((resursa) => {
//         // creezi o instanță a conținutului template-ului
//         const instance = document.importNode(sablon.content, true);
//         // Introdu conținutul în template
//         instance.querySelector('.card-text').innerHTML = resursa._source.description;
//         var cardHeaderLink = instance.querySelector('#resid');
//         cardHeaderLink.href = `/resursepublice/${resursa._id}`;
//         cardHeaderLink.innerHTML = resursa._source.title;

//         // Append the instance ot the DOM
//         document.getElementById('respubselected').appendChild(instance);
//     });
// });
