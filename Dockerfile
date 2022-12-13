# MULTISTAGE setting inspirat din https://github.com/BretFisher/nodejs-rocks-in-docker
ARG APP_VER
ARG FRONT_END_PORT
# BASE 
## Pornești adăugând to ce este nevoie pentru mediul de producție. 
FROM node:19.1-bullseye as base
ENV NODE_ENV production

## înlocuiește npm în linia de comandă cu tini pentru un mai bun kernel signal handling
# #You may also need development tools to build native npm addons: `apt-get install gcc g++ make`
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

## Portul pe care îl expui
EXPOSE ${FRONT_END_PORT}

## modifică permisiunile la un user care nu este root. Astfel poți controla și permisiunile pe director
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node

## copiere care setează corect permisiunile. Folosirea lui * previne erorile
COPY --chown=node:node package*.json yarn*.lock ./
## ci este folosit pentru a instala pachetele din fișierele .lock
RUN npm ci --only=production && npm cache clean --force
COPY --chown=node:node . .
## Argumentul este pasat din fișierul docker-compose.yaml
ARG FRONT_END_PORT
# CMD ["node", "./bin/www"]
CMD ["node", "app.js"]

# DEVELOPMENT
FROM base as devel
ENV NODE_ENV development
ENV PATH=/app/node_modules/.bin:$PATH
RUN npm install --production=false && npm cache clean --force
## schimbă comanda pentru a rula direct node, nu prin npm care are probleme. npm nu poate gestiona semnale de la kernel.
# CMD ["nodemon", "./bin/www", "--inspect=0.0.0.0:9229"]
CMD ["nodemon", "app.js"]

# SOURCE: TEST și PRODUCTION nivel comun
FROM base as source
COPY  --chown=node:node . .

# TEST
#FROM source as test
#ENV NODE_ENV=development
#ENV PATH=/app/node_modules/.bin:$PATH
#COPY --from=devel /app/node_modules /app/node_modules
#RUN npx eslint .
#RUN npm test
#CMD ["npm", "run", "test"]

#  PRODUCTION
FROM source as prod
ENTRYPOINT ["/usr/bin/tini", "--"]
# CMD ["node", "./bin/www"]
CMD ["node", "app.js"]
# https://docs.docker.com/engine/swarm/secrets/#defining-and-using-secrets-in-compose-files

# docker build --target devel -t kosson/kolector_devel:0.9.94 .
