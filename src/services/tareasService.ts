// Servicio de tareas (RF-01).
// Por ahora trabaja con datos simulados en memoria. En la Entrega Parcial 2
// estas funciones se reemplazan por llamadas a la API REST, sin que las
// páginas tengan que cambiar: por eso todas devuelven Promesas.

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

let tareas: Tarea[] = [
  { id: '1', titulo: 'Terminar informe de laboratorio', descripcion: 'Resultados y conclusiones', fechaLimite: '2026-09-24', prioridad: 'alta', completada: false },
  { id: '2', titulo: 'Limpiar el baño', descripcion: '', fechaLimite: '2026-09-23', prioridad: 'media', completada: true },
  { id: '3', titulo: 'Pagar la cuenta de la luz', descripcion: '', fechaLimite: '2026-09-18', prioridad: 'alta', completada: false },
  { id: '4', titulo: 'Comprar despensa', descripcion: 'Frutas, verduras y arroz', fechaLimite: '2026-09-26', prioridad: 'baja', completada: false },
];

export const listarTareas = async (): Promise<Tarea[]> =>
  tareas.map((t) => ({ ...t }));

export const crearTarea = async (datos: DatosTarea): Promise<Tarea> => {
  const nueva: Tarea = { ...datos, id: Date.now().toString(), completada: false };
  tareas = [...tareas, nueva];
  return { ...nueva };
};

export const actualizarTarea = async (
  id: string,
  cambios: Partial<Omit<Tarea, 'id'>>
): Promise<Tarea> => {
  const actual = tareas.find((t) => t.id === id);
  if (!actual) throw new Error('Tarea no encontrada');
  const actualizada: Tarea = { ...actual, ...cambios };
  tareas = tareas.map((t) => (t.id === id ? actualizada : t));
  return { ...actualizada };
};

export const eliminarTarea = async (id: string): Promise<void> => {
  tareas = tareas.filter((t) => t.id !== id);
};

// Fecha de hoy en hora local, en formato AAAA-MM-DD.
const hoy = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Una tarea está vencida si no está completada y su fecha límite ya pasó.
export const estaVencida = (t: Tarea): boolean =>
  !t.completada && t.fechaLimite < hoy();
