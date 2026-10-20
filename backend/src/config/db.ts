import { Pool } from 'pg';
import { config } from 'dotenv';

// Carga las variables definidas en el archivo .env y las deja
// disponibles en process.env. Se llama una sola vez, aqui, porque
// este archivo es de los primeros que se importan al arrancar.
config();

/**
 * Pool de conexiones a PostgreSQL.
 *
 * Un Pool mantiene un conjunto de conexiones ya abiertas y las va
 * prestando a cada consulta. Abrir una conexion nueva en cada
 * consulta costaria decenas de milisegundos (autenticacion y
 * handshake), y con muchas peticiones simultaneas se agotarian las
 * conexiones que PostgreSQL permite. El Pool resuelve las dos cosas.
 */
export const pool = new Pool({
  host: process.env.DB_HOST,
  // Las variables de entorno siempre llegan como texto, y el Pool
  // espera un numero.
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,                       // conexiones simultaneas como maximo
  idleTimeoutMillis: 30000,      // cierra las que lleven 30 s sin uso
});

// Si una conexion inactiva falla (por ejemplo, si se reinicia
// PostgreSQL), el Pool emite este evento. Sin este manejador, el
// proceso de Node se caeria entero.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Comprueba que la base responde. Se llama al arrancar el servidor
 * para fallar de inmediato si la conexion esta mal configurada, en
 * vez de descubrirlo en la primera peticion de un usuario.
 */
export const probarConexion = async (): Promise<void> => {
  const resultado = await pool.query('SELECT NOW() AS ahora');
  console.log('Conectado a PostgreSQL:', resultado.rows[0].ahora);
};
