// imageApplication.ts - Versión actualizada con estadísticas
import { Image } from '../../dominio/entities/imageEntity';
import { ImageRepository } from '../../dominio/repository/imageRepository';

export class ImageApplication {
    constructor(private imageRepository: ImageRepository) {}

    async createImage(image: Image): Promise<any> {
        return await this.imageRepository.createImage(image);
    }

    async getAllImages(): Promise<Image[]> {
        return await this.imageRepository.getAllImages();
    }

    async getImagesByDate(startDate: Date, endDate: Date): Promise<Image[]> {
        return await this.imageRepository.getImagesByDate(startDate, endDate);
    }

    async updateImage(id: number, image: Image): Promise<any> {
        return await this.imageRepository.updateImage(id, image);
    }

    async deleteImage(id: number): Promise<any> {
        return await this.imageRepository.deleteImage(id);
    }

    async getImageCount(): Promise<number> {
        
        if ('getImageCount' in this.imageRepository) {
            return await (this.imageRepository as any).getImageCount();
        }
      
        const images = await this.getAllImages();
        return images.length;
    }

  
    async getSystemStats(): Promise<any> {
        if ('getSystemStats' in this.imageRepository) {
            return await (this.imageRepository as any).getSystemStats();
        }
        throw new Error('El repositorio no soporta estadísticas del sistema');
    }

    /**
     * Fuerza la rotación automática
     */
    async forceRotation(): Promise<void> {
        if ('forceRotation' in this.imageRepository) {
            await (this.imageRepository as any).forceRotation();
        } else {
            throw new Error('El repositorio no soporta rotación forzada');
        }
    }
}