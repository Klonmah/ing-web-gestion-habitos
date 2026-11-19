import type { Request, Response, NextFunction } from 'express';
import * as tareasService from '../services/tareas.service';
import { idUsuarioActual } from '../utils/usuarioActual';

/**
 * Controlador de tareas (RF-01). Solo lee el request y arma la
 * respuesta: el body ya llega validado por validar(), el :id por
 * validarId, y el SQL vive en tareas.service. Cualquier error se pasa
 * a next() y lo responde error.middleware con el formato unico.
 */

// GET /api/tareas
export const getTareas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await tareasService.listarTareas(idUsuarioActual(req)));
  } catch (error) {
    next(error);
  }
};

// POST /api/tareas
export const createTarea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await tareasService.crearTarea(idUsuarioActual(req), req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/tareas/:id (parcial: solo cambian los campos enviados)
export const updateTarea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await tareasService.actualizarTarea(idUsuarioActual(req), Number(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tareas/:id
export const deleteTarea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tareasService.eliminarTarea(idUsuarioActual(req), Number(req.params.id));
    res.json({ mensaje: 'Tarea eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};
