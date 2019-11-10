var discipline = new Map([
    ['0', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română"]],
    ['1', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română"]],
    ['2', ["Arte vizuale și abilități practice", "Matematică și explorarea mediului", "Comunicare în limba română"]],
    ['3', ["Arte vizuale și abilități practice", "Științele naturii", "Limba și literatura română", "Educaţie civică", "Joc și mișcare"]],
    ['4', ["Arte vizuale și abilități practice", "Științele naturii", "Limba și literatura română", "Educaţie civică", "Geografie", "Istorie", "Joc și mișcare"]],
    ['5', []],
    ['6', []],
    ['7', []],
    ['8', []]
]);

$('#selectclasa').on('change', function () {
    // console.log("Valoarea aleasă pentru clasă este", $(this).val());
    // În momentul în care se alege clasa, se aduc toate resursele pentru clasa respectivă
    var clasa = $(this).val() || 0;

    // De fiecare dată când se schimbă valoarea, șterge toate elementele din dom pentru div-ul respubselected.
    $('#respubselected').empty();
    // var resurseExistente = document.getElementById('respubselected');
    // while (resurseExistente.firstChild) {
    //     resurseExistente.firstChild.remove();
    // }

     // Populează selectorul disciplinelor cu opțiunile posibile. 
    createDisciplineSelector(clasa);

    // În momentul în care se aleg și disciplinele (select cu multi), se vor selecta toate resursele pentru respectivele discipline
});

/**
 * Funcția are rolul să creeze elementul de selecție în funcție de alegerea clasei
 * @param {Number} nr 
 */
function createDisciplineSelector (nr) {
    $('#selectordisc').empty();
    var ancora = document.getElementById('selectordisc');
    var sel = $('<select>');
    // sel.addClass("custom-select").attr('required').prop('required');
    sel.attr({
        "id": "discselection",
        class: "custom-select",
        "required": "true",
        "multiple": "true"
    });
    sel.appendTo(ancora);
    // console.log(nr);
    // adu-mi toate disciplinele pentru clasa din nr
    var discs = discipline.get(`${nr}`);
    $(discs).each(function () {
        sel.append($('<option>').attr('value', this).text(this));
    });
    // console.log(discs);
    // bagă disciplinele ca opțiuni într-un select multi
    // $('#example').append('<option value="foo" selected="selected">Foo</option>');
    $('<select class="custom-select" required>');
}

$('#selectordisc').on('change', function () {
    var delayAct = setTimeout(function () {
        var discArr = $('#discselection option:selected').map(function () {
            // acesta este array-ul disciplinelor alese pentru o anumită clasă. În cazul în care este aleasă doar clasa si este apasat butonul, sunt aduse primele 10 resurse 
            return this.value;
        }).get();
        // console.log(discArr);
        pubComm.emit('searchresdisc', discArr);
    }, 1700);
    pubComm.on('searchresdisc', populeazaCuRes);
});

function populeazaCuRes (resurse) {
    var template = document.getElementById('resursa-template').innerHTML;
    var renderResurse = Handlebars.compile(template);
    document.getElementById('respubselected').innerHTML = renderResurse({
        resurse
    });
}