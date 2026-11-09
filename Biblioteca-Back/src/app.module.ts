// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibrosModule } from './libros/libros.module';
import { SagasModule } from './sagas/sagas.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
// Ya no necesitas importar las entidades aquí si usas autoLoadEntities
// import { Libro } from './libros/entities/libro.entity';
// import { Sagas } from './sagas/entities/sagas.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        // En desarrollo se mantiene el autosync; en producción puede
        // desactivarse con DB_SYNCHRONIZE=false cuando se usen migraciones.
        synchronize: configService.get<string>('DB_SYNCHRONIZE') !== 'false',
      }),
    }),
    LibrosModule,
    SagasModule,
    MetricsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
