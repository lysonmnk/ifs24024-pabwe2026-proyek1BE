import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      const user = await this.service.register(req.body);
      return sendSuccess(res, 201, 'Registrasi berhasil', user);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const data = await this.service.login(req.body);
      return sendSuccess(res, 200, 'Login berhasil', data);
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req, res, next) => {
    try {
      const user = this.service.getProfile(req.user.id);
      return sendSuccess(res, 200, 'Berhasil mengambil profil', user);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
