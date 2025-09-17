const express = require('express');
const { correlationIdMiddleware } = require('./middleware/correlation-id');
const { requestLoggerMiddleware } = require('./middleware/request-logger');
const { requestMetricsMiddleware, register: metricsRegister } = require('./metrics');

function createApp({ logger, loggerMiddleware } = {}) {
  const app = express();

  app.use(express.json());
  app.use(correlationIdMiddleware());

  if (loggerMiddleware) {
    app.use(loggerMiddleware);
  }

  if (logger) {
    app.use(requestLoggerMiddleware({ logger }));
  }

  app.use(requestMetricsMiddleware());

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', metricsRegister.contentType);
      res.send(await metricsRegister.metrics());
    } catch (error) {
      if (logger) {
        logger.error({ err: error }, 'Failed to collect metrics');
      }
      res.status(500).json({ status: 'metrics_error' });
    }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

module.exports = { createApp };
