FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PORT=3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]