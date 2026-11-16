// Configuración de variables de entorno para tests E2E.
// Los tests corren desde el HOST y se conectan a PostgreSQL en localhost:5432
// (puerto publicado por Docker Compose). En CI, las variables ya vienen
// definidas y se respetan tal cual.

process.env.DB_TYPE ??= 'postgres';
process.env.DB_HOST ??= 'localhost';
process.env.DB_PORT ??= '5432';
process.env.DB_USERNAME ??= 'sanderson';
process.env.DB_PASSWORD ??= '123456789';
process.env.DB_DATABASE ??= 'cosmere';
process.env.DB_SSL ??= 'false';

// Debug: muestra configuración que se usará
console.log('=== E2E Test DB Config ===');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`User: ${process.env.DB_USERNAME}`);
console.log(`Database: ${process.env.DB_DATABASE}`);
console.log('==========================');
