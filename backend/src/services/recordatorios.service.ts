import { pool } from '../config/db';
import { ErrorHttp, errorDeCampo } from '../utils/ErrorHttp';
import { esErrorPg, PG_CHECK, PG_UNIQUE, setParcial } from '../utils/pg';
import { verificarHabitoPropio } from './habitos.service';
import type {
  DatosActualizarRecordatorio,
  DatosCrearRecordatorio,
  FiltroRecordatorios,
} from '../schemas/recordatorios.schema';

/**
 * Capa de servicios de recordatorios (RF-05). Un recordatorio dice que
 * dia de la semana (1 = lunes ... 7 = domingo) y a que hora avisar de
 * un habito. Pertenece al usuario a traves de su habito, asi que todas
 * las consultas cruzan con habito.id_usuario.
 */

export interface Recordatorio {
  id_recordatorio: number;
  id_habito: number;
  nombre_habito: string;
  dia_semana: number;
  hora: string; // HH:MM
  activo: boolean;
}

// Columnas devueltas al cliente (hora sin segundos).
const COLUMNAS = `r.id_recordatorio, r.id_habito, h.nombre AS nombre_habito,
                  r.dia_semana, to_char(r.hora, 'HH24:MI') AS hora, r.activo`;

const noEncontrado = () => new ErrorHttp(404, 'Recordatorio no encontrado o no pertenece al usuario');

const traducirError = (error: unknown): unknown => {
  if (esErrorPg(error, PG_UNIQUE)) {
    return new ErrorHttp(409, 'Ya existe un recordatorio para ese hábito el mismo día y hora');
  }
  if (esErrorPg(error, PG_CHECK)) {
    return errorDeCampo('dia_semana', 'dia_semana va de 1 (lunes) a 7 (domingo)');
  }
  return error;
};

const obtenerPorId = async (idUsuario: number, idRecordatorio: number): Promise<Recordatorio> => {
  const r = await pool.query<Recordatorio>(
    `SELECT ${COLUMNAS}
     FROM recordatorio r
     JOIN habito h ON h.id_habito = r.id_habito
     WHERE r.id_recordatorio = $1 AND h.id_usuario = $2`,
    [idRecordatorio, idUsuario]
  );
  if (r.rowCount === 0) throw noEncontrado();
  return r.rows[0];
};

export const listarRecordatorios = async (
  idUsuario: number,
  filtro: FiltroRecordatorios
): Promise<Recordatorio[]> => {
  const r = await pool.query<Recordatorio>(
    `SELECT ${COLUMNAS}
     FROM recordatorio r
     JOIN habito h ON h.id_habito = r.id_habito
     WHERE h.id_usuario = $1
       AND ($2::int IS NULL OR r.id_habito = $2)
     ORDER BY r.dia_semana ASC, r.hora ASC, r.id_recordatorio ASC`,
    [idUsuario, filtro.id_habito ?? null]
  );
  return r.rows;
};

export const crearRecordatorio = async (
  idUsuario: number,
  datos: DatosCrearRecordatorio
): Promise<Recordatorio> => {
  await verificarHabitoPropio(idUsuario, datos.id_habito);
  try {
    const r = await pool.query<{ id_recordatorio: number }>(
      `INSERT INTO recordatorio (id_habito, dia_semana, hora, activo)
       VALUES ($1, $2, $3, $4)
       RETURNING id_recordatorio`,
      [datos.id_habito, datos.dia_semana, datos.hora, datos.activo ?? true]
    );
    return obtenerPorId(idUsuario, r.rows[0].id_recordatorio);
  } catch (error) {
    throw traducirError(error);
  }
};

export const actualizarRecordatorio = async (
  idUsuario: number,
  idRecordatorio: number,
  datos: DatosActualizarRecordatorio
): Promise<Recordatorio> => {
  const set = setParcial(datos, ['dia_semana', 'hora', 'activo'], 3);
  try {
    const r = await pool.query(
      `UPDATE recordatorio SET ${set.sql}
       WHERE id_recordatorio = $1
         AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $2)`,
      [idRecordatorio, idUsuario, ...set.valores]
    );
    if (r.rowCount === 0) throw noEncontrado();
  } catch (error) {
    throw traducirError(error);
  }
  return obtenerPorId(idUsuario, idRecordatorio);
};

export const eliminarRecordatorio = async (idUsuario: number, idRecordatorio: number): Promise<void> => {
  const r = await pool.query(
    `DELETE FROM recordatorio
     WHERE id_recordatorio = $1
       AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $2)`,
    [idRecordatorio, idUsuario]
  );
  if (r.rowCount === 0) throw noEncontrado();
};
