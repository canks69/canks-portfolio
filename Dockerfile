# ---- Tahap build: Bun ----
FROM oven/bun:1-alpine AS build

WORKDIR /app

# Salin manifest + lockfile dulu agar layer instalasi di-cache selama dependensi tidak berubah
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Salin sisa source (node_modules & dist dikecualikan lewat .dockerignore)
COPY . .

# Build Astro memakai runtime Bun (image ini tidak punya Node.js)
RUN bun --bun run build

# ---- Tahap serve: nginx ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
