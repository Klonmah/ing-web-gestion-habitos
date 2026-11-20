// Servicio de habitos del usuario (RF-02, RF-03).
//
// La pantalla de inicio necesita dos cosas que el backend entrega en
// endpoints distintos:
//   - GET /api/habitos            -> los habitos (nombre, meta, horario)
//   - GET /api/progreso?periodo=  -> la racha y los dias cumplidos
// Este servicio los junta en una sola lista lista para mostrar.

import { api } from './api';
import { aFechaLocal, hoy } from '../utils/fechas';

export type Frecuencia = 'diaria' | 'semanal';

/** Habito tal como lo muestra la pantalla de inicio. */
export interface HabitoHoy {
  id: number;
  nombre: string;
  meta: string | null;
  frecuencia: Frecuencia;
  horario: string | null; // HH:MM
  racha: number;
  completadoHoy: boolean;
}

// Formas que devuelve el backend (columnas de la BD).
interface HabitoApi {
  id_habito: number;
  nombre: string;
  frecuencia: Frecuencia;
  meta: string | null;
  horario_objetivo: string | null; // "22:00:00"
  activo: boolean;
}

interface ProgresoApi {
  periodo: 'semanal' | 'mensual';
  progreso: {
    id_habito: number;
    racha_actual: number;
    cumplimientos_periodo: string[]; // AAAA-MM-DD
  }[];
}

interface RegistroApi {
  id_registro: number;
  id_habito: number;
  fecha: string;
}

/** Habitos activos del usuario con su racha y si ya se cumplieron hoy. */
export const listarHabitosDeHoy = async (): Promise<HabitoHoy[]> => {
  const [habitos, { progreso }] = await Promise.all([
    api<HabitoApi[]>('/habitos'),
    api<ProgresoApi>('/progreso?periodo=semanal'),
  ]);

  const fechaHoy = hoy();
  const progresoPorHabito = new Map(progreso.map((p) => [p.id_habito, p]));

  return habitos
    .filter((h) => h.activo)
    .map((h) => {
      const p = progresoPorHabito.get(h.id_habito);
      return {
        id: h.id_habito,
        nombre: h.nombre,
        meta: h.meta,
        frecuencia: h.frecuencia,
        horario: h.horario_objetivo ? h.horario_objetivo.slice(0, 5) : null,
        racha: p?.racha_actual ?? 0,
        completadoHoy: p?.cumplimientos_periodo.includes(fechaHoy) ?? false,
      };
    });
};

/** Habito del usuario (para selectores y listados). */
export interface HabitoResumen {
  id: number;
  nombre: string;
  frecuencia: Frecuencia;
  activo: boolean;
}

/** Todos los habitos del usuario, activos primero y por nombre. */
export const listarMisHabitos = async (): Promise<HabitoResumen[]> => {
  const habitos = await api<HabitoApi[]>('/habitos');
  return habitos
    .map((h) => ({ id: h.id_habito, nombre: h.nombre, frecuencia: h.frecuencia, activo: h.activo }))
    .sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'));
};

/** Campos del formulario "Hábito nuevo". Meta y horario son opcionales. */
export interface DatosHabitoNuevo {
  nombre: string;
  frecuencia: Frecuencia;
  meta: string;
  horario: string; // HH:MM o ''
}

/**
 * Crea un habito propio, sin plantilla (RF-02). Las reglas de cada campo
 * las valida el backend; si algo falla responde 400 con el campo.
 */
export const crearHabito = async (datos: DatosHabitoNuevo): Promise<number> => {
  const creado = await api<HabitoApi>('/habitos', {
    metodo: 'POST',
    cuerpo: {
      nombre: datos.nombre.trim(),
      frecuencia: datos.frecuencia,
      meta: datos.meta.trim() || null,
      horario_objetivo: datos.horario || null,
    },
  });
  return creado.id_habito;
};

/** Datos minimos de una plantilla del catalogo para adoptarla. */
export interface PlantillaAdoptable {
  id_plantilla: number;
  nombre: string;
  frecuencia_sugerida: Frecuencia;
}

/**
 * Adopta una plantilla del catalogo (RF-06): crea un habito propio con
 * el nombre y la frecuencia sugerida de la plantilla.
 */
export const adoptarPlantilla = async (p: PlantillaAdoptable): Promise<void> => {
  await api('/habitos', {
    metodo: 'POST',
    cuerpo: { id_plantilla: p.id_plantilla, nombre: p.nombre, frecuencia: p.frecuencia_sugerida },
  });
};

/** Check-in de un toque (RNF-03): registra el cumplimiento de hoy. */
export const marcarCumplidoHoy = async (id: number): Promise<void> => {
  await api(`/habitos/${id}/cumplimientos`, {
    metodo: 'POST',
    cuerpo: { fecha: hoy() },
  });
};

/**
 * Deshace el check-in de hoy. El backend no tiene un DELETE por
 * habito y fecha, asi que se busca el registro de hoy y se borra por
 * su id con DELETE /api/registros/:id.
 */
export const desmarcarCumplidoHoy = async (id: number): Promise<void> => {
  const registros = await api<RegistroApi[]>('/registros');
  const fechaHoy = hoy();
  const deHoy = registros.find((r) => r.id_habito === id && aFechaLocal(r.fecha) === fechaHoy);
  if (!deHoy) return; // ya no estaba marcado: no hay nada que deshacer
  await api(`/registros/${deHoy.id_registro}`, { metodo: 'DELETE' });
};
