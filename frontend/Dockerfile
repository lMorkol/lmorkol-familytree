FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/uploads && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
