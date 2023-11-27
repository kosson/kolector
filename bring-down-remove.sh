#!/bin/bash

# Șterge subdirectoarele anterioare
sudo rm -rf assets/elasticsearch/certs && sudo rm -rf assets/elasticsearch/ca

# Distruge clusterul, șterge volumele și șterge containerele
docker compose -f docker-compose-elkonly.yml down -v --remove-orphans

# Să ne asigurăm că toate containerele au fost oprite și șterse
docker ps -aq | xargs docker stop | xargs docker rm