# Introducerea unei competențe noi sau modificarea uneia existentă

Pentru a administra codurile competențelor specifice, trebuie examinate următoarele componente:
- fișierul `form-adaugare-res.hbs`, care este șablonul HTML folosit de formularul aplicației. Acesta este în subdirectorul `views/partials` din rădăcina aplicației;
- fișierul `form01adres.mjs` din subdirectorul `public/js` care realizează cuplarea datelor din `form-adaugare-res.hbs` pentru a realiza interfața;
- baza de date a aplicației care stochează fiecare competență specifică ca înregistrări indviduale care au un cod unic pentru fiecare.


## Fișierul form-adaugare-res.hbs ca putător de date

Pentru a evita interogări cascadate pe baza de date și astfel pentru a păstra interacțiunea cu serverul la un nivel minim, s-a optat pentru ca fișierul `form-adaugare-res.hbs` să fie purtătorul datelor de lucru necesare selecțiilor formularului. Aceste date sunt atribute de tip `data-*` pentru diferitele elemente `<select>` sau `<input>`.

## Codurile competențelor specifice

În fișierul `form-adaugare-res.hbs` în fieldset-ul cu id-ul `claseleSel` există două diviziuni principale: `Primar` și `Gimnaziu`. Pentru fiecare clasă există câte un element `<input>` de tip checkbox care este purtător al datelor. Observă că atributul `value` indică clasa, precum în `value="cl0"`. Clasa este scrisă în formă prescurtată de la clasa 0, până la a VIII-a pornind de la `cl0`, la `cl8`.

Pentru fiecare clasă, elementul de input poartă toate datele necesare lucrului cu selecțiile discipinelor. Acestea sunt introduse în atributele `data-*`, precum în ` data-lbcom-rom0 ="Comunicare în limba română"`. Observă faptul că formarea codului de disciplină pleacă de la ceea ce este după `data-` așa cum este, de exemplu `lbcom-rom0` pentru *Comunicare în limba română* din clasa zero. Concatenarea celor două componente ale codului prin eliminarea liniuței despărțitoare și scrierea cu majusculă a primei litere din al doilea fragment, constituie codul de disciplină. Motivul pentru care există despărțirea prin liniuță la unele discipline, iar la altele nu este legată de varietatea unei discipline așa cum este *Religia* sau *Comunicare* în limba română și cele ale minorităților, de exemplu. Acolo unde disciplina este fără o fațetare, codul de disciplină este scris în atribut fără al doilea fragment și astfel, nu ai nici varianta concatenată (*cammelcase*).

Structura codurilor de disciplină, poate fi urmărită în `form01adres.mjs` în interiorul definirii structurii de mapping `mapCodDisc.set`. Aici sunt codurile finale. Pentru fiecare clasă există propria structură ``mapCodDisc.set`, adică `mapCodDisc.set("0", [])`, `mapCodDisc.set("1", [])` ș.a.m.d.

Odată aceste coduri pentru disciplină stabile, cele ale competențelor specifice, pur și simplu sunt completate cu o liniuță și numărul fiecăreia așa cum este în planul de învățământ.

## Codurile ariilor curriculare

Pentru a înțelege cum se constituie codurile, vom deschide fișierul `form-adaugare-res.hbs` și la fieldset-ul cu id-ul `arrileC` putem vedea care sunt codurile fiecărei arii curiculare în parte.

Fiecare arie curiculară are propriul său cod. Mai jos sunt atributele fiecărui element `<option>` care setează codurile:
- `data-lbcom="lbcom" value="Limbă și comunicare"`,
- `data-matstnat="matstnat" value="Matematică și științe ale naturii"`,
- `data-omsoc="omsoc" value="Om și societate"`,
- `data-edfizsp="edfizsp" value="Educație fizică și sport"`,
- `data-arte="arte" value="Arte"`,
- `data-teh="teh" value="Tehnologii"`,
- `data-consor="consor" value="Consiliere și orientare"`,
- `data-currsc="currsc" value="Curriculum la decizia școlii"`.

Deocamdată acestea nu sunt active, în sensul că nu determină care sunt subseturile disciplinelor. Poate la un moment viitor.