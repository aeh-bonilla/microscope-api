const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');

const CORRELATION_HEADER = 'x-correlation-id';
// Mantiene un contexto por petición para acceder al correlationId desde cualquier punto.
const storage = new AsyncLocalStorage();

function getCorrelationContext() {
  return storage.getStore();
}

function getCorrelationId() {
  const store = getCorrelationContext();
  return store ? store.correlationId : undefined;
}

function correlationIdMiddleware({ headerName = CORRELATION_HEADER } = {}) {
  return function correlationIdHandler(req, res, next) {
    // Usa el correlationId entrante o genera uno nuevo para la petición.
    const existingId = req.header(headerName);
    const correlationId = existingId && existingId.trim() !== '' ? existingId : randomUUID();

    const context = { correlationId };

    // Ejecuta el ciclo de la request dentro del contexto para exponer el correlationId.
    storage.run(context, () => {
      res.setHeader(headerName, correlationId);
      req.correlationId = correlationId;
      next();
    });
  };
}

module.exports = {
  correlationIdMiddleware,
  getCorrelationId,
  CORRELATION_HEADER,
};
