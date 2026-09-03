// src/libros/dto/create-libro.dto.ts
export class CreateLibroDto {
  sagaId: number; // <-- Necesario para saber a qué saga pertenece
  titulo: string;
  autor: string;
  fechaEdicion: Date;
  numeroPaginas: number;
  descripcion: string;
}
