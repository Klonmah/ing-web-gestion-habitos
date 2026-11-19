import { Router } from 'express';
import { getTareas, createTarea, updateTarea, deleteTarea } from '../controllers/tareas.controller';
import { requiereAuth } from '../middlewares/auth.middleware';
import { validar, validarId } from '../middlewares/validar.middleware';
import { esquemaCrearTarea, esquemaActualizarTarea } from '../schemas/tareas.schema';

const router = Router();

router.use(requiereAuth);

router.get('/', getTareas);
router.post('/', validar(esquemaCrearTarea), createTarea);
router.put('/:id', validarId, validar(esquemaActualizarTarea), updateTarea);
router.delete('/:id', validarId, deleteTarea);

export default router;
