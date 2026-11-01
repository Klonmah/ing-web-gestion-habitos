// Servicio de plantillas de habitos (RF-07), usado por el administrador.
// Ahora habla con la API REST (/api/admin/plantillas y /api/admin/categorias)
// a traves de api.ts. Los tipos y las funciones exportadas conservan su
// forma original, asi que Admin.tsx no necesita cambios.

import { api } from './api';

export type Frecuencia = 'Diaria' | 'Semanal';
export type Dificultad = 'baja' | 'media' | 'alta';

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  frecuencia: Frecuencia;
  activa: boolean;
  usuariosActivos: number; // cuantos usuarios la tienen adoptada
  dificultad: Dificultad;
}


export type DatosPlantilla = Omit<Plantilla, 'id' | 'activa' | 'usuariosActivos' | 'dificultad'> & {
  dificultad?: Dificultad;
};

// Forma de una plantilla tal como la devuelve el backend.
interface PlantillaApi {
  id_plantilla: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  dificultad: Dificultad;
  frecuencia_sugerida: 'diaria' | 'semanal';
  activa: boolean;
  usuarios_activos: number;
}

interface CategoriaApi {
  id_categoria: number;
  nombre: string;
}


// Categorias

// Admin.tsx importa CATEGORIAS como constante para armar el filtro y el
// selector del formulario. Empieza con las categorias de la base de datos
// de prueba y listarPlantillas() la reemplaza (en el mismo arreglo) con las
// reales cuando llegan de la API.
export const CATEGORIAS: string[] = ['Salud', 'Ejercicio', 'Estudio', 'Sueno'];

let categoriasApi: CategoriaApi[] = [];

// Compara nombres sin tildes ni mayusculas ("Sueño" == "sueno").
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const cargarCategorias = async (): Promise<CategoriaApi[]> => {
  categoriasApi = await api<CategoriaApi[]>('/admin/categorias');
  CATEGORIAS.splice(0, CATEGORIAS.length, ...categoriasApi.map((c) => c.nombre));
  return categoriasApi;
};

// El formulario trabaja con el NOMBRE de la categoria; la API pide su id.
const idDeCategoria = async (nombre: string): Promise<number> => {
  const buscar = () => categoriasApi.find((c) => normalizar(c.nombre) === normalizar(nombre));
  let encontrada = buscar();
  if (!encontrada) {
    await cargarCategorias();
    encontrada = buscar();
  }
  if (!encontrada) throw new Error(`La categoria "${nombre}" no existe.`);
  return encontrada.id_categoria;
};


// Plantillas


const aPlantilla = (p: PlantillaApi): Plantilla => ({
  id: String(p.id_plantilla),
  nombre: p.nombre,
  descripcion: p.descripcion ?? '',
  categoria: p.categoria,
  frecuencia: p.frecuencia_sugerida === 'semanal' ? 'Semanal' : 'Diaria',
  activa: p.activa,
  usuariosActivos: p.usuarios_activos,
  dificultad: p.dificultad,
});

const aFrecuenciaApi = (f: Frecuencia): 'diaria' | 'semanal' =>
  f === 'Semanal' ? 'semanal' : 'diaria';

export const listarPlantillas = async (): Promise<Plantilla[]> => {
  const [filas] = await Promise.all([api<PlantillaApi[]>('/admin/plantillas'), cargarCategorias()]);
  return filas.map(aPlantilla);
};

export const crearPlantilla = async (datos: DatosPlantilla): Promise<Plantilla> => {
  const fila = await api<PlantillaApi>('/admin/plantillas', {
    metodo: 'POST',
    cuerpo: {
      id_categoria: await idDeCategoria(datos.categoria),
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      dificultad: datos.dificultad ?? 'media',
      frecuencia_sugerida: aFrecuenciaApi(datos.frecuencia),
    },
  });
  return aPlantilla(fila);
};

export const actualizarPlantilla = async (
  id: string,
  cambios: Partial<Omit<Plantilla, 'id' | 'usuariosActivos'>>
): Promise<Plantilla> => {
  // Solo se envian los campos que cambiaron: el PUT del backend es parcial,
  // asi desactivar ({ activa: false }) no toca el resto de los datos.
  const cuerpo: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre;
  if (cambios.descripcion !== undefined) cuerpo.descripcion = cambios.descripcion;
  if (cambios.activa !== undefined) cuerpo.activa = cambios.activa;
  if (cambios.dificultad !== undefined) cuerpo.dificultad = cambios.dificultad;
  if (cambios.frecuencia !== undefined) cuerpo.frecuencia_sugerida = aFrecuenciaApi(cambios.frecuencia);
  if (cambios.categoria !== undefined) cuerpo.id_categoria = await idDeCategoria(cambios.categoria);

  const fila = await api<PlantillaApi>(`/admin/plantillas/${encodeURIComponent(id)}`, {
    metodo: 'PUT',
    cuerpo,
  });
  return aPlantilla(fila);
};

// Regla de RF-07: una plantilla adoptada por algun usuario no se elimina,
// solo se desactiva. La regla la valida el BACKEND (responde 409 con el
// mensaje que Admin.tsx muestra al usuario); aqui no se repite.
export const eliminarPlantilla = async (id: string): Promise<void> => {
  await api(`/admin/plantillas/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
};
