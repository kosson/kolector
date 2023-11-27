#!/bin/bash

# Șterge subdirectoarele anterioare
sudo rm -rf assets/elasticsearch/certs && sudo rm -rf assets/elasticsearch/ca;

# Reconstruiește întreg proiectul
docker compose -p devel -f docker-compose-elkonly.yml up -d --build;
