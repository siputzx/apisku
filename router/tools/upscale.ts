import axios from "axios";
import FormData from "form-data";
import { Buffer } from "buffer";
import { fileTypeFromBuffer } from "file-type";

class PicsArtUpscaler {
    private authToken: string | null = null;
    private uploadUrl = "https://upload.picsart.com/files";
    private enhanceUrl = "https://ai.picsart.com/gw1/diffbir-enhancement-service/v1.7.6";
    private jsUrl = "https://picsart.com/-/landings/4.290.0/static/index-msH24PNW-B73n3SC9.js";

    async getAuthToken(): Promise<string> {
        if (this.authToken) return this.authToken;
        
        const response = await axios.get(this.jsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
            }
        });
        
        const tokenMatch = response.data.match(/"x-app-authorization":"Bearer ([^"]+)"/);
        if (!tokenMatch) throw new Error('Token not found');
        
        this.authToken = `Bearer ${tokenMatch[1]}`;
        return this.authToken;
    }

    async uploadBuffer(buffer: Buffer): Promise<string> {
        await this.getAuthToken();

        const formData = new FormData();
        formData.append('type', 'editing-temp-landings');
        formData.append('file', buffer, {
            filename: 'image.jpeg',
            contentType: 'image/jpeg'
        });
        formData.append('url', '');
        formData.append('metainfo', '');

        const response = await axios.post(this.uploadUrl, formData, {
            headers: {
                ...formData.getHeaders(),
                'authority': 'upload.picsart.com',
                'accept': '*/*',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'origin': 'https://picsart.com',
                'referer': 'https://picsart.com/',
                'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
            }
        });

        return response.data.result.url;
    }

    async uploadFromUrl(imageUrl: string): Promise<string> {
        await this.getAuthToken();
        
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data);
        return await this.uploadBuffer(buffer);
    }

    async enhanceImage(imageUrl: string, targetScale: number = 4): Promise<any> {
        const scale = Math.max(1, Math.min(20, targetScale));
        
        const params = new URLSearchParams({
            picsart_cdn_url: imageUrl,
            format: 'PNG',
            model: 'REALESERGAN'
        });

        const payload = {
            image_url: imageUrl,
            colour_correction: {
                enabled: false,
                blending: 0.5
            },
            face_enhancement: {
                enabled: true,
                blending: 1,
                max_faces: 1000,
                impression: false,
                gfpgan: true,
                node: "ada"
            },
            seed: 42,
            upscale: {
                enabled: true,
                node: "esrgan",
                target_scale: scale
            }
        };

        const response = await axios.post(`${this.enhanceUrl}?${params.toString()}`, payload, {
            headers: {
                'authority': 'ai.picsart.com',
                'accept': 'application/json',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/json',
                'origin': 'https://picsart.com',
                'referer': 'https://picsart.com/',
                'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
                'x-app-authorization': this.authToken,
                'x-touchpoint': 'widget_EnhancedImage',
                'x-touchpoint-referrer': '/image-upscale/'
            }
        });

        return response.data;
    }

    async checkStatus(jobId: string): Promise<any> {
        const response = await axios.get(`${this.enhanceUrl}/${jobId}`, {
            headers: {
                'authority': 'ai.picsart.com',
                'accept': 'application/json',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'origin': 'https://picsart.com',
                'referer': 'https://picsart.com/',
                'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
                'x-app-authorization': this.authToken
            }
        });

        return response.data;
    }

    async waitForCompletion(jobId: string): Promise<string> {
        while (true) {
            const status = await this.checkStatus(jobId);
            
            if (status.status === 'DONE') {
                return status.result.image_url;
            }
            
            if (status.status === 'FAILED') {
                throw new Error(`Enhancement failed: ${status.error_message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async downloadBuffer(url: string): Promise<Buffer> {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }

    async upscale(input: Buffer | string, targetScale: number = 4): Promise<Buffer> {
        let uploadedUrl: string;
        
        if (Buffer.isBuffer(input)) {
            uploadedUrl = await this.uploadBuffer(input);
        } else if (typeof input === 'string') {
            uploadedUrl = await this.uploadFromUrl(input);
        } else {
            throw new Error('Input must be Buffer or URL string');
        }
        
        const enhanceResponse = await this.enhanceImage(uploadedUrl, targetScale);
        const resultUrl = await this.waitForCompletion(enhanceResponse.id);
        return await this.downloadBuffer(resultUrl);
    }
}

const upscaler = new PicsArtUpscaler();

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
    const headers = {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
    };

    if (filename) {
        headers["Content-Disposition"] = `inline; filename="${filename}"`;
    }

    return new Response(buffer, { headers });
};

async function UpscaleImageFromUrl(imageUrl: string, scale: number = 4) {
    const result = await upscaler.upscale(imageUrl, scale);
    return {
        buffer: result,
        scale: scale
    };
}

async function UpscaleImageFromFile(imageBuffer: Buffer, scale: number = 4, fileName: string = "image.jpg") {
    const fileType = await fileTypeFromBuffer(imageBuffer);
    if (!fileType || !fileType.mime.startsWith("image/")) {
        throw new Error("Unsupported file type, only images are allowed.");
    }

    const result = await upscaler.upscale(imageBuffer, scale);
    return {
        buffer: result,
        scale: scale
    };
}

export default [
    {
        metode: "GET",
        endpoint: "/api/tools/upscale",
        name: "upscale",
        category: "Tools",
        description: "This API endpoint upscales/enhances an image using PicsArt AI enhancement service. Users can submit the URL of an image along with a target scale factor (1-20), and the API will process it using REALESERGAN model with face enhancement, returning the upscaled image as a PNG buffer. This tool is ideal for improving image quality and resolution.",
        tags: ["TOOLS", "IMAGE", "UPSCALE", "ENHANCEMENT", "AI"],
        example: "?url=https://files.catbox.moe/258vhm.jpg&scale=4",
        parameters: [
            {
                name: "url",
                in: "query",
                required: true,
                schema: {
                    type: "string",
                    format: "url",
                    minLength: 1,
                    maxLength: 2048,
                },
                description: "The URL of the image to upscale.",
                example: "https://files.catbox.moe/258vhm.jpg",
            },
            {
                name: "scale",
                in: "query",
                required: false,
                schema: {
                    type: "number",
                    minimum: 1,
                    maximum: 20,
                    default: 4,
                },
                description: "The upscale factor (1-20). Higher values produce larger images.",
                example: 4,
            },
        ],
        isPremium: false,
        isMaintenance: false,
        isPublic: true,
        async run({ req }) {
            const { url, scale } = req.query || {};

            if (!url) {
                return {
                    status: false,
                    error: "Parameter 'url' is required.",
                    code: 400,
                };
            }

            if (typeof url !== "string" || url.trim().length === 0) {
                return {
                    status: false,
                    error: "Parameter 'url' must be a non-empty string.",
                    code: 400,
                };
            }

            const targetScale = scale ? parseInt(scale as string) : 4;
            if (isNaN(targetScale) || targetScale < 1 || targetScale > 20) {
                return {
                    status: false,
                    error: "Parameter 'scale' must be a number between 1 and 20.",
                    code: 400,
                };
            }

            try {
                new URL(url.trim());

                const result = await UpscaleImageFromUrl(url.trim(), targetScale);

                return createImageResponse(result.buffer);
            } catch (error: any) {
                console.error("Error:", error);
                return {
                    status: false,
                    error: error.message || "Internal Server Error",
                    code: 500,
                };
            }
        },
    },
    {
        metode: "POST",
        endpoint: "/api/tools/upscale",
        name: "upscale",
        category: "Tools",
        description: "This API endpoint upscales/enhances an image from an uploaded file using PicsArt AI enhancement service. Users can send an image file via multipart/form-data along with an optional scale parameter, and the API will process it using REALESERGAN model with face enhancement, returning the upscaled image as a PNG buffer. This method is suitable for direct image uploads.",
        tags: ["TOOLS", "IMAGE", "UPSCALE", "ENHANCEMENT", "AI"],
        example: "",
        requestBody: {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        required: ["image"],
                        properties: {
                            image: {
                                type: "string",
                                format: "binary",
                                description: "The image file to upscale.",
                            },
                            scale: {
                                type: "number",
                                minimum: 1,
                                maximum: 20,
                                default: 4,
                                description: "The upscale factor (1-20). Higher values produce larger images.",
                            },
                        },
                    },
                },
            },
        },
        isPremium: false,
        isMaintenance: false,
        isPublic: true,
        async run({ req, guf }) {
            try {
                const { file, type, isImage, isValid, size, name } = await guf(
                    req,
                    "image",
                );

                if (!file) {
                    return {
                        status: false,
                        error: "File 'image' is required in multipart/form-data.",
                        code: 400,
                    };
                }

                if (!isValid) {
                    return {
                        status: false,
                        error: `Invalid file: ${name}. Size must be between 1 byte and 10MB`,
                        code: 400,
                    };
                }

                if (!isImage) {
                    return {
                        status: false,
                        error: `Invalid file type: ${type}. Only image files are supported.`,
                        code: 400,
                    };
                }

                // Get scale parameter from form data if provided
                const formData = req.body || {};
                const targetScale = formData.scale ? parseInt(formData.scale) : 4;
                
                if (isNaN(targetScale) || targetScale < 1 || targetScale > 20) {
                    return {
                        status: false,
                        error: "Parameter 'scale' must be a number between 1 and 20.",
                        code: 400,
                    };
                }

                const result = await UpscaleImageFromFile(file, targetScale, name);

                return createImageResponse(result.buffer);
            } catch (error: any) {
                console.error("Error:", error);
                return {
                    status: false,
                    error: error.message || "Internal Server Error",
                    code: 500,
                };
            }
        },
    },
];
