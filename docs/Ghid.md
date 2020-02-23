![](images/HeaderProiect.png)

# Ghidul aplicației red.educred.ro

Nicolaie Constantinescu, nicu.constantinescu@educred.ro

## 1. Resursele în red.educred.ro

Odată create Resursele Educaționale Deschise, acestea apar în mai multe locuri din aplicația red.educred.ro. De exemplu, ultimele zece care au fost introduse vor apărea chiar pe pagina cu care aplicația se deschide.

![](img/resurse-prezentate/Landing.png)

Chiar din această pagină de întâmpinare este oferită posibilitatea de a accesa secțiunea în care sunt accesibile RED-urile care au fost declarate a fi demne de interesul public.

![](img/resurse-prezentate/ResursePubliceFull.png)

Resursele vor mai apărea atunci când este accesată secțiunea **Profil** -> **Resursele mele**.

![](img/resurse-prezentate/ResursaInResurseProprii.png)

Ultimul loc în care le veți mai găsi este legat de rolul de administrator al aplicației, în momentul în care care cauți unul din participanții din proiect pentru a investiga contribuțiile sale.

## 2. Crearea de cont red.educred.ro

Pentru a realiza un nivel de compatibilitate crescut cu întreaga infrastructură software creată în cadrul proiectului, Colectorul RED permite crearea de cont și astfel realizarea unei autentificări la nivel local corespondentă cu restul componentelor.

Pentru a crea un cont nu este necesar nimic altceva decât accesarea din meniul principal de pe prima pagină a opțiunii **Loghează-te**. Îmediat apare un ecran care vă propune apăsarea pe logo-ul proiectului Educred. Acest lucru va declanșa mecanismul de autentificare. Veți fi invitați să vă autentificați cu adresa de email pe care o aveți deja sub forma **nume_prenume@educred.ro**. Crearea contului se va face cu un browser proaspăt deschis, având un singur tab curat. Au exitat multe cazuri de sesiuni încrucișate și autentificări eșuate din cazul existenței mai multor sesiuni deschise în diferite taburi. 

![](img/creare-user/SignIn.png)

În acest moment, a fost creat și contul local aplicației red.educred.ro.

### 2.1 Profilul propriu

Odată autentificați, structura meniurilor se schimbă îmbogățindu-se cu opțiuni doar pentru cei autentificați cu succes.
Există o secțiune de **Profil** accesibilă din meniu de unde ai posibilitatea să verifici ce roluri dețineți în sistem, în ce unități (instituții, cursuri, formări, grupe, etc) sunteți înscriși.

![](img/creare-user/ProfilUserFaraNiciunRol.png)

Mai sus avem exemplul unui utilizator al platformei educred.ro care abia și-a creat contul prin autentificarea la red.educred.ro.
După cum se observă, din start, un utilizator are rolul de utilizator în „educred” (vezi *Roluri*) și este asimilat formei de organizare sau mai bine spus setului de interacțiuni numit generic „global” (vezi *Unități*).

Mai jos este un utilizator a cărui interacțiuni în interiorul Colectorului RED a fost dezvoltată.

![](img/creare-user/PropriulProfil.png)

Pentru acei utilizatori care sunt administratori ai Colectorului RED, în dreptul descriptorului **Administrator** va apărea informația **confirmat**.

### Resursele proprii

Panoul **Profil** permite accesul la vizualizarea resurselor proprii.

## 3. Încărcarea Resurselor Educaționale Deschise

### 3.1 Introducere

Acest material descrie pașii pe care persoana care contribuie cu o resursă trebuie să-i parcurgă pentru a introduce o înregistrare viabilă. Formularul dedicat expune patru pași în succesiune, care la rândul lor, fiecare expun informații specifice.
Completarea pașilor pentru adăugarea unei Resurse Educaționale Deschise va genera în baza de date o fișă descriptivă, iar în directorul dedicat `repo` se va constitui câte un subdirector pentru fiecare resursă în parte în directorul fiecărui utilizator al platformei. Mai jos este un mic exemplu ilustrativ pentru structura unei resurse așa cum este structurată pe hard disk-ul serverului după ce s-a încheiat introducerea.

![](img/StructuraSubdirectoare.png)

Pentru a fi mai simplu, din acest moment vom folosi în întreg documentul acronimul RED pentru Resurse Educaționale Deschise.

### 3.2 Preliminarii

Utilizatorii, formabili, formatori, experți e-learning și în general toți cei care interacționează cu aplicația Colector RED, trebuie să înțeleagă faptul că această aplicație are rolul de a descrie entități digitale deja existente, fie acestea documente, teste, video, simple texte, etc.

Toți cei care vor contribui cu resurse, vor trebui să aibă materialele deja pregătite, gata de a fi introduse.

Colectorul RED nu este un instrument de creație. Este o aplicație de agregare a materialelor care deja există, oferind cadrul descriptiv necesar încadrării din punct de vedere al Curriculei și al rigorii științifice din domeniul educației și pedagogiei.

