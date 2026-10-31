import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';
import type {
  DatosCrearPlantilla,
  DatosActualizarPlantilla,
  DatosCrearCategoria,
  DatosActualizarCategoria,
  FiltroCatalogo,
} from '../schemas/admin.schema';

/**
 * Capa de servicios del Rol D: plantillas, categorias, metricas y
 * catalogo. Aqui viven las consultas SQL (todas parametrizadas con
 * $1, $2...) y las reglas de negocio. No sabe que existe HTTP: si
 * algo sale mal lanza un ErrorHttp y el middleware de errores de B
 * arma la respuesta.
 */

// Forma de una plantilla tal como se devuelve al cliente. 
export interface PlantillaAdmin {
  id_plantilla: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  dificultad: 'baja' | 'media' | 'alta';
  frecuencia_sugerida: 'diaria' | 'semanal';
  activa: boolean;
  usuarios_activos: number;
}

// Codigos de error de PostgreSQL que se traducen a mensajes utiles.
const PG_UNIQUE = '23505';
const PG_FOREIGN_KEY = '23503';

const esErrorPg = (error: unknown, codigo: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error &&
  (error as { code: string }).code === codigo;

// Consulta base de plantillas. usuarios_activos cuenta cuantos
// habitos adoptaron la plantilla: es lo que decide si se puede
// eliminar (RF-07) y lo que el front muestra como "En uso por N".
const SELECT_PLANTILLAS = `
  SELECT p.id_plantilla,
         p.id_categoria,
         c.nombre AS categoria,
         p.nombre,
         p.descripcion,
         p.dificultad,
         p.frecuencia_sugerida,
         p.activa,
         COUNT(h.id_habito)::int AS usuarios_activos
  FROM plantilla_habito p
  JOIN categoria c ON c.id_categoria = p.id_categoria
  LEFT JOIN habito h ON h.id_plantilla = p.id_plantilla
`;
const GROUP_PLANTILLAS = `GROUP BY p.id_plantilla, c.nombre`;


// PLANTILLAS (RF-07)

export const listarPlantillas = async (): Promise<PlantillaAdmin[]> => {
  const r = await pool.query<PlantillaAdmin>(
    `${SELECT_PLANTILLAS} ${GROUP_PLANTILLAS} ORDER BY p.id_plantilla`
  );
  return r.rows;
};

export const obtenerPlantilla = async (id: number): Promise<PlantillaAdmin> => {
  const r = await pool.query<PlantillaAdmin>(
    `${SELECT_PLANTILLAS} WHERE p.id_plantilla = $1 ${GROUP_PLANTILLAS}`,
    [id]
  );
  if (r.rows.length === 0) {
    throw new ErrorHttp(404, 'La plantilla no existe');
  }
  return r.rows[0];
};

// Comprueba que la categoria exista. Sin esto, una categoria
// inexistente dispararia el error 23503 de clave foranea, cuyo
// mensaje generico ("registro en uso") confundiria al admin.
const exigirCategoria = async (id: number): Promise<void> => {
  const r = await pool.query('SELECT 1 FROM categoria WHERE id_categoria = $1', [id]);
  if (r.rowCount === 0) {
    throw new ErrorHttp(400, 'La categoria indicada no existe');
  }
};

export const crearPlantilla = async (datos: DatosCrearPlantilla): Promise<PlantillaAdmin> => {
  await exigirCategoria(datos.id_categoria);

  try {
    const r = await pool.query<{ id_plantilla: number }>(
      `INSERT INTO plantilla_habito
         (id_categoria, nombre, descripcion, dificultad, frecuencia_sugerida, activa)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_plantilla`,
      [
        datos.id_categoria,
        datos.nombre,
        datos.descripcion ?? null,
        datos.dificultad,
        datos.frecuencia_sugerida,
        datos.activa ?? true,
      ]
    );
    return obtenerPlantilla(r.rows[0].id_plantilla);
  } catch (error) {
    if (esErrorPg(error, PG_UNIQUE)) {
      throw new ErrorHttp(409, 'Ya existe una plantilla con ese nombre');
    }
    throw error;
  }
};

export const actualizarPlantilla = async (
  id: number,
  datos: DatosActualizarPlantilla
): Promise<PlantillaAdmin> => {
  if (datos.id_categoria !== undefined) {
    await exigirCategoria(datos.id_categoria);
  }

  try {
    // COALESCE($n, columna): si el campo no vino (null), la columna
    // conserva su valor. Asi un PUT parcial como { activa: false }
    // no pisa el resto de los datos.
    const r = await pool.query(
      `UPDATE plantilla_habito
       SET id_categoria        = COALESCE($1, id_categoria),
           nombre              = COALESCE($2, nombre),
           descripcion         = COALESCE($3, descripcion),
           dificultad          = COALESCE($4, dificultad),
           frecuencia_sugerida = COALESCE($5, frecuencia_sugerida),
           activa              = COALESCE($6, activa)
       WHERE id_plantilla = $7`,
      [
        datos.id_categoria ?? null,
        datos.nombre ?? null,
        datos.descripcion ?? null,
        datos.dificultad ?? null,
        datos.frecuencia_sugerida ?? null,
        datos.activa ?? null,
        id,
      ]
    );
    if (r.rowCount === 0) {
      throw new ErrorHttp(404, 'La plantilla no existe');
    }
    return obtenerPlantilla(id);
  } catch (error) {
    if (esErrorPg(error, PG_UNIQUE)) {
      throw new ErrorHttp(409, 'Ya existe una plantilla con ese nombre');
    }
    throw error;
  }
};

/**
 * RF-07: una plantilla adoptada por al menos un usuario NO se
 * elimina; solo se puede desactivar (activa = false).
 *
 * La regla esta en dos capas a proposito:
 *  1. Aqui, con un COUNT previo, para responder con un mensaje claro
 *     que dice cuantos usuarios la tienen.
 *  2. En la base, con ON DELETE RESTRICT en habito.id_plantilla. Si
 *     alguien adopta la plantilla justo entre el COUNT y el DELETE,
 *     PostgreSQL igual rechaza el borrado (23503) y se captura abajo.
 */
export const eliminarPlantilla = async (id: number): Promise<void> => {
  const existe = await pool.query('SELECT 1 FROM plantilla_habito WHERE id_plantilla = $1', [id]);
  if (existe.rowCount === 0) {
    throw new ErrorHttp(404, 'La plantilla no existe');
  }

  const uso = await pool.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM habito WHERE id_plantilla = $1',
    [id]
  );
  const total = uso.rows[0].total;
  if (total > 0) {
    throw new ErrorHttp(
      409,
      `La plantilla esta adoptada por ${total} usuario(s) y no puede eliminarse; solo puede desactivarse.`
    );
  }

  try {
    await pool.query('DELETE FROM plantilla_habito WHERE id_plantilla = $1', [id]);
  } catch (error) {
    if (esErrorPg(error, PG_FOREIGN_KEY)) {
      throw new ErrorHttp(
        409,
        'La plantilla esta adoptada por al menos un usuario y no puede eliminarse; solo puede desactivarse.'
      );
    }
    throw error;
  }
};


