import { Router } from 'express';
import { getProgreso } from '../controllers/progreso.controller';
import { requiereAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requiereAuth);
router.get('/', getProgreso);

export default router;