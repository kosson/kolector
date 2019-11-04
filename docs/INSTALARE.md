# Instalare

Este necesară o mașină Linux, de preferat un Ubuntu server 18.04.2 LTS.

Software necesar:
- MongoDB
- Node.js
- Redis

Ca etapă preliminară este necesară obținerea de chei pentru dezvoltarea de aplicații furnizate de Google (https://developers.google.com/identity/sign-in/web și https://developers.google.com/identity/sign-in/web/sign-in#before_you_begin).

Aplicația are nevoie de serviciile de SignIn oferite de Google și din acest motiv trebuie ca persoana care face instalarea și care va îngriji aplicația, să creeze un cont de Google pentru aplicația în sine. Acest cont va fi utilizat numai în scop de autentificare și pentru a furniza credențialele necesare.
După ce contul de Google a fost creat, se va naviga la Google API console, accesibil în momentul redactării acestui ghid de instalare la https://console.developers.google.com. Se va proceda la crearea unui `OAuth 2.0 client ID` din secțiunea `Credentials`.

La acest pas sunt cerute două căi pentru `Authorised JavaScript origins` și `Authorised redirect URIs`. Căile pentru această aplicație sunt:

- `Authorised JavaScript origins`: `http://localhost:8080`,
- `Authorised redirect URIs`: `http://localhost:8080/callback`

Copiază datele de la ` Client ID` și de la `Client secret`. Acestea vor fi necesare pentru a completa setările din fișierul dedicat acestora numit `.env`.

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

În cazul în care instalarea se face pe un server care nu are firewall hardware și este expus direct către wwww, atunci este necesară folosirea unui firewall al sistemului de operare pe care rulează aplicația.
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

La verificarea versiunii, ar trebui să răspundă cu `v12.13.0`.

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

Din consolă leagă-te la instanța de MongoDB.

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

În exemplul de mai sus, pentru fiecare server MongoDB se vor înlocui la câmpurile `user` și `pwd` datele cele două necesare autentificării ulterioare. Userul va fi creat de MongoDB și va fi afișat în consolă un obiect similar cu cel de mai jos:

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

Pentru mai multe detalii, consultă și https://docs.mongodb.com/manual/tutorial/create-users/.

Se va ieși din consola MongoDB introducând comanda `exit`.

În fișierul `/etc/mongodb.conf` trebuie activată rularea securizată prin editarea cu drepturi sudo.

```bash
sudo nano /etc/mongodb.conf
```

În fișier pentru varianta 3.6.3 a lui Mongo, va trebui să ștergi diezul din fața lui `auth = true`.

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

### Aducerea resurselor de pe Github

Pentru a avea deja resursele descărcate, trebuie setat subdirectorul din `/var/www/numeSite`.

```bash
sudo mkdir db.proiectInstitutie.ro
sudo chown userAdm:userAdm db.proiectInstitutie.ro
sudo chmod -R 755 /var/www/db.proiectInstitutie.ro/
```

Din subdirectorul selectat inițiezi depozitul git.

```bash
git init .
git remote add origin git@github.com:kosson/redcolector.git
git fetch origin
git checkout master
```

### Instalarea resurselor cu Bower

Imediat după aducerea resurselor de pe Git, este indicată instalarea din consola serverului a dependințelor externe necesare.

```bash
bower install
```

Toate dependințele necesare specificate în bower.json vor fi instalate în directorul specificat de `.bowerrc`. În cazul nostru, în `public/lib`.

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

### Instalare NginX

Instalare serverului NginX este necesară pentru a a gestiona certificatele SSL și pentru a face balancing.

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

Dacă ai nevoie să-l oprești mai întâi (stare de eroare)

```bash
sudo systemctl stop nginx
```

Pentru a face serviciul să pornească la fiecare restart:

```bash
sudo systemctl enable nginx
```

Creează directorul aplicației în `/var/www/`

```bash
sudo mkdir db.proiectInstitutie.ro
sudo chown userAdm:userAdm db.proiectInstitutie.ro
sudo chmod -R 755 /var/www/db.proiectInstitutie.ro/
sudo nano /etc/nginx/sites-available/db.proiectInstitutie.ro/
```

Introdu configurarea

```txt
server {
    listen 8080;
    listen [::]:80;
    server_name db.proiectInstitutie.ro www.db.proiectInstitutie.ro;
    return 301 https://$host$request_uri;
}
server {
    # listen 80;
    # listen [::]:80;
    index index.html index.php;
    # Setarea headerelor corectă către host (ieis2.ro)
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    ## Begin - Server Info
    #root /var/www/db.proiectInstitutie.ro;
    server_name db.proiectInstitutie.ro www.db.proiectInstitutie.ro 146.234.159.117;
    ## End - Server Info
    location /socket.io/ {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_pass "http://localhost:8080/socket.io/";
    }
    ## Begin - Index
    # for subfolders, simply adjust:
    # `location /subfolder {`
    # and the rewrite to use `/subfolder/index.php`
    location / {
        #try_files $uri $uri/ /index.php?$query_string;
        proxy_pass "http://localhost:8080/";
    }
    ## End - Index

    ## Begin - Security
    # deny all direct access for these folders
    location ~* /(\.git|cache|bin|logs|backup|tests)/.*$ { return 403; }
    # deny running scripts inside core system folders
    location ~* /(system|vendor)/.*\.(txt|xml|md|html|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ { return 403; }
    # deny running scripts inside user folder
    location ~* /user/.*\.(txt|md|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ { return 403; }
    # deny access to specific files in the root folder
    location ~ /(LICENSE\.txt|composer\.lock|composer\.json|nginx\.conf|web\.config|htaccess\.txt|\.htaccess) { return 403; }
    ## End - Security

    ## Begin - PHP
    location ~ \.php$ {
        # Choose either a socket or TCP/IP address
        fastcgi_pass unix:/var/run/php/php7.2-fpm.sock;
        # fastcgi_pass unix:/var/run/php5-fpm.sock; #legacy
        # fastcgi_pass 127.0.0.1:9000;

        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/$fastcgi_script_name;
    }
    ## End - PHP

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/db.proiectInstitutie.ro/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/db.proiectInstitutie.ro/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

Verifică sintaxa să fie în regulă folosind comanda:

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

Instalează certificate pentru domeniile setate în Nginx

```bash
sudo certbot --nginx -d db.proiectInstitutie.ro -d www.db.proiectInstitutie.ro
```

### Access Control List - ACL

În momentul în care primul utilizator se va loga folosind contul educred, acesta va deveni automat administratorul întregii aplicații.

### Testarea instalării

Pentru a face un test general, a fost creată o baterie de testare care va fi rulată cu `npm run test`. Dacă toate testele ies, atunci se va declara instalarea a fi una de succes și se va trece la popularea cu date.
În cazul rulării pe Windows 10, se va rula bateria de teste cu `npm run test-win` (vezi `package.json`).

## Detalii configurare Software

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating:https://www.npmjs.com/package/express-hbs