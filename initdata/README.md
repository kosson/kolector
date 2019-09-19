# Sistem de codare

## Sistem de codare pentru competențele specifice

Să analizăm competența specifică „1.1 Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate” pentru disciplina „Comunicare în limba română”.

Codificare sa va fi: **LbComRoComLbRomClI01Spec1.1** care înseamnă:

- **LbCom** - aria curriculară „Limbă și comunicare”,
- **Ro** - indică limba maternă,
- **ComLbRom** - indică numele disciplinei „Comunicare în limba română”,
- **ClI** - indică nivelul școlar clasa I,
- **01** - indică grupa mare a competențelor, în cazul de față „1. Receptarea de mesaje orale în contexte de comunicare cunoscute”,
- **Spec1.1** - indică competența „specifică” 1.1.

## Încărcarea competențelor specifice în MongoDB

Mai întâi de toate se vor introduce toate fișierele csv care au fost preformatate (deschide unul pentru a vedea headerul și structura) în directorul `csvuri`. Fiecare fișier CSV este formatat cât mai curat din ceea ce au oferit profesorii. Datele au fost curățate prin înlocuirea caracterelor cu diacriticile greșite și prin eliminarea caracterelor blanc (`/n`). Tot fișierele originale sunt debitate de coloanele inutile pentru această etapă de hidratare a bazei de date.

Apoi se va executa `node compSpecLoader.js` care va concatena toate fișierele și va încărca în baza de date înregistrările pentru o nouă colecție generată cu numele `competentaspecificas`. Prima parte a scriptului `compSpecLoader.js` va genera un fișier CSV cu toate datele din toate fișierele numit `all.csv`.

În cazul în care trebuie adăugate de la 0 din nou toate datele, se va activa linia `// mongoose.connection.dropCollection('competentaspecificas'); // Fii foarte atent: șterge toate datele din colecție la fiecare load!.` care este comentată.

În cazul în care se dorește adăuarea de date peste cele deja existente, se vor adăuga noile fișiere csv în directorul `csvuri`. Atenție ca în acest caz să nu cumva să păstrezi fișiere csv ale căror date au fost încărcate deja.

Pentru un scop de lucru viitor, scriptul va genera și un fișier JSON cu toate datele.