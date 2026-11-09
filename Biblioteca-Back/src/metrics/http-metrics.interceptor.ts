import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // Los probes de Kubernetes consultan /health cada pocos segundos:
    // se excluyen para no inflar las métricas HTTP de la aplicación.
    if (request.path.startsWith('/health')) {
      return next.handle();
    }

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationSeconds =
          Number(process.hrtime.bigint() - start) / 1_000_000_000;

        // Se usa la ruta del handler (no la URL cruda) para evitar
        // cardinalidad alta con IDs en la etiqueta.
        const route =
          (request.route as { path?: string } | undefined)?.path ??
          request.originalUrl.split('?')[0] ??
          'unknown';

        const labels = {
          method: request.method,
          route,
          status_code: String(response.statusCode),
        };

        this.metricsService.httpRequestsTotal.inc(labels);
        this.metricsService.httpRequestDuration.observe(
          labels,
          durationSeconds,
        );
      }),
    );
  }
}
