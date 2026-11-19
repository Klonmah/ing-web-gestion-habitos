import { pool } from '../config/db';
import { ErrorHttp, errorDeCampo } from '../utils/ErrorHttp';
import { esErrorPg, PG_CHECK, PG_FOREIGN_KEY, PG_UNIQUE, setParcial } from '../utils/pg';
import type { DatosCrearHabito, DatosActualizarHabito } from '../schemas/habitos.schema';

/**
 * Capa de servicios de habitos (RF-02), adopcion desde el catalogo
 * (RF-06) y check-in diario (RF-03). Todas las consultas filtran por
 * el id del usuario del token.
 */

export interface Habito {
  id_habito: number;
  id_usuario: number;
  id_plantilla: number | null;
  nombre: string;
  frecuencia: 'diaria' | 'semanal';
  meta: string | null;
  horario_objetivo: string | null;
  activo: boolean;
  fecha_adopcion: string;
}

export interface Registro {
  id_registro: number;
  id_habito: number;
  fecha: string;
  fecha_hora_registro: string;
}

const COLUMNAS_EDITABLES = ['nombre', 'frecuencia', 'meta', 'horario_objetivo', 'activo'] as const;

const noEncontrado = () => new ErrorHttp(404, 'Hábito no encontrado o no pertenece al usuario');

/**
 * Comprueba que el habito exista y sea del usuario, o lanza 404.
 * La usan tambien registros y recordatorios antes de escribir.
 */
export const verificarHabitoPropio = async (idUsuario: number, idHabito: number): Promise<void> => {
  const r = await pool.query('SELECT 1 FROM habito WHERE id_habito = $1 AND id_usuario = $2', [idHabito, idUsuario]);
  if (r.rowCount === 0) throw noEncontrado();
};

export const listarHabitos = async (idUsuario: number): Promise<Habito[]> => {
  const r = await pool.query<Habito>(
    'SELECT * FROM habito WHERE id_usuario = $1 ORDER BY fecha_adopcion DESC, id_habito DESC',
    [idUsuario]
  );
  return r.rows;
};

/**
 * Crea un habito propio o adopta una plantilla del catalogo (RF-06).
 *
 * Reglas al adoptar:
 *  - La plantilla tiene que existir: si no, 400 en id_plantilla (antes
 *    la clave foranea fallaba con 500).
 *  - Tiene que estar ACTIVA: una plantilla desactivada por el admin ya
 *    no aparece en el catalogo y no se puede adoptar (409).
 *  - No se puede adoptar dos veces: lo impide el UNIQUE
 *    (id_usuario, id_plantilla) de la base, y su error 23505 se
 *    traduce a 409 (antes era 500).
 */
export const crearHabito = async (idUsuario: number, datos: DatosCrearHabito): Promise<Habito> => {
  const idPlantilla = datos.id_plantilla ?? null;

  if (idPlantilla !== null) {
    const p = await pool.query<{ activa: boolean }>(
      'SELECT activa FROM plantilla_habito WHERE id_plantilla = $1',
      [idPlantilla]
    );
    if (p.rowCount === 0) throw errorDeCampo('id_plantilla', 'La plantilla indicada no existe');
    if (!p.rows[0].activa) {
      throw new ErrorHttp(409, 'La plantilla está desactivada y no se puede adoptar');
    }
  }

  try {
    const r = await pool.query<Habito>(
      `INSERT INTO habito (id_usuario, id_plantilla, nombre, frecuencia, meta, horario_objetivo, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        idUsuario,
        idPlantilla,
        datos.nombre,
        datos.frecuencia,
        datos.meta ?? null,
        datos.horario_objetivo ?? null,
        datos.activo ?? true,
      ]
    );
    return r.rows[0];
  } catch (error) {
    if (esErrorPg(error, PG_UNIQUE)) throw new ErrorHttp(409, 'Ya adoptaste esta plantilla');
    // La plantilla se borro entre la comprobacion y el INSERT.
    if (esErrorPg(error, PG_FOREIGN_KEY)) throw errorDeCampo('id_plantilla', 'La plantilla indicada no existe');
    throw error;
  }
};

/** PUT parcial: un PUT sin "activo" ya no deja NULL en la columna. */
export const actualizarHabito = async (
  idUsuario: number,
  idHabito: number,
  datos: DatosActualizarHabito
): Promise<Habito> => {
  const set = setParcial(datos, COLUMNAS_EDITABLES, 3);
  const r = await pool.query<Habito>(
    `UPDATE habito SET ${set.sql}
     WHERE id_habito = $1 AND id_usuario = $2
     RETURNING *`,
    [idHabito, idUsuario, ...set.valores]
  );
  if (r.rowCount === 0) throw noEncontrado();
  return r.rows[0];
};

export const eliminarHabito = async (idUsuario: number, idHabito: number): Promise<void> => {
  const r = await pool.query('DELETE FROM habito WHERE id_habito = $1 AND id_usuario = $2', [idHabito, idUsuario]);
  if (r.rowCount === 0) throw noEncontrado();
};

/**
 * Traduce los errores de la base al guardar un cumplimiento. Lo usan
 * el check-in y el CRUD de registros.
 */
export const traducirErrorRegistro = (error: unknown): unknown => {
  if (esErrorPg(error, PG_UNIQUE)) {
    return new ErrorHttp(409, 'Ya registraste este hábito en esa fecha');
  }
  // CHECK chk_registro_fecha_no_futura
  if (esErrorPg(error, PG_CHECK)) {
    return errorDeCampo('fecha', 'La fecha no puede ser futura');
  }
  return error;
};

/** Check-in de un toque (RF-03): registra el cumplimiento de una fecha. */
export const marcarCumplimiento = async (idUsuario: number, idHabito: number, fecha: string): Promise<Registro> => {
  await verificarHabitoPropio(idUsuario, idHabito);
  try {
    const r = await pool.query<Registro>(
      'INSERT INTO registro_cumplimiento (id_habito, fecha) VALUES ($1, $2) RETURNING *',
      [idHabito, fecha]
    );
    return r.rows[0];
  } catch (error) {
    throw traducirErrorRegistro(error);
  }
};
