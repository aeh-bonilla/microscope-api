const { getCorrelationId } = require('./correlation-id');

function requestLoggerMiddleware({ logger }) {
  return function requestLogger(req, res, next) {
    const startAt = process.hrtime.bigint();
    const boundLogger = req.log || logger;

    boundLogger.info(
      {
        method: req.method,
        url: req.originalUrl,
        correlationId: getCorrelationId(),
      },
      'incoming request'
    );

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
      boundLogger.info(
        {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
          correlationId: getCorrelationId(),
        },
        'request completed'
      );
    });

    next();
  };
}

module.exports = { requestLoggerMiddleware };
