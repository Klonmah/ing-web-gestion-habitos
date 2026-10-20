import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorHttp } from '../utils/ErrorHttp';
import type { UsuarioAutenticado } from '../types/express';

/**
 * Middlewares de autenticacion y autorizacion.
 *
 * Son las dos piezas que necesitan los roles C y D para proteger
 * sus endpoints. Ninguna de las dos consulta la base de datos: el
 * token ya trae el id y el rol firmados, y volver a consultar en
 * cada peticion seria un viaje a la base por request.
 *
 * Un middleware recibe (req, res, next) y decide si la peticion
 * sigue adelante (llamando a next()) o se corta (llamando a next
 * con un error).
 */

/**
 * AUTENTICACION: comprueba que la peticion traiga un token valido.
 *
 * Uso en una ruta:
 *     router.get('/tareas', requiereAuth, tareasController.listar);
 */
export const requiereAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // El token viaja en la cabecera Authorization con el formato
    // estandar:  Authorization: Bearer <token>
    const cabecera = req.headers.authorization;

    if (!cabecera || !cabecera.startsWith('Bearer ')) {
      throw new ErrorHttp(401, 'Falta el token de autenticacion');
    }

    // Se descarta la palabra "Bearer " y queda el token.
    const token = cabecera.substring(7).trim();

    const secreto = process.env.JWT_SECRET;
    if (!secreto) {
      throw new Error('Falta la variable JWT_SECRET en el archivo .env');
    }

    // verify hace dos cosas: comprueba que la firma corresponda al
    // secreto (es decir, que nadie haya alterado el contenido) y
    // que el token no haya expirado. Si algo falla, lanza.
    const payload = jwt.verify(token, secreto) as UsuarioAutenticado;

    // Se deja el usuario en el request para que los controladores
    // que vengan despues sepan quien hizo la peticion.
    req.usuario = {
      id_usuario: payload.id_usuario,
      correo: payload.correo,
      rol: payload.rol,
    };

    next();
  } catch (error) {
    // jwt lanza errores con nombres propios. Se traducen a mensajes
    // utiles para que el frontend pueda distinguir "tu sesion
    // expiro" de "este token es invalido".
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ErrorHttp(401, 'La sesion expiro, vuelve a iniciar sesion'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ErrorHttp(401, 'Token invalido'));
    }
    next(error);
  }
};

/**
 * AUTORIZACION: comprueba que el usuario sea administrador.
 *
 * Se usa SIEMPRE despues de requiereAuth, porque necesita que
 * req.usuario ya exista:
 *     router.get('/admin/plantillas', requiereAuth, requiereAdmin, ...);
 *
 * RF-08: un usuario sin rol admin recibe 403 (Forbidden), no 401.
 * La diferencia importa: 401 significa "no se quien eres", 403
 * significa "se quien eres y no tienes permiso".
 */
export const requiereAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.usuario) {
    return next(new ErrorHttp(401, 'Falta el token de autenticacion'));
  }

  if (req.usuario.rol !== 'admin') {
    return next(new ErrorHttp(403, 'No tienes permisos de administrador'));
  }

  next();
};
