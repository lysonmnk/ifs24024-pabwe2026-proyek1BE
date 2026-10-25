export class AppError extends Error {
  constructor(message, statusCode = 400, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : [message];
    Error.captureStackTrace(this, this.constructor);
  }
}
