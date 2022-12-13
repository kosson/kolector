FROM nginx:alpine
# Instalează utilitarele necesare
RUN apk add --no-cache bash
# Fă upload noii configurații NGINX ștergând-o pe cea preexistentă
# RUN rm /etc/nginx/default.conf
COPY default.conf /etc/nginx/default.conf
# Expune porturile
EXPOSE 80
# Pornește NGINX
CMD ["/bin/bash", "-c", "nginx -g \"daemon off;\""]