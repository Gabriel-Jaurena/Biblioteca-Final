import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSagasDto } from './dto/create-sagas.dto';
import { UpdateSagasDto } from './dto/update-sagas.dto';
import { Sagas } from './entities/sagas.entity';
import { QuerySagasDto } from './dto/query-sagas-dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Libro } from 'src/libros/entities/libro.entity';

@Injectable()
export class SagasService {
  constructor(
    @InjectRepository(Sagas)
    private sagasRepository: Repository<Sagas>,
    @InjectRepository(Libro) // Ya no es necesario aquí
    private librosRepository: Repository<Libro>,
  ) {}

  // Método para filtrar sagas según los criterios proporcionados
  async filterSagas(query: QuerySagasDto): Promise<Sagas[]> {
    const { nombre, libroTitulo } = query;
    // Inicia el QueryBuilder para la entidad Sagas con alias 'saga'
    const queryBuilder = this.sagasRepository
      .createQueryBuilder('saga')
      // Une la relación 'libros' (definida en Sagas entity) y selecciona sus datos,
      // usando el alias 'libro' para la tabla unida.
      .leftJoinAndSelect('saga.libros', 'libro');
    let hasInitialWhere = false; // Para saber si ya usamos .where()
    // Aplica filtro por nombre de la saga si se proporciona
    if (nombre) {
      // Usamos ILIKE para búsqueda insensible a mayúsculas/minúsculas en PostgreSQL
      queryBuilder.where('saga.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });
      hasInitialWhere = true; // Marcamos que ya usamos where()
    }
    // Aplica filtro por título del libro si se proporciona
    if (libroTitulo) {
      // Determinamos si usar where() (si es la primera condición) o andWhere()
      const conditionMethod = hasInitialWhere ? 'andWhere' : 'where';
      // Añadimos la condición sobre el campo 'titulo' de la tabla unida 'libro'
      queryBuilder[conditionMethod]('libro.titulo ILIKE :libroTitulo', {
        libroTitulo: `%${libroTitulo}%`,
      });
    }

    // Ejecuta la consulta construida y devuelve las sagas encontradas (con sus libros)
    return queryBuilder.getMany();
  }

  async create(createSagasDto: CreateSagasDto): Promise<Sagas> {
    // Como CreateSagasDto ya no tiene 'libros',
    // puedes pasarla directamente a 'create'
    const nuevaSaga = this.sagasRepository.create(createSagasDto);
    // Aseguramos que la propiedad 'libros' (que existe en la entidad)
    // se inicialice como un array vacío. TypeORM usualmente lo hace,
    nuevaSaga.libros = [];
    try {
      return await this.sagasRepository.save(nuevaSaga);
    } catch (error) {
      console.error('Error al guardar la saga:', error);
      throw new InternalServerErrorException('Error al crear la saga.');
    }
  }

  async findAll(): Promise<Sagas[]> {
    // Usa la opción 'relations' para cargar automáticamente la propiedad 'libros'
    // definida con @OneToMany en la entidad Sagas.
    return this.sagasRepository.find({
      relations: ['libros'], // El string debe coincidir con el nombre de la propiedad en la entidad Sagas
    });
  }

  async findOne(id: number): Promise<Sagas> {
    // Busca la saga por su ID y también carga la relación 'libros'.
    const saga = await this.sagasRepository.findOne({
      where: { id }, // Condición para encontrar la saga específica
      relations: ['libros'], // Carga los libros asociados
    });
    // Si no se encuentra la saga, lanza una excepción
    if (!saga) {
      throw new NotFoundException(`Saga con ID ${id} no encontrada`);
    }
    // Devuelve la entidad Saga encontrada (incluyendo sus libros)
    return saga;
  }

  async update(id: number, updateSagasDto: UpdateSagasDto): Promise<Sagas> {
    // 'preload' carga la saga y aplica los cambios del DTO (nombre, desc, etc.)
    const saga = await this.sagasRepository.preload({
      id: id,
      ...updateSagasDto,
    });

    if (!saga) {
      throw new NotFoundException(`Saga con ID ${id} no encontrada`);
    }
    try {
      // Guarda solo los cambios en los campos de la saga
      return await this.sagasRepository.save(saga);
    } catch (error) {
      console.error('Error al actualizar la saga:', error);
      throw new InternalServerErrorException('Error al actualizar la saga.');
    }
  }

  async remove(id: number): Promise<void> {
    // Intenta eliminar la saga usando su clave primaria 'id'
    const result = await this.sagasRepository.delete(id);
    // Si 'affected' es 0, significa que no se encontró ninguna saga con ese ID
    if (result.affected === 0) {
      throw new NotFoundException(`Saga con ID ${id} no encontrada`);
    }
    // No se retorna nada si la eliminación fue exitosa
  }
}
