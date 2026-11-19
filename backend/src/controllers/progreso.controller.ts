import type { Request, Response, NextFunction } from 'express';
import * as progresoService from '../services/progreso.service';
import { idUsuarioActual } from '../utils/usuarioActual';

/**
 * Controlador del panel de progreso (RF-04). El periodo ya llega
 * validado por validarQuery en res.locals.query; el calculo de rachas
 * y porcentajes vive en progreso.service.
 */

// GET /api/progreso?periodo=semanal|mensual
export const getProgreso = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await progresoService.obtenerProgreso(idUsuarioActual(req), res.locals.query.periodo));
  } catch (error) {
    next(error);
  }
};
