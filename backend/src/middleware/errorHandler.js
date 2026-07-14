export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express requires all 4 params to recognize this as error-handling middleware.
export function errorHandler(err, req, res, _next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.name === 'VersionError') {
    return res.status(409).json({ message: 'Resource was modified concurrently — reload and retry' });
  }

  const status = err.status || 500;
  console.error(err);
  res.status(status).json({ message: err.message || 'Internal server error' });
}
