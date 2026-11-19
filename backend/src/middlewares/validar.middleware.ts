import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ErrorHttp } from '../utils/ErrorHttp';
import { esquemaId } from '../schemas/comun.schema';

/**
 * Convierte un error de zod en el 400 estandar de la API, con un
 * detalle por campo para que el frontend pueda marcar el input
 * exacto que fallo en vez de mostrar un mensaje generico.
 */
const aErrorHttp = (error: ZodError, prefijo?: string): ErrorHttp =>
  new ErrorHttp(
    400,
    'Los datos enviados no son validos',
    error.issues.map((problema) => ({
      campo: [prefijo, ...problema.path].filter((p) => p !== undefined && p !== '').join('.') || (prefijo ?? 'body'),
      mensaje: problema.message,
    }))
  );

/**
 * Middleware generico de validacion del body.
 *
 *     router.post('/tareas', validar(esquemaCrearTarea), crearTarea);
 *
 * Si los datos son validos, reemplaza req.body por la version limpia
 * que devuelve zod (con los trim y toLowerCase ya aplicados), de
 * modo que el controlador siempre trabaja con datos normalizados.
 * Si no, pasa un ErrorHttp 400 al manejador central de errores.
 */
export const validar =
  (esquema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req.body);
    if (!resultado.success) {
      next(aErrorHttp(resultado.error));
      return;
    }
    req.body = resultado.data;
    next();
  };

/**
 * Valida el :id de la URL (entero positivo). Asi "/tareas/abc"
 * responde 400 con el campo "id" en vez de llegar a la base y
 * provocar un 500. El controlador puede usar Number(req.params.id).
 */
export const validarId = (req: Request, _res: Response, next: NextFunction): void => {
  const resultado = esquemaId.safeParse(req.params.id);
  if (!resultado.success) {
    next(aErrorHttp(resultado.error, 'id'));
    return;
  }
  next();
};

/**
 * Valida el query string con un esquema. En Express 5 req.query es de
 * solo lectura, asi que los datos limpios se dejan en res.locals.query.
 */
export const validarQuery =
  (esquema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req.query);
    if (!resultado.success) {
      next(aErrorHttp(resultado.error));
      return;
    }
    res.locals.query = resultado.data;
    next();
  };
