FROM selenium/node-firefox:latest
ENV NODE_ENV=production

RUN apt-get install -y curl \
  && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get install -y nodejs \
  && curl -L https://www.npmjs.com/install.sh | sh

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]


RUN npm install --production

COPY . .

EXPOSE 3000

CMD  ["node", "index.js"]