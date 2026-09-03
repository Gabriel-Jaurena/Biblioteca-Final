import { PartialType } from '@nestjs/mapped-types';
import { CreateSagasDto } from './create-sagas.dto';

export class UpdateSagasDto extends PartialType(CreateSagasDto) {}
