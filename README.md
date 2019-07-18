# RED Colector

Aceasta este o aplicație creată de Nicolaie Constantinescu (kosson@gmail.com) în sprijinul proiectului CRED.

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

## Detalii configurare Software

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating:https://www.npmjs.com/package/express-hbs
