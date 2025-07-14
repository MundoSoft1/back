import { Request, Response } from "express";
import { UserApplication } from '../../application/usecases/userApplication';
import { MysqlRepository } from '../dataAccess/MysqlRepository';
import { EncryptService } from "../helpers/encryptHelpers";
import { PasswordValidator } from "../helpers/passwordValidator";
import { User } from "../../dominio/entities/user";

const mysqlRepository = new MysqlRepository();
const userAppService = new UserApplication(mysqlRepository);
const encryptPassword = new EncryptService();

export class UserController {
    static async createUser(req: Request, res: Response): Promise<any> {
        try {
            const { correo, password, rol } = req.body;
            
            // Validar contraseña antes de procesar
            const passwordValidation = PasswordValidator.validatePassword(password);
            
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Contraseña no válida',
                    details: passwordValidation.errors,
                    strength: passwordValidation.strength
                });
            }

            // Si la contraseña es débil, advertir pero permitir (opcional)
            if (passwordValidation.strength === 'weak') {
                console.warn(`Usuario ${correo} está usando una contraseña débil`);
            }

            const hashedPassword = encryptPassword.endecodePassword(password);
            const newUser = new User(0, correo, hashedPassword, rol);

            await userAppService.createUser(newUser);

            res.status(201).json({
                message: 'El usuario se creó exitosamente',
                data: {
                    id: newUser.id,
                    correo: newUser.correo,
                    rol: newUser.rol
                },
                passwordStrength: passwordValidation.strength
            });
        } catch (error) {
            console.log('Hubo un error al crear el usuario', error);
            res.status(500).json({
                error: 'Hubo un error al crear el usuario'
            });
        }
    }
}