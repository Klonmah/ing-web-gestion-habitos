// Panel de progreso (RF-04): porcentaje de cumplimiento semanal y mensual
// por habito y por categoria.
//
// GET /api/progreso devuelve, por habito, la racha y las fechas cumplidas
// en el periodo, pero no el porcentaje. Aqui se calcula con esta regla:
//   - habito diario:  se espera 1 cumplimiento por dia del periodo
//   - habito semanal: se espera 1 cumplimiento por semana del periodo
//   - solo cuentan los dias desde que se adopto el habito (un habito
//     adoptado ayer no puede tener 2/7 = 29% por los dias anteriores)
//   - porcentaje = cumplidos / esperados, con tope en 100%
// La categoria sale de la plantilla de origen (via /api/catalogo); los
// habitos creados sin plantilla quedan en "Personalizados".

import { api } from './api';
import { listarCatalogo } from './adminService';
import { aFechaLocal, hoy } from '../utils/fechas';

export type Periodo = 'semanal' | 'mensual';

export const DIAS_PERIODO: Record<Periodo, number> = { semanal: 7, mensual: 30 };

export const SIN_PLANTILLA = 'Personalizados';
export const SIN_CATEGORIA = 'Sin categoría';

export interface ProgresoHabito {
  id: number;
  nombre: string;
  frecuencia: 'diaria' | 'semanal';
  categoria: string;
  racha: number;
  cumplidos: number;
  esperados: number;
  porcentaje: number; // 0-100
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
  porcentajeGeneral: number;
  habitos: ProgresoHabito[];
  categorias: ProgresoCategoria[];
}

interface ProgresoApi {
  periodo: Periodo;
  progreso: {
    id_habito: number;
    nombre: string;
    frecuencia: 'diaria' | 'semanal';
    racha_actual: number;
    cumplimientos_periodo: string[];
  }[];
}

interface HabitoApi {
  id_habito: number;
  id_plantilla: number | null;
  fecha_adopcion: string;
}

// Dias entre dos fechas AAAA-MM-DD (b - a).
const diasEntre = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const porcentaje = (cumplidos: number, esperados: number): number =>
  esperados > 0 ? Math.round((Math.min(cumplidos, esperados) / esperados) * 100) : 0;

/** Cumplimientos esperados de un habito en el periodo (regla de arriba). */
export const esperadosEnPeriodo = (
  frecuencia: 'diaria' | 'semanal',
  periodo: Periodo,
  fechaAdopcion: string,
  fechaHoy: string = hoy()
): number => {
  const diasActivo = Math.max(1, diasEntre(fechaAdopcion, fechaHoy) + 1);
  const dias = Math.min(DIAS_PERIODO[periodo], diasActivo);
  return frecuencia === 'diaria' ? dias : Math.max(1, Math.round(dias / 7));
};

export const obtenerProgreso = async (periodo: Periodo): Promise<ResumenProgreso> => {
  const [{ progreso }, habitos, catalogo] = await Promise.all([
    api<ProgresoApi>(`/progreso?periodo=${periodo}`),
    api<HabitoApi[]>('/habitos'),
    listarCatalogo(),
  ]);

  const habitoPorId = new Map(habitos.map((h) => [h.id_habito, h]));
  const categoriaPorPlantilla = new Map(catalogo.map((p) => [p.id_plantilla, p.categoria]));
  const fechaHoy = hoy();

  const filas: ProgresoHabito[] = progreso.map((p) => {
    const h = habitoPorId.get(p.id_habito);
    const categoria = !h?.id_plantilla
      ? SIN_PLANTILLA
      : categoriaPorPlantilla.get(h.id_plantilla) ?? SIN_CATEGORIA; // plantilla ya inactiva
    const esperados = esperadosEnPeriodo(
      p.frecuencia, periodo, h ? aFechaLocal(h.fecha_adopcion) : fechaHoy, fechaHoy
    );
    const cumplidos = p.cumplimientos_periodo.length;
    return {
      id: p.id_habito,
      nombre: p.nombre,
      frecuencia: p.frecuencia,
      categoria,
      racha: p.racha_actual,
      cumplidos,
      esperados,
      porcentaje: porcentaje(cumplidos, esperados),
    };
  });

  // Por categoria: se suman cumplidos (con tope por habito) y esperados.
  const grupos = new Map<string, ProgresoCategoria>();
  for (const f of filas) {
    const g = grupos.get(f.categoria) ?? { categoria: f.categoria, habitos: 0, cumplidos: 0, esperados: 0, porcentaje: 0 };
    g.habitos += 1;
    g.cumplidos += Math.min(f.cumplidos, f.esperados);
    g.esperados += f.esperados;
    grupos.set(f.categoria, g);
  }
  const categorias = [...grupos.values()]
    .map((g) => ({ ...g, porcentaje: porcentaje(g.cumplidos, g.esperados) }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));

  const total = categorias.reduce((acc, g) => ({ c: acc.c + g.cumplidos, e: acc.e + g.esperados }), { c: 0, e: 0 });

  return {
    periodo,
    porcentajeGeneral: porcentaje(total.c, total.e),
    habitos: filas.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    categorias,
  };
};
