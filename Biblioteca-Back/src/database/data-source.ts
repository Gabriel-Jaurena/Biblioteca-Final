import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

/**
 * DataSource usado por el CLI de TypeORM para generar y ejecutar migraciones.
 *
 *   npm run migration:generate -- src/database/migrations/Nombre
 *   npm run migration:run
 *   npm run migration:revert
 *
 * La aplicación Nest no usa este archivo directamente: arma su propia
 * configuración con buildTypeOrmOptions() desde AppModule, pero comparte
 * exactamente las mismas entidades y migraciones.
 */
const dataSource = new DataSource(
  buildTypeOrmOptions((key) => process.env[key], false),
);

export default dataSource;
