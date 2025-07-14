import { Request, Response, NextFunction } from 'express';
import { PasswordValidator } from '../helpers/passwordValidator';

export const validatePassword = (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({
            error: 'La contraseña es requerida'
        });
    }

    const validation = PasswordValidator.validatePassword(password);
    
    if (!validation.isValid) {
        return res.status(400).json({
            error: 'Contraseña no válida',
            details: validation.errors,
            strength: validation.strength
        });
    }

    // Opcional: rechazar contraseñas débiles
    if (validation.strength === 'weak') {
        return res.status(400).json({
            error: 'La contraseña es demasiado débil',
            details: ['Por favor, use una contraseña más fuerte'],
            strength: validation.strength
        });
    }

    next();
};