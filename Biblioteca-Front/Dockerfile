# Capa de Runtime: Define la imagen base ligera con Node.js 22.
FROM node:22-alpine

# Capa de Espacio de Trabajo: Establece el directorio interno.
WORKDIR /usr/src/app

# Capa de Resolución de Dependencias: Transfiere los manifiestos de paquetes.
COPY package*.json ./

# Capa de Instalación: Ejecuta la descarga de módulos en el sistema de archivos de la imagen.
RUN npm install

# Capa de Código Fuente: Copia la totalidad de los archivos del contexto local.
COPY . .

# Capa de Metadatos de Red: Expone documentalmente el puerto TCP 5173 (estándar de Vite).
EXPOSE 5173

# Capa de Ejecución: Inicia el servidor de desarrollo. La bandera --host expone el servicio a la red virtual de Docker para ser accesible desde el sistema host.
CMD ["npm", "start", "--", "--host", "0.0.0.0"]