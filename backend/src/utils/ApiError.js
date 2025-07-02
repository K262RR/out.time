export class ApiError extends Error {
  constructor(statusCode, message, data = {}, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = isOperational; // Ошибки, которые мы предвидели (валидация, не найдено и т.д.)
    this.name = 'ApiError';
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError; 