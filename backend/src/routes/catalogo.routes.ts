import { Router } from 'express';
import { listarCatalogo } from '../controllers/admin.controller';
import { requiereAuth } from '../middlewares/auth.middleware';

/**
 * Catalogo de plantillas para el usuario (RF-06). Se monta en
 * /api/catalogo. Cualquier usuario autenticado puede verlo (no
 * requiere rol admin) y solo devuelve plantillas activas.
 */
const router = Router();

router.get('/', requiereAuth, listarCatalogo);

export default router;
