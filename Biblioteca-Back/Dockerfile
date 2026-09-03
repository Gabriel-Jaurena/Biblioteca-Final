FROM node:22-alpine

# Capa de Espacio de Trabajo: Establece el directorio interno absoluto donde operarán los comandos subsecuentes.
WORKDIR /usr/src/app

# Capa de Resolución de Dependencias: Transfiere los manifiestos de paquetes.
# Se aíslan del código fuente para aprovechar el almacenamiento en caché de Docker; si el código cambia pero las dependencias no, esta capa no se reconstruye.
COPY package*.json ./

# Capa de Instalación: Ejecuta la descarga de módulos en el sistema de archivos de la imagen.
RUN npm install

# Capa de Código Fuente: Copia la totalidad de los archivos del directorio de contexto local hacia el entorno interno.
COPY . .

# Capa de Metadatos de Red: Expone documentalmente el puerto TCP 3000, estándar del servidor HTTP subyacente de NestJS.
EXPOSE 3000

# Capa de Ejecución: Define el proceso de arranque por defecto empleando el script de observación del compilador.
CMD ["npm", "run", "start:dev"]