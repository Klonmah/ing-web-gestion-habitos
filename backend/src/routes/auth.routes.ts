import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validar } from '../middlewares/validar.middleware';
import { requiereAuth } from '../middlewares/auth.middleware';
import { esquemaRegistro, esquemaLogin } from '../schemas/auth.schema';

/**
 * Rutas de autenticacion.
 *
 * Este archivo solo dice que URL corresponde a que funcion y por
 * que middlewares pasa antes. Se lee de izquierda a derecha, en el
 * orden en que se ejecuta.
 */
const router = Router();

// Publicas: no llevan requiereAuth.
router.post('/registro', validar(esquemaRegistro), authController.registro);
router.post('/login', validar(esquemaLogin), authController.login);

// Protegida: requiereAuth se ejecuta antes del controlador y corta
// la peticion con 401 si el token falta, es invalido o expiro.
router.get('/perfil', requiereAuth, authController.perfil);

export default router;
