import { z } from 'zod';
import { alMenosUnCampo, horaHHMM, idEnBody } from './comun.schema';

/**
 * Validacion de recordatorios (RF-05).
 *
 * Los valores permitidos son los mismos que los CHECK de la base. Se
 * validan aqui primero para responder un 400 que dice que campo
 * fallo, en vez de dejar que PostgreSQL rechace la consulta con un
 * error que terminaba en 500.
 */

const camposRecordatorio = z.object({
  id_habito: idEnBody('id_habito'),
  // 1 = lunes ... 7 = domingo (CHECK chk_recordatorio_dia)
  dia_semana: z
    .number({ message: 'dia_semana debe ser un numero' })
    .int('dia_semana debe ser un entero')
    .min(1, 'dia_semana va de 1 (lunes) a 7 (domingo)')
    .max(7, 'dia_semana va de 1 (lunes) a 7 (domingo)'),
  hora: horaHHMM,
  activo: z.boolean({ message: 'activo debe ser true o false' }).optional(),
});

export const esquemaCrearRecordatorio = camposRecordatorio;
// El habito de un recordatorio no se cambia: se borra y se crea otro.
export const esquemaActualizarRecordatorio = alMenosUnCampo(camposRecordatorio.omit({ id_habito: true }));

export const esquemaQueryRecordatorios = z.object({
  id_habito: z.coerce
    .number({ message: 'id_habito debe ser un numero' })
    .int('id_habito debe ser un entero')
    .positive('id_habito debe ser positivo')
    .optional(),
});

export type DatosCrearRecordatorio = z.infer<typeof esquemaCrearRecordatorio>;
export type DatosActualizarRecordatorio = z.infer<typeof esquemaActualizarRecordatorio>;
export type FiltroRecordatorios = z.infer<typeof esquemaQueryRecordatorios>;
