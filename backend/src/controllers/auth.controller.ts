import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ErrorHttp } from '../utils/ErrorHttp';

/**
 * Capa de controladores.
 *
 * Un controlador hace siempre lo mismo: lee lo que viene en el
 * request, llama al servicio correspondiente y arma la respuesta.
 * No contiene logica de negocio ni consultas SQL.
 *
 * El try/catch envuelve cada uno porque son funciones asincronas: si
 * una promesa falla y nadie la captura, Express no se entera y la
 * peticion queda colgada. Con next(error) el fallo viaja al
 * middleware de errores, que decide la respuesta.
 */

/** POST /api/auth/registro */
export const registro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.body ya viene validado y normalizado por el middleware de
    // zod, asi que aqui se puede confiar en su forma.
    const { usuario, token } = await authService.registrar(req.body);

    // 201 Created: se creo un recurso nuevo.
    res.status(201).json({ usuario, token });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/login */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { usuario, token } = await authService.login(req.body);
    res.status(200).json({ usuario, token });
  } catch (error) {
    next(error);
  }
};

/** GET /api/auth/perfil  (ruta protegida) */
export const perfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.usuario lo dejo el middleware requiereAuth. Si llegamos
    // aqui es que el token era valido, pero se comprueba igual para
    // que TypeScript sepa que no es undefined.
    if (!req.usuario) {
      throw new ErrorHttp(401, 'No autenticado');
    }

    const usuario = await authService.obtenerPorId(req.usuario.id_usuario);
    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
};
