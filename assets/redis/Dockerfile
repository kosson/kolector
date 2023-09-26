FROM redis/redis-stack:latest 

WORKDIR /usr/local/db

COPY redis.conf ./redis.conf
COPY users.acl ./users.acl

ENV PORT=6379
EXPOSE 6379

CMD [ "redis-stack-server", "redis.conf" ]