import { Router } from 'express';
import { getTareas, createTarea, updateTarea, deleteTarea } from '../controllers/tareas.controller';
import { requiereAuth } from '../middlewares/auth.middleware'; 

const router = Router();

router.use(requiereAuth);

router.get('/', getTareas);
router.post('/', createTarea);
router.put('/:id', updateTarea);
router.delete('/:id', deleteTarea);

export default router;