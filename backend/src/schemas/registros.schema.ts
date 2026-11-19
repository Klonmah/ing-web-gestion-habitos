import { z } from 'zod';
import { alMenosUnCampo, fechaReal, idEnBody } from './comun.schema';

/**
 * Validacion de registros de cumplimiento (RF-03).
 *
 * Los valores permitidos son los mismos que los CHECK de la base. Se
 * validan aqui primero para responder un 400 que dice que campo
 * fallo, en vez de dejar que PostgreSQL rechace la consulta con un
 * error que terminaba en 500.
 */

const camposRegistro = z.object({
  id_habito: idEnBody('id_habito'),
  fecha: fechaReal,
});

export const esquemaCrearRegistro = camposRegistro;
export const esquemaActualizarRegistro = alMenosUnCampo(camposRegistro);

export type DatosCrearRegistro = z.infer<typeof esquemaCrearRegistro>;
export type DatosActualizarRegistro = z.infer<typeof esquemaActualizarRegistro>;
