import { z } from 'zod';

/**
 * Esquemas de validacion del admin
 *
 * Los valores permitidos de dificultad y frecuencia son los mismos
 * que los CHECK de la base de datos. Se validan aqui primero para
 * devolver un 400 claro por campo, en vez de dejar que PostgreSQL
 * rechace el INSERT con un error de CHECK (23514).
 */

const DIFICULTADES = ['baja', 'media', 'alta'] as const;
const FRECUENCIAS = ['diaria', 'semanal'] as const;

// ---------------------------------------------------------------
// Plantillas (RF-07)
// ---------------------------------------------------------------
export const esquemaCrearPlantilla = z.object({
  id_categoria: z.number().int().positive('La categoria es obligatoria'),
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede superar los 60 caracteres'),
  descripcion: z.string().trim().max(500, 'La descripcion es demasiado larga').optional(),
  dificultad: z.enum(DIFICULTADES, { message: 'La dificultad debe ser baja, media o alta' }),
  frecuencia_sugerida: z.enum(FRECUENCIAS, {
    message: 'La frecuencia debe ser diaria o semanal',
  }),
  activa: z.boolean().optional(),
});

// PUT parcial: el front manda solo lo que cambia (por ejemplo
// { activa: false } para desactivar). Todos los campos son
// opcionales, pero al menos uno tiene que venir.
export const esquemaActualizarPlantilla = esquemaCrearPlantilla
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });


// Categorias (RF-08)
export const esquemaCrearCategoria = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar los 50 caracteres'),
  descripcion: z.string().trim().max(500, 'La descripcion es demasiado larga').optional(),
});

export const esquemaActualizarCategoria = esquemaCrearCategoria
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

// Parametros de ruta y query


// :id llega como texto. Se exige un entero positivo; asi un
// "/admin/plantillas/abc" responde 400 y no llega a la base.
export const esquemaId = z.coerce
  .number({ message: 'El id debe ser un numero' })
  .int('El id debe ser un entero')
  .positive('El id debe ser positivo');

// GET /catalogo?categoria=&dificultad=
// Los dos filtros son opcionales y un valor vacio ("?categoria=")
// cuenta como "sin filtro". categoria acepta el id numerico o el
// nombre de la categoria.
const vacioAUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const esquemaFiltroCatalogo = z.object({
  categoria: z.preprocess(vacioAUndefined, z.string().trim().max(50).optional()),
  dificultad: z.preprocess(
    vacioAUndefined,
    z.enum(DIFICULTADES, { message: 'La dificultad debe ser baja, media o alta' }).optional()
  ),
});

export type DatosCrearPlantilla = z.infer<typeof esquemaCrearPlantilla>;
export type DatosActualizarPlantilla = z.infer<typeof esquemaActualizarPlantilla>;
export type DatosCrearCategoria = z.infer<typeof esquemaCrearCategoria>;
export type DatosActualizarCategoria = z.infer<typeof esquemaActualizarCategoria>;
export type FiltroCatalogo = z.infer<typeof esquemaFiltroCatalogo>;
