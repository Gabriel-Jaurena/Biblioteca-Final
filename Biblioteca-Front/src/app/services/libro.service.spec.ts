// Test Unitario Simple: LibroService con Mock manual (SIN TestBed)
// Verifica lógica del servicio mockeando HttpClient directamente
// Ejecutar: npm run test:unit

import { LibroService } from './libro';
import { Libro } from '../interfaces/libro';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';

// Mock simple de HttpClient
class MockHttpClient {
  private mockResponses = new Map<string, any>();

  setResponse(url: string, data: any) {
    this.mockResponses.set(url, data);
  }

  get<T>(url: string): Observable<T> {
    const data = this.mockResponses.get(url);
    if (data) {
      return of(data as T);
    }
    return of([] as T);
  }
}

describe('LibroService (Unitario con Mock Manual)', () => {
  let service: LibroService;
  let mockHttp: MockHttpClient;
  const apiUrl = `${environment.apiUrl}/libros`;

  beforeEach(() => {
    mockHttp = new MockHttpClient();
    // Inyectamos el mock manualmente (accedemos a propiedad privada para testing)
    service = new LibroService(mockHttp as any);
  });

  it('debería obtener libros y mapear respuesta a Libro[] (GET /libros)', (done) => {
    // ARRANGE: Datos mockeados
    const mockLibros: Libro[] = [
      { id: 1, sagaId: 1, titulo: 'El Camino de los Reyes', autor: 'Brandon Sanderson', fechaEdicion: '2010-08-31', numeroPaginas: 1007, descripcion: 'Fantasia epica' },
      { id: 2, sagaId: 1, titulo: 'Palabras Radiantes', autor: 'Brandon Sanderson', fechaEdicion: '2014-03-04', numeroPaginas: 1087, descripcion: 'Segunda entrega' },
    ];
    mockHttp.setResponse(apiUrl, mockLibros);

    // ACT + ASSERT
    service.getLibros().subscribe({
      next: (libros) => {
        expect(libros).toEqual(mockLibros);
        expect(libros.length).toBe(2);
        expect(libros[0].titulo).toBe('El Camino de los Reyes');
        expect(libros[1].autor).toBe('Brandon Sanderson');
        done();
      },
      error: done.fail,
    });
  });

  it('debería manejar respuesta vacía', (done) => {
    mockHttp.setResponse(apiUrl, []);

    service.getLibros().subscribe({
      next: (libros) => {
        expect(libros).toEqual([]);
        expect(libros.length).toBe(0);
        done();
      },
      error: done.fail,
    });
  });
});