import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { ErrorHttp } from '../utils/ErrorHttp';
import type { DatosRegistro, DatosLogin } from '../schemas/auth.schema';
import type { UsuarioAutenticado } from '../types/express';

/**
 * Capa de servicios de autenticacion.
 *
 * Aqui vive la logica y las consultas SQL. Este archivo no sabe que
 * existe HTTP: recibe datos normales y devuelve datos normales. Si
 * algo sale mal lanza un ErrorHttp, y el controlador se encarga de
 * convertirlo en una respuesta.
 */

// Numero de rondas de bcrypt. Cada ronda duplica el tiempo de
// calculo: 10 toma unos 50-100 ms, que es lento para un atacante que
// prueba millones de contrasenas y despreciable para un login.
const RONDAS_BCRYPT = 10;

/** Forma de una fila de la tabla usuario. */
interface FilaUsuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  contrasena_hash: string;
  rol: 'usuario' | 'admin';
  fecha_registro: Date;
}

/** Lo que se devuelve al cliente: nunca incluye el hash. */
export interface UsuarioPublico {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: 'usuario' | 'admin';
}

const aUsuarioPublico = (fila: FilaUsuario): UsuarioPublico => ({
  id_usuario: fila.id_usuario,
  nombre: fila.nombre,
  correo: fila.correo,
  rol: fila.rol,
});

/**
 * Genera el token JWT.
 *
 * El payload va firmado pero NO cifrado: cualquiera puede leer su
 * contenido decodificando base64. Por eso solo lleva id, correo y
 * rol, y nunca la contrasena ni datos sensibles. La firma garantiza
 * que nadie pueda modificarlo sin conocer JWT_SECRET.
 */
const generarToken = (usuario: UsuarioPublico): string => {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error('Falta la variable JWT_SECRET en el archivo .env');
  }

  const payload: UsuarioAutenticado = {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
  };

  return jwt.sign(payload, secreto, {
    // RNF-02: el token expira a las 24 horas.
    // El cast es necesario porque expiresIn acepta un formato
    // concreto de texto ('24h', '7d'...) y TypeScript no puede
    // comprobar que una variable de entorno lo cumpla.
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Registra un usuario nuevo (siempre con rol 'usuario').
 */
export const registrar = async (
  datos: DatosRegistro
): Promise<{ usuario: UsuarioPublico; token: string }> => {
  const { nombre, correo, contrasena } = datos;

  // Se comprueba antes para poder dar un mensaje claro. La columna
  // tambien es UNIQUE en la base, que es la garantia real: si dos
  // peticiones llegaran a la vez, la segunda falla igual.
  const existente = await pool.query<FilaUsuario>(
    'SELECT id_usuario FROM usuario WHERE correo = $1',
    [correo]
  );

  if (existente.rowCount && existente.rowCount > 0) {
    throw new ErrorHttp(409, 'Ya existe una cuenta registrada con ese correo');
  }

  // bcrypt genera internamente una "sal" aleatoria distinta para
  // cada contrasena, por eso dos usuarios con la misma contrasena
  // tienen hashes diferentes. La sal queda guardada dentro del
  // propio hash, no hay que almacenarla aparte.
  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  // $1, $2, $3 son parametros: el driver los envia separados de la
  // consulta, asi que su contenido nunca se interpreta como SQL.
  // Esto es lo que impide la inyeccion SQL. Concatenar los valores
  // en el texto de la consulta seria el error clasico.
  //
  // El campo rol no se incluye a proposito: lo pone la base con su
  // valor por defecto 'usuario'.
  const insertado = await pool.query<FilaUsuario>(
    `INSERT INTO usuario (nombre, correo, contrasena_hash)
     VALUES ($1, $2, $3)
     RETURNING id_usuario, nombre, correo, rol, fecha_registro`,
    [nombre, correo, hash]
  );

  const usuario = aUsuarioPublico(insertado.rows[0]);
  return { usuario, token: generarToken(usuario) };
};

/**
 * Verifica las credenciales y devuelve un token.
 */
export const login = async (
  datos: DatosLogin
): Promise<{ usuario: UsuarioPublico; token: string }> => {
  const { correo, contrasena } = datos;

  const resultado = await pool.query<FilaUsuario>(
    `SELECT id_usuario, nombre, correo, contrasena_hash, rol, fecha_registro
     FROM usuario
     WHERE correo = $1`,
    [correo]
  );

  const fila = resultado.rows[0];

  // El mensaje es el mismo tanto si el correo no existe como si la
  // contrasena esta mala. Si se distinguieran, cualquiera podria
  // averiguar que correos tienen cuenta en el sistema probando uno
  // por uno.
  const credencialesInvalidas = new ErrorHttp(401, 'Correo o contrasena incorrectos');

  if (!fila) {
    throw credencialesInvalidas;
  }

  // bcrypt.compare vuelve a calcular el hash de la contrasena
  // recibida usando la sal guardada y compara el resultado. Nunca
  // se descifra el hash: eso no es posible.
  const coincide = await bcrypt.compare(contrasena, fila.contrasena_hash);
  if (!coincide) {
    throw credencialesInvalidas;
  }

  const usuario = aUsuarioPublico(fila);
  return { usuario, token: generarToken(usuario) };
};

/**
 * Devuelve los datos del usuario autenticado. Lo usa GET /auth/perfil
 * para que el frontend pueda comprobar si la sesion sigue viva.
 */
export const obtenerPorId = async (id: number): Promise<UsuarioPublico> => {
  const resultado = await pool.query<FilaUsuario>(
    `SELECT id_usuario, nombre, correo, contrasena_hash, rol, fecha_registro
     FROM usuario
     WHERE id_usuario = $1`,
    [id]
  );

  const fila = resultado.rows[0];
  if (!fila) {
    // El token era valido pero la cuenta ya no existe.
    throw new ErrorHttp(404, 'El usuario no existe');
  }

  return aUsuarioPublico(fila);
};
