// mysqlImageRepository.ts - Versión actualizada con rotación automática
import { Image } from "../../dominio/entities/imageEntity";
import { ImageRepository } from "../../dominio/repository/imageRepository";
import { query } from '../../../database/db.config';

export class MysqlImageRepository implements ImageRepository {
    private readonly MAX_IMAGES = 1000; // Límite máximo de imágenes

    async createImage(image: Image): Promise<Image> {
        const sql = 'INSERT INTO images (date, url) VALUES (?, ?)';
        const params = [image.date, image.url];

        try {
            const result: any = await query(sql, params);
            const insertId = result[0].insertId;
            if (!insertId) {
                throw new Error('No se pudo obtener el ID de la imagen insertada');
            }

            // Verificar y aplicar rotación automática después de insertar
            await this.enforceImageLimit();

            return { ...image, id: insertId };
        } catch (error) {
            console.log('Error al crear la imagen', error);
            throw new Error('Error al crear la imagen: ' + error);
        }
    }

    /**
     * Verifica el límite de imágenes y elimina las más antiguas si es necesario
     */
    private async enforceImageLimit(): Promise<void> {
        try {
            // Contar el número total de imágenes
            const countSql = 'SELECT COUNT(*) as total FROM images';
            const [countResult]: any = await query(countSql, []);
            const totalImages = countResult[0].total;

            if (totalImages > this.MAX_IMAGES) {
                const imagesToDelete = totalImages - this.MAX_IMAGES;
                
                // Obtener las imágenes más antiguas a eliminar
                const oldestImagesSql = `
                    SELECT id, url FROM images 
                    ORDER BY date ASC, id ASC 
                    LIMIT ?
                `;
                const [oldestImages]: any = await query(oldestImagesSql, [imagesToDelete]);

                if (oldestImages.length > 0) {
                    // Eliminar las imágenes más antiguas
                    const idsToDelete = oldestImages.map((img: any) => img.id);
                    const deleteSql = `DELETE FROM images WHERE id IN (${idsToDelete.map(() => '?').join(',')})`;
                    
                    await query(deleteSql, idsToDelete);
                    
                    console.log(`Rotación automática: ${imagesToDelete} imágenes antiguas eliminadas. Total actual: ${this.MAX_IMAGES}`);
                    
                    // Opcional: También eliminar de Cloudinary
                    await this.deleteFromCloudinary(oldestImages);
                }
            }
        } catch (error) {
            console.error('Error en la rotación automática:', error);
            // No lanzar error para no interrumpir el proceso principal
        }
    }

    /**
     * Elimina imágenes de Cloudinary (opcional)
     */
    private async deleteFromCloudinary(images: any[]): Promise<void> {
        const cloudinary = require('cloudinary').v2;
        
        for (const image of images) {
            try {
                // Extraer public_id de la URL de Cloudinary
                const publicId = this.extractPublicIdFromUrl(image.url);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (error) {
                console.error(`Error al eliminar imagen de Cloudinary: ${image.url}`, error);
            }
        }
    }

    /**
     * Extrae el public_id de una URL de Cloudinary
     */
    private extractPublicIdFromUrl(url: string): string | null {
        try {
            const urlParts = url.split('/');
            const filename = urlParts[urlParts.length - 1];
            return filename.split('.')[0]; // Remover extensión
        } catch {
            return null;
        }
    }

    /**
     * Obtiene el conteo actual de imágenes
     */
    async getImageCount(): Promise<number> {
        const sql = 'SELECT COUNT(*) as total FROM images';
        try {
            const [result]: any = await query(sql, []);
            return result[0].total;
        } catch (error) {
            console.log('Error al obtener el conteo de imágenes', error);
            throw new Error('Error al obtener el conteo de imágenes: ' + error);
        }
    }

    /**
     * Obtiene estadísticas del sistema
     */
    async getSystemStats(): Promise<{
        totalImages: number;
        maxImages: number;
        oldestImage: Date | null;
        newestImage: Date | null;
    }> {
        try {
            const totalImages = await this.getImageCount();
            
            const statsSql = `
                SELECT 
                    MIN(date) as oldest_date,
                    MAX(date) as newest_date
                FROM images
            `;
            const [statsResult]: any = await query(statsSql, []);
            
            return {
                totalImages,
                maxImages: this.MAX_IMAGES,
                oldestImage: statsResult[0].oldest_date,
                newestImage: statsResult[0].newest_date
            };
        } catch (error) {
            console.log('Error al obtener estadísticas del sistema', error);
            throw new Error('Error al obtener estadísticas del sistema: ' + error);
        }
    }

    async getAllImages(): Promise<Image[]> {
        const sql = 'SELECT id, date, url FROM images ORDER BY date DESC';

        try {
            const [result]: any = await query(sql, []);
            const images: Image[] = result.map((imageData: any) => {
                return {
                    id: imageData.id,
                    date: imageData.date,
                    url: imageData.url,
                };
            });
            return images;
        } catch (error) {
            console.log('Error al obtener las imágenes', error);
            throw new Error('Error al obtener las imágenes' + error)
        }
    }

    async getImageById(id: number): Promise<Image | null> {
        const sql = 'SELECT id, date, url FROM images WHERE id = ?';
        const params = [id];

        try {
            const [result]: any = await query(sql, params);

            if (result.length > 0) {
                const imageData = result[0];
                const image: Image = {
                    id: imageData.id,
                    date: imageData.date,
                    url: imageData.url,
                };
                return image;
            } else {
                return null;
            }
        } catch (error) {
            console.log('Error al obtener la imagen por ID', error);
            throw new Error('Error al obtener la imagen por ID' + error);
        }
    }

    async updateImage(id: number, image: Image): Promise<any> {
        const sql = 'UPDATE images SET date = ?, url = ? WHERE id = ?';
        const params = [image.date, image.url, id];

        try {
            const result = await query(sql, params);
            return result;
        } catch (error) {
            console.log('Error al actualizar la imagen', error);
            throw new Error('Error al actualizar la imagen' + error);
        }
    }

    async deleteImage(id: number): Promise<any> {
        const sql = 'DELETE FROM images WHERE id = ?';
        const params = [id];

        try {
            const result = await query(sql, params);
            return result;
        } catch (error) {
            console.log('Error al eliminar la imagen', error);
            throw new Error('Error al eliminar la imagen' + error);
        }
    }

    async getImagesByDate(startDate: Date, endDate: Date): Promise<Image[]> {
        const sql = 'SELECT id, date, url FROM images WHERE date BETWEEN ? AND ? ORDER BY date DESC';
        const params = [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')];

        try {
            const [result]: any = await query(sql, params);
            const images: Image[] = result.map((imageData: any) => {
                return {
                    id: imageData.id,
                    date: imageData.date,
                    url: imageData.url,
                };
            });
            return images;
        } catch (error) {
            console.log('Error al obtener las imágenes por fecha', error);
            throw new Error('Error al obtener las imágenes por fecha' + error);
        }
    }

    
    async forceRotation(): Promise<void> {
        await this.enforceImageLimit();
    }
}