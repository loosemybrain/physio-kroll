# Cookie-Scan-Worker: Playwright/Chromium im Container, keine Installation beim Endkunden.
# Basis: offizielles Playwright-Image (Chromium inklusive).
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# Nicht als root laufen (empfohlen für Produktion)
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
