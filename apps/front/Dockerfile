# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /repo
COPY packages packages
COPY apps/front apps/front
WORKDIR /repo/apps/front
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN npm ci
RUN npm run build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/front/.next/standalone ./
COPY --from=build /repo/apps/front/.next/static ./apps/front/.next/static
EXPOSE 3000
CMD ["node", "apps/front/server.js"]
