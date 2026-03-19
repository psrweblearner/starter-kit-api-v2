FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache dumb-init curl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/logs /app/public/uploads \
  && chown -R node:node /app

USER node

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
