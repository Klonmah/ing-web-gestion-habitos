// Servicio de plantillas de hábitos (RF-07), usado por el administrador.
// Igual que el de tareas: datos simulados ahora, API REST en la EP2.

export type Frecuencia = 'Diaria' | 'Semanal';

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  frecuencia: Frecuencia;
  activa: boolean;
  usuariosActivos: number; // cuántos usuarios la tienen adoptada
}

export type DatosPlantilla = Omit<Plantilla, 'id' | 'activa' | 'usuariosActivos'>;

export const CATEGORIAS = ['Salud', 'Ejercicio', 'Estudio', 'Sueño'];

let plantillas: Plantilla[] = [
  { id: '1', nombre: 'Beber 2L de agua', descripcion: 'Mantenerse hidratado durante el día', categoria: 'Salud', frecuencia: 'Diaria', activa: true, usuariosActivos: 0 },
  { id: '2', nombre: 'Dormir 7 horas', descripcion: 'Acostarse a una hora fija', categoria: 'Sueño', frecuencia: 'Diaria', activa: true, usuariosActivos: 0 },
  { id: '3', nombre: 'Leer 20 páginas', descripcion: 'Lectura diaria', categoria: 'Estudio', frecuencia: 'Diaria', activa: false, usuariosActivos: 0 },
  { id: '4', nombre: 'Caminar 8.000 pasos', descripcion: 'Actividad física moderada', categoria: 'Ejercicio', frecuencia: 'Diaria', activa: true, usuariosActivos: 12 },
];

export const listarPlantillas = async (): Promise<Plantilla[]> =>
  plantillas.map((p) => ({ ...p }));

export const crearPlantilla = async (datos: DatosPlantilla): Promise<Plantilla> => {
  const nueva: Plantilla = { ...datos, id: Date.now().toString(), activa: true, usuariosActivos: 0 };
  plantillas = [...plantillas, nueva];
  return { ...nueva };
};

export const actualizarPlantilla = async (
  id: string,
  cambios: Partial<Omit<Plantilla, 'id' | 'usuariosActivos'>>
): Promise<Plantilla> => {
  const actual = plantillas.find((p) => p.id === id);
  if (!actual) throw new Error('Plantilla no encontrada');
  const actualizada: Plantilla = { ...actual, ...cambios };
  plantillas = plantillas.map((p) => (p.id === id ? actualizada : p));
  return { ...actualizada };
};

// Regla de RF-07: una plantilla adoptada por algún usuario no se elimina,
// solo se desactiva. Se valida aquí además de en la interfaz, como lo hará
// el backend en la EP2.
export const eliminarPlantilla = async (id: string): Promise<void> => {
  const actual = plantillas.find((p) => p.id === id);
  if (actual && actual.usuariosActivos > 0) {
    throw new Error('La plantilla está en uso y solo puede desactivarse.');
  }
  plantillas = plantillas.filter((p) => p.id !== id);
};
