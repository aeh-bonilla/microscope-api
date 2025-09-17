# Microscope API

API de ejemplo que demuestra cómo instrumentar una aplicación Node.js/Express con logging estructurado, correlation IDs y métricas en formato Prometheus.

## Requisitos previos
- Node.js >= 18 (incluye npm)

## Instalación
```bash
npm install
```

## Ejecución en desarrollo
```bash
npm start
```
- El servidor escucha por defecto en `http://localhost:3000`.
- Ajusta el nivel de log con la variable `LOG_LEVEL` (por defecto `info`).

## Endpoints principales
- `GET /health` → Health check sencillo `{ "status": "ok" }`.
- `GET /metrics` → Métricas Prometheus, incluye:
  - Contador `http_requests_total` (etiquetas `method`, `status_code`, `route`).
  - Histograma `http_request_duration_ms` y gauge `http_request_duration_ms_p95` (etiquetas `method`, `route`).
  - Métricas por defecto del runtime Node (`process_*`, `nodejs_*`).

## Observabilidad incorporada
- Middleware de correlation ID que asegura el header `x-correlation-id` y lo propaga a logs.
- Logging estructurado con `pino` y `pino-http`, incluyendo latencia y estado por request.
- Métricas para Prometheus: contador de requests, histograma de latencias, percentil p95 calculado en memoria y métricas de proceso.

## Estructura relevante
```
├─ src/
│  ├─ index.js                # Entrada principal; configura logging y servidor HTTP
│  ├─ app.js                  # Define middlewares y rutas (health, metrics)
│  ├─ middleware/
│  │  ├─ correlation-id.js    # Gestiona correlation IDs con AsyncLocalStorage
│  │  └─ request-logger.js    # Logging por request con duración
│  └─ metrics/
│     └─ index.js             # Contadores, histogramas y gauge p95
├─ docs/
│  └─ pasos-iniciales.md      # Bitácora detallada de configuración
└─ README.md
```

## Próximos pasos sugeridos
- Añadir pruebas automatizadas para el middleware y los endpoints.
- Empaquetar la aplicación para despliegue (Docker o similar) según el entorno objetivo.
