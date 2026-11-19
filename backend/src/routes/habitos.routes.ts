import { Router } from 'express';
import { getHabitos, createHabito, updateHabito, deleteHabito, marcarCumplimiento } from '../controllers/habitos.controller';
import { requiereAuth } from '../middlewares/auth.middleware';
import { validar, validarId } from '../middlewares/validar.middleware';
import { esquemaCrearHabito, esquemaActualizarHabito, esquemaCumplimiento } from '../schemas/habitos.schema';

const router = Router();

// Todas las rutas de hábitos requieren autenticación
router.use(requiereAuth);

router.get('/', getHabitos);
router.post('/', validar(esquemaCrearHabito), createHabito);
router.put('/:id', validarId, validar(esquemaActualizarHabito), updateHabito);
router.delete('/:id', validarId, deleteHabito);

router.post('/:id/cumplimientos', validarId, validar(esquemaCumplimiento), marcarCumplimiento);

export default router;
