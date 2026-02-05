# ETAPA 1: Construcción (Cocinamos la app)
# Usamos una imagen de Node.js ligera para construir el proyecto
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero (para aprovechar la caché de Docker)
COPY package.json package-lock.json ./

# Instalamos las dependencias
RUN npm ci

# Copiamos todo el código fuente del proyecto
COPY . .

# 🔥 AGREGA ESTA LÍNEA AQUÍ:
# Esto fuerza la copia del .env y si no existe, el build fallará (así sabremos si Docker lo ve)
COPY .env .env

# Construimos la aplicación para producción (esto crea la carpeta /dist)
RUN npm run build

# -------------------------------------------------------------------

# ETAPA 2: Servidor (Servimos el plato)
# Usamos Nginx, un servidor web súper rápido y ligero
FROM nginx:alpine

# Copiamos los archivos construidos en la Etapa 1 a la carpeta pública de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos nuestra configuración personalizada de Nginx (el archivo nginx.conf que crearás)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Le decimos a Docker que este contenedor usará el puerto 80
EXPOSE 80

# Iniciamos Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]