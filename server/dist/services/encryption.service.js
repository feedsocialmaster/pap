import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
/**
 * Servicio de encriptación para credenciales de pasarelas de pago
 * Utiliza AES-256-GCM para encriptación segura
 */
export class EncryptionService {
    constructor() {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY must be set in environment variables');
        }
        // Derivar key de 32 bytes desde la clave del entorno
        this.key = crypto.scryptSync(encryptionKey, 'salt', KEY_LENGTH);
    }
    /**
     * Encripta un objeto de configuración a string
     * @param config - Objeto de configuración a encriptar
     * @returns String encriptado en formato: iv:authTag:encryptedData
     */
    encrypt(config) {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
            const plaintext = JSON.stringify(config);
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            // Formato: iv:authTag:encryptedData
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Desencripta un string a objeto de configuración
     * @param encryptedData - String encriptado en formato: iv:authTag:encryptedData
     * @returns Objeto de configuración desencriptado
     */
    decrypt(encryptedData) {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const [ivHex, authTagHex, encrypted] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Valida que un objeto encriptado pueda ser desencriptado correctamente
     * @param encryptedData - String encriptado
     * @returns true si es válido, false en caso contrario
     */
    validate(encryptedData) {
        try {
            this.decrypt(encryptedData);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Genera una clave de encriptación segura para usar como ENCRYPTION_KEY
     * @returns String hexadecimal de 64 caracteres
     */
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
}
// Singleton instance
let encryptionService = null;
export function getEncryptionService() {
    if (!encryptionService) {
        encryptionService = new EncryptionService();
    }
    return encryptionService;
}
