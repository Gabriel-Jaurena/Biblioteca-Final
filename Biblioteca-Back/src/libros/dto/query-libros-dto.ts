/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLibrosDto {
  @IsOptional()
  @IsString()
  titulo: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fechaEdicion: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sagaId?: number;
}