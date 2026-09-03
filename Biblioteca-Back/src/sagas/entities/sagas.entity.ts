// src/sagas/entities/sagas.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'; // <-- Cambia a OneToMany
import { Libro } from '../../libros/entities/libro.entity';

@Entity('sagas')
export class Sagas {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('date', { nullable: true })
  fechaInicio: Date;

  @Column({ nullable: true })
  era: string;

  // --- Relación OneToMany con Libro ---
  // 'saga' debe coincidir con el nombre de la propiedad en la entidad Libro
  @OneToMany(() => Libro, (libro) => libro.saga)
  libros: Libro[]; // Sigue siendo un array de entidades Libro
}
