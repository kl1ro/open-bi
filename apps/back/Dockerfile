# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /repo
RUN npm install -g npm@11
COPY packages packages
COPY apps/back apps/back
WORKDIR /repo/apps/back
RUN npm ci
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /repo/apps/back
ENV NODE_ENV=production
COPY --from=build /repo/apps/back/package.json ./
COPY --from=build /repo/apps/back/node_modules ./node_modules
COPY --from=build /repo/apps/back/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
