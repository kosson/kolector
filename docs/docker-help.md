# Asistență în lucrul cu Docker

https://r-future.github.io/post/how-to-fix-redis-warnings-with-docker/


## Erori unhealthy

Dacă ai erori de tipul
ERROR: for redcolectordevel  Container "64467f7e2e99" is unhealthy.
ERROR: Encountered errors while bringing up the project.

Verifică folosind docker-compose ps pentru a vedea starea tuturor containerelor active
Poți investiga fiecare container individual cu:

```bash
docker inspect --format "{{json .State.Health }}" nume_container_sau_id  | jq
```

sau

```bash
docker inspect --format "{{json .State.Health }}" $(docker-compose ps -q) | jq
```

`docker-compose up` in the first terminal window, and `docker-compose logs -f` in another. This will display all logs from docker-compose-managed containers.

## Erori de citire

Și dacă ai o eroare de citire de socket:
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/64467f7e2e99/json: dial unix /var/run/docker.sock: connect: permission denied

Atunci e o groblemă pentru că folosești docker drept root!!!
Vezi: https://docs.docker.com/engine/install/linux-postinstall/
Vezi: https://www.digitalocean.com/community/questions/how-to-fix-docker-got-permission-denied-while-trying-to-connect-to-the-docker-daemon-socket

```bash
sudo groupadd docker
groupadd: group 'docker' already exists

sudo usermod -aG docker $USER
```

## Multistage build

https://docs.docker.com/develop/develop-images/multistage-build/

```bash
docker-compose up -d
docker-compose down
```

## Șterge și volumele

```bash
docker-compose down -v
```

## Cand modifici lucruri în aplicație trebuie să reconstruiești imaginea

```bash
docker-compose up --build -d
```

## pornește doar aplicația node fără dependințe

```bash
docker compose -f docker-compose.yml up -d --no-deps kolector_devel
```

sau

```bash
docker compose -f docker-compose.yml up -d --no-deps kolector_devel
```

## Ridică două instanțe ale aplicației

```bash
docker compose -f docker-compose.yml up -d kolector_devel=2
```

## Cand modifici aplicatia sau configurările, pentru a nu mai face docker-compose down, apoi build

```bash
docker-compose -f docker-compose.yml up -d --build -V kolector_devel=2
```

-V este pentru a șterge volumele anonime in care sunt, de fapt `node_modules`

## Dacă ai modificări doar pe un anumit serviciu, nu-i nevoie sa dai comanda pentru build toate imaginile. Poți doar pentru respectivul serviciu

```bash
docker-compose -f docker-compose.yml up -d --build --no-deps -V nume_serviciu
```

## Push doar pentru un singur serviciu

```bash
docker-compose -f docker-compose.yml push nume_serviciu
```

## Pull imagine

```bash
docker-compose -f docker-compose.yml pull
```

Nu uita că în momentul în care docker-compose simte o noua imagine, va recrea containerul în baza acesteia

## Pull doar pentru un anumit serviciu, nu pentru toate serviciile/serverele

```bash
docker-compose -f docker-compose.yml pull --no-deps nume_serviciu
```

## Pentru că în timp se acumulează volumele anonime necesare Node.js, va trebui să pornești serviciile și în spate

```bash
docker-compose volume prune
```

Atenție, va șterge toate volumele care nu sunt în uz!!! ATENȚIE MARE!!!

## Conectarea la baza de date direct

```bash
docker run -p "27017:27017" -d --name mongo mongo
docker-compose exec mongo redcolector
```

## Desfacerea serviciilor

```bash
docker-compose -f docker-compose.yml down -v --remove-orphans
docker-compose -f docker-compose.yml -f docker-compose-development.yml down -v --remove-orphans
```

## Ridicarea serviciilor

```bash
docker-compose -f docker-compose.yml -f docker-compose-development.yml up -d --build
docker-compose -f docker-compose-production.yml up -d --build --env-file
```

Vezi: https://docs.docker.com/compose/environment-variables/

## Verifică ce va fi construit

Folosește următoare comandă pentru a vedea exect care este șablonul de construcție a serviciilor.

```bash
docker-compose config
```

## Urmărește loguri

```bash
docker-compose logs -f
docker-compose logs -f nume_serviciu
docker-compose --log-level info up
```

## REMOVE ALL

```bash
docker system prune -a
```

https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes
https://docs.docker.com/compose/startup-order/

## Console in container

```bash
docker exec -it nginx /bin/bash
```

## Tatarea erorilor

### WARNING: Host is already in use by another container

Vezi care sunt containerele deja în sistem

```bash
docker ps -a
```

Apoi le elimini cu

```bash
docker rm nume_container
```

Dacă nu merge, alegi eliminarea forțată 

```bash
docker rm -f nume_container
```

Sau poți folosi și 

```bash
docker container prune -f
```

## Resurse

- https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- https://www.freecodecamp.org/news/the-docker-handbook/

## Construieste un container după imagine

```bash
docker run -d --name redcolector nume_imagine_noua
```

## Vezi istoricul de construcție a imaginii

```bash
docker history nume_imagine
```

## Sincronizeaza directoarele de lucru folosind un volum bind mount

```bash
docker run -v pathonlocal:pathoncontainer -p 8080:8080 -d name nume_container nume_imagine
docker run -v /home/nicolaie/Desktop/DEVELOPMENT/redcolectorcolab/redcolector:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
docker run -v $(pwd):/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
```

## Windows command
docker run -v %cd%:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
### Windows PowerShell
docker run -v ${pwd}:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine

## Rulare cu Docker Desktop

Problema este că Docker Desktop folosește portul 8080. Din acest motiv, a trebuit să folosesc 8081 pentru app.

Poți accesa cAdvisor pe http://localhost:8080/containers/ dacă ai nevoie de o inspectare a proceselor care rulează și nu numai.