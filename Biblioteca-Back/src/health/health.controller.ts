import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Liveness probe: confirma que el proceso responde.
   * No consulta dependencias externas, para no reiniciar el Pod
   * cuando la base de datos está temporalmente caída.
   */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /**
   * Readiness probe: confirma que el proceso puede atender tráfico
   * (incluye conectividad con PostgreSQL).
   */
  @Get('ready')
  async ready() {
    const start = Date.now();

    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        info: {
          database: {
            status: 'up',
            responseTime: Date.now() - start,
          },
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        error: {
          database: { status: 'down' },
        },
      });
    }
  }

  /** Alias de readiness para chequeos manuales y healthchecks de Compose. */
  @Get()
  check() {
    return this.ready();
  }
}
