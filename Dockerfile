FROM node:18.18
LABEL authors="Zack Sargent, Con Godsted, Ajai Nelson" 

WORKDIR /wiki-races
RUN npm install pm2 bunyan -g

COPY package.json .
RUN npm install
COPY . .
CMD touch /var/tmp/WikiRaces.json && npm run-script docker-run
