FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ git

COPY package*.json ./

RUN npm cache clean --force && npm install

COPY . .
RUN npm run build

EXPOSE 8090

CMD sh -c "npm run start:prod"