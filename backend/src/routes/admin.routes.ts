import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { validar } from '../middlewares/validar.middleware';
import { requiereAuth, requiereAdmin } from '../middlewares/auth.middleware';
import {
  esquemaCrearPlantilla,
  esquemaActualizarPlantilla,
  esquemaCrearCategoria,
  esquemaActualizarCategoria,
} from '../schemas/admin.schema';

/**
 * Rutas de administracion (RF-07 y RF-08). Se montan en /api/admin.
 *
 * router.use aplica los dos middlewares a TODAS las rutas de este
 * archivo, en este orden:
 *   1. requiereAuth  -> sin token valido: 401
 *   2. requiereAdmin -> con token pero sin rol admin: 403
 * Asi ninguna ruta nueva puede quedar sin proteger por olvido.
 */
const router = Router();

router.use(requiereAuth, requiereAdmin);

// Plantillas
router.get('/plantillas', admin.listarPlantillas);
router.post('/plantillas', validar(esquemaCrearPlantilla), admin.crearPlantilla);
router.put('/plantillas/:id', validar(esquemaActualizarPlantilla), admin.actualizarPlantilla);
router.delete('/plantillas/:id', admin.eliminarPlantilla);

// Categorias
router.get('/categorias', admin.listarCategorias);
router.post('/categorias', validar(esquemaCrearCategoria), admin.crearCategoria);
router.put('/categorias/:id', validar(esquemaActualizarCategoria), admin.actualizarCategoria);
router.delete('/categorias/:id', admin.eliminarCategoria);

// Metricas (agregados anonimos)
router.get('/metricas', admin.obtenerMetricas);

export default router;
