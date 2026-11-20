// Cliente HTTP de la app (Rol D: integracion front-backend).
//
// Todos los servicios (tareas, plantillas, catalogo...) pasan por la
// funcion api() de este archivo. Hace tres cosas por ellos:
//   1. Adjunta el JWT en la cabecera Authorization de cada peticion
//      (esto hace de "interceptor").
//   2. Si el backend responde 401 (token vencido o invalido), borra
//      la sesion y redirige a /login con un aviso.
//   3. Convierte los errores del backend en un Error con mensaje
//      legible, para que las paginas lo muestren con err.message.

// La sesion (token y usuario) se lee y se borra con las funciones de auth.ts.
import { cerrarSesion, obtenerToken } from './auth';

// URL base de la API. En desarrollo apunta al backend local; se puede
// cambiar con la variable VITE_API_URL en un archivo .env del front.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Error de un campo, tal como lo arma el middleware validar del backend. */
export interface DetalleError {
  campo: string;
  mensaje: string;
}

/**
 * Error de la API: conserva el codigo HTTP y, si el backend los mando,
 * los errores por campo, para que los formularios marquen el input
 * exacto que fallo.
 */
export class ApiError extends Error {
  readonly estado: number;
  readonly detalles: DetalleError[];

  constructor(estado: number, mensaje: string, detalles: DetalleError[] = []) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
    this.detalles = detalles;
  }
}


// Peticiones


interface OpcionesApi {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  /**
   * true en las rutas publicas (login, registro): no se envia token y
   * un 401 NO cierra la sesion ni redirige, porque ahi significa
   * "credenciales incorrectas" y no "sesion vencida".
   */
  publica?: boolean;
}

// Los distintos endpoints devuelven el error con formas distintas:
//   { error: "texto" }                         (middleware de B)
//   { error: "...", detalles: [{campo, mensaje}] }   (validar de B)
//   { errores: [{ message }] }                 (zod directo, tareas)
// Esta funcion saca de ahi un solo texto para mostrar al usuario.
const extraerMensaje = (cuerpo: unknown, porDefecto: string): string => {
  if (typeof cuerpo !== 'object' || cuerpo === null) return porDefecto;
  const c = cuerpo as {
    error?: string;
    detalles?: { mensaje?: string }[];
    errores?: { message?: string }[];
  };
  if (c.detalles?.length && c.detalles[0].mensaje) return c.detalles[0].mensaje;
  if (c.errores?.length && c.errores[0].message) return c.errores[0].message;
  if (typeof c.error === 'string') return c.error;
  return porDefecto;
};

// Errores por campo de { error, detalles: [{ campo, mensaje }] }.
const extraerDetalles = (cuerpo: unknown): DetalleError[] => {
  if (typeof cuerpo !== 'object' || cuerpo === null) return [];
  const { detalles } = cuerpo as { detalles?: unknown };
  if (!Array.isArray(detalles)) return [];
  return detalles.filter(
    (d): d is DetalleError =>
      typeof d === 'object' && d !== null &&
      typeof (d as DetalleError).campo === 'string' &&
      typeof (d as DetalleError).mensaje === 'string'
  );
};

const sesionExpirada = (): never => {
  cerrarSesion();
  // Se evita redirigir si ya estamos en /login (no hacer bucle).
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login?sesion=expirada');
  }
  throw new ApiError(401, 'Tu sesion expiro. Vuelve a iniciar sesion.');
};

export const api = async <T = unknown>(ruta: string, opciones: OpcionesApi = {}): Promise<T> => {
  const { metodo = 'GET', cuerpo, publica = false } = opciones;

  const cabeceras: Record<string, string> = {};
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

  if (!publica) {
    const token = obtenerToken();
    // Sin token ni siquiera se hace la peticion: sera un 401 seguro.
    if (!token) return sesionExpirada();
    cabeceras['Authorization'] = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    // fetch solo lanza si no hubo respuesta (servidor caido, CORS...).
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend este corriendo.');
  }

  // Algunas respuestas pueden venir sin cuerpo JSON.
  const datos: unknown = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !publica) return sesionExpirada();
    throw new ApiError(
      respuesta.status,
      extraerMensaje(datos, `Error ${respuesta.status} al comunicarse con el servidor`),
      extraerDetalles(datos)
    );
  }

  return datos as T;
};
