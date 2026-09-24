import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Libro } from '../src/libros/entities/libro.entity';
import { Sagas } from '../src/sagas/entities/sagas.entity';

describe('SagasController (e2e) - Tests contra PostgreSQL real en Docker', () => {
  let app: INestApplication;
  let sagasRepository: Repository<Sagas>;
  let librosRepository: Repository<Libro>;

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

    sagasRepository = moduleFixture.get<Repository<Sagas>>(getRepositoryToken(Sagas));
    librosRepository = moduleFixture.get<Repository<Libro>>(getRepositoryToken(Libro));

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

  describe('POST /sagas - Crear saga en BD real', () => {
    it('debería crear una saga y retornar HTTP 201 con el objeto persistido', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL E2E REAL:
      // ---------------------------------------------------------
      // 1. ARRANGE: DTO válido para crear saga
      //    - Solo 'nombre' es requerido (@IsDefined)
      //    - Campos opcionales: descripcion, fechaInicio, era
      //
      // 2. ACT: POST HTTP real a /sagas
      //    - ValidationPipe valida DTO -> 400 si inválido
      //    - Controller -> Service -> Repository.save()
      //    - TypeORM: INSERT INTO sagas (...) RETURNING *
      //    - Transacción: BEGIN -> INSERT -> COMMIT
      //    - PostgreSQL genera ID serial y retorna fila completa
      //
      // 3. ASSERT: Verificamos persistencia real en PostgreSQL
      //    - Status 201 Created
      //    - ID numérico auto-generado por PostgreSQL
      //    - Relación 'libros' inicializada como array vacío []
      // ---------------------------------------------------------

      const createDto = {
        nombre: 'El Archivo de las Tormentas - E2E',
        descripcion: 'Saga de prueba E2E contra PostgreSQL',
        fechaInicio: '2010-08-31',
        era: 'Era de los Heraldos',
      };

      const response = await request(app.getHttpServer())
        .post('/sagas')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        nombre: createDto.nombre,
        descripcion: createDto.descripcion,
        era: createDto.era,
      });
      expect(response.body.libros).toEqual([]);
      expect(response.body.fechaInicio).toBeDefined();
    });

    it('debería crear saga solo con campo obligatorio (HTTP 201)', async () => {
      const minimalDto = { nombre: 'Mistborn - E2E Minimal' };

      const response = await request(app.getHttpServer())
        .post('/sagas')
        .send(minimalDto)
        .expect(201);

      expect(response.body.nombre).toBe(minimalDto.nombre);
      expect(response.body.descripcion).toBeNull();
      expect(response.body.fechaInicio).toBeNull();
      expect(response.body.era).toBeNull();
      expect(response.body.libros).toEqual([]);
    });

    it('debería retornar HTTP 400 si falta campo requerido (nombre)', async () => {
      // ---------------------------------------------------------
      // FLUJO: Validación DTO ANTES de BD
      // ---------------------------------------------------------
      // - ValidationPipe intercepta request ANTES del controller
      // - class-validator verifica @IsDefined() en 'nombre'
      // - Si falla: lanza BadRequestException (HTTP 400)
      // - NUNCA llega al service ni a la BD
      // ---------------------------------------------------------

      await request(app.getHttpServer())
        .post('/sagas')
        .send({ descripcion: 'Sin nombre' })
        .expect(400);
    });
  });

  describe('DELETE /sagas/:id - Eliminar saga de BD real', () => {
    let createdSagaId: number;

    beforeEach(async () => {
      const saga = await sagasRepository.save({
        nombre: 'Saga para borrar - E2E',
        descripcion: 'Se eliminará en test',
        fechaInicio: new Date('2020-01-01'),
        era: 'Era Test',
      });
      createdSagaId = saga.id;
    });

    it('debería eliminar una saga existente y retornar HTTP 200', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL E2E REAL - DELETE:
      // ---------------------------------------------------------
      // 1. ARRANGE: beforeEach creó saga real en BD
      //
      // 2. ACT: DELETE HTTP real a /sagas/:id
      //    - ParseIntPipe valida y transforma :id a number
      //    - Controller -> Service -> Repository.delete(id)
      //    - TypeORM: DELETE FROM sagas WHERE id = $1
      //    - CASCADE: Si hay libros asociados, se eliminan (ON DELETE CASCADE)
      //    - Transacción: BEGIN -> DELETE -> COMMIT
      //
      // 3. ASSERT: Status 200 y verificación 404 posterior
      // ---------------------------------------------------------

      await request(app.getHttpServer())
        .delete(`/sagas/${createdSagaId}`)
        .expect(200);

      const deleted = await sagasRepository.findOneBy({ id: createdSagaId });
      expect(deleted).toBeNull();
    });

    it('debería retornar HTTP 404 si la saga no existe', async () => {
      await request(app.getHttpServer())
        .delete('/sagas/999999')
        .expect(404);
    });

    it('debería retornar HTTP 400 si ID no es un número', async () => {
      await request(app.getHttpServer())
        .delete('/sagas/invalid-id')
        .expect(400);
    });
  });
});