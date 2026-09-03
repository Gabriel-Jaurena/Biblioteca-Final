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
import { LibrosService } from './libros.service';
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
import { QueryLibrosDto } from './dto/query-libros-dto';
import { Libro } from './entities/libro.entity';

@Controller('libros') // <--- Ruta base simple
export class LibrosController {
  constructor(private readonly librosService: LibrosService) {}

  @Post()
  async create(@Body() createLibroDto: CreateLibroDto): Promise<Libro> {
    return await this.librosService.create(createLibroDto);
  }

  @Get()
  async findAll(@Query() query: QueryLibrosDto): Promise<Libro[]> {
    if (Object.keys(query).length) {
      return await this.librosService.filterLibros(query);
    }
    return await this.librosService.findAll();
  }

  @Get(':id') // <--- Solo un ID
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Libro> {
    return await this.librosService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLibroDto: UpdateLibroDto,
  ): Promise<Libro> {
    return await this.librosService.update(id, updateLibroDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.librosService.remove(id);
  }
}
