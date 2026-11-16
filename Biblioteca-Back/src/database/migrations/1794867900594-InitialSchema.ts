import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial del esquema (sagas + libros).
 *
 * Es idempotente a propósito: la base de Render pudo haber sido creada
 * antes con `synchronize`, y en ese caso las tablas ya existen aunque la
 * tabla `migrations` esté vacía. Usar `IF NOT EXISTS` evita el error
 * "relation already exists" y permite que el deploy arranque sin tener
 * que resetear el esquema a mano.
 */
export class InitialSchema1794867900594 implements MigrationInterface {
  name = 'InitialSchema1794867900594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "sagas" ("id" SERIAL NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "fechaInicio" date, "era" character varying, CONSTRAINT "PK_c950945566b99142462ba2b1608" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "libros" ("id" SERIAL NOT NULL, "sagaId" integer NOT NULL, "titulo" character varying(255) NOT NULL, "autor" character varying NOT NULL, "fechaEdicion" date NOT NULL, "numeroPaginas" integer NOT NULL, "descripcion" text, CONSTRAINT "PK_63bdc208aaf1ed7e4df6dba27a6" PRIMARY KEY ("id"))`,
    );

    // Solo agrega la FK si no existe otra equivalente (sin depender del
    // nombre que le haya puesto `synchronize`).
    const fkExists: unknown[] = await queryRunner.query(
      `SELECT 1
         FROM pg_constraint c
        WHERE c.contype = 'f'
          AND c.conrelid = 'libros'::regclass
          AND c.confrelid = 'sagas'::regclass`,
    );

    if (fkExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "libros" ADD CONSTRAINT "FK_8cb440b96367caccc9ad5137684" FOREIGN KEY ("sagaId") REFERENCES "sagas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "libros" DROP CONSTRAINT IF EXISTS "FK_8cb440b96367caccc9ad5137684"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "libros"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sagas"`);
  }
}
