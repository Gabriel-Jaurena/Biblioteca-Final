import { Saga } from "./saga";

export interface Libro {
  id: number;       // ID único autogenerado por la BD
  sagaId: number;   // Referencia a la saga a la que pertenece
  titulo: string;
  autor: string;
  fechaEdicion: string; // Recordá: JSON envía fechas como texto
  numeroPaginas: number;
  descripcion?: string; // Opcional
  saga?: Saga;
}