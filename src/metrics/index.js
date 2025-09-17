const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code', 'route'],
  registers: [register],
});

const requestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Histogram of HTTP request durations in milliseconds',
  labelNames: ['method', 'route'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

const requestDurationP95Gauge = new client.Gauge({
  name: 'http_request_duration_ms_p95',
  help: 'Observed 95th percentile of HTTP request durations in milliseconds',
  labelNames: ['method', 'route'],
  registers: [register],
});

async function updateLatencyPercentiles(labels) {
  const histogramData = await requestDurationHistogram.get();

  const bucketValues = histogramData.values.filter(
    (value) =>
      value.metricName === `${requestDurationHistogram.name}_bucket` &&
      value.labels.method === labels.method &&
      value.labels.route === labels.route
  );

  if (bucketValues.length === 0) {
    return;
  }

  bucketValues.sort((a, b) => {
    const parse = (bucket) => (bucket.labels.le === '+Inf' ? Infinity : Number(bucket.labels.le));
    return parse(a) - parse(b);
  });

  const countEntry = histogramData.values.find(
    (value) =>
      value.metricName === `${requestDurationHistogram.name}_count` &&
      value.labels.method === labels.method &&
      value.labels.route === labels.route
  );

  if (!countEntry || countEntry.value === 0) {
    return;
  }

  const target = countEntry.value * 0.95;
  let p95 = 0;

  for (const bucket of bucketValues) {
    const upperBound = bucket.labels.le === '+Inf' ? undefined : Number(bucket.labels.le);
    if (bucket.value >= target) {
      if (upperBound !== undefined) {
        p95 = upperBound;
      }
      break;
    }
    if (upperBound !== undefined) {
      p95 = upperBound;
    }
  }

  requestDurationP95Gauge.labels(labels.method, labels.route).set(p95);
}

function requestMetricsMiddleware() {
  return function metricsHandler(req, res, next) {
    const startAt = process.hrtime.bigint();

    res.on('finish', () => {
      const route = req.route && req.route.path ? req.route.path : req.originalUrl;
      const labels = { method: req.method, route };

      requestCounter
        .labels({ method: req.method, status_code: res.statusCode, route })
        .inc();

      const durationMs = Number(process.hrtime.bigint() - startAt) / 1e6;
      requestDurationHistogram.labels(labels.method, labels.route).observe(durationMs);

      updateLatencyPercentiles(labels).catch(() => {});
    });

    next();
  };
}

module.exports = {
  register,
  requestCounter,
  requestMetricsMiddleware,
  requestDurationHistogram,
  requestDurationP95Gauge,
};