Este necesară o bună cunoaștere a materialului care va urma să fie descris. Pentru a aprofunda cunoașterea privind elaborarea unei Resurse Educaționale Deschisă, vă invit să parcurgeți încă o dată cursul dedicat din cadrul proiectului CRED în educație.

### Pasul 1 - Titlu și responsabilitate

Primul pas a fișei este dedicat introducerii titlului, descrierii și licenței pe care o poartă RED-ul.

![](img/introducere-resursa/Pas1-all.png)

#### P1.1 Titlul resursei

Titlul resursei primește informația care va denumi resursa educațională și trebuie să fie o formulare concisă în limba română.

![](img/Pas1-TitlulResursei.png)

Software-ul prevede eventualitatea folosirii sale în grupuri ale vorbitorilor de alte limbi, care trăiesc în România sau care au devenit cetățeni români, dar sunt de altă naționalitate. În cazul acesta, formularul prevede posibilitatea de a introduce titlul în limba minorității urmată de selectarea limbii acesteia.

#### P1.2 Responsabilitate (contribuitor)

În secțiunea aceasta `Responsabilitate` este un câmp care va fi completat automat cu datele persoanei care s-a autentificat și care face contribuția. În baza adresei de email se va face generarea subdirectoarelor proprii fiecărui utilizator care contribuie cu resurse. 

Persoana care introduce RED-ul în sistem este considerat a fi contribuitorul acesteia. Un contribuitor poate fi autorul RED-ului, dar în cazul în care acesta este produsul a mai multor autori, unul dintre aceștia va fi desemnat să încarce resursa în sistem, fiind cel care *contribuie* RED-ul în sistem. În acest caz, contribuitorul poate fi considerat autor colectiv.

#### P1.3 Autorii

Autorii unei resurse pot fi o singură persoană, un grup, un colectiv, o instituție. Autorii vor fi introduși rând pe rând, separați de virgule. Nu uitați separarea cu virgule care este esențială. Trebuie înțeleasă distincția clară dintre autori și contribuitori.

#### P1.4 O scurtă descriere a resursei

În maxim 1000 de caractere, contribuitorul trebuie să descrie conținutul RED-ului. Contribuitorul va introduce toate detaliile necesare realizării unei bune corelații între titlu, descriere și conținut.

![](img/Pas1-ScurtaDescriereAResursei.png)

Acest element este obligatoriu să fie completat. Este recomandabil să fie introduse două propoziții sau maxim o frază. Acest detaliu este foarte important pentru că dincolo de aspectele ce țin de natura funcțională, acesta este și textul care va apărea în prezentarea publică a resursei. 

#### P1.4 Alegerea licenței resursei

![](img/Pas1-AlegereaLicentei.png)

