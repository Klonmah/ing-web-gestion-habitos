import { z } from 'zod';

/**
 * Piezas de validacion compartidas por todos los recursos.
 */

// :id llega como texto. Se exige un entero positivo; asi "/tareas/abc"
// responde 400 y no llega a la base.
export const esquemaId = z.coerce
  .number({ message: 'El id debe ser un numero' })
  .int('El id debe ser un entero')
  .positive('El id debe ser positivo');

// Id que viene en el body como numero (id_habito, id_plantilla...).
export const idEnBody = (nombre: string) =>
  z
    .number({ message: `${nombre} debe ser un numero` })
    .int(`${nombre} debe ser un entero`)
    .positive(`${nombre} debe ser positivo`);

/**
 * Fecha AAAA-MM-DD que ademas EXISTE en el calendario.
 *
 * El regex solo no basta: "2026-02-31" tiene el formato correcto pero
 * no existe, y PostgreSQL lo rechazaba con un error que terminaba en
 * 500. Aqui se arma la fecha y se comprueba que el dia y el mes no se
 * hayan "corrido" (Date convierte 31 de febrero en 3 de marzo).
 */
export const fechaReal = z
  .string({ message: 'La fecha es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
  .refine((valor) => {
    // Si el formato ya fallo, basta con ese mensaje.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return true;
    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return (
      fecha.getUTCFullYear() === anio &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia
    );
  }, 'La fecha no existe en el calendario');

// Hora HH:MM de 00:00 a 23:59.
export const horaHHMM = z
  .string({ message: 'La hora es obligatoria' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener el formato HH:MM (00:00 a 23:59)');

/**
 * Para los PUT parciales: todos los campos son opcionales, pero tiene
 * que venir al menos uno. Se usa igual que en las plantillas del admin.
 */
export const alMenosUnCampo = <T extends z.ZodRawShape>(esquema: z.ZodObject<T>) =>
  esquema.partial().refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });
