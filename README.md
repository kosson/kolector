# RED Colector

![](public/img/rED-logo192.png)

RED Colector este aplicația care gestionează Resurse Educaționale Deschise. Această aplicație este integrată fluxului de lucru din proiectul CRED în Educație.

![](public/img/CREDlogo.jpg)

## Echipa de dezvoltare

Acest efort este al echipei compuse din:

- Nicolaie Constantinescu, developer (mailto:nicu.constantinescu@educred.ro);
- Radu Vasile, developer (mailto:radu.vasile@educred.ro);
- Liviu Constandache, analist date și workflow (mailto:radu.vasile@educred.ro);
- Alina Crăciunescu, analist de date (mailto:alina.craciunescu@educred.ro);
- Andreea Diana Scoda, analist (andreea.scoda@educred.ro);
- George Boroș, specialist infrastructură, (mailto:george.boros@educred.ro).

## Instalare

Este necesară o mașină Linux, de preferat un Ubuntu server 18.04.2 LTS.

Software necesar:
- MongoDB
- Node.js
- Redis

### Instalare utilitare

```bash
sudo add-apt-repository universe
sudo apt-get install curl
sudo apt-get install software-properties-common
sudo apt-get install -y build-essential python
sudo snap install bower --classic
```

### Instalare Redis

```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server.service
redis-cli ping
```

Ar trebui să ai răspuns `PONG` la ultima comandă.

### Instalare Node.js

```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install nodejs
node -v
```

La verificarea versiunii, ar trebui să răspundă cu `v12.10.0`.

Instalează și pachetul PM2

```bash
sudo npm install pm2 -g
```

### Instalare Mongodb

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt update
sudo apt install mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod 
mongod --version
```

Trebuie să ai un răspuns asemănător cu 

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

### Instalare NginX

Este necesar pentru a a gestiona certificatele SSL și pentru a face balancing

```bash
sudo apt install nginx
sudo systemctl status nginx
```

În acest moment ar trebui să ai un răspuns asemănător cu:

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

Dacă serviciul este oprit, pornește-l cu 

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

Verifică sintaxa să fie în regulă cu

```bash
sudo nginx -t
```

Trebuie să ai un răspuns asemănător cu 

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Apoi, reîncerci setările cu

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
sudo certbot --nginx -d db.ise.ro -d www.bd.ise.ro
```

### Clonare aplicație

Fă un git clone pe repo-ul aplicației

### Access Control List - ACL

În momentul în care primul utilizator se va loga folosind contul educred, acesta va deveni automat administratorul întregii aplicații.

### Testarea instalării

Pentru a face un test general, a fost creată o baterie de testare care va fi rulată cu `npm run test`. Dacă toate testele ies, atunci se va declara instalarea a fi una de succes și se va trece la popularea cu date.
În cazul rulării pe Windows 10, se va rula bateria de teste cu `npm run test-win` (vezi `package.json`).

## Detalii configurare Software

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating:https://www.npmjs.com/package/express-hbs

## Fișierul `.env`

Are următoarele câmpuri:

```text
MONGO_LOCAL_CONN=mongodb://localhost:27017/redcolector
GOOGLE_CLIENT_ID=xsdkkdfkjkuf8s9df9sdfsf9sdfhsvp84.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=fdsao09sad99s0fuajfas
BASE_URL=http://localhost:8080
NAME_OF_REPO_DIR=repo
REPO_REL_PATH=./repo/
FILE_LIMIT_UPL_RES=5242880
```

unde `GOOGLE_CLIENT_ID` și `GOOGLE_CLIENT_SECRET` sunt proprii administratorului care face instalarea