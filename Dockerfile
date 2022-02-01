FROM ubuntu

RUN apt-get update
RUN apt install nodejs -y
RUN apt install npm -y
RUN node -v

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]