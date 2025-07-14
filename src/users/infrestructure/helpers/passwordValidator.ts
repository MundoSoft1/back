// helpers/passwordValidator.ts
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export class PasswordValidator {
    private static readonly MIN_LENGTH = 8;
    private static readonly MAX_LENGTH = 128;
    
    // Patrones comunes de contraseñas débiles
    private static readonly COMMON_PASSWORDS = [
        'password', '123456', '123456789', 'qwerty', 'abc123', 
        'password123', 'admin', 'letmein', 'welcome', 'monkey',
        'dragon', 'master', 'hello', 'freedom', 'whatever'
    ];

    // Patrones secuenciales
    private static readonly SEQUENTIAL_PATTERNS = [
        /123456/, /abcdef/, /qwerty/, /asdfgh/, /zxcvbn/
    ];

    static validatePassword(password: string): PasswordValidationResult {
        const errors: string[] = [];
        
        // Validar longitud
        if (password.length < this.MIN_LENGTH) {
            errors.push(`La contraseña debe tener al menos ${this.MIN_LENGTH} caracteres`);
        }
        
        if (password.length > this.MAX_LENGTH) {
            errors.push(`La contraseña no puede exceder ${this.MAX_LENGTH} caracteres`);
        }

        // Validar complejidad
        if (!/[a-z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial');
        }

        // Validar patrones débiles
        if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
            errors.push('La contraseña es demasiado común y fácil de adivinar');
        }

        // Validar patrones secuenciales
        if (this.SEQUENTIAL_PATTERNS.some(pattern => pattern.test(password.toLowerCase()))) {
            errors.push('La contraseña no puede contener secuencias obvias');
        }

        // Validar caracteres repetidos
        if (this.hasRepeatedCharacters(password)) {
            errors.push('La contraseña no puede tener más de 2 caracteres consecutivos iguales');
        }

        // Calcular fuerza de la contraseña
        const strength = this.calculatePasswordStrength(password);

        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }

    private static hasRepeatedCharacters(password: string): boolean {
        for (let i = 0; i < password.length - 2; i++) {
            if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
                return true;
            }
        }
        return false;
    }

    private static calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
        let score = 0;
        
        // Longitud
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        // Complejidad
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
        
        // Diversidad de caracteres
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.5) score += 1;
        
        if (score >= 7) return 'strong';
        if (score >= 4) return 'medium';
        return 'weak';
    }
}

