FROM node:18 

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

RUN npm run build
RUN npm install --include=dev

EXPOSE $PORT

CMD ["npm", "run", "serve"]