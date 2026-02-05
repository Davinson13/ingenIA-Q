# Usamos una imagen ligera de Node 18
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero (para aprovechar el caché)
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente (incluido prisma)
COPY . .

# Generamos el cliente de Prisma (necesario porque el OS de Docker es Linux)
RUN npx prisma generate

# Construimos la aplicación (TypeScript -> JavaScript)
RUN npm run build

# Exponemos el puerto que definimos en el .env
EXPOSE 3001

# Comando para iniciar la app (asegúrate de que en package.json "start" sea "node dist/app.js")
# Si quieres correr migraciones al iniciar, puedes cambiar esto por un script sh
CMD ["npm", "start"]