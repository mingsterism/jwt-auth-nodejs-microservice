# latest official node image
FROM node:lts-slim

LABEL maintainer="Kee Ming Yu <ming.k@hotmail.com>"
ENV NODE_ENV development
ENV PORT 8080
ENV CORS_ORIGIN_DEVELOPMENT http://127.0.0.1:8081
ENV CORS_ORIGIN_PRODUCTION http://35.247.140.17:2015
ENV COOKIE_DOMAIN_DEVELOPMENT 127.0.0.1
ENV COOKIE_DOMAIN_PRODUCTION 35.247.140.17

# use nodemon for development
RUN npm install -g nodemon

# use cached layer for node modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src && cp -a /tmp/node_modules /usr/src/

# add project files
WORKDIR /usr/src
ADD . /usr/src

EXPOSE 8080

CMD ["nodemon", "/usr/src/server.js"]
