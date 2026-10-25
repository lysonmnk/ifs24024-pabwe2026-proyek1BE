import { materiService } from '../services/materi.service.js';
import { sendSuccess } from '../utils/response.js';

export class MateriController {
  constructor(service = materiService) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const materiList = this.service.getAllMateri(req.user.id);
      return sendSuccess(res, 200, 'Berhasil mengambil daftar materi', materiList);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const materi = this.service.getMateriById(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Berhasil mengambil detail materi', materi);
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const newMateri = this.service.createMateri(req.user.id, req.body);
      return sendSuccess(res, 201, 'Materi berhasil dibuat', newMateri);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const updatedMateri = this.service.updateMateri(req.params.id, req.user.id, req.body);
      return sendSuccess(res, 200, 'Materi berhasil diperbarui', updatedMateri);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      this.service.deleteMateri(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Materi beserta seluruh sesinya berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  };
}

export const materiController = new MateriController();
