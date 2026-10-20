import { Router } from 'express';
import authRoutes from './auth.routes';

/**
 * Punto unico donde se montan todas las rutas de la API.
 *
 * Cuando C y D tengan las suyas listas, las agregan aqui con una
 * linea cada una, por ejemplo:
 *
 *     import tareasRoutes from './tareas.routes';
 *     router.use('/tareas', tareasRoutes);
 *
 *     import adminRoutes from './admin.routes';
 *     router.use('/admin', adminRoutes);
 *
 * De esa forma index.ts no cambia nunca y cada uno toca solo su
 * archivo, sin conflictos de git.
 */
const router = Router();

router.use('/auth', authRoutes);

export default router;
