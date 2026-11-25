# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g npm@11
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
