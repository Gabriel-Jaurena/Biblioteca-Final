import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // <-- Importar HttpParams
import { Observable } from 'rxjs';
import { Libro } from '../interfaces/libro';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LibroService {
  
  private apiUrl = `${environment.apiUrl}/libros`;

  constructor(private http: HttpClient) { }

  // 1. GET All + Filter (Combinados)
  getLibros(titulo?: string, fechaEdicion?: number): Observable<Libro[]> {
    let params = new HttpParams();

    if (titulo) {
      params = params.set('titulo', titulo);
    }
    if (fechaEdicion) {
      params = params.set('fechaEdicion', fechaEdicion);
    }

    // Si hay params, la URL será: .../libros?titulo=X&fechaEdicion=Y
    return this.http.get<Libro[]>(this.apiUrl, { params });
  }

  // 2. GET By ID
  getLibroById(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}`);
  }

  getLibrosBySaga(sagaId: number): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.apiUrl}?sagaId=${sagaId}`);
  }

  // ... (tus métodos create, delete, update siguen igual) ...
  createLibro(libro: Omit<Libro, 'id'>): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro);
  }

  deleteLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateLibro(id: number, libro: Partial<Libro>): Observable<Libro> {
    return this.http.patch<Libro>(`${this.apiUrl}/${id}`, libro);
  }
}