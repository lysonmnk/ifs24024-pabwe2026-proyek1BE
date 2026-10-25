import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const DB_PATH = process.env.DB_PATH || path.resolve('data/catatan.db');
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
export const JWT_SECRET = process.env.JWT_SECRET || 'kunci-rahasia-default-pengembangan-ifs24024';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const NODE_ENV = process.env.NODE_ENV || 'development';
