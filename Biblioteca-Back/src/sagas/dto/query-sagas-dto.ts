import { IsOptional, IsString } from 'class-validator';

export class QuerySagasDto {
  @IsOptional()
  @IsString()
  nombre: string; // Título de la saga

  @IsOptional()
  @IsString()
  libroTitulo: string; // Título del libro asociado
}
