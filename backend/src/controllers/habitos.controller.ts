import type { Request, Response, NextFunction } from 'express';
import * as habitosService from '../services/habitos.service';
import { idUsuarioActual } from '../utils/usuarioActual';

/**
 * Controlador de habitos (RF-02, RF-03 y RF-06). Solo lee el request y
 * arma la respuesta; las reglas y el SQL viven en habitos.service.
 */

// GET /api/habitos
export const getHabitos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await habitosService.listarHabitos(idUsuarioActual(req)));
  } catch (error) {
    next(error);
  }
};

// POST /api/habitos (habito propio, o adopcion si trae id_plantilla)
export const createHabito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await habitosService.crearHabito(idUsuarioActual(req), req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/habitos/:id (parcial)
export const updateHabito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await habitosService.actualizarHabito(idUsuarioActual(req), Number(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/habitos/:id
export const deleteHabito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await habitosService.eliminarHabito(idUsuarioActual(req), Number(req.params.id));
    res.json({ mensaje: 'Hábito eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

// POST /api/habitos/:id/cumplimientos (check-in)
export const marcarCumplimiento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registro = await habitosService.marcarCumplimiento(
      idUsuarioActual(req),
      Number(req.params.id),
      req.body.fecha
    );
    res.status(201).json(registro);
  } catch (error) {
    next(error);
  }
};
