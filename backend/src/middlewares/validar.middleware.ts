import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

/**
 * Middleware generico de validacion.
 *
 * Recibe un esquema de zod y devuelve un middleware que comprueba
 * req.body contra el. Sirve para cualquier endpoint, asi que C y D
 * pueden usarlo con sus propios esquemas:
 *
 *     router.post('/tareas', requiereAuth, validar(esquemaTarea), crear);
 *
 * Si los datos son validos, reemplaza req.body por la version limpia
 * que devuelve zod (con los trim y toLowerCase ya aplicados), de
 * modo que el controlador siempre trabaja con datos normalizados.
 */
export const validar =
  (esquema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = esquema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Se devuelve un detalle por campo, para que el frontend
        // pueda marcar el input exacto que fallo en vez de mostrar
        // un mensaje generico.
        const detalles = (error as ZodError).issues.map((problema) => ({
          campo: problema.path.join('.'),
          mensaje: problema.message,
        }));

        res.status(400).json({
          error: 'Los datos enviados no son validos',
          detalles,
        });
        return;
      }
      next(error);
    }
  };
