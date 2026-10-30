import { Router } from 'express';
import { getRegistros, createRegistro, updateRegistro, deleteRegistro } from '../controllers/registros.controller';
import { requiereAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requiereAuth); // Se requiere inicio de sesión

router.get('/', getRegistros);
router.post('/', createRegistro);
router.put('/:id', updateRegistro);
router.delete('/:id', deleteRegistro);

export default router;