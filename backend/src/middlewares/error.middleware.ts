import type { Request, Response, NextFunction } from 'express';
import { ErrorHttp } from '../utils/ErrorHttp';

/**
 * Manejador de rutas inexistentes.
 * Se monta despues de todas las rutas: si la peticion llego hasta
 * aqui, es que ninguna coincidio.
 */
export const rutaNoEncontrada = (req: Request, res: Response): void => {
  res.status(404).json({
    error: `La ruta ${req.method} ${req.originalUrl} no existe`,
  });
};

/**
 * Manejador central de errores.
 *
 * Express reconoce un middleware como manejador de errores solo si
 * declara CUATRO parametros, aunque no use el ultimo. Por eso
 * aparece "_next" sin usarse: quitarlo romperia el manejo de errores
 * sin dar ningun aviso.
 *
 * Todo next(error) de cualquier controlador termina aqui.
 */
export const manejadorErrores = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Errores esperados: los que lanzan los servicios a proposito.
  if (error instanceof ErrorHttp) {
    res.status(error.estado).json({ error: error.message });
    return;
  }

  // Errores de PostgreSQL que conviene traducir. El codigo 23505 es
  // violacion de restriccion UNIQUE, y 23503 de clave foranea: esta
  // ultima es la que se va a disparar con RF-07, cuando se intente
  // eliminar una plantilla que algun usuario tiene adoptada.
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const codigo = (error as { code: string }).code;

    if (codigo === '23505') {
      res.status(409).json({ error: 'El registro ya existe' });
      return;
    }
    if (codigo === '23503') {
      res.status(409).json({
        error: 'No se puede completar la operacion porque el registro esta en uso',
      });
      return;
    }
  }

  // Errores no previstos: se registran completos en la consola del
  // servidor, pero al cliente solo se le da un mensaje generico.
  // Devolver el detalle (nombres de tablas, rutas de archivos,
  // consultas SQL) le daria informacion util a un atacante.
  console.error('Error no controlado:', error);

  res.status(500).json({ error: 'Error interno del servidor' });
};
