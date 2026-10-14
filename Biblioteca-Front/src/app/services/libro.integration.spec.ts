// ============================================================================
// TEST DE INTEGRACIÓN REAL: Frontend → Backend → Base de Datos
// ============================================================================
// Qué hace este test:
//   1. Levanta un cliente HTTP real (fetch nativo del navegador)
//   2. Hace un POST real a http://localhost:3000/libros (backend NestJS en Docker)
//   3. El backend valida el DTO, persiste en PostgreSQL (TypeORM) y devuelve el libro con ID autogenerado
//   4. El test verifica que la respuesta tiene ID > 0, título correcto y sagaId válido
//
// Qué NO hace (para mantenerlo simple y enfocado en 1 solo test):
//   - NO usa mocks, NO usa HttpClient de Angular, NO usa TestBed (evita problemas de Zone.js)
//   - NO hace GET, NO hace DELETE, NO limpia la BD (el libro queda creado en la BD real)
//
// Prerrequisitos (ejecutar ANTES del test):
//   1. docker compose up -d                    # Levanta Postgres + Backend + Frontend
//   2. curl -X POST http://localhost:3000/sagas \
//        -H "Content-Type: application/json" \
//        -d '{"nombre":"Test Saga","descripcion":"Para test","fechaInicio":"2024-01-01","era":"Test"}'
//      (Esto crea la saga con ID 1 que el test usa como FK obligatoria)
//
// Cómo ejecutar este test:
//   cd Biblioteca-Front
//   npm run test:integration
// ============================================================================

import { environment } from '../../environments/environment';

// Helper simple para esperar milisegundos (usado en reintentos de conexión)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// HttpClientReal: Cliente HTTP mínimo usando fetch nativo del navegador
// -----------------------------------------------------------------------------
// Por qué NO usamos Angular HttpClient + TestBed:
//   - Angular 20 + Karma + Zone.js da error NG0908 en tests sin configuración extra
//   - fetch nativo es estándar, funciona en ChromeHeadless sin setup Angular
//   - Hace peticiones HTTP REALES de red (integración real, no mock)
// -----------------------------------------------------------------------------
class HttpClientReal {
  // baseUrl: ej. 'http://localhost:3000' (viene de environment.apiUrl)
  constructor(private baseUrl: string) {}

  // POST: Crea recurso en el backend
  //   url: endpoint relativo (ej. '/libros')
  //   body: objeto que se serializa a JSON
  //   Retorna: Promise con la respuesta parseada como JSON (tipo genérico T)
  //   Lanza: Error con .status si response.ok es false (4xx, 5xx)
  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  // GET: Lee recurso del backend (usado en beforeAll para verificar conectividad)
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }
}

// -----------------------------------------------------------------------------
// Suite de test: 1 solo test de integración CREATE
// -----------------------------------------------------------------------------
describe('Integración Real Frontend → Backend: CREATE libro', () => {
  let http: HttpClientReal;
  const apiUrl = environment.apiUrl; // 'http://localhost:3000' (configurado en environment.ts)

  // beforeAll: Se ejecuta UNA VEZ antes de todos los tests de esta suite
  //   - Instancia el cliente HTTP real
  //   - Verifica que el backend responde (reintenta 3 veces con 500ms entre intentos)
  //   - Falla rápido si el backend no está arriba (mensaje claro para el dev)
  beforeAll(async () => {
    http = new HttpClientReal(apiUrl);
    
    let connected = false;
    for (let i = 1; i <= 3; i++) {
      try {
        // Intento de conexión: GET /libros (endpoint público, no requiere auth)
        await http.get('/libros');
        connected = true;
        break; // Si responde OK, salimos del loop
      } catch {
        await sleep(500); // Espera antes de reintentar
      }
    }
    if (!connected) throw new Error('Backend no disponible en ' + apiUrl);
  });

  // ---------------------------------------------------------------------------
  // TEST ÚNICO: Verifica que se puede crear un libro via POST /libros
  // ---------------------------------------------------------------------------
  // Flujo:
  //   1. Prepara DTO con datos válidos (sagaId: 1 debe existir en BD)
  //   2. Ejecuta POST real al backend NestJS
  //   3. Valida respuesta: ID autogenerado > 0, título coincide, FK sagaId correcta
  // ---------------------------------------------------------------------------
  it('debería crear un libro en la base de datos via POST /libros', async () => {
    // ARRANGE: DTO de entrada - campos requeridos por CreateLibroDto del backend
    //   sagaId: 1 (FK obligatoria - la saga debe existir en BD, ver prerrequisitos)
    //   titulo, autor, fechaEdicion, numeroPaginas, descripcion: campos del modelo Libro
    const nuevoLibro = {
      sagaId: 1,
      titulo: `Test Integración ${Date.now()}`, // Timestamp evita duplicados si se re-ejecuta
      autor: 'Autor Test',
      fechaEdicion: '2024-01-15',
      numeroPaginas: 100,
      descripcion: 'Creado por test de integración automatizado',
    };

    // ACT: Petición HTTP POST real al backend
    //   - Viaja por red: ChromeHeadless → localhost:3000 (Docker network)
    //   - Backend: ValidationPipe valida DTO → TypeORM guarda en PostgreSQL
    //   - Respuesta: JSON con el libro creado (incluye ID autogenerado por BD)
    const libroCreado = await http.post<{ id: number; titulo: string; sagaId: number }>('/libros', nuevoLibro);

    // ASSERT: Verificaciones de la respuesta real del backend
    expect(libroCreado).toBeTruthy();              // Existe respuesta (no null/undefined)
    expect(libroCreado.id).toBeGreaterThan(0);     // ID numérico > 0 (autogenerado por PostgreSQL SERIAL)
    expect(libroCreado.titulo).toBe(nuevoLibro.titulo); // Título echo coincide con el enviado
    expect(libroCreado.sagaId).toBe(1);            // FK sagaId se persistió correctamente
  });
});