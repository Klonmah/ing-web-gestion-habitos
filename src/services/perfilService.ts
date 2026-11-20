// Perfil del usuario: datos de la cuenta y un resumen de su actividad.
//
// Los datos de la cuenta salen de GET /api/auth/perfil (no del
// localStorage), asi la pantalla muestra lo que tiene la base de datos.
// El resumen junta lo que ya entregan /api/habitos, /api/tareas y
// /api/progreso; para el administrador solo se piden los datos de la
// cuenta, porque esas rutas son del usuario normal.

import { api } from './api';

export interface DatosCuenta {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: 'usuario' | 'admin';
}

export interface ResumenActividad {
  habitosActivos: number;
  tareasPendientes: number;
  tareasCompletadas: number;
  porcentajeSemanal: number;
  mejorRacha: { nombre: string; dias: number } | null;
}

export const obtenerCuenta = async (): Promise<DatosCuenta> => {
  const { usuario } = await api<{ usuario: DatosCuenta }>('/auth/perfil');
  return usuario;
};

interface ProgresoApi {
  porcentaje_general: number;
  progreso: { nombre: string; racha_actual: number }[];
}

export const obtenerResumenActividad = async (): Promise<ResumenActividad> => {
  const [habitos, tareas, progreso] = await Promise.all([
    api<{ activo: boolean }[]>('/habitos'),
    api<{ completada: boolean }[]>('/tareas'),
    api<ProgresoApi>('/progreso?periodo=semanal'),
  ]);

  const mejor = progreso.progreso.reduce<{ nombre: string; dias: number } | null>(
    (max, p) => (p.racha_actual > (max?.dias ?? 0) ? { nombre: p.nombre, dias: p.racha_actual } : max),
    null
  );

  return {
    habitosActivos: habitos.filter((h) => h.activo).length,
    tareasPendientes: tareas.filter((t) => !t.completada).length,
    tareasCompletadas: tareas.filter((t) => t.completada).length,
    porcentajeSemanal: progreso.porcentaje_general,
    mejorRacha: mejor,
  };
};

/**
 * Fecha de vencimiento de la sesion, leida del campo "exp" del JWT.
 * El token va firmado pero no cifrado, asi que el cliente puede leer
 * su contenido (no puede modificarlo sin invalidar la firma).
 */
export const vencimientoDelToken = (token: string | null): Date | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === 'number' ? new Date(exp * 1000) : null;
  } catch {
    return null;
  }
};
