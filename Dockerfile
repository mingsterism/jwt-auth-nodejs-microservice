# latest official node image
FROM node:lts-slim

LABEL maintainer="Kee Ming Yu <ming.k@hotmail.com>"

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
