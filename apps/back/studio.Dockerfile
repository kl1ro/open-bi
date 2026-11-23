FROM node:22-alpine
RUN apk add --no-cache socat && npm install -g prisma@7.10.1
EXPOSE 5556
CMD ["sh", "-c", "socat TCP-LISTEN:5556,fork,reuseaddr TCP:127.0.0.1:5555 & exec prisma studio --url \"$DATABASE_URL\" --port 5555 --browser none"]
