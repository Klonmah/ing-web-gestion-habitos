// Recordatorios de habitos (RF-05).
//
// Un recordatorio indica que dia de la semana y a que hora avisar de un
// habito. El backend los guarda en /api/recordatorios, uno por dia:
// "lunes, miercoles y viernes a las 08:00" son tres recordatorios.

import { api } from './api';

/** 1 = lunes ... 7 = domingo (igual que la base de datos). */
export const DIAS_SEMANA: { numero: number; corto: string; largo: string }[] = [
  { numero: 1, corto: 'Lun', largo: 'Lunes' },
  { numero: 2, corto: 'Mar', largo: 'Martes' },
  { numero: 3, corto: 'Mié', largo: 'Miércoles' },
  { numero: 4, corto: 'Jue', largo: 'Jueves' },
  { numero: 5, corto: 'Vie', largo: 'Viernes' },
  { numero: 6, corto: 'Sáb', largo: 'Sábado' },
  { numero: 7, corto: 'Dom', largo: 'Domingo' },
];

export const nombreDia = (numero: number): string =>
  DIAS_SEMANA.find((d) => d.numero === numero)?.largo ?? `Día ${numero}`;

export interface Recordatorio {
  id_recordatorio: number;
  id_habito: number;
  nombre_habito: string;
  dia_semana: number;
  hora: string; // HH:MM
  activo: boolean;
}

export const listarRecordatorios = (): Promise<Recordatorio[]> =>
  api<Recordatorio[]>('/recordatorios');

export const crearRecordatorio = (idHabito: number, diaSemana: number, hora: string): Promise<Recordatorio> =>
  api<Recordatorio>('/recordatorios', {
    metodo: 'POST',
    cuerpo: { id_habito: idHabito, dia_semana: diaSemana, hora },
  });

export const cambiarActivoRecordatorio = (id: number, activo: boolean): Promise<Recordatorio> =>
  api<Recordatorio>(`/recordatorios/${id}`, { metodo: 'PUT', cuerpo: { activo } });

export const eliminarRecordatorio = async (id: number): Promise<void> => {
  await api(`/recordatorios/${id}`, { metodo: 'DELETE' });
};
