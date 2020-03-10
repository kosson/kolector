# Instalare

Este necesară o mașină Linux, de preferat un Ubuntu server 18.04.2 LTS.

Software necesar:
- MongoDB
- Node.js
- Redis
- Elasticsearch
- Kibana

Ca etapă preliminară este necesară obținerea de chei pentru dezvoltarea de aplicații furnizate de Google (https://developers.google.com/identity/sign-in/web și https://developers.google.com/identity/sign-in/web/sign-in#before_you_begin).

Aplicația are nevoie de serviciile de SignIn oferite de Google și din acest motiv trebuie ca persoana care face instalarea și care va îngriji aplicația, să creeze un cont de Google pentru aplicația în sine. Acest cont va fi utilizat numai în scop de autentificare și pentru a furniza credențialele necesare.
După ce contul de Google a fost creat, se va naviga la Google API console, accesibil în momentul redactării acestui ghid de instalare la https://console.developers.google.com. Se va proceda la crearea unui `OAuth 2.0 client ID` din secțiunea `Credentials`.

La acest pas sunt cerute două căi pentru `Authorised JavaScript origins` și `Authorised redirect URIs`. Căile pentru această aplicație sunt:

- `Authorised JavaScript origins`: `http://localhost:8080`,
- `Authorised redirect URIs`: `http://localhost:8080/callback`

Copiază datele de la ` Client ID` și de la `Client secret`. Acestea vor fi necesare pentru a completa setările din fișierul dedicat, numit `.env`.

### Instalare utilitare

Pentru a nu întâmpina surprize pe parcursul instalării, asigură-te că ai următoarele pachete instalate deja.

```bash
sudo add-apt-repository universe
sudo apt-get install curl
sudo apt-get install software-properties-common
sudo apt-get install -y build-essential python
sudo snap install bower --classic
```

### Activează firewall-ul

În cazul în care instalarea se face pe un server care nu are firewall hardware și este expus direct către WWW, atunci este necesară folosirea unui firewall al sistemului de operare pe care rulează aplicația.
În acest sens, există un ghid de instalare și configurare la https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-18-04.

### Instalare Redis

Pentru a realiza mecanismul de caching, se va instala Redis.

```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server.service
redis-cli ping
```

Ar trebui să ai răspuns `PONG` la ultima comandă.

### Instalare Node.js

Aplicația este una scrisă exclusiv în ECMAScript, ceea ce necesită pentru partea server instalarea lui Node.js.

```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install nodejs
node -v
```

La verificarea versiunii, ar trebui să răspundă cu versiunea precum următoarea secvență: `v12.13.0`.

Instalează și pachetul PM2 care este folosit pentru rularea aplicației și repornirea automată în caz de downtime. Instalarea se va face la nivel global (vezi flag-ul `g`).

```bash
sudo npm install pm2 -g
```

### Instalare Mongodb

Baza de date folosită de platformă este MongoDB.

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt update
sudo apt install mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod 
mongod --version
```

Odată instalat, MongoDB în momentul în care ceri versiunea, trebuie să ai un răspuns asemănător cu următoarea secvență.

```text
db version v4.0.12
git version: 5776e3cbf9e7afe86e6b29e22520ffb6766e95d4
OpenSSL version: OpenSSL 1.1.1  11 Sep 2018
allocator: tcmalloc
modules: none
build environment:
    distmod: ubuntu1804
    distarch: x86_64
    target_arch: x86_64
```

#### Securizează MongoDB

După instalarea MongoDB, asigură-te că funcționează.

```bash
systemctl status mongod
```

Din consolă, leagă-te la instanța de MongoDB.

```bash
mongo
```

Din shell-ul obținut către MongoDB, treci la utilizarea bazei de date `admin`.

```text
> use admin
```

În acest moment, vei crea un cond te utilizator care să fie administrator de baze de date.

```text
db.createUser({user:"nume_administrator",pwd:"paR0laMea1nfa1libila",roles:[{role:"userAdminAnyDatabase",db:"admin"}]})
```

În exemplul de mai sus, pentru fiecare server MongoDB se vor înlocui pentru câmpurile `user` și `pwd` datele cele două cu cele proprii. Userul va fi creat de MongoDB și va fi afișat în consolă un obiect similar cu cel de mai jos:

```text
Successfully added user: {
	"user" : "nume_administrator",
	"roles" : [
		{
			"role" : "userAdminAnyDatabase",
			"db" : "admin"
		}
	]
}
```

Pentru mai multe detalii, consultă și https://docs.mongodb.com/manual/tutorial/create-users/. Se va ieși din consola MongoDB introducând comanda `exit`.

În fișierul `/etc/mongodb.conf` trebuie activată rularea securizată prin editarea cu drepturi sudo.

```bash
sudo nano /etc/mongodb.conf
```

În fișier pentru versiunea 3.6.3 a lui MongoDB, va trebui să ștergi diezul din fața lui `auth = true`.

```text
# Turn on/off security.  Off is currently the default
#noauth = true
auth = true
```

MongoDB trebuie repornit.

```bash
sudo systemctl restart mongodb
```

În cazul în care dorești autentificare specific pe o bază de date, mai întâi trebuie să te autentifici din consola MongoDB și apoi să faci o modificare.

```text
db.auth({user: "nume_administrator", pwd: "paR0laMea1nfa1libila"})
1
db.grantRolesToUser("nume_administrator", ["readWrite", {role: "readWrite", db: "redcolector"}])
```

În cazul în care baze de date conține mai multe baze aparținând diferitelor aplicații, va trebui să ceri administratorului sau dacă tu ai aceste drepturi să adaugi drepturi de scriere/citire pentru baza de date a aplicației colectorului.

În cazul în care ești administratorul, te autentifici din consola `mongo`, selectezi baza de date `admin`, după care te autentifici.

```bash
use admin
db.auth('numeleAdminului', 'parolaSa')
```

Mai întâi, asigură-te că nu trebuie doar să modifici ceea ce există, căutând dreturile administratorului.

```bash
db.system.users.find()
```

Acum, introdu drepturi de scriere/citire pentru o anumită bază de date.

```bash
db.grantRolesToUser('numeleAdminului', ['readWrite', {role: 'readWrite', db: 'numeleBazeiDeDate'}])
```

## Instalarea Elasticsearch

Asigură-te că ai instalată Java rulând comanda `java -v`. Dacă nu ai un răspuns, va trebui instalat Java.

```bash
sudo apt install openjdk-8-jdk
```

Pentru a vedea ce opțiuni îți oferă sistemul privind Java Virtual Machines, rulează comanda `update-alternatives --config java`. Setează variabila de mediu `JAVA_HOME` rulând în consolă `export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64/bin/java`. Astfel, vom seta calea către directorul unde avem instalat JAVA.

Pentru a verifica, rulează comanda `echo $JAVA_HOME`.

Mai trebuile adăugat directorul binarelor Java la căile de sistem. Vom face acest lucru beneficiind de faptul că am setat variabila de sistem `$JAVA_HOME`. Astfel, în consolă executăm `export PATH=$PATH:$JAVA_HOME/bin`.

Verifică dacă a fost adăugată calea către binare rulând `echo $PATH`. Rulând comanda `java -version` ar trebui să reflecte versiunea de Java dorită.

Împortă cheia depozitului.

```bash
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

Dacă ai un răspuns `OK`, atunci poți proceda la introducerea în lista depzozitelor (directorul `sources.list.d`), pe cel al lui Elasticsearch.

```bash
sudo sh -c 'echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" > /etc/apt/sources.list.d/elastic-7.x.list'
```

Procedează la actualizarea listei rulând comanda `sudo apt update`.
Instalează Elastisearch rulând comanda `sudo apt install elasticsearch`. După instalare, este necesară activarea serviciului rulând comanda `sudo systemctl enable elasticsearch.service`. Astfel, Elasticsearch va fi pornit ori de câte ori sistemul va fi repornit.

În acest moment ești gata să pornești pentru prima dată serverul de Elastisearch rulând `sudo systemctl start elasticsearch.service`. Dacă totul funcționează ok, răspunsul în browser la adresa `http://localhost:9200/` ar trebui să fie un obiect. Poți rula repede din comandă `curl -X GET "localhost:9200/"`. În cazul în care la interogare, este returnat un mesaj *failed to connect* trebuie să mai aștepți puțin pentru ca serverul să pornească. Elasticsearch are nevoie de ceva timp pentru a porni.

Dacă erorile persistă, poți investiga folosind comanda `sudo journalctl -u elasticsearch`.

## Aducerea resurselor de pe Github

Pentru a avea deja resursele descărcate, trebuie setat subdirectorul din `/var/www/numeSite`.

```bash
sudo mkdir db.proiectInstitutie.ro
sudo chown userAdm:userAdm db.proiectInstitutie.ro
sudo chmod -R 755 /var/www/db.proiectInstitutie.ro/
```

Din subdirectorul selectat inițiezi depozitul `.git`.

```bash
git init .
git remote add origin git@github.com:kosson/redcolector.git
git fetch origin
git checkout master
```

### Instalarea resurselor cu Bower

Imediat după aducerea resurselor de pe Github, este indicată instalarea din consola serverului a dependințelor externe necesare. Toate dependințele necesare specificate în `bower.json` vor fi instalate în directorul specificat de `.bowerrc`. În cazul nostru, în `public/lib`.

```bash
bower install
```

#### Dependințe DataTable

Aceste dependințe sunt necesare pentru a realiza mediul de prezentare a datelor în format tabelar.


### Crearea fișierului `.env`

Acest fișier este necesar pentru că ține datele necesare conectării cu serverul bazei de date și credențialele necesare gestionării sistemului de autentificare cu serverul Google.
Primul pas este să creezi fișierul `.env` chiar în rădăcina aplicației. Deschide-l și introdu datele necesare așa cum sunt specificate în următoarele câmpuri:

```text
MONGO_LOCAL_CONN=mongodb://localhost:27017/redcolector
MONGO_USER=nume_utilizator
MONGO_PASSWD=parola_utilizatorului
ELASTIC_URL=http://localhost:9200
GOOGLE_CLIENT_ID=xsdkkdfkjkuf8s9df9sdfsf9sdfhsvp84.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=fdsao09sad99s0fuajfas
BASE_URL=http://localhost:8080
NAME_OF_REPO_DIR=repo
REPO_REL_PATH=./repo/
FILE_LIMIT_UPL_RES=5242880
APP_VER=0.1.3
```

Câmpurile `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET` sunt proprii administratorului care face instalarea.
Câmpurile `MONGO_USER` și `MONGO_PASSWD` se vor completa cu datele necesare autorizării la serverul bazei de date MongoDB, care a fost securizat în prealabil.

### Instalare NGINX

Instalarea serverului NGINX este necesară pentru a a gestiona certificatele SSL și pentru a face *balancing*.

```bash
sudo apt install nginx
sudo systemctl status nginx
```

Odată instalat, ar trebui să ai un răspuns asemănător cu următoarea secvență:

```txt
nginx.service - A high performance web server and a reverse proxy server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2019-09-11 11:57:29 EEST; 29s ago
     Docs: man:nginx(8)
 Main PID: 7412 (nginx)
    Tasks: 3 (limit: 4915)
   CGroup: /system.slice/nginx.service
           ├─7412 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
           ├─7413 nginx: worker process
           └─7414 nginx: worker process

Sep 11 11:57:29 db systemd[1]: Starting A high performance web server and a reverse proxy server...
Sep 11 11:57:29 db systemd[1]: Started A high performance web server and a reverse proxy server.
```

Dacă serviciul este oprit, pornește-l folosind comanda: 

```bash
sudo systemctl start nginx
```

Dacă ai nevoie să-l oprești mai întâi (stare de eroare).

```bash
sudo systemctl stop nginx
```

Pentru a face serviciul să pornească la fiecare restart:

```bash
sudo systemctl enable nginx
```

Creează directorul aplicației în subdirectorul `/var/www/`

```bash
sudo mkdir db.proiectInstitutie.ro
sudo chown userAdm:userAdm db.proiectInstitutie.ro
sudo chmod -R 755 /var/www/db.proiectInstitutie.ro/
sudo nano /etc/nginx/sites-available/db.proiectInstitutie.ro/
```

### Instalează certbot

Adaugă repo-ul de surse.

```bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
```

După actualizarea pachetelor din cache, instalează-l.

```bash
sudo apt install python-certbot-nginx
```

#### Instalează certificate pentru domeniile setate în NGINX

```bash
sudo certbot --nginx -d db.proiectInstitutie.ro -d www.db.proiectInstitutie.ro
```

Certbot adaugă următoarea secvență la fișierul de configurare în cazul în care certificatele de securitate s-au instalat corect.

```text
    listen 443 ssl http2 default_server; # managed by Certbot
    listen [::]:443 ssl http2 default_server; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/db.proiectInstitutie.ro/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/db.proiectInstitutie.ro/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
```

### Amendează configurarea serverului NGINX

Următoarea secvență este un model de configurare a serverului ce permite folosirea certificatelor emise de Letsencrypt.

```txt
# Default server configuration
server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name db.proiectInstitutie.ro www.db.proiectInstitutie.ro;
	    return 301 https://$server_name$request_uri;
}

# Virtual Host/SSL/Reverse proxy configuration pentru db.proiectInstitutie.ro
server {
    # Listen on both HTTP and HTTPS - between Nginx and Express the traffic is HTTP but this is not a major
    # security concern as both services are on the same box
    listen 80;
    
    listen 443 ssl http2 default_server; # managed by Certbot
    listen [::]:443 ssl http2 default_server; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/db.proiectInstitutie.ro/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/db.proiectInstitutie.ro/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    server_name db.proiectInstitutie.ro www.db.proiectInstitutie.ro;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Allow location for Acme challenge - you also might need to allow 'dotfiles' in Express (see next section)
    location ~ /.well-known {
        allow all;
	    proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
    }
}
```

În fișierul de configurare dat drept model se va înlocui secvența `db.proiectInstitutie.ro` și `www.db.proiectInstitutie.ro` cu cele ale propriilor domenii. Verifică sintaxa fișierului de configurare să fie în regulă folosind comanda:

```bash
sudo nginx -t
```

Trebuie urmărit un răspuns asemănător cu următoarea secvență:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Este necesar să reîncerci setările folosind următoarea secvență de comenzi:

```bash
sudo systemctl reload nginx
```

### Introducerea datelor în baza de date

În acest moment baza de date este goală și este nevoie de încărcarea seturilor de date necesare. Primul set este cel al competențelor specifice cu activitățile arondate.

#### Încărcarea competențelor specifice pentru discipine

În interiorul subdirectorului `initdata` există seturile de date necesare populării bazei de date. Pentru a încărca datele în baza de date, se va face un symlink către fișierul `.env` din directorul rădăcină a aplicației din care scriptul de încărvare va culege date utile rulării.

```bash
ln -s ../.env .
```

În cazul în care fișierul sumator numit generic `all.csv` din subdirectorul `csvuri` nu există, se va activa linia care generează acest fișier sumator al seturilor de date pentru disciplinele individuale.

```javascript
// concatCSVAndOutput(read(dir), `${dir}/all.csv`);
```

Apoi rulează:

```bash
node compSpecLoader.js
```

În momentul afișării mesajului `Am terminat de scris rezultatul!` în consolă, se a termina execuția scriptului cu CTRL + C. Acesta este primul pas: generarea fișierului `all.csv`. Imediat după, se va dezactiva această linie și se va rula din nou scriptul pentru a se încărca datele generate în MongoDB. În cazul în care totul a funcționat corect, va fi afișat în consolă numărul de înregistrări introduse.

La finalizarea operațiunii, va fi afișat în consolă un mesaj similar următorului `Înregistrări inserate în colecție:  408`. Acesta semnalează popularea bazei de date.

În cazul în care dorești la fiecare rulare a scriptului `compSpecLoader.js` să se șteargă și să se construiască de la zero setul de date în bază, se va activa următoarea linie din script.

```javascript
// mongoose.connection.dropCollection('competentaspecificas');
```

Acest lucru este necesar pentru a avea acces la setările de securitate prin care se face conexiunea la baza de date.
După ce acest symlink a fost făcut, se va lansa în execuție executând scriptul `compSpecLoader.js`.

```bash
node compSpecLoader.js
```

Dacă toate lucrurile au funcționat corect, ar trebui să fie afișat în consolă numărul de înregistrări create. În acest moment, sunt disponibile date aplicației.

În cazul în care din orice motiv, aveți nevoie să încercați din nou oprațiunea de încărcare, activați linia:

```javascript
// mongoose.connection.dropCollection('competentaspecificas'); // Fii foarte atent: șterge toate datele din colecție la fiecare load!.
```

Drept efect, se vor recrea toare înregistrările, stergând baza anterioară pentru competențele specifice. Acest lucru înseamnă că pentru a adăuga înregistrări noi, pur și simplu adaugi csv-urile în directorul csvuri și rulezi comanda, ceea ce va adăuga la preexistent noile date. Dar dacă ai nevoie de la 0, pur și simplu poți face acest lucru activând un `dropCollection`.

### Access Control List - ACL

În momentul în care primul utilizator se va loga folosind contul educred, acesta va deveni automat administratorul întregii aplicații.

### Testarea instalării

Pentru a face un test general, a fost creată o baterie de testare care va fi rulată cu `npm run test`. Dacă toate testele ies, atunci se va declara instalarea a fi una de succes și se va trece la popularea cu date.
În cazul rulării pe Windows 10, se va rula bateria de teste cu `npm run test-win` (vezi `package.json`).

## Detalii configurare Software

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating este Handlebars: https://www.npmjs.com/package/express-hbs