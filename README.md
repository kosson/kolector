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

### Access Control List - ACL

În momentul în care primul utilizator se va loga folosind contul educred, acesta va deveni automat administratorul întregii aplicații.

### Testarea instalării

Pentru a face un test general, a fost creată o baterie de testare care va fi rulată cu `npm run test`. Dacă toate testele ies, atunci se va declara instalarea a fi una de succes și se va trece la popularea cu date.
În cazul rulării pe Windows 10, se va rula bateria de teste cu `npm run test-win` (vezi `package.json`).

## Detalii configurare Software

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating:https://www.npmjs.com/package/express-hbs
