// src/libros/libros.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibrosService } from './libros.service';
import { LibrosController } from './libros.controller';
import { Libro } from './entities/libro.entity';
import { Sagas } from '../sagas/entities/sagas.entity'; // <-- Importa la entidad Sagas
import { SagasModule } from '../sagas/sagas.module'; // ---> Importa SagasModule <---

@Module({
  imports: [
    // Asegúrate de incluir AMBAS entidades aquí
    TypeOrmModule.forFeature([Libro, Sagas]),
    SagasModule, // ---> Añade SagasModule aquí <---
  ],
  controllers: [LibrosController],
  providers: [LibrosService],
})
export class LibrosModule {}
