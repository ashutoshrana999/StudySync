function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _ = next;
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack })
  });
}

module.exports = { notFound, errorHandler };

