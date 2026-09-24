import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { LibrosController } from '../src/libros/libros.controller';
import { LibrosService } from '../src/libros/libros.service';
import { Libro } from '../src/libros/entities/libro.entity';
import { CreateLibroDto } from '../src/libros/dto/create-libro.dto';

describe('LibrosController - Tests Unitarios (Create & Delete)', () => {
  let controller: LibrosController;
  let service: LibrosService;

  // Libro simulado que representa una entidad persistida en BD
  const mockLibro: Libro = {
    id: 1,
    sagaId: 1,
    titulo: 'El camino de los reyes',
    autor: 'Brandon Sanderson',
    fechaEdicion: new Date('2010-08-31'),
    numeroPaginas: 1007,
    descripcion: 'Primera parte de El Archivo de las Tormentas',
    saga: null as any,
  };

  // Mock del service - simulamos solo los métodos que usaremos: create y remove
  const mockService = {
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    // 1. CREAMOS MÓDULO DE TESTING
    // Compilamos un módulo NestJS mínimo que solo incluye el controller
    // y su dependencia (LibrosService) mockeada
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibrosController],
      providers: [
        {
          provide: LibrosService,
          useValue: mockService, // Inyectamos nuestro mock en lugar del service real
        },
      ],
    }).compile();

    // 2. OBTENEMOS INSTANCIAS
    // Extraemos el controller y el service del módulo compilado
    controller = module.get<LibrosController>(LibrosController);
    service = module.get<LibrosService>(LibrosService);

    // 3. LIMPIEZA DE MOCKS
    // Reseteamos contadores y implementaciones entre tests
    jest.clearAllMocks();
  });

  // ============================================
  // TEST 1: POST /libros - CREAR
  // ============================================
  describe('POST /libros - create()', () => {
    // DTO de entrada que simula el body de la petición HTTP
    const createDto: CreateLibroDto = {
      sagaId: 1,
      titulo: 'El camino de los reyes',
      autor: 'Brandon Sanderson',
      fechaEdicion: new Date('2010-08-31'),
      numeroPaginas: 1007,
      descripcion: 'Primera parte de El Archivo de las Tormentas',
    };

    it('debería crear un libro y retornar HTTP 201 con el objeto creado', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DEL TEST:
      // ---------------------------------------------------------
      // 1. ARRANGE (Preparación):
      //    - Configuramos el mock para que al llamar service.create()
      //      retorne una Promise resuelta con el libro simulado
      //    - Esto simula una transacción BD exitosa: INSERT + COMMIT
      //
      // 2. ACT (Ejecución):
      //    - Invocamos controller.create(createDto)
      //    - El controller delega al service.create(dto)
      //    - El service (mockeado) retorna el libro creado
      //
      // 3. ASSERT (Verificación):
      //    - Verificamos que service.create() fue llamado 1 vez con el DTO exacto
      //    - Verificamos que el controller retorna el mismo objeto que el service
      //    - Esto confirma el flujo: Controller -> Service -> BD (mock) -> Response
      // ---------------------------------------------------------

      // ARRANGE: Simulamos creación exitosa en BD
      mockService.create.mockResolvedValue(mockLibro);

      // ACT: Ejecutamos el endpoint (delegación al service)
      const result = await controller.create(createDto);

      // ASSERT: Validamos comportamiento
      expect(service.create).toHaveBeenCalledTimes(1);           // Una sola llamada
      expect(service.create).toHaveBeenCalledWith(createDto);    // Con el DTO correcto
      expect(result).toEqual(mockLibro);                         // Retorna lo que service devuelve
      expect(result.id).toBe(1);                                 // ID asignado por BD
      expect(result.titulo).toBe(createDto.titulo);              // Datos conservados
    });

    it('debería propagar InternalServerErrorException (HTTP 500) si falla la BD', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DE ERROR:
      // ---------------------------------------------------------
      // 1. ARRANGE: Simulamos fallo transaccional (ej: constraint FK, deadlock, timeout)
      //    - mockRejectedValue simula que service.create() lanza excepción
      //    - Esto representa un ROLLBACK automático en BD real
      //
      // 2. ACT: Llamamos al controller
      //
      // 3. ASSERT: Verificamos que el controller NO atrapa la excepción
      //    - La propaga hacia arriba (NestJS la convierte a HTTP 500)
      //    - El controller es "thin" - no maneja errores de BD
      // ---------------------------------------------------------

      // ARRANGE: Simulamos error de BD (rollback transaccional)
      mockService.create.mockRejectedValue(
        new InternalServerErrorException('Error al crear el libro. Verifique que el sagaId exista.'),
      );

      // ACT & ASSERT: El controller propaga la excepción hacia el framework
      await expect(controller.create(createDto)).rejects.toThrow(InternalServerErrorException);
      expect(service.create).toHaveBeenCalledTimes(1); // Se intentó la operación
    });
  });

  // ============================================
  // TEST 2: DELETE /libros/:id - ELIMINAR
  // ============================================
  describe('DELETE /libros/:id - remove()', () => {
    it('debería eliminar un libro existente y retornar HTTP 200', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DEL TEST:
      // ---------------------------------------------------------
      // 1. ARRANGE:
      //    - Configuramos mock para que service.remove() retorne Promise<void> resuelta
      //    - Simula: DELETE FROM libros WHERE id = 1; COMMIT; (affected = 1)
      //
      // 2. ACT:
      //    - Invocamos controller.remove(1)
      //    - Controller delega a service.remove(id)
      //    - Service ejecuta eliminación en BD
      //
      // 3. ASSERT:
      //    - Verificamos llamada con ID correcto
      //    - Verificamos que retorna undefined (void) = HTTP 200 OK sin body
      //    - En REST, DELETE exitoso suele retornar 200 o 204 No Content
      // ---------------------------------------------------------

      // ARRANGE: Simulamos eliminación exitosa (affected = 1)
      mockService.remove.mockResolvedValue(undefined);

      // ACT: Ejecutamos eliminación
      await controller.remove(1);

      // ASSERT: Validamos delegación correcta
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(1); // ID numérico correcto
    });

    it('debería propagar NotFoundException (HTTP 404) si el libro no existe', async () => {
      // ---------------------------------------------------------
      // FLUJO TRANSACCIONAL DE ERROR - NOT FOUND:
      // ---------------------------------------------------------
      // 1. ARRANGE: Simulamos que la BD no encuentra el registro
      //    - DELETE WHERE id = 999 afecta 0 filas
      //    - Service lanza NotFoundException (lógica de negocio)
      //
      // 2. ACT: Intentamos eliminar ID inexistente
      //
      // 3. ASSERT: Verificamos propagación de excepción 404
      //    - NestJS convierte NotFoundException a HTTP 404 automáticamente
      //    - El controller no debe atrapar ni transformar esta excepción
      // ---------------------------------------------------------

      // ARRANGE: Simulamos entidad no encontrada
      mockService.remove.mockRejectedValue(
        new NotFoundException('Libro con ID 999 no encontrado'),
      );

      // ACT & ASSERT: Excepción propagada hacia framework
      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});