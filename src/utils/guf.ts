import { Logger } from "./logger"
import { fileTypeFromBuffer } from "file-type"

export class GetUploadFile {
    private static logger = new Logger("Media")
    
    // Konstanta yang hilang
    private static readonly VALID_IMAGE_TYPES = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml'
    ]
    
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    
    static guf = async (req: any, fieldName: string = 'image') => {
        const { context } = req

        if (!context || typeof context !== "object") {
            return null // Return null jika context tidak valid
        }

        const searchPaths = [
            () => context[fieldName],
            () => context.body?.[fieldName],
            () => context.files?.[fieldName],
            async () => {
                try {
                    const formData = await context.request.formData()
                    return formData.get(fieldName)
                } catch {
                    return null
                }
            }
        ]

        for (const getFile of searchPaths) {
            const file = await getFile()
            if (file instanceof File) {
                // Deteksi tipe file yang akurat menggunakan file-type
                let type = file.type || 'unknown'
                
                try {
                    const arrayBuffer = await file.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)
                    const detectedType = await fileTypeFromBuffer(buffer)
                    
                    if (detectedType) {
                        type = detectedType.mime
                    }
                    
                    const isImage = type.startsWith('image/') || this.VALID_IMAGE_TYPES.includes(type)
                    const isValid = file.size > 0 && file.size <= this.MAX_FILE_SIZE
                    
                    // Log hanya ketika file ditemukan dan valid
                    if (isValid) {
                        this.logger.success(`Media Accepted: ${type}`)
                    }
                    
                    // Return buffer langsung sebagai file
                    return { file: buffer, type, isImage, isValid, size: file.size, name: file.name }
                    
                } catch (error) {
                    this.logger.warn(`Failed to detect file type: ${error.message}`)
                    
                    // Fallback jika gagal detect type, tetap return buffer
                    const arrayBuffer = await file.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)
                    const isImage = type.startsWith('image/') || this.VALID_IMAGE_TYPES.includes(type)
                    const isValid = file.size > 0 && file.size <= this.MAX_FILE_SIZE
                    
                    return { file: buffer, type, isImage, isValid, size: file.size, name: file.name }
                }
            }
        }

        return null // Return null jika file tidak ditemukan
    }
}