import express from 'express';
import { UserController } from '../controller/userController';
import { DeleteController } from '../controller/deleteUserController';
import { validatePassword } from '../middleware/passwordValidationMiddleware';

export const router = express.Router();

// Usar middleware de validación en la ruta de creación
router.post('/', validatePassword, UserController.createUser);
router.delete('/:id', DeleteController.deleteUser);

export default router;