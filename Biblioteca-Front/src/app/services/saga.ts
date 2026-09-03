import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Saga } from '../interfaces/saga';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SagaService {
  
  private apiUrl = `${environment.apiUrl}/sagas`;

  constructor(private http: HttpClient) { }

// Modificado para aceptar filtros
  getSagas(nombre?: string, libroTitulo?: string): Observable<Saga[]> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (libroTitulo) params = params.set('libroTitulo', libroTitulo);

    return this.http.get<Saga[]>(this.apiUrl, { params });
  }
  
  // Nuevo: Obtener una saga individual por ID (para el detalle)
  getSagaById(id: number): Observable<Saga> {
    return this.http.get<Saga>(`${this.apiUrl}/${id}`);
  }

  createSaga(saga: Omit<Saga, 'id'>): Observable<Saga> {
    return this.http.post<Saga>(this.apiUrl, saga);
  }

  updateSaga(id: number, saga: Partial<Saga>): Observable<Saga> {
    return this.http.patch<Saga>(`${this.apiUrl}/${id}`, saga);
  }

  deleteSaga(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}