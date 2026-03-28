FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache dumb-init curl \
  && npm install -g pm2

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/logs /app/public/uploads \
  && chown -R node:node /app

USER node

EXPOSE 5000

# pm2-runtime keeps Node in the foreground (correct for Docker); survives SSH close on the host because the process is inside `docker run -d`.
ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "app.js", "--name", "api"]
