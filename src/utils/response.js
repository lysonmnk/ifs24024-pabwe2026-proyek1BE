export const sendSuccess = (res, statusCode = 200, message = 'Berhasil', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== null ? data : {}
  });
};

export const sendError = (res, statusCode = 400, message = 'Gagal', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};
