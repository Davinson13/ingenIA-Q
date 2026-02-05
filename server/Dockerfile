FROM node:18-slim

# Instalar dependencias del sistema necesarias para Prisma
RUN apt-get update -y && apt-get install -y openssl libssl-dev

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar el cliente de Prisma para Linux
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]