// CATEGORIAS (RF-08)

export interface CategoriaAdmin {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  total_plantillas: number;
}

const SELECT_CATEGORIAS = `
  SELECT c.id_categoria,
         c.nombre,
         c.descripcion,
         COUNT(p.id_plantilla)::int AS total_plantillas
  FROM categoria c
  LEFT JOIN plantilla_habito p ON p.id_categoria = c.id_categoria
`;
const GROUP_CATEGORIAS = `GROUP BY c.id_categoria`;

export const listarCategorias = async (): Promise<CategoriaAdmin[]> => {
  const r = await pool.query<CategoriaAdmin>(
    `${SELECT_CATEGORIAS} ${GROUP_CATEGORIAS} ORDER BY c.id_categoria`
  );
  return r.rows;
};

const obtenerCategoria = async (id: number): Promise<CategoriaAdmin> => {
  const r = await pool.query<CategoriaAdmin>(
    `${SELECT_CATEGORIAS} WHERE c.id_categoria = $1 ${GROUP_CATEGORIAS}`,
    [id]
  );
  if (r.rows.length === 0) {
    throw new ErrorHttp(404, 'La categoria no existe');
  }
  return r.rows[0];
};

export const crearCategoria = async (datos: DatosCrearCategoria): Promise<CategoriaAdmin> => {
  try {
    const r = await pool.query<{ id_categoria: number }>(
      `INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING id_categoria`,
      [datos.nombre, datos.descripcion ?? null]
    );
    return obtenerCategoria(r.rows[0].id_categoria);
  } catch (error) {
    if (esErrorPg(error, PG_UNIQUE)) {
      throw new ErrorHttp(409, 'Ya existe una categoria con ese nombre');
    }
    throw error;
  }
};

