FROM node:18 

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

ENV PORT 3000

EXPOSE 3000

# Corrija o comando serve para usar -l 0.0.0.0:$PORT
CMD ["npx", "serve", "-s", "build", "-l", "$PORT"]

