import { Router } from 'express';
import { getHabitos, createHabito, updateHabito, deleteHabito, marcarCumplimiento } from '../controllers/habitos.controller';
import { requiereAuth } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de hábitos requieren autenticación
router.use(requiereAuth);

router.get('/', getHabitos);
router.post('/', createHabito);
router.put('/:id', updateHabito);
router.delete('/:id', deleteHabito);

router.post('/:id/cumplimientos', marcarCumplimiento);

export default router;