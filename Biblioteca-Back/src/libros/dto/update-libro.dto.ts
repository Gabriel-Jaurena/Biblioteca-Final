import { PartialType } from '@nestjs/mapped-types';
import { CreateLibroDto } from './create-libro.dto';
import { IsOptional, IsNumber, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLibroDto extends PartialType(CreateLibroDto) {
  @IsOptional()
  @IsNumber()
  sagaId?: number;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  autor?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaEdicion?: Date;

  @IsOptional()
  @IsNumber()
  numeroPaginas?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
