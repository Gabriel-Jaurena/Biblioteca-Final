import { PartialType } from '@nestjs/mapped-types';
import { CreateSagasDto } from './create-sagas.dto';
import { IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSagasDto extends PartialType(CreateSagasDto) {
  @IsOptional()
  @IsString()
  nombre?: string;

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