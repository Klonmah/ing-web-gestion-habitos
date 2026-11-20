// Sesion del usuario en el navegador.
//
// Todo lo que lee o escribe la sesion pasa por este archivo: el token JWT
// y los datos del usuario que devuelve el login se guardan en
// localStorage. El resto de la app (cliente HTTP, rutas protegidas,
// menu, login, registro) importa estas funciones en vez de tocar
// localStorage directamente.

export const TOKEN_KEY = 'token';
export const USUARIO_KEY = 'usuario';

export type Rol = 'usuario' | 'admin';

/** Usuario tal como lo devuelve el backend en el login y el registro. */
export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

/** Pantalla de entrada de cada rol. */
export const RUTA_INICIO: Record<Rol, string> = {
  usuario: '/inicio',
  admin: '/admin/plantillas',
};

export const obtenerToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const obtenerUsuario = (): UsuarioSesion | null => {
  try {
    const crudo = localStorage.getItem(USUARIO_KEY);
    return crudo ? (JSON.parse(crudo) as UsuarioSesion) : null;
  } catch {
    return null;
  }
};

/** Hay sesion solo si estan el token y los datos del usuario. */
export const haySesion = (): boolean => obtenerToken() !== null && obtenerUsuario() !== null;

export const esAdmin = (): boolean => obtenerUsuario()?.rol === 'admin';

export const guardarSesion = (token: string, usuario: UsuarioSesion): UsuarioSesion => {
  // Se guardan solo los campos conocidos, no lo que venga de mas.
  const sesion: UsuarioSesion = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(sesion));
  return sesion;
};

export const cerrarSesion = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
};

/**
 * A donde mandar a quien entra sin una ruta concreta (la raiz, el
 * login con sesion ya iniciada, el boton de la pagina 404...):
 * sin sesion al login, y con sesion a la pantalla de su rol.
 */
export const rutaDeInicio = (): string => {
  const usuario = obtenerUsuario();
  if (!usuario || !obtenerToken()) return '/login';
  return RUTA_INICIO[usuario.rol];
};
