import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';
import { setParcial } from '../utils/pg';
import { traducirErrorRegistro, verificarHabitoPropio } from './habitos.service';
import type { Registro } from './habitos.service';
import type { DatosCrearRegistro, DatosActualizarRegistro } from '../schemas/registros.schema';

/**
 * Capa de servicios de registros de cumplimiento (RF-03). Un registro
 * pertenece al usuario a traves de su habito, asi que todas las
 * consultas cruzan con habito.id_usuario.
 */

const noEncontrado = () => new ErrorHttp(404, 'Registro no encontrado o no pertenece al usuario');

export const listarRegistros = async (idUsuario: number): Promise<Registro[]> => {
  const r = await pool.query<Registro>(
    `SELECT r.*
     FROM registro_cumplimiento r
     JOIN habito h ON h.id_habito = r.id_habito
     WHERE h.id_usuario = $1
     ORDER BY r.fecha DESC, r.id_registro DESC`,
    [idUsuario]
  );
  return r.rows;
};

export const crearRegistro = async (idUsuario: number, datos: DatosCrearRegistro): Promise<Registro> => {
  await verificarHabitoPropio(idUsuario, datos.id_habito);
  try {
    const r = await pool.query<Registro>(
      'INSERT INTO registro_cumplimiento (id_habito, fecha) VALUES ($1, $2) RETURNING *',
      [datos.id_habito, datos.fecha]
    );
    return r.rows[0];
  } catch (error) {
    throw traducirErrorRegistro(error);
  }
};

export const actualizarRegistro = async (
  idUsuario: number,
  idRegistro: number,
  datos: DatosActualizarRegistro
): Promise<Registro> => {
  // Si el registro se mueve a otro habito, ese habito tambien tiene
  // que ser del usuario.
  if (datos.id_habito !== undefined) await verificarHabitoPropio(idUsuario, datos.id_habito);

  const set = setParcial(datos, ['id_habito', 'fecha'], 3);
  try {
    const r = await pool.query<Registro>(
      `UPDATE registro_cumplimiento SET ${set.sql}
       WHERE id_registro = $1
         AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $2)
       RETURNING *`,
      [idRegistro, idUsuario, ...set.valores]
    );
    if (r.rowCount === 0) throw noEncontrado();
    return r.rows[0];
  } catch (error) {
    throw traducirErrorRegistro(error);
  }
};

export const eliminarRegistro = async (idUsuario: number, idRegistro: number): Promise<void> => {
  const r = await pool.query(
    `DELETE FROM registro_cumplimiento
     WHERE id_registro = $1
       AND id_habito IN (SELECT id_habito FROM habito WHERE id_usuario = $2)`,
    [idRegistro, idUsuario]
  );
  if (r.rowCount === 0) throw noEncontrado();
};
