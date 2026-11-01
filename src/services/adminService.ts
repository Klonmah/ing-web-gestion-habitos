// Servicios extra del Rol D: categorias y metricas del administrador (RF-08)
// y catalogo para el usuario (RF-06). Las paginas de estas pantallas aun
// son PaginaPlaceholder; estas funciones quedan listas para cuando se
// construyan.

import { api } from './api';

//  Categorias (RF-08) 

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  total_plantillas: number;
}

export interface DatosCategoria {
  nombre: string;
  descripcion?: string;
}

export const listarCategorias = (): Promise<Categoria[]> =>
  api<Categoria[]>('/admin/categorias');

export const crearCategoria = (datos: DatosCategoria): Promise<Categoria> =>
  api<Categoria>('/admin/categorias', { metodo: 'POST', cuerpo: datos });

export const actualizarCategoria = (
  id: number,
  cambios: Partial<DatosCategoria>
): Promise<Categoria> =>
  api<Categoria>(`/admin/categorias/${id}`, { metodo: 'PUT', cuerpo: cambios });

// Responde 409 (con mensaje) si la categoria aun tiene plantillas.
export const eliminarCategoria = async (id: number): Promise<void> => {
  await api(`/admin/categorias/${id}`, { metodo: 'DELETE' });
};

//  Metricas (RF-08)

export interface Metricas {
  total_usuarios: number;
  habitos_activos: number;
  plantillas_totales: number;
  plantillas_activas: number;
  cumplimientos_ultimos_7_dias: number;
  cumplimientos_ultimos_30_dias: number;
  adopciones_por_plantilla: { id_plantilla: number; nombre: string; adopciones: number }[];
  cumplimientos_por_categoria: { categoria: string; cumplimientos: number }[];
}

export const obtenerMetricas = (): Promise<Metricas> => api<Metricas>('/admin/metricas');

// Catalogo (RF-06)
export interface PlantillaCatalogo {
  id_plantilla: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  descripcion: string | null;
  dificultad: 'baja' | 'media' | 'alta';
  frecuencia_sugerida: 'diaria' | 'semanal';
  ya_adoptada: boolean; // el usuario que consulta ya la tiene
}

export interface FiltroCatalogo {
  categoria?: string | number; // id o nombre
  dificultad?: 'baja' | 'media' | 'alta';
}

export const listarCatalogo = (filtro: FiltroCatalogo = {}): Promise<PlantillaCatalogo[]> => {
  const params = new URLSearchParams();
  if (filtro.categoria !== undefined && filtro.categoria !== '') {
    params.set('categoria', String(filtro.categoria));
  }
  if (filtro.dificultad) params.set('dificultad', filtro.dificultad);
  const query = params.toString();
  return api<PlantillaCatalogo[]>(`/catalogo${query ? `?${query}` : ''}`);
};
