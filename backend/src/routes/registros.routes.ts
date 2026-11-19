import { Router } from 'express';
import { getRegistros, createRegistro, updateRegistro, deleteRegistro } from '../controllers/registros.controller';
import { requiereAuth } from '../middlewares/auth.middleware';
import { validar, validarId } from '../middlewares/validar.middleware';
import { esquemaCrearRegistro, esquemaActualizarRegistro } from '../schemas/registros.schema';

const router = Router();

router.use(requiereAuth); // Se requiere inicio de sesión

router.get('/', getRegistros);
router.post('/', validar(esquemaCrearRegistro), createRegistro);
router.put('/:id', validarId, validar(esquemaActualizarRegistro), updateRegistro);
router.delete('/:id', validarId, deleteRegistro);

export default router;
