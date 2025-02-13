# Arquivo: frontend/Dockerfile
FROM node:18 

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE $PORT

CMD ["npm", "run", "serve"]