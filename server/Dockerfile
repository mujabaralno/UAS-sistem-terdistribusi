
FROM node:20-alpine
WORKDIR /app

# Salin file dependensi lebih dulu (agar cache build efisien)
COPY package*.json ./
RUN npm install

# Salin source code lalu compile TypeScript -> JavaScript (folder dist/)
COPY . .
RUN npm run build

# Port yang dipakai server
EXPOSE 3000

# Jalankan hasil kompilasi
CMD ["node", "dist/server.js"]
