// Configuración de variables de entorno para tests E2E
// Usa los valores EXACTOS del archivo .env de Biblioteca-Back
// Los tests corren desde el HOST, conectándose a PostgreSQL en localhost:5432
// (puerto mapeado del contenedor web-postgres-1: 0.0.0.0:5432->5432/tcp)

process.env.DB_TYPE = 'postgres';
process.env.DB_HOST = 'localhost';     // Desde el host, el puerto 5432 está expuesto
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'sanderson';
process.env.DB_PASSWORD = '123456789';
process.env.DB_DATABASE = 'cosmere';
process.env.DB_SSL = 'false';

// Debug: muestra configuración que se usará
console.log('=== E2E Test DB Config (desde .env) ===');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`User: ${process.env.DB_USERNAME}`);
console.log(`Database: ${process.env.DB_DATABASE}`);
console.log('========================================');