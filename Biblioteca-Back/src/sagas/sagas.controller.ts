// src/sagas/sagas.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SagasService } from './sagas.service';
import { CreateSagasDto } from './dto/create-sagas.dto';
import { UpdateSagasDto } from './dto/update-sagas.dto';
import { QuerySagasDto } from './dto/query-sagas-dto';
import { Sagas } from './entities/sagas.entity';

@Controller('sagas')
export class SagasController {
  constructor(private readonly sagasService: SagasService) {}

  @Post()
  async create(@Body() createSagasDto: CreateSagasDto): Promise<Sagas> {
    return await this.sagasService.create(createSagasDto);
  }

  @Get()
  async findAll(@Query() query: QuerySagasDto): Promise<Sagas[]> {
    if (Object.keys(query).length) {
      return await this.sagasService.filterSagas(query);
    }
    return await this.sagasService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Sagas> {
    return await this.sagasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSagasDto: UpdateSagasDto,
  ): Promise<Sagas> {
    return await this.sagasService.update(id, updateSagasDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.sagasService.remove(id);
  }
}
