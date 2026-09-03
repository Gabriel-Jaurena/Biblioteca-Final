// src/sagas/sagas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. Importa TypeOrmModule
import { SagasService } from './sagas.service';
import { SagasController } from './sagas.controller';
import { Sagas } from './entities/sagas.entity'; // <-- 2. Importa la entidad Sagas
import { Libro } from '../libros/entities/libro.entity'; // <-- 3. Importa la entidad Libro

@Module({
  imports: [
    // 4. Añade esto para registrar los repositorios
    TypeOrmModule.forFeature([Sagas, Libro]),
  ],
  controllers: [SagasController],
  providers: [SagasService],
  exports: [SagasService], // <-- 5. Exporta el servicio
})
export class SagasModule {}
