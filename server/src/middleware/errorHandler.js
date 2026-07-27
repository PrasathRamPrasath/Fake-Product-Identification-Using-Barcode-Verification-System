import envConfig from '../config/envConfig.js';

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: envConfig.nodeEnv === 'production' ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
export default errorHandler;
