import type { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { ErrorHttp } from '../utils/ErrorHttp';
import { esquemaId, esquemaFiltroCatalogo } from '../schemas/admin.schema';

/**
 * Igual que en auth.controller: leen el
 * request, llaman al servicio y arman la respuesta. El body ya llega
 * validado por el middleware validar(); el id de la URL y los
 * filtros del query se validan aqui con zod.
 */

// Convierte req.params.id en un numero valido o lanza 400.
const leerId = (req: Request): number => {
  const resultado = esquemaId.safeParse(req.params.id);
  if (!resultado.success) {
    throw new ErrorHttp(400, resultado.error.issues[0].message);
  }
  return resultado.data;
};

// Plantillas 

// GET /api/admin/plantillas 
export const listarPlantillas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminService.listarPlantillas());
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/plantillas 
export const crearPlantilla = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await adminService.crearPlantilla(req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/plantillas/:id 
export const actualizarPlantilla = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminService.actualizarPlantilla(leerId(req), req.body));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/plantillas/:id  (RF-07: 409 si esta adoptada) 
export const eliminarPlantilla = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.eliminarPlantilla(leerId(req));
    res.status(200).json({ mensaje: 'Plantilla eliminada' });
  } catch (error) {
    next(error);
  }
};

//  Categorias 

// GET /api/admin/categorias 
export const listarCategorias = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminService.listarCategorias());
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categorias 
export const crearCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await adminService.crearCategoria(req.body));
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/categorias/:id 
export const actualizarCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminService.actualizarCategoria(leerId(req), req.body));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categorias/:id 
export const eliminarCategoria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.eliminarCategoria(leerId(req));
    res.status(200).json({ mensaje: 'Categoria eliminada' });
  } catch (error) {
    next(error);
  }
};

//  Metricas 

// GET /api/admin/metricas 
export const obtenerMetricas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await adminService.obtenerMetricas());
  } catch (error) {
    next(error);
  }
};

// Catalogo (usuario normal) 

// GET /api/catalogo?categoria=&dificultad= 
export const listarCatalogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.usuario) {
      throw new ErrorHttp(401, 'No autenticado');
    }

    const filtro = esquemaFiltroCatalogo.safeParse(req.query);
    if (!filtro.success) {
      throw new ErrorHttp(400, filtro.error.issues[0].message);
    }

    res.status(200).json(await adminService.listarCatalogo(filtro.data, req.usuario.id_usuario));
  } catch (error) {
    next(error);
  }
};
