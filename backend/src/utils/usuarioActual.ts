import type { Request } from 'express';
import { ErrorHttp } from './ErrorHttp';

/**
 * Id del usuario autenticado, tal como lo dejo requiereAuth a partir
 * del token. Es el UNICO id de usuario que usan los servicios: nunca
 * se filtra por un id que venga en la URL o en el body.
 */
export const idUsuarioActual = (req: Request): number => {
  if (!req.usuario) throw new ErrorHttp(401, 'No autenticado');
  return req.usuario.id_usuario;
};
