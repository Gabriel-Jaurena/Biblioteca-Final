# ─────────────────────────────────────────────
# Etapa 1: dependencias
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────
# Etapa 2: build de Angular (SSR)
# ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# La URL de la API se resuelve en build time (Angular). Se puede
# sobreescribir con --build-arg API_URL=...
ARG API_URL=https://biblioteca-sanderson.onrender.com
RUN sed -i "s#apiUrl: '.*'#apiUrl: '${API_URL}'#" src/environments/environment.prod.ts \
    && npm run build

# ─────────────────────────────────────────────
# Etapa 3: runtime de producción (servidor SSR Express)
# ─────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 4000
CMD ["node", "dist/biblioteca/server/server.mjs"]
