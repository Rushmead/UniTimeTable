FROM ubuntu

RUN apt-get update
RUN apt install nodejs -y
RUN apt install npm -y
RUN node -v

WORKDIR /usr/app

COPY package*.json ./
RUN npm install --production

RUN apt install wget unzip -y
RUN wget https://chromedriver.storage.googleapis.com/97.0.4692.71/chromedriver_linux64.zip
RUN unzip chromedriver_linux64.zip
RUN chmod +x chromedriver 
RUN mv chromedriver /usr/local/bin/

RUN apt install default-jre -y
RUN apt -f install -y
RUN apt install chromium-browser -y

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]