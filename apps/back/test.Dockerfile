# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /repo
RUN npm install -g npm@11
COPY packages packages
COPY apps/back apps/back
WORKDIR /repo/apps/back
RUN npm ci
