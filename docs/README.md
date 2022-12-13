# RED Colector

Aceasta este o aplicație creată de Nicolaie Constantinescu (kosson@gmail.com) în sprijinul proiectului CRED.

## Instalare

Este necesară o mașină Linux, de preferat un Ubuntu server, fie 18.04.2 LTS, ori 22.04.1 LTS.

Software necesar:

- MongoDB
- Node.js
- Redis

### Pregătirea sistemului de operare gazdă (Ubuntu)

Modifici fișierul `/etc/sysctl.conf` la care adaugi linia `vm.max_map_count=262144`. Este necesar pentru lucrul cu instanțele dockerizate de Elasticsearch. Este modul de a persista o setare temporară prin `sysctl -w vm.max_map_count=262144`.

## Detalii configurare Softwarevm.max_map_count=262144

Strategia Passport pentru Google: http://www.passportjs.org/packages/passport-google-oauth20/
Motorul de templating:https://www.npmjs.com/package/express-hbs

## Pornirea containerizată cu Docker

Pentru a evita erorile Elasticsearch de tipul

```text
ERROR: [1] bootstrap checks failed
[1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
ERROR: Elasticsearch did not exit normally — check the logs at /usr/share/elasticsearch/logs/docker-cluster.log
```

Această eroare apare atunci când resursele sistemului pentru [mmapfs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-store.html#mmapfs) sunt prea mici. Pentru a rezolva această limitare ai comanda `sysctl -w vm.max_map_count=262144` la dispoziție. Pentru a persista această comandă după ieșirea din sesiunea de shell, poți să modifici mașina gazdă în fișierul `/etc/sysctl.conf` la care adaugi linia `vm.max_map_count=262144`.

Pornește `docker compose up -d`. Pentru a vedea logurile generate, caută identificatorul sau numele containerului și `docker logs <CONTAINER ID> -f`. Sau combinat `docker compose up -d --build && docker compose logs -f`.

Pentru a verifica ce a pornit și pe ce porturi comunică, poți folosi comanda `docker compose ps`.