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

// URL base de la API. En desarrollo apunta al backend local; se puede
// cambiar con la variable VITE_API_URL en un archivo .env del front.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const TOKEN_KEY = 'token';
export const USUARIO_KEY = 'usuario';

/** Usuario tal como lo guarda el front tras el login. */
export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  correo: string;
  email: string; // copia de "correo": Home.tsx y otras paginas leen "email"
  rol: 'usuario' | 'admin';
}

/** Error de la API: conserva el codigo HTTP por si la pagina lo necesita. */
export class ApiError extends Error {
  readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
  }
}


// Sesion (localStorage)


export const obtenerToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const obtenerUsuario = (): UsuarioSesion | null => {
  try {
    const crudo = localStorage.getItem(USUARIO_KEY);
    return crudo ? (JSON.parse(crudo) as UsuarioSesion) : null;
  } catch {
    return null;
  }
};

export const guardarSesion = (
  token: string,
  usuario: Omit<UsuarioSesion, 'email'>
): UsuarioSesion => {
  const sesion: UsuarioSesion = { ...usuario, email: usuario.correo };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(sesion));
  return sesion;
};

export const cerrarSesion = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
};


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
      extraerMensaje(datos, `Error ${respuesta.status} al comunicarse con el servidor`)
    );
  }

  return datos as T;
};