Un RED poartă încă din denumire atributul care permite tuturor celor interesați reutilizarea în scopuri didactice sau chiar pentru realizarea de lucrări derivate.
Pentru a crește nivelul de implicare și gradul de refolosire a materialelor, a fost aleasă suita de licențe Creative Commons. Prima opțiune, care este și cea selectată implicit este „Atribuire”, fiind cea mai deschisă din toate cele posibile. Despre licențele Creative Commons puteți citi mai multe la „[Despre licențe](https://creativecommons.org/licenses/?lang=ro)”. Despre efectele și aria de protecție pentru fiecare licență în parte consultă și „[Distribuie-ți opera](https://creativecommons.org/choose/?lang=ro)”

Pentru că este posibil ca unii dintre creatori să considere codul sursă a unui software ca fiind o Resursă Educațională Deschisă, am introdus și licența generică GNU - General Public License.
Despre licența [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.en.html) puteți să aflați mai multe de la [articolul Wikipedia dedicat](https://ro.wikipedia.org/wiki/Licen%C8%9Ba_Public%C4%83_General%C4%83_GNU).

### Pasul 2 - Încadrarea resursei

Pasul doi adaugă informație privind Aria curriculară, clasa sau clasele la care poate fi folosită resursa și competențele specifice expuse de fiecare disciplină.

![](img/Pas2-IncadrareaResursei.png)

#### P2.1 Arie curriculară

Selectarea corectă a **Ariei curriculare** este primul criteriu de încadrare al resursei. Se poate opta pentru mai multe *arii curriculare* atunci când resursa are un caracter transversal.

#### P2.2 Clasa

Un RED poate fi conceput pentru a fi folosit la mai multe clase diferite. Acesta este și motivul pentru care a fost lăsată opțiunea de a alege mai multe clase. Atenție, selectarea claselor este în directă legătură cu apariția disciplinelor, care sunt expuse pentru încadrarea mai granulară. Bifarea unei clase are drept efect apariția disciplinelor acelor clase. Pentru acest material, am ales să nu încărcăm toate disciplinele. Dacă nu apar toate motivul este că folosim un set de date demonstrativ, redus ca dimensiuni.

![](img/Pasul2-ClasaAIIaCuDisciplineleSetRedus.png)

Bifarea mai multor clase, va adăuga setului existent disciplinele proprii.

![](img/Pasul2-ClasaAIIaSiAIIIaSetRedusDiscipline.png)

#### P2.3 Alege disciplinele

Selectarea disciplinei sau a mai multora încarcă competențele specifice. Pentru a avea acces la competențele specifice și implicit la activitățile proprii, cât și pentru a propune noi activități inexistente, se va alege una sau mai multe discipline.

![](img/Pasul2-SelectareaPrimeiDiscipline-Alege.png)

În acest moment, după ce am putut selecta disciplina sau disciplinele în cazul în care RED-ul răspunde mai multor discipline, apare opțiunea de a încărca competențele specifice așa cum apar acestea în Planul Național. Pentru fiecare dintre Competențele Specifice prezente, există posibilitatea de a consulta activitățile care sunt arondate.

![](img/Pas2-SelectieCSActivitatiAnsamblu.png)

Pentru fiecare competență specifică, apăsând butonul verde, vei avea acces la cunoștințe, abilități, atitudini arondate fiecărei competențe specifice.
Acestea pot fi selectate, iar în cazul în care se dorește ceva ce nu există, este oferită posibilitatea de a introduce una nouă.

![](img/Pas2-SelectieCSAdaugaActivitate.png)

Activitățile noi introduse, vor completa setul celor deja existente.

![](img/Pas2-SelectieCSActivitateAdaugata.png)

### Pasul 3 - Validarea resursei prin specificitate

Acest pas permite o mai mare granularitate în ceea ce privește atributele și funcțiile / obiectivele pe care trebuie să le împlinească conținuturile Resursei Educaționale Deschise.

![](img/Pas3-ValidareaREDprinCriteriiDeIncadrareCompletat.png)

### Pasul 4 - Introducerea conținuturilor

Editorul permite încărcarea de fișiere tip document, text, referințe către materiale video, fragmente de cod active și fișiere de imagine în format `jpg` și `png`. Este permisă copierea și inserarea de text care conține hyperlinkuri.

![](img/Pas4-EditorulIndicatorulDeBloc.png)

Un posibil scenariu de completare poate implica introducerea unui fragment de text cu o imagine și un material video de pe Youtube. În acest sens, editorul oferit este foarte flexibil considerând fiecare intrare drept un bloc de conținut distinct.

![](img/Pas4-BlocDeTextInserat.png)

În cazul fișierelor de imagine este permisă încărcarea urmată de afișarea imaginii. Este preferabil ca una dintre imaginile încărcate, să fie cea mai reprezentativă pentru resursă. În cazul în care sunt mai multe imagini asociate conținutului, acestea pot fi încărcate fără probleme concomitent cu afișarea lor.

![](img/Pas4-EditorVideoYT.png)

Încărcarea pentru imagine înseamnă copy/paste a unui link a cărui element final indică o imagine sau chiar încărcarea de pe hard disk a unei imagini. Pentru fiecare imagine, se va introduce un element descriptiv în zona `Caption` afișată dedesubt. Chiar dacă nu există nicio mențiune atașată imaginii, se va trece obligatoriu numele fișierului (este necesar pentru a asigura specificitatea resursei de imagine în contextul înregistrării).

Editorul permite încărcarea de fișiere word, pdf, etc.

Toate aceste fișiere încărcate vor sta împreună în același director dedicat al resursei pentru care se constituie înregistrarea.

După ce am încărcat în editor fragmentele necesare sau am încărcat un fișier care reprezintă resursa, se va proceda la alegerea imaginii, care va ilustra resursa la momentul afisării sale în zona publică. Putem să ne gândim la această imagine ca la o copertă.

![](img/Pas4-EditorsalvareaContinutuluiSiSelectieImagineCoperta.png)

Din moment ce am făcut și acest mic pas, nu mai rămâne decât să completăm cuvintele cheie de care avem nevoie în plus față de cele generate prin completarea formularului.
Cuvintele cheie se completează delimitându-se cu virgulă, dar, atenție, fără spații între cuvintele cheie și virgule.

Odată parcus și acest ultim pas vom salva resursa și imediat vom fi trimiși în modul de vizualizare a sa.

![](img/RED-Publicat.png)

##4.  Administrare

Unul din posibilele roluri pe care le poate juca un utilizator autentificat este cel de administrator. Administratorii pot face două operațiuni esențiale în economia existenței unui RED. 
RED-urile care nu sunt verificate, au un marcaj fin de culoare galbenă atunci când sunt accesate de un administrator. 

![](img/VizualizareRED-ADMIN.png)

În momentul în care sunt validate, marcajul se transformă în verde indicând modificarea de stare.

Poate verifica și poate trimite RED-ul în zona publică.

![](img/REDVerificat-ADMIN.png)