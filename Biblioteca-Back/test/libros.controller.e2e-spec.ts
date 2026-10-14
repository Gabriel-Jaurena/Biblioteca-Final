import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from '../src/libros/entities/libro.entity';
import { Sagas } from '../src/sagas/entities/sagas.entity';

describe('LibrosController (e2e) - Tests contra PostgreSQL real en Docker', () => {
  let app: INestApplication;
  let librosRepository: Repository<Libro>;
  let sagasRepository: Repository<Sagas>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
        validationError: { target: false, value: false },
      }),
    );
    await app.init();

    librosRepository = moduleFixture.get<Repository<Libro>>(
      getRepositoryToken(Libro),
    );
    sagasRepository = moduleFixture.get<Repository<Sagas>>(
      getRepositoryToken(Sagas),
    );

    // Limpieza inicial: DELETE sin WHERE (borra todas las filas)
    await librosRepository.createQueryBuilder().delete().execute();
    await sagasRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await librosRepository.createQueryBuilder().delete().execute();
    await sagasRepository.createQueryBuilder().delete().execute();
  });

  describe('POST /libros - Crear libro en BD real', () => {
    it('debería crear un libro y retornar HTTP 201 con el objeto persistido', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL E2E REAL:
      // ---------------------------------------------------------
      // 1. ARRANGE: Creamos una saga PREVIA en BD (requisito FK)
      //    - TypeORM synchronize=true crea tablas automáticamente
      //    - La saga debe existir ANTES de crear el libro (FK constraint)
      //
      // 2. ACT: POST HTTP real a /libros con sagaId válido
      //    - ValidationPipe valida DTO (class-validator) -> 400 si inválido
      //    - Controller -> Service -> Repository.save()
      //    - TypeORM: INSERT INTO libros (...) RETURNING *
      //    - Transacción: BEGIN -> INSERT -> COMMIT
      //
      // 3. ASSERT: Verificamos persistencia real en PostgreSQL
      //    - Status 201 Created
      //    - Body contiene ID generado por PostgreSQL (serial)
      //    - Todos los campos coinciden con DTO
      //    - Relación sagaId apunta a saga existente
      // ---------------------------------------------------------

      // 1. Creamos saga previa
      const saga = await sagasRepository.save({
        nombre: 'El Archivo de las Tormentas - E2E',
        descripcion: 'Saga para test E2E',
        fechaInicio: new Date('2010-08-31'),
        era: 'Era de los Heraldos',
      });

      const createDto = {
        sagaId: saga.id, // Usamos ID de saga REAL creada arriba
        titulo: 'El camino de los reyes - E2E Test',
        autor: 'Brandon Sanderson',
        fechaEdicion: '2010-08-31',
        numeroPaginas: 1007,
        descripcion: 'Test E2E contra PostgreSQL real',
      };

      const response = await request(app.getHttpServer())
        .post('/libros')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        titulo: createDto.titulo,
        autor: createDto.autor,
        numeroPaginas: createDto.numeroPaginas,
        descripcion: createDto.descripcion,
        sagaId: saga.id,
      });
      expect(response.body.fechaEdicion).toBeDefined();
    });

    it('debería retornar HTTP 400 si faltan campos requeridos (validación DTO)', async () => {
      // ---------------------------------------------------------
      // FLUJO: Validación ANTES de BD
      // ---------------------------------------------------------
      // - ValidationPipe intercepta request ANTES del controller
      // - class-validator verifica @IsDefined() en campos requeridos
      // - Si falla: lanza BadRequestException (HTTP 400)
      // - NUNCA llega al service ni a la BD
      // ---------------------------------------------------------

      await request(app.getHttpServer())
        .post('/libros')
        .send({ titulo: 'Solo titulo' }) // Faltan sagaId, autor, fechaEdicion, etc.
        .expect(400);
    });

    it('debería retornar HTTP 400 si sagaId no existe (FK constraint)', async () => {
      // ---------------------------------------------------------
      // FLUJO: Error de integridad referencial (BD)
      // ---------------------------------------------------------
      // - ValidationPipe pasa (DTO válido sintácticamente)
      // - Service intenta INSERT con sagaId inexistente
      // - PostgreSQL rechaza por FK constraint -> 500 Internal Server Error
      // - Service atrapa y lanza InternalServerErrorException
      // ---------------------------------------------------------

      await request(app.getHttpServer())
        .post('/libros')
        .send({
          sagaId: 99999, // ID que no existe
          titulo: 'Libro test',
          autor: 'Autor test',
          fechaEdicion: '2020-01-01',
          numeroPaginas: 100,
          descripcion: 'Test FK',
        })
        .expect(500);
    });
  });

  describe('DELETE /libros/:id - Eliminar libro de BD real', () => {
    let createdLibroId: number;

    beforeEach(async () => {
      // Creamos saga y libro para tener algo que borrar
      const saga = await sagasRepository.save({
        nombre: 'Saga para borrar - E2E',
        descripcion: 'Se eliminará en test',
        fechaInicio: new Date('2020-01-01'),
        era: 'Era Test',
      });

      const libro = await librosRepository.save({
        sagaId: saga.id,
        titulo: 'Libro para borrar - E2E',
        autor: 'Test Author',
        fechaEdicion: new Date('2020-01-01'),
        numeroPaginas: 100,
        descripcion: 'Se eliminará en test',
      });

      createdLibroId = libro.id;
    });

    it('debería eliminar un libro existente y retornar HTTP 200', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL E2E REAL - DELETE:
      // ---------------------------------------------------------
      // 1. ARRANGE: beforeEach creó libro real en BD (POST previo)
      //
      // 2. ACT: DELETE HTTP real a /libros/:id
      //    - ParseIntPipe valida y transforma :id a number
      //    - Controller -> Service -> Repository.delete(id)
      //    - TypeORM: DELETE FROM libros WHERE id = $1
      //    - Transacción: BEGIN -> DELETE -> COMMIT
      //    - affected = 1 (una fila eliminada)
      //
      // 3. ASSERT: Status 200 y verificación 404 posterior
      // ---------------------------------------------------------

      await request(app.getHttpServer())
        .delete(`/libros/${createdLibroId}`)
        .expect(200);

      // Verificamos eliminación real en BD
      const deleted = await librosRepository.findOneBy({ id: createdLibroId });
      expect(deleted).toBeNull();
    });

    it('debería retornar HTTP 404 si el libro no existe', async () => {
      await request(app.getHttpServer()).delete('/libros/999999').expect(404);
    });

    it('debería retornar HTTP 400 si ID no es un número', async () => {
      await request(app.getHttpServer())
        .delete('/libros/invalid-id')
        .expect(400);
    });
  });
});
