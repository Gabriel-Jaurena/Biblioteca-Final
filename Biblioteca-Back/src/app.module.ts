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
import { buildTypeOrmOptions } from './database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // La app mantiene synchronize=true por defecto (Compose/K8s).
        // En Render se usa DB_SYNCHRONIZE=false + DB_MIGRATIONS_RUN=true.
        ...buildTypeOrmOptions((key) => configService.get<string>(key), true),
        // Si la base no está lista al arrancar (cold start de Render),
        // Nest reintenta la conexión en lugar de salir al primer fallo.
        retryAttempts: Number(configService.get('DB_RETRY_ATTEMPTS') ?? 20),
        retryDelay: Number(configService.get('DB_RETRY_DELAY') ?? 5000),
        verboseRetryLog: configService.get('DB_RETRY_VERBOSE') === 'true',
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
