import { pool } from '../config/db';
import type { Periodo } from '../schemas/progreso.schema';

/**
 * Capa de servicios del panel de progreso (RF-04).
 *
 * Calcula, para cada habito activo del usuario, la racha actual y el
 * porcentaje de cumplimiento del periodo, y lo agrupa por categoria.
 * Esta logica antes vivia en el frontend; ahora queda en el servidor y
 * el front solo la muestra.
 *
 * Regla del porcentaje:
 *  - habito diario:  se espera 1 cumplimiento por dia del periodo.
 *  - habito semanal: se espera 1 cumplimiento por semana del periodo
 *    (redondeado, minimo 1).
 *  - Solo cuentan los dias desde que se adopto el habito: uno adoptado
 *    ayer no puede quedar en 2/7 = 29% por los dias anteriores.
 *  - porcentaje = cumplidos / esperados, con tope en 100.
 *  - Por categoria y en total se suman los cumplidos (con tope por
 *    habito) y los esperados, y se calcula el porcentaje de la suma.
 *
 * Las fechas (hoy, inicio del periodo, dias desde la adopcion) las
 * calcula PostgreSQL con CURRENT_DATE, para no depender de la zona
 * horaria del proceso de Node.
 */

export const DIAS_PERIODO: Record<Periodo, number> = { semanal: 7, mensual: 30 };

// Categoria de los habitos creados sin plantilla del catalogo.
export const SIN_PLANTILLA = 'Personalizados';

export interface ProgresoHabito {
  id_habito: number;
  nombre: string;
  frecuencia: 'diaria' | 'semanal';
  id_plantilla: number | null;
  categoria: string;
  fecha_adopcion: string;
  racha_actual: number;
  cumplimientos_periodo: string[];
  cumplidos: number;
  esperados: number;
  porcentaje: number;
}

export interface ProgresoCategoria {
  categoria: string;
  habitos: number;
  cumplidos: number;
  esperados: number;
  porcentaje: number;
}

export interface ResumenProgreso {
  periodo: Periodo;
  fecha_inicio: string;
  fecha_fin: string;
  porcentaje_general: number;
  categorias: ProgresoCategoria[];
  progreso: ProgresoHabito[];
}

interface FilaHabito {
  id_habito: number;
  nombre: string;
  frecuencia: 'diaria' | 'semanal';
  id_plantilla: number | null;
  categoria: string | null;
  fecha_adopcion: string;
  dias_activo: number;
}

const calcularPorcentaje = (cumplidos: number, esperados: number): number =>
  esperados > 0 ? Math.round((Math.min(cumplidos, esperados) / esperados) * 100) : 0;

/** Cumplimientos esperados de un habito en el periodo (regla de arriba). */
export const esperadosEnPeriodo = (
  frecuencia: 'diaria' | 'semanal',
  periodo: Periodo,
  diasActivo: number
): number => {
  const dias = Math.min(DIAS_PERIODO[periodo], Math.max(1, diasActivo));
  return frecuencia === 'diaria' ? dias : Math.max(1, Math.round(dias / 7));
};

/** Dia anterior a una fecha AAAA-MM-DD (en UTC, sin efecto de zona horaria). */
const diaAnterior = (fecha: string): string => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Racha actual: dias seguidos con cumplimiento, contando hacia atras
 * desde hoy, o desde ayer si hoy todavia no se marco (la racha no se
 * rompe hasta que termina el dia). "fechas" viene sin repetidos.
 */
const calcularRacha = (fechas: Set<string>, hoy: string): number => {
  let dia = fechas.has(hoy) ? hoy : diaAnterior(hoy);
  let racha = 0;
  while (fechas.has(dia)) {
    racha++;
    dia = diaAnterior(dia);
  }
  return racha;
};

