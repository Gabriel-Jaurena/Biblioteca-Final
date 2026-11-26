# Biblioteca-Final

![Promedio](https://img.shields.io/codecov/c/github/Gabriel-Jaurena/Biblioteca-Final/main?label=Promedio)
![Backend](https://img.shields.io/codecov/c/github/Gabriel-Jaurena/Biblioteca-Final/main?flag=backend&label=Backend)
![Frontend](https://img.shields.io/codecov/c/github/Gabriel-Jaurena/Biblioteca-Final/main?flag=frontend&label=Frontend)

Aplicación full-stack para gestionar el Cosmere: **sagas** y los **libros** que las componen. Backend NestJS con TypeORM y PostgreSQL, frontend Angular con SSR, monitoreo con Prometheus + Grafana y despliegue en Render + Netlify.

| Servicio | URL |
|----------|-----|
| Frontend (SSR) | https://sanderson-web.netlify.app |
| API | https://biblioteca-back-z50o.onrender.com |
| Estado de la API | https://biblioteca-back-z50o.onrender.com/health/ready |
| Cobertura | https://codecov.io/gh/Gabriel-Jaurena/Biblioteca-Final |

> El backend usa el plan free de Render: se suspende tras ~15 minutos sin tráfico y el primer request puede tardar en despertarlo.

---

## Arquitectura

```
Navegador
   │
   ├──► Netlify (Angular SSR)
   │       └── fetch a la API (URL embebida en build time)
   │
   └──► Render (NestJS)
           ├── ValidationPipe (DTO)
           ├── Controllers → Services → Repositorios TypeORM
           └── PostgreSQL

Prometheus ──scrape──► API /metrics
    ▲                      │
    └──── Grafana ◄────────┘
```

| Componente | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| Frontend | Angular 20 + Express SSR | Interfaz de sagas y libros; render en servidor |
| Backend | NestJS 11 + TypeORM | API REST, validación, CORS, health y métricas |
| Base de datos | PostgreSQL 14 | Persistencia con relación 1:N y borrado en cascada |
| Monitoreo | Prometheus + Grafana | Métricas HTTP/Node/PostgreSQL y dashboard |
| CI/CD | GitHub Actions | Tests, cobertura y publicación de imágenes |
| Deploy | Render + Netlify | API desde imagen Docker; frontend desde el repo |

También incluye manifiestos de **Kubernetes** (`k8s/`) y un entorno local completo con **Docker Compose**.

---

## Funcionalidades

- CRUD completo de sagas y libros.
- Relación `sagas 1 ── N libros` con `ON DELETE CASCADE`.
- Filtros por nombre de saga, título de libro, título y saga.
- Validación estricta de payloads: rechaza campos desconocidos.
- CORS configurable por variable de entorno.
- SSR con hidratación y sin caché de transferencia HTTP entre servidor y navegador.
- Health probes de liveness y readiness.
- Endpoint `/metrics` en formato Prometheus.

---

## Modelo de datos

**`sagas`**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `id` | entero, autoincremental | generado |
| `nombre` | string (255) | sí |
| `descripcion` | texto | no |
| `fechaInicio` | fecha | no |
| `era` | string | no |

**`libros`**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `id` | entero, autoincremental | generado |
| `sagaId` | entero, FK → `sagas.id` | sí |
| `titulo` | string (255) | sí |
| `autor` | string | sí |
| `fechaEdicion` | fecha | sí |
| `numeroPaginas` | entero | sí |
| `descripcion` | texto | sí |

Al eliminar una saga se eliminan sus libros por la cascada de la FK.

---

## API

Base local: `http://localhost:3000`
Base productiva: `https://biblioteca-back-z50o.onrender.com`

### Endpoints

| Método | Ruta | Descripción | Éxito |
|--------|------|-------------|-------|
| GET | `/` | Mensaje de bienvenida | 200 |
| GET | `/health/live` | Liveness: proceso vivo, sin consultar la BD | 200 |
| GET | `/health/ready` | Readiness: ejecuta `SELECT 1` contra PostgreSQL | 200 / 503 |
| GET | `/health` | Alias de `/health/ready` | 200 / 503 |
| GET | `/metrics` | Métricas en formato Prometheus | 200 |
| GET | `/sagas` | Lista sagas (incluye sus libros) | 200 |
| GET | `/sagas/:id` | Obtiene una saga con sus libros | 200 / 404 |
| POST | `/sagas` | Crea una saga | 201 |
| PATCH | `/sagas/:id` | Actualiza parcialmente una saga | 200 / 404 |
| DELETE | `/sagas/:id` | Elimina una saga y sus libros | 200 / 404 |
| GET | `/libros` | Lista libros | 200 |
| GET | `/libros/:id` | Obtiene un libro | 200 / 404 |
| POST | `/libros` | Crea un libro | 201 / 500 |
| PATCH | `/libros/:id` | Actualiza parcialmente un libro | 200 / 404 |
| DELETE | `/libros/:id` | Elimina un libro | 200 / 404 |

`DELETE` responde `200` con cuerpo vacío. Los `id` se validan como enteros; un valor no numérico devuelve `400`.

### Filtros

| Ruta | Parámetros | Comportamiento |
|------|------------|----------------|
| `GET /sagas` | `nombre`, `libroTitulo` | Búsqueda parcial (`LIKE %valor%`). Devuelve las sagas con sus libros. |
| `GET /libros` | `titulo`, `sagaId` | Búsqueda parcial por título y coincidencia exacta por saga. |

Ejemplos:

```bash
curl "http://localhost:3000/sagas?nombre=mistborn"
curl "http://localhost:3000/sagas?libroTitulo=imperio"
curl "http://localhost:3000/libros?titulo=imperio"
curl "http://localhost:3000/libros?sagaId=1"
```

### Ejemplos de uso

```bash
BASE=http://localhost:3000

# Crear una saga
curl -s -X POST $BASE/sagas \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre": "Nacidos de la Bruma",
    "descripcion": "Primera era del Cosmere",
    "fechaInicio": "2006-07-17",
    "era": "Era 1"
  }'

# Crear un libro asociado (usar el id devuelto por la saga)
curl -s -X POST $BASE/libros \
  -H 'Content-Type: application/json' \
  -d '{
    "sagaId": 1,
    "titulo": "El Imperio Final",
    "autor": "Brandon Sanderson",
    "fechaEdicion": "2006-07-17",
    "numeroPaginas": 672,
    "descripcion": "Primer libro de Mistborn"
  }'

# Actualizar solo un campo
curl -s -X PATCH $BASE/libros/1 \
  -H 'Content-Type: application/json' \
  -d '{"numeroPaginas": 680}'

# Eliminar
curl -i -X DELETE $BASE/libros/1
```

### Validación y errores

El `ValidationPipe` global usa `whitelist` y `forbidNonWhitelisted`: cualquier propiedad que no esté en el DTO produce `400`.

- Enviar `descripcion`, no `description`.
- No enviar `id`, `libros` ni `saga`: son campos de la entidad, no del DTO.
- En libros, `descripcion` es obligatoria.
- Un `sagaId` inexistente devuelve `500` con el mensaje "Verifique que el sagaId exista" (la FK lo rechaza).

| Código | Causa |
|--------|-------|
| 400 | Campo desconocido, tipo inválido o `id` no numérico |
| 404 | El recurso solicitado no existe |
| 500 | Error de FK al crear un libro con `sagaId` inválido |

---

## Configuración

La API se configura por variables de entorno (`ConfigService`); no hay credenciales ni hosts en el código.

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | — | URL completa de conexión. Tiene prioridad sobre `DB_*`. |
| `DB_HOST` | `localhost` / `postgres` | Host de PostgreSQL. |
| `DB_PORT` | `5432` | Puerto de PostgreSQL. |
| `DB_USERNAME` | `sanderson` | Usuario. |
| `DB_PASSWORD` | `123456789` | Contraseña. |
| `DB_DATABASE` | `cosmere` | Nombre de la base. |
| `DB_SSL` | `false` | TLS hacia la BD. También se activa si `DATABASE_URL` incluye `sslmode=require`. |
| `DB_SYNCHRONIZE` | `true` | TypeORM crea/actualiza el esquema. Se fuerza a `false` si `DB_MIGRATIONS_RUN=true`. |
| `DB_MIGRATIONS_RUN` | `false` | Ejecuta las migraciones pendientes al iniciar. |
| `DB_RETRY_ATTEMPTS` | `20` | Intentos de conexión al arrancar. |
| `DB_RETRY_DELAY` | `5000` | Milisegundos entre intentos. |
| `DB_RETRY_VERBOSE` | `false` | Log detallado de reintentos. |
| `PORT` | `3000` | Puerto de la API. Render lo inyecta automáticamente. |
| `CORS_ORIGINS` | `*` | Orígenes permitidos, separados por comas. |
| `API_URL` | `http://localhost:3000` | URL de la API embebida en el build de Angular. |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | `admin` / `admin` | Credenciales de Grafana. |

Plantillas: `Web/.env.example` (Compose) y `Web/Biblioteca-Back/.env.example` (API desde el host).

Variables típicas en Render: `DATABASE_URL`, `DB_SYNCHRONIZE=false`, `DB_MIGRATIONS_RUN=true` y `CORS_ORIGINS` con el dominio de Netlify.

---

## Puesta en marcha

Requisitos: Docker y Docker Compose. No hace falta instalar Node ni PostgreSQL.

```bash
# Levantar todo el entorno (aplicación + monitoreo)
docker compose up -d --build

# Estado de los contenedores
docker compose ps

# Bajar conservando los datos
docker compose down

# Bajar y borrar también los volúmenes
docker compose down -v
```

| Servicio | URL local | Notas |
|----------|-----------|-------|
| Frontend | http://localhost:4200 | Angular SSR; el contenedor escucha en `4000` |
| API | http://localhost:3000 | NestJS |
| Métricas | http://localhost:3000/metrics | Formato Prometheus |
| Liveness | http://localhost:3000/health/live | Sin consultar la BD |
| Readiness | http://localhost:3000/health/ready | Incluye `SELECT 1` |
| Prometheus | http://localhost:9090 | Scrape cada 15 s |
| Grafana | http://localhost:3001 | `admin` / `admin` |
| PostgreSQL | `localhost:5432` | `sanderson` / `123456789`, base `cosmere` |

Para correr los servicios desde el host, cada módulo tiene sus propios scripts (`npm run start:dev` en el backend, `npm start` en el frontend). En ese caso, la API espera PostgreSQL en `localhost:5432` y el frontend usa `http://localhost:3000` como `API_URL`.

---

## Tests y cobertura

```bash
# Backend
cd Biblioteca-Back
npm ci
npm run lint
npm run test:unit          # Jest, sin cobertura
npm run test:e2e           # requiere PostgreSQL en localhost:5432
npm run test:cov           # cobertura unitaria
npm run test:cov:e2e       # cobertura e2e

# Frontend
cd ../Biblioteca-Front
npm ci
npm run lint
npm run test:unit          # Karma + ChromeHeadless
npm run test:integration   # requiere API y PostgreSQL reales
npm run test:cov           # cobertura unitaria
```

El test de integración del frontend hace un `POST` real a `http://localhost:3000/libros`; necesita una saga con `id=1` creada de antemano.

### Codecov

Los reportes se generan con Jest y Karma en formato `lcov` y se suben desde el CI con dos flags:

| Flag | Reportes |
|------|----------|
| `backend` | `coverage/unit/lcov.info` + `coverage/e2e/lcov.info` |
| `frontend` | `coverage/biblioteca/lcov.info` |

`codecov.yml` define `target: auto`, los `ignore` (specs, `server.ts`, `main.ts`) y `carryforward: true` para que un flag no caiga a 0 % si no se sube en un commit.

En un monorepo, Jest y Karma emiten rutas relativas (`SF:src/...`). El CI las normaliza con `sed` a `Biblioteca-Back/src/...` y `Biblioteca-Front/src/...` antes de subirlas.

Cobertura actual: **backend ~56 %**, **frontend ~40 %**, **total ~55 %**. La del frontend es baja porque solo hay tests de servicios, no de componentes.

---

## CI/CD

El workflow `CI` (`.github/workflows/ci.yml`) corre en pushes y PRs a `main`, `develop` y `testing`:

| Job | Qué hace |
|-----|----------|
| `backend-tests` | Lint, unit y e2e con cobertura; sube el flag `backend` a Codecov |
| `frontend-unit` | Lint y unit con cobertura; sube el flag `frontend` |
| `frontend-integration` | Levanta PostgreSQL y la API reales y ejecuta el test de integración |
| `docker-publish` | Publica las tres imágenes con Buildx para `linux/amd64` |

`docker-publish` depende de los tres jobs de test. Publica:

- `gabyjaurena/biblioteca-back:2.0`
- `gabyjaurena/biblioteca-front:2.0`
- `gabyjaurena/postgres14-alpine:2.0`

El frontend recibe `API_URL` como build arg (Angular la resuelve en build time); si la variable de repositorio no está definida, usa `https://biblioteca-back-z50o.onrender.com`.

**Deploy de la API**: el workflow `DeployHook` (`.github/workflows/deploy-hook.yml`) escucha el fin del `CI` y, solo si terminó en éxito, fue un `push` y la rama es `main` (configurable con `DEPLOY_BRANCH`), ejecuta:

```bash
curl -fsS -X POST "$RENDER_DEPLOY_HOOK"
```

Render corre la imagen `gabyjaurena/biblioteca-back:2.0` (servicio "existing image"), conecta con reintentos y aplica migraciones al arrancar.

**Deploy del frontend**: Netlify clona el repo y buildea Angular. `netlify.toml` define `publish = dist/biblioteca/browser`, el plugin `@netlify/angular-runtime` (crea la Edge Function de SSR) y un redirect de fallback a `index.csr.html`.

---

## Monitoreo

Un único Prometheus y un único Grafana centralizan todos los targets.

```
Grafana :3001 ──consulta──► Prometheus :9090
                                 │ scrape
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              api:3000     postgres-       prometheus
              /metrics     exporter:9187   :9090
```

| Componente | Rol |
|------------|-----|
| `prom-client` (backend) | Métricas de Node y HTTP en `GET /metrics` |
| `postgres-exporter` | Métricas de PostgreSQL en formato Prometheus |
| Prometheus | Scrapea los tres targets cada 15 s |
| Grafana | Dashboard `Biblioteca API` con 6 paneles |

El interceptor HTTP mide `http_requests_total` y `http_request_duration_seconds` por `method`, `route` y `status_code`. Usa la ruta del handler (`/libros/:id`) para evitar cardinalidad alta y excluye `/health*`.

El dashboard incluye: tasa de requests por ruta, latencia p95, requests por status, memoria del proceso, event loop lag y estado de los targets. Se aprovisiona desde archivos, sin importación manual.

```bash
curl -s http://localhost:3000/metrics | head
curl -s http://localhost:9090/api/v1/targets \
  | jq -r '.data.activeTargets[] | "\(.labels.job)\t\(.health)"'
curl -s -u admin:admin http://localhost:3001/api/health
```

---

## Kubernetes

Los manifiestos están en `k8s/`, sin Helm. Cada archivo agrupa los objetos de un componente y el prefijo numérico ordena su aplicación.

| Archivo | Objetos |
|---------|---------|
| `00-namespace.yaml` | Namespace `biblioteca` |
| `01-secret.yaml` | Credenciales de PostgreSQL y Grafana |
| `10-postgres.yaml` | Service headless, Service del exporter y StatefulSet con sidecar |
| `20-backend.yaml` | Service `api` y Deployment del backend (1 réplica) |
| `30-frontend.yaml` | Service y Deployment del frontend (2 réplicas) |
| `40-prometheus.yaml` | ConfigMap, PVC, Service y Deployment |
| `50-grafana.yaml` | ConfigMaps, PVC, Service y Deployment |
| `60-ingress.yaml` | Ingress para `biblioteca.local` y `api.biblioteca.local` |

Son 20 recursos. El stack fue probado en minikube: pods `Ready`, PVCs `Bound`, CRUD contra la API, targets de Prometheus en `up`, dashboard de Grafana y auto-healing al borrar pods.

```bash
# Cluster local
minikube start
minikube addons enable ingress

# Cargar imágenes publicadas por el CI
minikube image load gabyjaurena/biblioteca-back:2.0
minikube image load gabyjaurena/biblioteca-front:2.0
minikube image load gabyjaurena/postgres14-alpine:2.0

# Desplegar
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/

# Verificar
kubectl get pods,svc,pvc,ingress -n biblioteca
kubectl rollout status deployment/backend -n biblioteca

# Acceso sin Ingress
kubectl port-forward -n biblioteca svc/frontend 4200:80
kubectl port-forward -n biblioteca svc/api 3000:3000

# Prometheus y Grafana
kubectl port-forward -n biblioteca svc/prometheus 9090:9090
kubectl port-forward -n biblioteca svc/grafana 3001:3000

# Apagar
minikube stop
# Borrar todo el cluster: minikube delete
```

Con Ingress, agregar al `/etc/hosts` la IP de `minikube ip`:

```
192.168.49.2  biblioteca.local  api.biblioteca.local
```

Consideraciones:

- Las credenciales de `01-secret.yaml` son de laboratorio; en producción deben gestionarse con SealedSecrets o External Secrets.
- Las imágenes usan `imagePullPolicy: IfNotPresent` y tag mutable `2.0`: tras publicar una nueva, ejecutar `kubectl rollout restart deployment/backend deployment/frontend -n biblioteca`.
- El backend corre con 1 réplica mientras `DB_SYNCHRONIZE=true` para evitar que dos pods creen el esquema a la vez.
- El frontend se compila con `API_URL=http://api.biblioteca.local`; ese host funciona por Ingress desde el navegador, pero no resuelve dentro del pod. Por eso el SSR no trae datos en el cluster y sí lo hace el navegador por CSR.

---

## Estructura del repositorio

```
Web/
├── Biblioteca-Back/          # API NestJS
│   ├── src/
│   │   ├── libros/
│   │   ├── sagas/
│   │   ├── health/
│   │   ├── metrics/
│   │   └── database/         # configuración de TypeORM y migraciones
│   ├── test/                 # Jest unit y e2e
│   └── Dockerfile
├── Biblioteca-Front/         # Angular SSR
│   ├── src/
│   ├── netlify.toml
│   ├── karma.conf.js
│   └── Dockerfile
├── monitoring/               # Prometheus y provisioning de Grafana
├── k8s/                      # manifiestos de Kubernetes
├── .github/workflows/        # CI y DeployHook
├── codecov.yml
├── docker-compose.yml
└── .env.example
```

---

## Consideraciones de producción

- **Render free**: cold start tras ~15 min sin tráfico y la base free expira a los 30 días.
- **Netlify**: si se quita `@netlify/angular-runtime` de `netlify.toml`, se publica solo el shell CSR y las rutas profundas devuelven 404.
- **URL de la API**: Angular la embebe en build time; si cambia el dominio del backend, hay que rebuildear el frontend.
- **Tag mutable `2.0`**: simplifica el deploy pero reduce trazabilidad; una mejora es publicar también por commit SHA.
- **Secretos**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_DEPLOY_HOOK` y `CODECOV_TOKEN` viven en GitHub Secrets, nunca en el repo.
