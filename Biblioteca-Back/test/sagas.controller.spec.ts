import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SagasController } from '../src/sagas/sagas.controller';
import { SagasService } from '../src/sagas/sagas.service';
import { Sagas } from '../src/sagas/entities/sagas.entity';
import { CreateSagasDto } from '../src/sagas/dto/create-sagas.dto';

describe('SagasController - Tests Unitarios (Create & Delete)', () => {
  let controller: SagasController;
  let service: SagasService;

  // Saga simulada que representa una entidad persistida en BD
  const mockSaga: Sagas = {
    id: 1,
    nombre: 'El Archivo de las Tormentas',
    descripcion: 'Serie de fantasía épica',
    fechaInicio: new Date('2010-08-31'),
    era: 'Era de los Heraldos',
    libros: [], // Relación OneToMany vacía por defecto
  };

  // Mock del service - solo métodos create y remove
  const mockService = {
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    // 1. CREAMOS MÓDULO DE TESTING
    // Módulo NestJS aislado con controller y service mockeado
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SagasController],
      providers: [
        {
          provide: SagasService,
          useValue: mockService,
        },
      ],
    }).compile();

    // 2. OBTENEMOS INSTANCIAS DEL CONTENEDOR DI
    controller = module.get<SagasController>(SagasController);
    service = module.get<SagasService>(SagasService);

    // 3. LIMPIEZA ENTRE TESTS
    jest.clearAllMocks();
  });

  // ============================================
  // TEST 1: POST /sagas - CREAR
  // ============================================
  describe('POST /sagas - create()', () => {
    // DTO de entrada - solo campos requeridos + opcionales
    const createDto: CreateSagasDto = {
      nombre: 'El Archivo de las Tormentas',
      descripcion: 'Serie de fantasía épica',
      fechaInicio: new Date('2010-08-31'),
      era: 'Era de los Heraldos',
    };

    it('debería crear una saga y retornar HTTP 201 con el objeto creado', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DEL TEST:
      // ---------------------------------------------------------
      // 1. ARRANGE (Preparación):
      //    - mockResolvedValue simula transacción exitosa:
      //      INSERT INTO sagas (...) VALUES (...); COMMIT;
      //    - La BD genera ID auto-incremental y retorna entidad completa
      //
      // 2. ACT (Ejecución):
      //    - controller.create(createDto) recibe DTO validado por ValidationPipe
      //    - Delega a service.create(dto) que ejecuta la persistencia
      //    - Retorna entidad con ID asignado por BD
      //
      // 3. ASSERT (Verificación):
      //    - Una sola llamada al service con DTO exacto
      //    - Respuesta incluye ID generado + todos los campos
      //    - Relación 'libros' inicializada como array vacío
      // ---------------------------------------------------------

      // ARRANGE: Simulamos INSERT exitoso en BD
      mockService.create.mockResolvedValue(mockSaga);

      // ACT: Ejecutamos endpoint de creación
      const result = await controller.create(createDto);

      // ASSERT: Validamos respuesta y delegación
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockSaga);
      expect(result.id).toBe(1); // ID auto-generado por BD
      expect(result.nombre).toBe(createDto.nombre); // Campo requerido persistido
      expect(result.libros).toEqual([]); // Relación inicializada vacía
    });

    it('debería propagar InternalServerErrorException (HTTP 500) si falla la BD', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DE ERROR:
      // ---------------------------------------------------------
      // 1. ARRANGE: Simulamos fallo a nivel BD (constraint, deadlock, timeout)
      //    - mockRejectedValue = ROLLBACK transaccional automático
      //    - Service envuelve error BD en InternalServerErrorException
      //
      // 2. ACT: Controller intenta crear
      //
      // 3. ASSERT: Excepción burbujea sin ser atrapada
      //    - Controller es "pasivo" ante errores de infraestructura
      //    - NestJS Exception Filter convierte a HTTP 500
      // ---------------------------------------------------------

      // ARRANGE: Simulamos error transaccional
      mockService.create.mockRejectedValue(
        new InternalServerErrorException('Error al crear la saga.'),
      );

      // ACT & ASSERT: Propagación hacia Exception Filter de NestJS
      await expect(controller.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // TEST 2: DELETE /sagas/:id - ELIMINAR
  // ============================================
  describe('DELETE /sagas/:id - remove()', () => {
    it('debería eliminar una saga existente y retornar HTTP 200', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DEL TEST:
      // ---------------------------------------------------------
      // 1. ARRANGE:
      //    - mockResolvedValue(undefined) simula:
      //      DELETE FROM sagas WHERE id = 1; COMMIT; (affected = 1)
      //    - Retorno void = HTTP 200 OK sin contenido (o 204 No Content)
      //
      // 2. ACT:
      //    - controller.remove(1) recibe ID parseado por ParseIntPipe
      //    - Delega a service.remove(id)
      //
      // 3. ASSERT:
      //    - Llamada con ID numérico correcto
      //    - Sin retorno de datos (eliminación exitosa)
      // ---------------------------------------------------------

      // ARRANGE: Simulamos DELETE exitoso (1 fila afectada)
      mockService.remove.mockResolvedValue(undefined);

      // ACT: Ejecutamos eliminación
      await controller.remove(1);

      // ASSERT: Validamos delegación con ID correcto
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('debería propagar NotFoundException (HTTP 404) si la saga no existe', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DE ERROR - ENTIDAD INEXISTENTE:
      // ---------------------------------------------------------
      // 1. ARRANGE: Simulamos DELETE WHERE id = 999 (0 filas afectadas)
      //    - Service verifica affected === 0 y lanza NotFoundException
      //    - Esto es lógica de negocio, NO error de BD
      //
      // 2. ACT: Intentamos eliminar ID que no existe
      //
      // 3. ASSERT: Excepción 404 propagada a framework
      //    - Diferencia clave: 404 = recurso no existe (lógica)
      //    - vs 500 = error infraestructura (BD caída, constraint, etc)
      // ---------------------------------------------------------

      // ARRANGE: Simulamos entidad no encontrada (affected = 0)
      mockService.remove.mockRejectedValue(
        new NotFoundException('Saga con ID 999 no encontrada'),
      );

      // ACT & ASSERT: Propagación de error de negocio
      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});
