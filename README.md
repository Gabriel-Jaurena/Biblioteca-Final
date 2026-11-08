# Biblioteca-Final

Aplicación de biblioteca del Cosmere con backend NestJS, frontend Angular y PostgreSQL, más un stack de monitoreo con **Prometheus + Grafana**.

## Estructura del repositorio

```
Web/
├── Biblioteca-Back/     # API NestJS (expone /metrics)
├── Biblioteca-Front/    # Frontend Angular
├── monitoring/
│   ├── prometheus.yml                         # scrape config de Prometheus
│   └── grafana/
│       ├── provisioning/datasources/          # datasource Prometheus
│       ├── provisioning/dashboards/           # provider de dashboards
│       └── dashboards/biblioteca-api.json     # dashboard pre-provisionado
└── docker-compose.yml   # entorno local completo
```

## Servicios y puertos

| Servicio | URL local | Descripción |
|----------|-----------|-------------|
| Frontend | http://localhost:4200 | Angular servido por nginx |
| API | http://localhost:3000 | NestJS |
| Métricas de la API | http://localhost:3000/metrics | Formato Prometheus (`text/plain; version=0.0.4`) |
| Prometheus | http://localhost:9090 | Recolección de métricas |
| Grafana | http://localhost:3001 | Visualización (`admin` / `admin`) |
| PostgreSQL | `localhost:5432` | Base de datos (`sanderson` / `123456789`, db `cosmere`) |

> Dentro de la red de Docker Compose la API sigue usando `postgres:5432`; el cambio de puerto es solo para el acceso desde el host.

## Arranque rápido

```bash
# Levantar todo el entorno (incluye monitoreo)
docker compose up -d --build

# Ver estado y salud de los contenedores
docker compose ps

# Bajar el entorno conservando los volúmenes de datos
docker compose down

# Bajar y borrar también los datos (Postgres, Prometheus, Grafana)
docker compose down -v
```

Para levantar solo el stack de monitoreo sobre un entorno ya existente:

```bash
docker compose up -d postgres api postgres-exporter prometheus grafana
```

## Monitoreo (Fase 1 — Docker Compose)

### Arquitectura

Monitoreo **centralizado**: un único Prometheus y un único Grafana para todos los targets.

```
                    ┌──────────────┐
                    │   GRAFANA    │
                    │   :3001      │
                    └──────┬───────┘
                           │ consulta
                    ┌──────▼───────┐
                    │  PROMETHEUS  │
                    │   :9090      │
                    └──┬───┬───┬───┘
          scrape       │   │   │
        ┌──────────────┘   │   └──────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌────────────────┐
│ api:3000      │  │ postgres-     │  │ prometheus     │
│ /metrics      │  │ exporter:9187 │  │ :9090          │
└───────────────┘  └───────────────┘  └────────────────┘
```

| Componente | Rol |
|-----------|-----|
| `prom-client` (backend) | Expone métricas de Node.js y HTTP en `GET /metrics` |
| `postgres-exporter` | Traduce métricas de PostgreSQL al formato Prometheus |
| `prometheus` | Scrapea los tres targets cada 15 s y almacena las series |
| `grafana` | Consulta Prometheus y renderiza el dashboard `Biblioteca API` |

### Instrumentación del backend

El módulo `Biblioteca-Back/src/metrics/` contiene:

- `metrics.service.ts`: usa un `Registry` propio de `prom-client` (evita colisiones en Jest) con las métricas por defecto de Node (`process_*`, `nodejs_*`).
- `http-metrics.interceptor.ts`: interceptor global que registra cada petición en `http_requests_total` y `http_request_duration_seconds`, etiquetando por `method`, `route` y `status_code`. Usa la ruta del handler (`/libros/:id`) en lugar de la URL cruda para evitar cardinalidad alta.
- `metrics.controller.ts`: expone `GET /metrics`.
- `metrics.module.ts`: registra el controlador y el interceptor global (`APP_INTERCEPTOR`).

### Dashboard

Grafana se aprovisiona automáticamente desde archivos (no hace falta importar nada a mano):

- Datasource `Prometheus` (`uid=prometheus`, por defecto) → `http://prometheus:9090`
- Dashboard `Biblioteca API` (`uid=biblioteca-api`), con 6 paneles:
  1. Tasa de peticiones por ruta
  2. Latencia p95 por ruta
  3. Peticiones por código de estado
  4. Memoria residente del proceso
  5. Event loop lag
  6. Estado de los targets (`up`)

### Verificación

```bash
# Endpoint de métricas del backend
curl -s http://localhost:3000/metrics | head

# Targets de Prometheus (los 3 deben estar "up")
curl -s http://localhost:9090/api/v1/targets \
  | jq -r '.data.activeTargets[] | "\(.labels.job)\t\(.health)"'

# Healthy de Grafana
curl -s -u admin:admin http://localhost:3001/api/health
```

## Tests

```bash
cd Biblioteca-Back
npm run lint
npm run test:unit
npm run test:e2e    # requiere PostgreSQL en localhost:5432 (docker compose up -d postgres)
```

Los tests e2e usan `DB_PORT=5432` por defecto y respetan la variable si ya viene definida (por ejemplo en CI).

## Roadmap

- **Fase 1 (actual)**: monitoreo con Compose — Prometheus, Grafana, postgres-exporter y dashboard provisionado.
- **Fase 2**: preparar la aplicación para Kubernetes (`/health`, configuración por entorno, imágenes publicadas).
- **Fase 3**: manifiestos de Kubernetes en `k8s/`, reutilizando `monitoring/prometheus.yml` en un `ConfigMap`.

> Docker Compose se mantiene como entorno de **desarrollo local**; Kubernetes será la capa de **despliegue**. Ambos consumen las mismas imágenes y la misma configuración de Prometheus.
