import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';
import { setParcial } from '../utils/pg';
import type { DatosCrearTarea, DatosActualizarTarea } from '../schemas/tareas.schema';

/**
 * Capa de servicios de tareas (RF-01). Aqui viven las consultas SQL
 * (parametrizadas) y las reglas; el controlador solo lee el request.
 * Todas las consultas filtran por el id del usuario del token.
 */

export interface Tarea {
  id_tarea: number;
  id_usuario: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string;
  prioridad: 'alta' | 'media' | 'baja';
  completada: boolean;
  fecha_creacion: string;
}

// Columnas que un PUT puede modificar (lista fija, nunca del body).
const COLUMNAS_EDITABLES = ['titulo', 'descripcion', 'fecha_limite', 'prioridad', 'completada'] as const;

const noEncontrada = () => new ErrorHttp(404, 'Tarea no encontrada o no pertenece al usuario');

export const listarTareas = async (idUsuario: number): Promise<Tarea[]> => {
  const r = await pool.query<Tarea>(
    'SELECT * FROM tarea WHERE id_usuario = $1 ORDER BY fecha_limite ASC, id_tarea ASC',
    [idUsuario]
  );
  return r.rows;
};

export const crearTarea = async (idUsuario: number, datos: DatosCrearTarea): Promise<Tarea> => {
  const r = await pool.query<Tarea>(
    `INSERT INTO tarea (id_usuario, titulo, descripcion, fecha_limite, prioridad, completada)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [idUsuario, datos.titulo, datos.descripcion ?? null, datos.fecha_limite, datos.prioridad, datos.completada ?? false]
  );
  return r.rows[0];
};

/**
 * PUT parcial: solo cambian las columnas que vienen en el body. Antes
 * el UPDATE escribia todas, y un PUT sin "completada" intentaba
 * guardar NULL en una columna NOT NULL (500).
 */
export const actualizarTarea = async (
  idUsuario: number,
  idTarea: number,
  datos: DatosActualizarTarea
): Promise<Tarea> => {
  const set = setParcial(datos, COLUMNAS_EDITABLES, 3);
  const r = await pool.query<Tarea>(
    `UPDATE tarea SET ${set.sql}
     WHERE id_tarea = $1 AND id_usuario = $2
     RETURNING *`,
    [idTarea, idUsuario, ...set.valores]
  );
  if (r.rowCount === 0) throw noEncontrada();
  return r.rows[0];
};

export const eliminarTarea = async (idUsuario: number, idTarea: number): Promise<void> => {
  const r = await pool.query('DELETE FROM tarea WHERE id_tarea = $1 AND id_usuario = $2', [idTarea, idUsuario]);
  if (r.rowCount === 0) throw noEncontrada();
};
