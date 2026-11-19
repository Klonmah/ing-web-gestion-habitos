/**
 * Ayudas para traducir errores de PostgreSQL a respuestas claras.
 * Los servicios las usan para convertir, por ejemplo, una violacion
 * de UNIQUE (23505) en un 409 con un mensaje que el usuario entienda.
 */

export const PG_UNIQUE = '23505';
export const PG_FOREIGN_KEY = '23503';
export const PG_CHECK = '23514';

export const esErrorPg = (error: unknown, codigo: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error &&
  (error as { code: string }).code === codigo;

/** Nombre de la restriccion violada (p. ej. 'chk_registro_fecha_no_futura'). */
export const restriccionPg = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'constraint' in error
    ? (error as { constraint?: string }).constraint
    : undefined;

/**
 * Construye el SET de un UPDATE parcial con parametros ($1, $2...).
 * Solo incluye las columnas que vienen en "datos", asi un PUT que no
 * manda "completada" no la deja en NULL. Los nombres de columna salen
 * de una lista fija del servicio, nunca del body.
 */
export const setParcial = (
  datos: Record<string, unknown>,
  columnas: readonly string[],
  primerIndice = 1
): { sql: string; valores: unknown[] } => {
  const partes: string[] = [];
  const valores: unknown[] = [];
  for (const columna of columnas) {
    if (datos[columna] !== undefined) {
      valores.push(datos[columna]);
      partes.push(`${columna} = $${primerIndice + valores.length - 1}`);
    }
  }
  return { sql: partes.join(', '), valores };
};
