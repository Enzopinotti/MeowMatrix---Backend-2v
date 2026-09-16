FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS production-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    PORT=8080 \
    PRIVATE_STORAGE_ROOT=/var/lib/meow/private

WORKDIR /app

RUN mkdir -p /var/lib/meow/private \
    && chown -R node:node /var/lib/meow

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json

USER node

EXPOSE 8080

CMD ["node", "dist/server.js"]
