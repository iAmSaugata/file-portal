# syntax=docker/dockerfile:1
FROM node:20-alpine

RUN apk add --no-cache tini
WORKDIR /app

# install deps without requiring lockfile
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .
RUN mkdir -p /app/uploads /app/sqlite

ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","index.js"]
