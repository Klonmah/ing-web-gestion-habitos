import { Router } from 'express';
import {
  getRecordatorios,
  createRecordatorio,
  updateRecordatorio,
  deleteRecordatorio,
} from '../controllers/recordatorios.controller';
import { requiereAuth } from '../middlewares/auth.middleware';
import { validar, validarId, validarQuery } from '../middlewares/validar.middleware';
import {
  esquemaCrearRecordatorio,
  esquemaActualizarRecordatorio,
  esquemaQueryRecordatorios,
} from '../schemas/recordatorios.schema';

/**
 * Rutas de recordatorios (RF-05). Se montan en /api/recordatorios.
 */
const router = Router();

router.use(requiereAuth);

router.get('/', validarQuery(esquemaQueryRecordatorios), getRecordatorios);
router.post('/', validar(esquemaCrearRecordatorio), createRecordatorio);
router.put('/:id', validarId, validar(esquemaActualizarRecordatorio), updateRecordatorio);
router.delete('/:id', validarId, deleteRecordatorio);

export default router;
