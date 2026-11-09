# Biblioteca-Final

Aplicación de biblioteca del Cosmere con backend NestJS, frontend Angular y PostgreSQL, más un stack de monitoreo con **Prometheus + Grafana**.

## Estructura del repositorio

```
Web/
├── Biblioteca-Back/     # API NestJS (expone /metrics y /health)
├── Biblioteca-Front/    # Frontend Angular (SSR con Express)
├── monitoring/
│   ├── prometheus.yml                         # scrape config de Prometheus
│   └── grafana/
│       ├── provisioning/datasources/          # datasource Prometheus
│       ├── provisioning/dashboards/           # provider de dashboards
│       └── dashboards/biblioteca-api.json     # dashboard pre-provisionado
├── k8s/                 # manifiestos de Kubernetes (sin Helm)
├── .env.example         # variables de Compose (opcional)
└── docker-compose.yml   # entorno local completo
```

## Servicios y puertos

| Servicio | URL local | Descripción |
|----------|-----------|-------------|
| Frontend | http://localhost:4200 | Angular SSR (Node/Express, puerto interno `4000`) |
| API | http://localhost:3000 | NestJS |
| Métricas de la API | http://localhost:3000/metrics | Formato Prometheus (`text/plain; version=0.0.4`) |
| Liveness | http://localhost:3000/health/live | Proceso vivo (no consulta la BD) |
| Readiness | http://localhost:3000/health/ready | Proceso listo (incluye `SELECT 1` a PostgreSQL) |
| Prometheus | http://localhost:9090 | Recolección de métricas |
| Grafana | http://localhost:3001 | Visualización (`admin` / `admin`) |
| PostgreSQL | `localhost:5432` | Base de datos (`sanderson` / `123456789`, db `cosmere`) |

> El contenedor del frontend expone `4000` internamente; Compose lo publica en `4200` para mantener la URL de siempre.

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
- `http-metrics.interceptor.ts`: interceptor global que registra cada petición en `http_requests_total` y `http_request_duration_seconds`, etiquetando por `method`, `route` y `status_code`. Usa la ruta del handler (`/libros/:id`) en lugar de la URL cruda para evitar cardinalidad alta. Las rutas `/health*` se excluyen para que los probes no inflen las métricas.
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

## Preparación para Kubernetes (Fase 2)

La aplicación queda lista para desplegarse en un cluster sin cambios de código:

### Health probes

El módulo `Biblioteca-Back/src/health/` expone:

| Endpoint | Tipo | Comportamiento |
|----------|------|----------------|
| `GET /health/live` | Liveness | Devuelve `200 {"status":"ok"}` si el proceso responde. No consulta la BD, para no reiniciar el Pod cuando PostgreSQL está caído. |
| `GET /health/ready` | Readiness | Ejecuta `SELECT 1` contra PostgreSQL. Devuelve `200` si la BD responde o `503` si no. |
| `GET /health` | Alias | Equivale a `/health/ready` (útil para chequeos manuales y Compose). |

En Kubernetes se mapean directamente a los probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Configuración por entorno

Toda la configuración se lee de variables de entorno (`ConfigService`); no hay credenciales ni hosts hardcodeados en el código. Los valores por defecto de Compose permiten levantar todo sin crear un `.env`:

| Variable | Default en Compose | Uso |
|----------|--------------------|-----|
| `DB_TYPE` | `postgres` | Driver de TypeORM |
| `DB_HOST` | `postgres` | Host de la base (`localhost` fuera de Compose) |
| `DB_PORT` | `5432` | Puerto de la base |
| `DB_USERNAME` | `sanderson` | Usuario |
| `DB_PASSWORD` | `123456789` | Contraseña |
| `DB_DATABASE` | `cosmere` | Nombre de la base |
| `DB_SSL` | `false` | Habilita TLS hacia la BD |
| `DB_SYNCHRONIZE` | `true` | Autosync de esquema (`false` cuando se usen migraciones) |
| `PORT` | `3000` (API) / `4000` (front) | Puerto de escucha |
| `API_URL` | `http://localhost:3000` | URL de la API embebida en el build de Angular |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | `admin` / `admin` | Credenciales de Grafana |

Ejemplos disponibles:

- `Web/.env.example` → variables de Docker Compose.
- `Web/Biblioteca-Back/.env.example` → para correr la API desde el host.

En Kubernetes, estos valores se moverán a un `ConfigMap` (no sensibles) y a un `Secret` (credenciales).

### Imágenes de producción

Ambos `Dockerfile` son multi-stage:

| Imagen | Etapas | Runtime |
|--------|--------|---------|
| Backend | `deps` → `build` → `runtime` | `node dist/main.js`, usuario `node`, puerto `3000` |
| Frontend | `deps` → `build` (Angular SSR) → `runtime` | `node dist/biblioteca/server/server.mjs`, usuario `node`, puerto `4000` |

