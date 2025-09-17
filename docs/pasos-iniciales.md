# Bitácora de configuración - Microscope API

## Requisitos previos
- Node.js >= 18
- npm (se instala junto con Node.js)

## Pasos para crear el proyecto desde cero
1. Crear la carpeta del proyecto y posicionarse en ella:
   ```bash
   mkdir microscope-api
   cd microscope-api
   ```
2. Inicializar `package.json`:
   ```bash
   npm init -y
   ```
3. Instalar dependencias base (Express y logging):
   ```bash
   npm install express pino pino-http
   ```
4. Instalar la librería de métricas:
   ```bash
   npm install prom-client
   ```
5. Generar la estructura de carpetas mínima:
   ```bash
   mkdir -p src/middleware src/metrics docs
   ```
6. Crear `.gitignore` para ignorar artefactos comunes:
   ```bash
   cat <<'EOT' > .gitignore
   node_modules
   npm-debug.log
   .DS_Store
   EOT
   ```

## Orden en el que se agregaron los módulos
1. **Middleware de Correlation IDs** (`src/middleware/correlation-id.js`): usa `AsyncLocalStorage` para generar/propagar el header `x-correlation-id` y exponerlo vía `getCorrelationId`.
2. **Aplicación base** (`src/app.js`): registra JSON parser, el middleware de correlation y expone `/health`.
3. **Punto de entrada y logging estructurado** (`src/index.js`): configura `pino` y `pino-http`, habilita logs por request y arranca el servidor HTTP en el puerto 3000.
4. **Logging por request** (`src/middleware/request-logger.js`): registra mensajes de entrada/salida por petición con duración y `correlationId`.
5. **Métricas de contador** (`src/metrics/index.js` - contador `http_requests_total`): incrementa un counter por método, estado y ruta, y expone `/metrics` en la app.
6. **Histograma de latencia y Gauge de p95** (`src/metrics/index.js`): observa la duración en un histograma `http_request_duration_ms` y calcula el percentil 95 en `http_request_duration_ms_p95`.

## Cómo ejecutar la aplicación
1. Instalar dependencias (si aún no se ha hecho):
   ```bash
   npm install
   ```
2. Iniciar el servidor:
   ```bash
   npm start
   ```
   - Por defecto expone HTTP en `http://localhost:3000`.
3. Probar el health check:
   ```bash
   curl -i http://localhost:3000/health
   ```
4. Consultar métricas (formato Prometheus):
   ```bash
   curl -i http://localhost:3000/metrics
   ```

## Notas adicionales
- Puedes fijar el nivel de log con la variable `LOG_LEVEL` (`info` por defecto).
- Cada petición devuelve el header `x-correlation-id`; si ya viene en la request se reutiliza.
- Los logs de request incluyen método, URL, duración y `correlationId` para facilitar el trazado.
- Las métricas disponibles son:
  - `http_requests_total` (counter) etiquetado por `method`, `status_code`, `route`.
  - `http_request_duration_ms` (histograma) etiquetado por `method`, `route`.
  - `http_request_duration_ms_p95` (gauge) etiquetado por `method`, `route`.
  - Métricas por defecto de `prom-client` con prefijos `process_` y `nodejs_`.
