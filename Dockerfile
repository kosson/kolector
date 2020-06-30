# construiește nivelul de bază
FROM node:14.4.0-stretch-slim as base

ARG CREATED_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
# ARG SOURCE_COMMIT="$(git rev-parse --short HEAD)"

LABEL org.containers.image.autors=kosson@gmail.com
LABEL org.containers.image.created=$CREATED_DATE
LABEL org.containers.image.revision=$SOURCE_COMMIT
LABEL org.containers.image.title="Kolector"
LABEL org.containers.image.url="https://github.com/kosson/kolector"
LABEL org.containers.image.source="https://github.com/kosson/kolector"
LABEL org.containers.image.license="GPL-3.0"
LABEL ro.kosson.nodeversion=$NODE_VERSION

EXPOSE 8080 9200 6379 443

ENV NODE_ENV=production

WORKDIR /var/www/kolector

VOLUME  ["/repo"]

# Add Tini
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN apt-get update && apt-get install -y git
RUN chown -R node:node /var/www/kolector
COPY --chown=node:node package*.json ./
RUN npm install -g bower nodemon
USER node
COPY --chown=node:node . /var/www/kolector
# RUN npm install && bower install --force
# folosește npm ci pentru a instala pachetele din package-lock.json
RUN npm ci && npm cache clean --force && bower install --force

# construiește nivelul de dezvoltare
FROM base as devel
ENV NODE_ENV=development
ENV PATH=/var/www/kolector/node_modules/.bin:$PATH

WORKDIR /var/www/kolector
RUN npm install --only=dev
CMD ["nodemon", "app.js", "--inspect=0.0.0.0:9229"]

# construiește nivelul de producție
FROM base as prod
WORKDIR /var/www/kolector
COPY . .
CMD ["node", "/var/www/kolector/app.js"]

# docker build -t kolector:devel --target devel . && docker run -d -p 8080:8080 kolector:devel
# docker run -d -p 8080:8080 kolector:devel --network="host"
# docker run -it -p 8080:8080 kolector:devel
# docker container logs kolector:devel
# docker container logs -f kolector:devel
# docker container run -it --env "MY_IPS=$(hostname -I)" kolector:devel bash
# docker rm -f $(docker ps -a -q)