- El runtime instala solo dependencias de producción (`npm ci --omit=dev`).
- Los contenedores corren como usuario **no root** (compatible con `securityContext` de K8s).
- `.dockerignore` excluye `node_modules`, `dist`, `.env` y artefactos de test.
- La URL de la API del frontend se inyecta en build time: `docker build --build-arg API_URL=... ./Biblioteca-Front`.

### Publicación de imágenes (CI)

El job `docker-publish` usa **Docker Buildx** y publica las tres imágenes para `linux/amd64`:

- `gabyjaurena/biblioteca-back:2.0`
- `gabyjaurena/biblioteca-front:2.0`
- `gabyjaurena/postgres14-alpine:2.0`

La URL de la API del frontend se toma de la variable de repositorio `API_URL` y, si no está definida, usa `https://biblioteca-sanderson.onrender.com`.

### Verificación local

```bash
# Liveness (rápido, sin BD)
curl -s http://localhost:3000/health/live

# Readiness (incluye PostgreSQL)
curl -s http://localhost:3000/health/ready

# El healthcheck de Compose usa /health/ready
docker inspect --format '{{.State.Health.Status}}' web-api-1
```

## Despliegue en Kubernetes (Fase 3)

Los manifiestos están en `k8s/`, **sin Helm**, con un archivo por servicio. Cada archivo agrupa todos los objetos de ese componente y lleva un prefijo numérico para que `kubectl apply -f k8s/` respete el orden (primero el Namespace y el Secret).

| Archivo | Objetos |
|---------|---------|
| `00-namespace.yaml` | `Namespace biblioteca` |
| `01-secret.yaml` | `Secret` con credenciales de Postgres y Grafana |
| `10-postgres.yaml` | `Service` headless, `Service` del exporter y `StatefulSet` con **postgres-exporter como sidecar** |
| `20-backend.yaml` | `Service api` + `Deployment backend` (1 réplica, probes `/health/*`) |
| `30-frontend.yaml` | `Service frontend` + `Deployment frontend` (2 réplicas, SSR en `4000`) |
| `40-prometheus.yaml` | `ConfigMap`, `PVC`, `Service` y `Deployment` de Prometheus |
| `50-grafana.yaml` | `ConfigMaps` (datasource, provider y dashboard), `PVC`, `Service` y `Deployment` |
| `60-ingress.yaml` | `Ingress` opcional para `biblioteca.local` y `api.biblioteca.local` |

### Topología

```
Ingress (opcional)
   ├── biblioteca.local      → Service frontend:80  → Pods frontend:4000
   └── api.biblioteca.local  → Service api:3000     → Pods backend:3000

Service postgres (headless) → Pod postgres
   ├── postgres:5432
   └── postgres-exporter:9187 (sidecar, localhost:5432)

Service prometheus:9090 → Pod prometheus
Service grafana:3000    → Pod grafana

Prometheus scrapea:
   - api:3000/metrics
   - postgres-exporter:9187/metrics
   - localhost:9090
```

Los nombres de los Services (`api`, `postgres-exporter`, `prometheus`) coinciden con los targets de `monitoring/prometheus.yml`, por lo que la configuración de scrape es la misma que en Compose.

### Requisitos

- `kubectl` apuntando al cluster.
- Un **StorageClass por defecto** (los PVC de Postgres, Prometheus y Grafana lo usan).
- Las imágenes disponibles para el cluster:
  - `gabyjaurena/biblioteca-back:2.0`
  - `gabyjaurena/biblioteca-front:2.0`
  - `gabyjaurena/postgres14-alpine:2.0`
- Opcional: un Ingress Controller (nginx) si se aplica `60-ingress.yaml`.

### Imágenes y URL del frontend

Angular embebe `API_URL` en **build time**. Hay dos escenarios:

**A) Acceso con `port-forward` (sin Ingress):**

```bash
docker build -t gabyjaurena/biblioteca-back:2.0 ./Biblioteca-Back
docker build \
  --build-arg API_URL=http://localhost:3000 \
  -t gabyjaurena/biblioteca-front:2.0 ./Biblioteca-Front
```

**B) Acceso con Ingress:**

```bash
docker build \
  --build-arg API_URL=http://api.biblioteca.local \
  -t gabyjaurena/biblioteca-front:2.0 ./Biblioteca-Front
```

En un cluster local (kind/minikube) las imágenes locales se cargan con:

```bash
kind load docker-image gabyjaurena/biblioteca-back:2.0 gabyjaurena/biblioteca-front:2.0
# o, con minikube:
minikube image load gabyjaurena/biblioteca-back:2.0
minikube image load gabyjaurena/biblioteca-front:2.0
```

