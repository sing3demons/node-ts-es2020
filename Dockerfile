FROM node:18.18.0-alpine
RUN apk update && apk add git
ENV TZ=Asia/Bangkok
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
RUN git log -1 > APPLICATION_VERSION.txt
RUN npx prisma generate
RUN npm run build
RUN rm -rf src
EXPOSE 3000
CMD ["npm", "start"]