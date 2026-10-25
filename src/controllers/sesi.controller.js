import { sesiService } from '../services/sesi.service.js';
import { sendSuccess } from '../utils/response.js';

export class SesiController {
  constructor(service = sesiService) {
    this.service = service;
  }

  getByMateriId = async (req, res, next) => {
    try {
      const sesiList = this.service.getSesiByMateriId(req.params.materiId, req.user.id);
      return sendSuccess(res, 200, 'Berhasil mengambil daftar sesi belajar', sesiList);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const newSesi = this.service.createSesi(req.params.materiId, req.user.id, req.body);
      return sendSuccess(res, 201, 'Berhasil menambahkan sesi belajar', newSesi);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      this.service.deleteSesi(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Berhasil menghapus sesi belajar', null);
    } catch (error) {
      next(error);
    }
  };
}

export const sesiController = new SesiController();