export const obtenerProgreso = async (idUsuario: number, periodo: Periodo): Promise<ResumenProgreso> => {
  const dias = DIAS_PERIODO[periodo];

  const fechasResult = await pool.query<{ hoy: string; inicio: string }>(
    'SELECT CURRENT_DATE::text AS hoy, (CURRENT_DATE - $1::int)::text AS inicio',
    [dias - 1]
  );
  const { hoy, inicio } = fechasResult.rows[0];

  // Habitos activos con la categoria de su plantilla de origen. El
  // LEFT JOIN no filtra por plantilla activa: si el admin desactiva una
  // plantilla, los que ya la adoptaron siguen viendo su categoria.
  const habitosResult = await pool.query<FilaHabito>(
    `SELECT h.id_habito, h.nombre, h.frecuencia, h.id_plantilla,
            c.nombre AS categoria,
            h.fecha_adopcion::text AS fecha_adopcion,
            (CURRENT_DATE - h.fecha_adopcion) + 1 AS dias_activo
     FROM habito h
     LEFT JOIN plantilla_habito p ON p.id_plantilla = h.id_plantilla
     LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
     WHERE h.id_usuario = $1 AND h.activo = TRUE
     ORDER BY h.nombre ASC, h.id_habito ASC`,
    [idUsuario]
  );

  // Historial completo (hace falta para la racha, que puede ser mas
  // larga que el periodo).
  const registrosResult = await pool.query<{ id_habito: number; fecha: string }>(
    `SELECT r.id_habito, r.fecha::text AS fecha
     FROM registro_cumplimiento r
     JOIN habito h ON h.id_habito = r.id_habito
     WHERE h.id_usuario = $1
     ORDER BY r.fecha DESC`,
    [idUsuario]
  );

  const fechasPorHabito = new Map<number, string[]>();
  for (const r of registrosResult.rows) {
    const lista = fechasPorHabito.get(r.id_habito) ?? [];
    lista.push(r.fecha);
    fechasPorHabito.set(r.id_habito, lista);
  }

  const progreso: ProgresoHabito[] = habitosResult.rows.map((h) => {
    const fechas = fechasPorHabito.get(h.id_habito) ?? [];
    const cumplimientosPeriodo = fechas.filter((f) => f >= inicio && f <= hoy);
    const esperados = esperadosEnPeriodo(h.frecuencia, periodo, Number(h.dias_activo));
    const cumplidos = cumplimientosPeriodo.length;
    return {
      id_habito: h.id_habito,
      nombre: h.nombre,
      frecuencia: h.frecuencia,
      id_plantilla: h.id_plantilla,
      categoria: h.categoria ?? SIN_PLANTILLA,
      fecha_adopcion: h.fecha_adopcion,
      racha_actual: calcularRacha(new Set(fechas), hoy),
      cumplimientos_periodo: cumplimientosPeriodo,
      cumplidos,
      esperados,
      porcentaje: calcularPorcentaje(cumplidos, esperados),
    };
  });

  const grupos = new Map<string, ProgresoCategoria>();
  for (const p of progreso) {
    const g = grupos.get(p.categoria) ?? { categoria: p.categoria, habitos: 0, cumplidos: 0, esperados: 0, porcentaje: 0 };
    g.habitos += 1;
    g.cumplidos += Math.min(p.cumplidos, p.esperados);
    g.esperados += p.esperados;
    grupos.set(p.categoria, g);
  }
  const categorias = [...grupos.values()]
    .map((g) => ({ ...g, porcentaje: calcularPorcentaje(g.cumplidos, g.esperados) }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria, 'es'));

  const totalCumplidos = categorias.reduce((s, g) => s + g.cumplidos, 0);
  const totalEsperados = categorias.reduce((s, g) => s + g.esperados, 0);

  return {
    periodo,
    fecha_inicio: inicio,
    fecha_fin: hoy,
    porcentaje_general: calcularPorcentaje(totalCumplidos, totalEsperados),
    categorias,
    progreso,
  };
};
