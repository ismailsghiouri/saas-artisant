FROM node:18-alpine

WORKDIR /app

# Couche dépendances séparée du code source pour profiter du cache Docker :
# tant que package*.json ne change pas, "npm ci" n'est pas relancé.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Exécution en utilisateur non-root (image node:alpine fournit déjà l'utilisateur "node").
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 5000

# Réutilise la route de santé exposée par server.js (voir GET /api/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
