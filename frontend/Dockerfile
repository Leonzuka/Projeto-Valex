FROM node:18 

WORKDIR /app

COPY package.json package-lock.json ./

# Instala as dependências, incluindo 'serve'
RUN npm install && npm install serve --global

COPY . .

RUN npm run build

ENV PORT=3000

# Usa o 'serve' instalado globalmente
CMD npx serve -s build -l 0.0.0.0:$PORT
