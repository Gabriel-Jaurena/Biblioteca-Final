import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { Libro } from '../libros/entities/libro.entity';
import { Sagas } from '../sagas/entities/sagas.entity';

export type EnvReader = (key: string) => string | undefined;

/**
 * Construye la configuración de TypeORM a partir de variables de entorno.
 *
 * Acepta dos formas de conexión:
 *  - DATABASE_URL (Render, Neon, etc.)
 *  - DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE (Compose, K8s)
 *
 * @param get función que resuelve una variable de entorno.
 * @param synchronizeDefault valor de synchronize cuando DB_SYNCHRONIZE no está
 *   definida. La app mantiene true por compatibilidad; el CLI de migraciones
 *   usa false para comparar el esquema contra la base sin modificarlo.
 */
export function buildTypeOrmOptions(
  get: EnvReader,
  synchronizeDefault = false,
): DataSourceOptions {
  const databaseUrl = get('DATABASE_URL');
  const sslEnabled =
    get('DB_SSL') === 'true' ||
    databaseUrl?.includes('sslmode=require') === true;

  const port = get('DB_PORT');

  const connection = databaseUrl
    ? { url: databaseUrl }
    : {
        host: get('DB_HOST'),
        port: port ? Number(port) : 5432,
        username: get('DB_USERNAME'),
        password: get('DB_PASSWORD'),
        database: get('DB_DATABASE'),
      };

  const synchronizeEnv = get('DB_SYNCHRONIZE');
  const migrationsRun = get('DB_MIGRATIONS_RUN') === 'true';

  // Si las migraciones están activas, synchronize se desactiva siempre:
  // mezclar ambos mecanismos puede producir cambios de esquema inesperados.
  const synchronize = migrationsRun
    ? false
    : synchronizeEnv === undefined
      ? synchronizeDefault
      : synchronizeEnv !== 'false';

  return {
    type: 'postgres',
    ...connection,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    entities: [Libro, Sagas],
    migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
    synchronize,
    migrationsRun,
  };
}
