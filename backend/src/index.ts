import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Express anuncia por defecto la cabecera "X-Powered-By: Express".
// Decirle a cualquiera con que framework esta hecho el servidor solo
// le sirve a quien busca vulnerabilidades conocidas de esa version.
app.disable('x-powered-by');

// helmet agrega un conjunto de cabeceras HTTP de seguridad, entre
// ellas X-Content-Type-Options (impide que el navegador adivine el
// tipo de un archivo), X-Frame-Options (evita que la API se cargue
// dentro de un iframe ajeno) y Referrer-Policy.
app.use(helmet());

// CORS: el navegador bloquea por defecto las peticiones de una
// pagina a un servidor de otro origen. El frontend corre en otro
// puerto, asi que hay que autorizarlo explicitamente.
//
// 5173 es el puerto de Vite (npm run dev) y 8100 el de Ionic
// (ionic serve). Se permiten ambos porque el equipo usa los dos.
const origenesPermitidos = (
  process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:8100'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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
 * LIMITE DE INTENTOS EN AUTENTICACION
 *
 * Sin esto, nada impide probar miles de contrasenas contra una
 * cuenta hasta acertar. El limite se aplica solo a /api/auth, que es
 * donde se prueban credenciales: ponerlo en toda la API molestaria
 * al uso normal de la aplicacion.
 * ---------------------------------------------------------------- */
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  limit: 15,                // intentos fallidos por IP en esa ventana
  standardHeaders: 'draft-7',
  legacyHeaders: false,

  // Solo cuentan las peticiones que fallaron. Un login correcto o un
  // registro exitoso no gastan cupo, porque lo que hay que frenar es
  // quien prueba contrasenas a ciegas, no a quien acierta.
  //
  // Sin esto, una sesion normal de uso (entrar, cerrar sesion, entrar
  // con otra cuenta, registrarse) agotaria el limite y bloquearia al
  // usuario legitimo durante 15 minutos.
  skipSuccessfulRequests: true,

  message: {
    error: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
  },
});

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

// El limitador se monta antes de las rutas de autenticacion.
app.use('/api/auth', limiteAuth);

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
