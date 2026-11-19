import type { Request, Response, NextFunction } from 'express';
import * as registrosService from '../services/registros.service';
import { idUsuarioActual } from '../utils/usuarioActual';

/**
 * Controlador de registros de cumplimiento (RF-03). Solo lee el
 * request y arma la respuesta; el SQL vive en registros.service.
 */

// GET /api/registros
export const getRegistros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await registrosService.listarRegistros(idUsuarioActual(req)));
  } catch (error) {
    next(error);
  }
};

// POST /api/registros
export const createRegistro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await registrosService.crearRegistro(idUsuarioActual(req), req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/registros/:id (parcial)
export const updateRegistro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await registrosService.actualizarRegistro(idUsuarioActual(req), Number(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/registros/:id
export const deleteRegistro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await registrosService.eliminarRegistro(idUsuarioActual(req), Number(req.params.id));
    res.json({ mensaje: 'Registro de cumplimiento eliminado' });
  } catch (error) {
    next(error);
  }
};
