import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Sagas } from '../../sagas/entities/sagas.entity';

@Entity('libros')
export class Libro {
  @PrimaryGeneratedColumn() // <--- ID Estándar (1, 2, 3...)
  id: number;

  @Column()
  sagaId: number; // <--- Campo normal para la relación

  // Relación con Sagas
  @ManyToOne(() => Sagas, (saga) => saga.libros, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sagaId' })
  saga: Sagas;

  @Column({ length: 255 })
  titulo: string;

  @Column()
  autor: string;

  @Column('date')
  fechaEdicion: Date;

  @Column('int')
  numeroPaginas: number;

  @Column('text', { nullable: true })
  descripcion: string;
}
