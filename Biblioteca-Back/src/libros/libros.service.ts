// src/libros/libros.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // <-- Importa InjectRepository
import { Repository } from 'typeorm'; // <-- Importa Repository y utilidades
import { CreateLibroDto } from './dto/create-libro.dto';
import { UpdateLibroDto } from './dto/update-libro.dto';
// Ya no necesitas importar el array 'libros'
// import { libros } from 'src/base-de-datos/libros';
import { Libro } from './entities/libro.entity'; // <-- Tu entidad decorada
import { QueryLibrosDto } from './dto/query-libros-dto';
import { SagasService } from '../sagas/sagas.service'; // <-- Importa SagasService
// import { Sagas } from 'src/sagas/entities/sagas.entity';

@Injectable()
export class LibrosService {
  // Repositorios inyectados (Libro y Sagas)
  constructor(
    @InjectRepository(Libro) // Especifica la entidad
    private librosRepository: Repository<Libro>, // El tipo es Repository<TuEntidad>
    private sagasService: SagasService, // Inyecta SagasService
  ) {}

  // Filter simplificado para buscar por propiedades del libro
  async filterLibros(query: QueryLibrosDto): Promise<Libro[]> {
    const { titulo, fechaEdicion, sagaId } = query;
    const queryBuilder = this.librosRepository.createQueryBuilder('libro');

    if (titulo) {
      queryBuilder.andWhere('libro.titulo ILIKE :titulo', {
        titulo: `%${titulo}%`,
      });
    }
    if (fechaEdicion) {
      const year = Number(fechaEdicion);
      if (!isNaN(year)) {
        queryBuilder.andWhere('EXTRACT(YEAR FROM libro.fechaEdicion) = :year', {
          year,
        });
      }
    }
    if (sagaId) {
      queryBuilder.andWhere('libro.sagaId = :sagaId', { sagaId });
    }
    return queryBuilder.getMany();
  }

  async create(createLibroDto: CreateLibroDto): Promise<Libro> {
    // Simplemente creamos y guardamos.
    // Si la sagaId no existe, PostgreSQL lanzará un error de Foreign Key.
    const nuevoLibro = this.librosRepository.create(createLibroDto);

    try {
      return await this.librosRepository.save(nuevoLibro);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al crear el libro. Verifique que el sagaId exista.',
      );
    }
  }

  async findAll(): Promise<Libro[]> {
    return this.librosRepository.find();
  }

  async findOne(id: number): Promise<Libro> {
    const libro = await this.librosRepository.findOneBy({ id });
    if (!libro) {
      throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    }
    return libro;
  }

  async update(id: number, updateLibroDto: UpdateLibroDto): Promise<Libro> {
    const libro = await this.librosRepository.preload({
      id: id,
      ...updateLibroDto,
    });
    if (!libro) {
      throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    }
    return this.librosRepository.save(libro);
  }

  async remove(id: number): Promise<void> {
    const result = await this.librosRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Libro con ID ${id} no encontrado`);
    }
  }
}
