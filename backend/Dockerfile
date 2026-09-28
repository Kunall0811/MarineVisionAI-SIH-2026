FROM node:20-bullseye AS base
WORKDIR /app

# Sharp/onnxruntime-node need build tools for native bindings on some platforms
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main.js"]
