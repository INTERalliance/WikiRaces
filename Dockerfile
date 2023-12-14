FROM node:18.18
LABEL maintainer="Zack Sargent <zack@zack.fyi>"

WORKDIR /wiki-races
RUN npm install pm2 bunyan -g

# initalize for future logging 
RUN echo "{\"name\":\"WikiRaces\",\"hostname\":\"initalization\",\"pid\":0,\"level\":30,\"msg\":\"logs initalized\",\"time\":\"$(node -e 'console.log(new Date().toISOString())')\",\"v\":0}" > /var/tmp/WikiRaces.json 

COPY package.json .
RUN npm install
COPY . .
CMD npm run-script prod-run && npm run-script prod-show-latest-logs
