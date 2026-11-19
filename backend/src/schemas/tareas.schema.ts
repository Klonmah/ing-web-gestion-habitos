import { z } from 'zod';
import { alMenosUnCampo, fechaReal } from './comun.schema';

/**
 * Validacion de tareas (RF-01).
 *
 * Los valores permitidos son los mismos que los CHECK de la base. Se
 * validan aqui primero para responder un 400 que dice que campo
 * fallo, en vez de dejar que PostgreSQL rechace la consulta con un
 * error que terminaba en 500.
 *
 * El PUT es parcial (como el de plantillas del admin): se envian solo
 * los campos que cambian, y al menos uno. Asi un PUT sin "completada"
 * ya no falla.
 */

const PRIORIDADES = ['alta', 'media', 'baja'] as const;

const camposTarea = z.object({
  titulo: z
    .string({ message: 'El titulo es obligatorio' })
    .trim()
    .min(1, 'El titulo no puede estar vacio')
    .max(80, 'El titulo no puede superar los 80 caracteres'),
  descripcion: z.string().trim().max(1000, 'La descripcion es demasiado larga').nullable().optional(),
  fecha_limite: fechaReal,
  prioridad: z.enum(PRIORIDADES, { message: 'La prioridad debe ser alta, media o baja' }),
  completada: z.boolean({ message: 'completada debe ser true o false' }).optional(),
});

export const esquemaCrearTarea = camposTarea;
export const esquemaActualizarTarea = alMenosUnCampo(camposTarea);

export type DatosCrearTarea = z.infer<typeof esquemaCrearTarea>;
export type DatosActualizarTarea = z.infer<typeof esquemaActualizarTarea>;