export const actualizarCategoria = async (
  id: number,
  datos: DatosActualizarCategoria
): Promise<CategoriaAdmin> => {
  try {
    const r = await pool.query(
      `UPDATE categoria
       SET nombre      = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion)
       WHERE id_categoria = $3`,
      [datos.nombre ?? null, datos.descripcion ?? null, id]
    );
    if (r.rowCount === 0) {
      throw new ErrorHttp(404, 'La categoria no existe');
    }
    return obtenerCategoria(id);
  } catch (error) {
    if (esErrorPg(error, PG_UNIQUE)) {
      throw new ErrorHttp(409, 'Ya existe una categoria con ese nombre');
    }
    throw error;
  }
};

/**
 * Una categoria con plantillas no se elimina (ON DELETE RESTRICT en
 * plantilla_habito.id_categoria): el admin debe reasignarlas antes.
 */
export const eliminarCategoria = async (id: number): Promise<void> => {
  const existe = await pool.query('SELECT 1 FROM categoria WHERE id_categoria = $1', [id]);
  if (existe.rowCount === 0) {
    throw new ErrorHttp(404, 'La categoria no existe');
  }

  const uso = await pool.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM plantilla_habito WHERE id_categoria = $1',
    [id]
  );
  const total = uso.rows[0].total;
  if (total > 0) {
    throw new ErrorHttp(
      409,
      `La categoria tiene ${total} plantilla(s) asociada(s); reasignalas o eliminalas antes de borrarla.`
    );
  }

  try {
    await pool.query('DELETE FROM categoria WHERE id_categoria = $1', [id]);
  } catch (error) {
    if (esErrorPg(error, PG_FOREIGN_KEY)) {
      throw new ErrorHttp(409, 'La categoria tiene plantillas asociadas y no puede eliminarse.');
    }
    throw error;
  }
};


// METRICAS (RF-08): solo agregados, nunca datos de una persona


export interface Metricas {
  total_usuarios: number;
  habitos_activos: number;
  plantillas_totales: number;
  plantillas_activas: number;
  cumplimientos_ultimos_7_dias: number;
  cumplimientos_ultimos_30_dias: number;
  adopciones_por_plantilla: { id_plantilla: number; nombre: string; adopciones: number }[];
  cumplimientos_por_categoria: { categoria: string; cumplimientos: number }[];
}

