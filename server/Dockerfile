# syntax=docker/dockerfile:1
FROM node:20-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

# Create runtime dirs
RUN mkdir -p /app/uploads /app/sqlite

ENV NODE_ENV=production
EXPOSE 8080

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","index.js"]
