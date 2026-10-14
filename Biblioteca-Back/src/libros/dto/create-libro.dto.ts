// src/libros/dto/create-libro.dto.ts
import { IsNumber, IsString, IsDate, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLibroDto {
  @IsNumber()
  @IsDefined()
  sagaId: number; // <-- Necesario para saber a qué saga pertenece

  @IsString()
  @IsDefined()
  titulo: string;

  @IsString()
  @IsDefined()
  autor: string;

  @IsDate()
  @Type(() => Date)
  @IsDefined()
  fechaEdicion: Date;

  @IsNumber()
  @IsDefined()
  numeroPaginas: number;

  @IsString()
  @IsDefined()
  descripcion: string;
}
