import { z } from 'zod';

/**
 * Validacion del query de GET /api/progreso (RF-04).
 */

export const esquemaQueryProgreso = z.object({
  periodo: z.enum(['semanal', 'mensual'], {
    message: 'El parametro periodo debe ser "semanal" o "mensual"',
  }),
});

export type Periodo = z.infer<typeof esquemaQueryProgreso>['periodo'];
