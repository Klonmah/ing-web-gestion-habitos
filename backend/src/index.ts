import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import rutas from './routes';
import { pool, probarConexion } from './config/db';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/error.middleware';

config();

const app = express();
const PUERTO = Number(process.env.PORT) || 3000;

/* ------------------------------------------------------------------
 * MIDDLEWARES GLOBALES
 * El orden importa: se ejecutan de arriba hacia abajo en cada
 * peticion, antes de llegar a las rutas.
 * ---------------------------------------------------------------- */

// CORS: el navegador bloquea por defecto las peticiones de una
// pagina a un servidor de otro origen. El frontend corre en otro
// puerto, asi que hay que autorizarlo explicitamente.
const origenesPermitidos = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8100')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true,
  })
);

// Convierte el body JSON de las peticiones en un objeto accesible
// desde req.body. Sin esto, req.body llega undefined.
// El limite evita que alguien mande un cuerpo enorme para saturar
// el servidor.
app.use(express.json({ limit: '1mb' }));

/* ------------------------------------------------------------------
 * RUTAS
 * ---------------------------------------------------------------- */

// Comprueba que el servidor esta vivo y que llega a la base.
app.get('/salud', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW() AS ahora');
    res.json({
      estado: 'ok',
      baseDeDatos: 'conectada',
      hora: resultado.rows[0].ahora,
    });
  } catch {
    res.status(503).json({
      estado: 'error',
      baseDeDatos: 'sin conexion',
    });
  }
});

// Todas las rutas de la API cuelgan de /api.
app.use('/api', rutas);

/* ------------------------------------------------------------------
 * MANEJO DE ERRORES
 * Van al final, despues de las rutas: Express los alcanza solo si
 * ninguna ruta respondio o si alguien llamo a next(error).
 * ---------------------------------------------------------------- */
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

/* ------------------------------------------------------------------
 * ARRANQUE
 * ---------------------------------------------------------------- */
const iniciar = async () => {
  try {
    // Se comprueba la base ANTES de aceptar peticiones. Si la
    // conexion esta mal configurada, es mejor fallar aqui con un
    // mensaje claro que descubrirlo en el primer login.
    await probarConexion();

    app.listen(PUERTO, () => {
      console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
      console.log(`Estado:  http://localhost:${PUERTO}/salud`);
    });
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL.');
    console.error('Revisa las variables DB_* del archivo .env y que el servicio este corriendo.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

iniciar();
