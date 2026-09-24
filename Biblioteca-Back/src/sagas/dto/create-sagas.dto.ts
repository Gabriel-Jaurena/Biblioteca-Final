// src/sagas/dto/create-sagas.dto.ts
import { IsString, IsOptional, IsDate, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSagasDto {
  @IsString()
  @IsDefined()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaInicio?: Date;

  @IsOptional()
  @IsString()
  era?: string;
}