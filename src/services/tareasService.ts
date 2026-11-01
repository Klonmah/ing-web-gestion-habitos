// Servicio de tareas (RF-01).
// Ahora habla con la API REST (GET/POST/PUT/DELETE /api/tareas) a traves
// de api.ts. Las firmas de las funciones y los tipos exportados NO
// cambiaron, asi que las paginas siguen funcionando igual.

import { api } from './api';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaLimite: string; // formato AAAA-MM-DD
  prioridad: Prioridad;
  completada: boolean;
}

// Datos que el usuario ingresa en el formulario.
export type DatosTarea = Omit<Tarea, 'id' | 'completada'>;

// Forma de una tarea tal como la devuelve el backend (columnas de la BD).
interface TareaApi {
  id_tarea: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string;
  prioridad: Prioridad;
  completada: boolean;
}

// La columna fecha_limite es un DATE, pero el driver de PostgreSQL lo
// entrega como fecha con hora ("2026-10-22T03:00:00.000Z"). Si ya viene
// como AAAA-MM-DD se deja igual; si no, se toma el dia en hora local.
const aFechaLocal = (valor: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const aTarea = (t: TareaApi): Tarea => ({
  id: String(t.id_tarea),
  titulo: t.titulo,
  descripcion: t.descripcion ?? '',
  fechaLimite: aFechaLocal(t.fecha_limite),
  prioridad: t.prioridad,
  completada: t.completada,
});

// Cuerpo que espera el backend (nombres en snake_case).
const aCuerpoApi = (t: Omit<Tarea, 'id'>) => ({
  titulo: t.titulo,
  descripcion: t.descripcion,
  fecha_limite: t.fechaLimite,
  prioridad: t.prioridad,
  completada: t.completada,
});

// El PUT del backend reemplaza la tarea completa, pero las paginas
// llaman actualizarTarea(id, { completada }) con un solo campo. Por eso
// se recuerda la ultima version de cada tarea para completar el resto.
const ultimaVersion = new Map<string, Tarea>();

export const listarTareas = async (): Promise<Tarea[]> => {
  const filas = await api<TareaApi[]>('/tareas');
  const tareas = filas.map(aTarea);
  ultimaVersion.clear();
  tareas.forEach((t) => ultimaVersion.set(t.id, t));
  return tareas;
};

export const crearTarea = async (datos: DatosTarea): Promise<Tarea> => {
  const fila = await api<TareaApi>('/tareas', {
    metodo: 'POST',
    cuerpo: aCuerpoApi({ ...datos, completada: false }),
  });
  const nueva = aTarea(fila);
  ultimaVersion.set(nueva.id, nueva);
  return nueva;
};

export const actualizarTarea = async (
  id: string,
  cambios: Partial<Omit<Tarea, 'id'>>
): Promise<Tarea> => {
  let actual = ultimaVersion.get(id);
  if (!actual) {
    // Solo pasa si la pagina no listo antes (p. ej. recarga a medias).
    await listarTareas();
    actual = ultimaVersion.get(id);
  }
  if (!actual) throw new Error('Tarea no encontrada');

  const { id: _omitido, ...completa } = { ...actual, ...cambios };
  const fila = await api<TareaApi>(`/tareas/${encodeURIComponent(id)}`, {
    metodo: 'PUT',
    cuerpo: aCuerpoApi(completa),
  });
  const actualizada = aTarea(fila);
  ultimaVersion.set(id, actualizada);
  return actualizada;
};

export const eliminarTarea = async (id: string): Promise<void> => {
  await api(`/tareas/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
  ultimaVersion.delete(id);
};

// Fecha de hoy en hora local, en formato AAAA-MM-DD.
const hoy = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Una tarea esta vencida si no esta completada y su fecha limite ya paso.
export const estaVencida = (t: Tarea): boolean =>
  !t.completada && t.fechaLimite < hoy();
