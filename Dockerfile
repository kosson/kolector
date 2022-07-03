# PATCHUISTE REDIS_UL
# FROM redis:latest as redis
# WORKDIR /redis
# COPY ./assets/redis/redis.conf /usr/local/etc/redis/redis.conf
# COPY ./assets/redis/init.sh ./
# RUN chmod +x init.sh

FROM node:16.1-alpine3.13 as base
#Argument that is passed from docer-compose.yaml file
ARG FRONT_END_PORT

# construiește nivelul de dezvoltare
FROM base as devel
RUN apk add dumb-init
ENV NODE_ENV development
WORKDIR /usr/src/redcolector
RUN apt-get update && apt-get install -y git
RUN npm install -g npm && npm install -g nodemon
COPY ./package*.json ./
# Enables caching for npm installs, making subsequent npm installs faster
RUN npm config set cache-min 9999999 && npm install
COPY . ./
EXPOSE ${FRONT_END_PORT}

# construiește nivelul de producție
FROM base as prod
RUN apk add dumb-init
ENV NODE_ENV production
USER node
WORKDIR /usr/src/redcolector
RUN apt-get update && apt-get install -y git
RUN npm install -g npm && npm install -g nodemon
# Truc pentru copierea și a lui package-locked
COPY --chown=node:node ./package*.json ./
RUN npm ci --only=production && npm cache clean --force
# folosește `npm ci` pentru a instala pachetele din package-lock.json
EXPOSE ${FRONT_END_PORT}
# https://docs.docker.com/engine/swarm/secrets/#defining-and-using-secrets-in-compose-files