FROM ubuntu

RUN apt-get update
RUN apt install nodejs -y
RUN apt install npm -y
RUN node -v

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --production

RUN apt install wget -y
RUN wget https://github.com/mozilla/geckodriver/releases/download/v0.30.0/geckodriver-v0.30.0-linux64.tar.gz 
RUN tar -xvzf geckodriver-v0.30.0-linux64.tar.gz 
RUN chmod +x geckodriver 
RUN mv geckodriver /usr/local/bin/

RUN apt install firefox -y
RUN export MOZ_HEADLESS=1

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]