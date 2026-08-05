# ---- Étape 1 : build de l'app React/Vite ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inline ces variables dans le bundle au moment du build (pas au runtime) :
# elles doivent donc être fournies en tant que build args, pas en env compose.
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_ADSENSE_CLIENT_ID=
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ADSENSE_CLIENT_ID=$VITE_ADSENSE_CLIENT_ID \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ---- Étape 2 : serveur statique nginx ----
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# "127.0.0.1" et non "localhost" : nginx.conf n'écoute qu'en IPv4 (0.0.0.0:80),
# et "localhost" résout en priorité vers ::1 (IPv6) dans l'image Alpine, ce qui
# fait échouer le healthcheck ("connection refused") même quand nginx tourne
# normalement.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
