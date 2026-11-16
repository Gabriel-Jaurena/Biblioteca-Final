# ─────────────────────────────────────────────
# Etapa 1: dependencias (incluye dev)
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────
# Etapa 2: compilación TypeScript
# ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Etapa 3: runtime de producción
# ─────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Solo dependencias de producción para reducir superficie y tamaño.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist

# Ejecuta sin privilegios (requisito habitual de securityContext en K8s).
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