export const obtenerMetricas = async (): Promise<Metricas> => {
  // Ninguna consulta devuelve nombres, correos ni ids de usuario:
  // todo son conteos. Se ejecutan en paralelo porque son
  // independientes entre si.
  const [totales, adopciones, porCategoria] = await Promise.all([
    pool.query<{
      total_usuarios: number;
      habitos_activos: number;
      plantillas_totales: number;
      plantillas_activas: number;
      cumplimientos_ultimos_7_dias: number;
      cumplimientos_ultimos_30_dias: number;
    }>(
      `SELECT
         (SELECT COUNT(*)::int FROM usuario WHERE rol = 'usuario')            AS total_usuarios,
         (SELECT COUNT(*)::int FROM habito WHERE activo = TRUE)               AS habitos_activos,
         (SELECT COUNT(*)::int FROM plantilla_habito)                         AS plantillas_totales,
         (SELECT COUNT(*)::int FROM plantilla_habito WHERE activa = TRUE)     AS plantillas_activas,
         (SELECT COUNT(*)::int FROM registro_cumplimiento
            WHERE fecha > CURRENT_DATE - 7)                                   AS cumplimientos_ultimos_7_dias,
         (SELECT COUNT(*)::int FROM registro_cumplimiento
            WHERE fecha > CURRENT_DATE - 30)                                  AS cumplimientos_ultimos_30_dias`
    ),
    pool.query<{ id_plantilla: number; nombre: string; adopciones: number }>(
      `SELECT p.id_plantilla, p.nombre, COUNT(h.id_habito)::int AS adopciones
       FROM plantilla_habito p
       LEFT JOIN habito h ON h.id_plantilla = p.id_plantilla
       GROUP BY p.id_plantilla, p.nombre
       ORDER BY adopciones DESC, p.nombre`
    ),
    // Cumplimientos de los ultimos 30 dias agrupados por categoria.
    // Los habitos propios (id_plantilla NULL) no pertenecen a
    // ninguna categoria, por eso no aparecen aqui.
    pool.query<{ categoria: string; cumplimientos: number }>(
      `SELECT c.nombre AS categoria, COUNT(r.id_registro)::int AS cumplimientos
       FROM categoria c
       LEFT JOIN plantilla_habito p ON p.id_categoria = c.id_categoria
       LEFT JOIN habito h ON h.id_plantilla = p.id_plantilla
       LEFT JOIN registro_cumplimiento r
              ON r.id_habito = h.id_habito AND r.fecha > CURRENT_DATE - 30
       GROUP BY c.id_categoria, c.nombre
       ORDER BY cumplimientos DESC, c.nombre`
    ),
  ]);

  return {
    ...totales.rows[0],
    adopciones_por_plantilla: adopciones.rows,
    cumplimientos_por_categoria: porCategoria.rows,
  };
};


// CATALOGO (RF-06): lo que ve el usuario normal

export interface PlantillaCatalogo {
  id_plantilla: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  dificultad: 'baja' | 'media' | 'alta';
  frecuencia_sugerida: 'diaria' | 'semanal';
  ya_adoptada: boolean;
}

/**
 * Lista las plantillas ACTIVAS, con filtros opcionales por categoria
 * y dificultad. Los filtros van como parametros: si no vienen, el
 * "$n IS NULL" deja pasar todas las filas, asi se usa una sola
 * consulta fija en vez de armar el WHERE concatenando texto.
 *
 * ya_adoptada indica si el usuario que consulta ya tiene esa
 * plantilla, para que la pantalla muestre "Ya la tienes" en vez de
 * "Agregar". Se calcula con el id del token, nunca con uno enviado
 * por el cliente.
 */
export const listarCatalogo = async (
  filtro: FiltroCatalogo,
  idUsuario: number
): Promise<PlantillaCatalogo[]> => {
  // categoria puede ser el id ("2") o el nombre ("Ejercicio").
  const texto = filtro.categoria ?? null;
  const esId = texto !== null && /^\d+$/.test(texto);
  const idCategoria = esId ? Number(texto) : null;
  const nombreCategoria = texto !== null && !esId ? texto : null;

  const r = await pool.query<PlantillaCatalogo>(
    `SELECT p.id_plantilla,
            p.id_categoria,
            c.nombre AS categoria,
            p.nombre,
            p.descripcion,
            p.dificultad,
            p.frecuencia_sugerida,
            EXISTS (
              SELECT 1 FROM habito h
              WHERE h.id_plantilla = p.id_plantilla AND h.id_usuario = $4
            ) AS ya_adoptada
     FROM plantilla_habito p
     JOIN categoria c ON c.id_categoria = p.id_categoria
     WHERE p.activa = TRUE
       AND ($1::int  IS NULL OR p.id_categoria = $1)
       AND ($2::text IS NULL OR LOWER(c.nombre) = LOWER($2))
       AND ($3::text IS NULL OR p.dificultad = $3)
     ORDER BY c.nombre, p.nombre`,
    [idCategoria, nombreCategoria, filtro.dificultad ?? null, idUsuario]
  );
  return r.rows;
};
