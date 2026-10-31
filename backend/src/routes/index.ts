import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import tareasRoutes from './tareas.routes';
import habitosRoutes from './habitos.routes';
import registrosRoutes from './registros.routes';
import progresoRoutes from './progreso.routes';
import catalogoRoutes from './catalogo.routes';

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
router.use('/admin', adminRoutes);
router.use('/tareas', tareasRoutes);
router.use('/habitos', habitosRoutes);
router.use('/catalogo', catalogoRoutes);
router.use('/registros', registrosRoutes);
router.use('/progreso', progresoRoutes);

export default router;
