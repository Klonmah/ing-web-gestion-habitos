import { z } from 'zod';
import { alMenosUnCampo, fechaReal, horaHHMM, idEnBody } from './comun.schema';

/**
 * Validacion de habitos (RF-02) y del check-in (RF-03).
 *
 * Los valores permitidos son los mismos que los CHECK de la base. Se
 * validan aqui primero para responder un 400 que dice que campo
 * fallo, en vez de dejar que PostgreSQL rechace la consulta con un
 * error que terminaba en 500.
 *
 * El PUT es parcial: un PUT sin "activo" ya no falla.
 */

const FRECUENCIAS = ['diaria', 'semanal'] as const;

const camposHabito = z.object({
  nombre: z
    .string({ message: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacio')
    .max(60, 'El nombre no puede superar los 60 caracteres'),
  frecuencia: z.enum(FRECUENCIAS, { message: 'La frecuencia debe ser diaria o semanal' }),
  meta: z.string().trim().max(60, 'La meta no puede superar los 60 caracteres').nullable().optional(),
  horario_objetivo: horaHHMM.nullable().optional(),
  activo: z.boolean({ message: 'activo debe ser true o false' }).optional(),
});

// Al crear se puede indicar la plantilla de origen (adoptar del
// catalogo, RF-06). Al editar no: la plantilla de origen no cambia.
export const esquemaCrearHabito = camposHabito.extend({
  id_plantilla: idEnBody('id_plantilla').nullable().optional(),
});
export const esquemaActualizarHabito = alMenosUnCampo(camposHabito);

// POST /habitos/:id/cumplimientos (check-in de un toque, RF-03)
export const esquemaCumplimiento = z.object({ fecha: fechaReal });

export type DatosCrearHabito = z.infer<typeof esquemaCrearHabito>;
export type DatosActualizarHabito = z.infer<typeof esquemaActualizarHabito>;
