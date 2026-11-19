import { Router } from 'express';
import { getProgreso } from '../controllers/progreso.controller';
import { requiereAuth } from '../middlewares/auth.middleware';
import { validarQuery } from '../middlewares/validar.middleware';
import { esquemaQueryProgreso } from '../schemas/progreso.schema';

const router = Router();
router.use(requiereAuth);
router.get('/', validarQuery(esquemaQueryProgreso), getProgreso);

export default router;
