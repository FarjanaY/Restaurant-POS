export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express requires all 4 params to recognize this as error-handling middleware.
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  console.error(err);
  res.status(status).json({ message: err.message || 'Internal server error' });
}
