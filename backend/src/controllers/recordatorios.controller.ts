import type { Request, Response, NextFunction } from 'express';
import * as recordatoriosService from '../services/recordatorios.service';
import { idUsuarioActual } from '../utils/usuarioActual';

/**
 * Controlador de recordatorios (RF-05). Solo lee el request y arma la
 * respuesta; el SQL vive en recordatorios.service.
 */

// GET /api/recordatorios?id_habito=
export const getRecordatorios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await recordatoriosService.listarRecordatorios(idUsuarioActual(req), res.locals.query));
  } catch (error) {
    next(error);
  }
};

// POST /api/recordatorios
export const createRecordatorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await recordatoriosService.crearRecordatorio(idUsuarioActual(req), req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/recordatorios/:id (parcial)
export const updateRecordatorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await recordatoriosService.actualizarRecordatorio(idUsuarioActual(req), Number(req.params.id), req.body)
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/recordatorios/:id
export const deleteRecordatorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recordatoriosService.eliminarRecordatorio(idUsuarioActual(req), Number(req.params.id));
    res.json({ mensaje: 'Recordatorio eliminado' });
  } catch (error) {
    next(error);
  }
};