### Desplegar

```bash
# Namespace primero (el prefijo 00 lo ordena igual con -f k8s/)
kubectl apply -f k8s/00-namespace.yaml

# Resto de los manifiestos
kubectl apply -f k8s/

# Estado
kubectl get pods -n biblioteca -w
kubectl rollout status deployment/backend -n biblioteca
kubectl rollout status deployment/frontend -n biblioteca
```

El Ingress es opcional; si no hay controller, omitir ese archivo:

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secret.yaml
kubectl apply -f k8s/10-postgres.yaml
kubectl apply -f k8s/20-backend.yaml
kubectl apply -f k8s/30-frontend.yaml
kubectl apply -f k8s/40-prometheus.yaml
kubectl apply -f k8s/50-grafana.yaml
```

### Acceso sin Ingress

```bash
kubectl port-forward -n biblioteca svc/frontend 4200:80
kubectl port-forward -n biblioteca svc/api 3000:3000
kubectl port-forward -n biblioteca svc/prometheus 9090:9090
kubectl port-forward -n biblioteca svc/grafana 3001:3000
```

Luego: frontend `http://localhost:4200`, Prometheus `http://localhost:9090`, Grafana `http://localhost:3001` (`admin` / `admin`).

### Acceso con Ingress

Con un controller nginx instalado (`minikube addons enable ingress`, o el manifiesto de kind), agregar al `/etc/hosts` la IP del Ingress:

```
<IP_DEL_INGRESS>  biblioteca.local  api.biblioteca.local
```

### Verificación

```bash
kubectl get pods -n biblioteca
kubectl get svc -n biblioteca
kubectl get pvc -n biblioteca

# Logs y probes
kubectl logs -n biblioteca deployment/backend
kubectl describe pod -n biblioteca -l app=backend | grep -A5 Probes

# Prometheus: los 3 targets deben estar "up"
kubectl port-forward -n biblioteca svc/prometheus 9090:9090
curl -s http://localhost:9090/api/v1/targets \
  | jq -r '.data.activeTargets[] | "\(.labels.job)\t\(.health)"'
```

Grafana se aprovisiona solo con el mismo dashboard `Biblioteca API` de la Fase 1.

### Consideraciones

- `01-secret.yaml` contiene credenciales de **laboratorio**. En producción se deben reemplazar o gestionar con SealedSecrets/External Secrets.
- Las imágenes usan `imagePullPolicy: IfNotPresent` con el tag mutable `2.0`. Después de publicar una nueva imagen con CI, forzar la actualización con:
  ```bash
  kubectl rollout restart deployment/backend deployment/frontend -n biblioteca
  ```
- `postgres-exporter` comparte el Pod de Postgres y usa `localhost:5432`; es el caso de sidecar válido dentro del esquema de monitoreo centralizado.
- El backend corre con **1 réplica** mientras `DB_SYNCHRONIZE=true`, para evitar que dos Pods creen el esquema a la vez. Cuando se agreguen migraciones (y `DB_SYNCHRONIZE=false`), se puede escalar y sumar un HPA.
- El Ingress no está incluido en el flujo por defecto porque no todos los clusters tienen controller.
- Los manifiestos fueron validados estáticamente con `kubeconform` (20 recursos, 0 errores); la validación en un cluster real queda pendiente de tener `kubectl`/kind/minikube instalado.

## Tests

```bash
cd Biblioteca-Back
npm run lint
npm run test:unit
npm run test:e2e    # requiere PostgreSQL en localhost:5432 (docker compose up -d postgres)
```

Los tests e2e usan `DB_PORT=5432` por defecto y respetan la variable si ya viene definida (por ejemplo en CI).

## Roadmap

- **Fase 1 (completada)**: monitoreo con Compose — Prometheus, Grafana, postgres-exporter y dashboard provisionado.
- **Fase 2 (completada)**: aplicación preparada para Kubernetes — `/health/live` y `/health/ready`, configuración 100 % por entorno, imágenes multi-stage no root y publicación `linux/amd64` con Buildx.
- **Fase 3 (manifiestos listos)**: despliegue en Kubernetes con YAML planos en `k8s/` (sin Helm). Validados estáticamente con `kubeconform`; pendiente de ejecutar en un cluster real.
- **Fase 4 (pendiente)**: Terraform para provisionar infraestructura (cluster, red, registry, DNS) y aplicar los mismos manifiestos; deploy en Render con URL configurable.

> Docker Compose se mantiene como entorno de **desarrollo local**; Kubernetes será la capa de **despliegue**. Ambos consumen las mismas imágenes y la misma configuración de Prometheus.
