// Panel de progreso (RF-04): porcentaje de cumplimiento semanal y mensual
// por habito y por categoria.
//
// El calculo (esperados, cumplidos, porcentaje con tope en 100, categoria
// de la plantilla de origen y totales por categoria) lo hace el backend en
// GET /api/progreso. Aqui solo se adapta la respuesta a los nombres que usa
// la pantalla; no hay logica de negocio en el cliente.

import { api } from './api';

export type Periodo = 'semanal' | 'mensual';

// Solo para el texto explicativo de la pantalla.
export const DIAS_PERIODO: Record<Periodo, number> = { semanal: 7, mensual: 30 };

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
  porcentaje_general: number;
  categorias: ProgresoCategoria[];
  progreso: {
    id_habito: number;
    nombre: string;
    frecuencia: 'diaria' | 'semanal';
    categoria: string;
    racha_actual: number;
    cumplidos: number;
    esperados: number;
    porcentaje: number;
  }[];
}

export const obtenerProgreso = async (periodo: Periodo): Promise<ResumenProgreso> => {
  const datos = await api<ProgresoApi>(`/progreso?periodo=${periodo}`);
  return {
    periodo: datos.periodo,
    porcentajeGeneral: datos.porcentaje_general,
    categorias: datos.categorias,
    habitos: datos.progreso.map((p) => ({
      id: p.id_habito,
      nombre: p.nombre,
      frecuencia: p.frecuencia,
      categoria: p.categoria,
      racha: p.racha_actual,
      cumplidos: p.cumplidos,
      esperados: p.esperados,
      porcentaje: p.porcentaje,
    })),
  };
};
