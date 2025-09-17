const http = require('http');
const pino = require('pino');
const pinoHttp = require('pino-http');

const { createApp } = require('./app');
const { getCorrelationId } = require('./middleware/correlation-id');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const serverLogger = pinoHttp({
  logger,
  autoLogging: false,
  customProps: () => ({ correlationId: getCorrelationId() }),
});

const app = createApp({ logger, loggerMiddleware: serverLogger });

const PORT = process.env.PORT || 3000;

http.createServer(app).listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening');
});
