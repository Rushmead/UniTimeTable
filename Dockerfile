FROM node:12-slim


# See https://crbug.com/795759
RUN apt-get update && apt-get -yq upgrade && apt-get install \
    && apt-get autoremove -y && apt-get autoclean

RUN apt-get install -y gnupg2

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
# https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-unstable
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

COPY . /app/
#COPY local.conf /etc/fonts/local.conf
WORKDIR app

# Install deps for server.
RUN yarn

# Uncomment to skip the chromium download when installing puppeteer.
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install puppeteer so it can be required by user code that gets run in
# server.js. Cache bust so we always get the latest version of puppeteer when
# building the image.
ARG CACHEBUST=1
RUN yarn add puppeteer puppeteer-extra

# Add pptr user.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run user as non privileged.
USER pptruser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["yarn", "start"]