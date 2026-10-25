import { AppError } from './app-error.js';

export const parseId = (id, paramName = 'ID') => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError(`${paramName} tidak valid`, 400, [`${paramName} harus berupa bilangan bulat positif`]);
  }
  return numericId;
};
