# syntax=docker/dockerfile:1

# ---------------------------------------------------------------
# Etapa 1: compilacion
# Instala todas las dependencias (incluidas las de desarrollo, que
# hacen falta para TypeScript) y compila src/ a dist/.
# ---------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Se copian primero los manifiestos y se instala: asi Docker reutiliza
# la capa de dependencias mientras package.json no cambie, aunque se
# modifique el codigo.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------
# Etapa 2: imagen final
# Solo lleva dist/ y las dependencias de produccion. La imagen queda
# mas liviana y sin el compilador de TypeScript ni el codigo fuente.
# ---------------------------------------------------------------
FROM node:22-alpine AS produccion

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# El contenedor corre como usuario sin privilegios, no como root.
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
