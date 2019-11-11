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

// LISTENER pentru multiselectul disciplinelor; 
$('#selectordisc').on('change', function () {
    var delayAct = setTimeout(function () {
        var discArr = $('#discselection option:selected').map(function () {
            // acesta este array-ul disciplinelor alese pentru o anumită clasă. În cazul în care este aleasă doar clasa si este apasat butonul, sunt aduse primele 10 resurse 
            return this.value;
        }).get();
        // console.log(discArr);
        pubComm.emit('searchresdisc', discArr);
    }, 1300);
    pubComm.on('searchresdisc', populeazaCuRes);
});

// LISTENER pentru căutarea generală
$('#generalsearch').on('click', function (event) {
    event.preventDefault();
    // selectează valoarea din input și trimite-o în backend
    var searchterms = $('#searchterms').val();
    if (searchterms) {
        pubComm.emit('searchres', searchterms);
    }
});

// LISTENER pentru ENTER pe căutare
$('#searchterms').on('keyup', function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        $('#generalsearch').click();
    }
});

// LISTENER pentru orice modificare
$('#searchterms').change(function () {
    console.log('E ceva nou');
});

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

pubComm.on('searchres', function populeazaCuResES (resurse) {
    $('#selectordisc').empty(); 
    $('#respubselected').empty();

    var sablon = document.getElementById('resursa-template');
    
    resurse.forEach((resursa) => {
        console.log(resursa);
        console.log(resursa._source.title);
        // creezi o instanță a conținutului template-ului
        const instance = document.importNode(sablon.content, true);
        // Introdu conținutul în template
        instance.querySelector('.card-title').innerHTML = resursa._source.title;
        instance.querySelector('.card-text').innerHTML = resursa._source.description;
        instance.querySelector('#resid').href = `/resursepublice/${resursa._id}`;

        // Append the instance ot the DOM
        document.getElementById('respubselected').appendChild(instance);
    });
});
