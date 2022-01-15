FROM node:12.18.1
ENV NODE_ENV=production

WORKDIR /app

RUN wget https://github.com/mozilla/geckodriver/releases/download/v0.30.0/geckodriver-v0.30.0-linux64.tar.gz -O gecko.tar.gz && tar -xzf gecko.tar.gz
ENV PATH="/app:${PATH}"

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --production

COPY . .

EXPOSE 3000

CMD  ["node", "index.js"]