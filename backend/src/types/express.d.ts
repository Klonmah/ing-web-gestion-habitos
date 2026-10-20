/**
 * Extension del tipo Request de Express.
 *
 * El middleware de autenticacion verifica el token y necesita dejar
 * los datos del usuario en algun lado para que el controlador los
 * lea. Lo natural es guardarlos en el propio request, pero el tipo
 * Request que define Express no tiene una propiedad "usuario", asi
 * que TypeScript lo rechaza.
 *
 * Esto se llama "declaration merging": TypeScript combina esta
 * declaracion con la original de Express y agrega el campo. No
 * cambia nada en tiempo de ejecucion, es solo informacion de tipos.
 */

export interface UsuarioAutenticado {
  // Se usa id_usuario, el mismo nombre que la columna de la base,
  // para que el codigo de todo el equipo hable igual.
  id_usuario: number;
  correo: string;
  rol: 'usuario' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      // Opcional, porque en las rutas publicas no hay usuario.
      usuario?: UsuarioAutenticado;
    }
  }
}
