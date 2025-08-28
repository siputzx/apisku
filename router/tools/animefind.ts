import axios from "axios";
import FormData from "form-data";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
];

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

async function validateImageBuffer(buffer: Buffer) {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw new Error("Could not detect file type");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
      throw new Error(
        `Unsupported file type: ${fileType.mime}. Only image files are allowed.`,
      );
    }

    return {
      isValid: true,
      mime: fileType.mime,
      ext: fileType.ext,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

async function processImageIdentification(imageBuffer: Buffer) {
  const form = new FormData();
  form.append("image", imageBuffer, {
    filename: "anime.jpg",
    contentType: "image/jpeg",
  });

  try {
    const response = await axios.post(
      "https://www.animefinder.xyz/api/identify",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Origin": "https://www.animefinder.xyz",
          "Referer": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        maxBodyLength: Infinity,
        timeout: 30000,
      },
    );

    const result = response.data;
    return {
      status: true,
      anime: result.animeTitle,
      character: result.character,
      genres: result.genres,
      premiere: result.premiereDate,
      production: result.productionHouse,
      description: result.description,
      synopsis: result.synopsis,
      references: result.references || [],
    };
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw new Error(
      error.response?.data?.error || "Failed to identify anime from image",
    );
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/identify-anime",
    name: "identify anime",
    category: "Tools",
    description: "This API endpoint allows users to identify an anime from an image URL. By providing a valid image URL, the API will analyze the image content to determine the anime title, character, genres, premiere date, production house, and a brief description. This is useful for users who encounter an anime image and want to know more about it.",
    tags: ["ANIME", "IMAGE", "RECOGNITION"],
    example: "?imageUrl=https://files.catbox.moe/57d96s.jpg",
    parameters: [
      {
        name: "imageUrl",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "URL of the image to identify",
        example: "https://files.catbox.moe/57d96s.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { imageUrl } = req.query || {};

      if (!imageUrl) {
        return {
          status: false,
          error: "Parameter 'imageUrl' is required.",
          code: 400,
        };
      }

      if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'imageUrl' must be a non-empty string.",
          code: 400,
        };
      }

      try {
        const imageBuffer = (await axios.get(imageUrl.trim(), {
          responseType: "arraybuffer",
          timeout: 30000,
        })).data;

        const validation = await validateImageBuffer(Buffer.from(imageBuffer));
        if (!validation.isValid) {
          return {
            status: false,
            error: validation.error || "File is not a valid image.",
            code: 400,
          };
        }

        const result = await processImageIdentification(imageBuffer);

        return {
          status: true,
          data: {
            ...result,
            image: imageUrl.trim(),
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
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
    endpoint: "/api/tools/identify-anime",
    name: "identify anime",
    category: "Tools",
    description: "This API endpoint allows users to identify an anime by uploading an image file. Users can send an image file, and the API will process it to identify the anime title, character, genres, premiere date, production house, and a brief description. This is ideal for applications where users need to upload images directly.",
    tags: ["ANIME", "IMAGE", "RECOGNITION"],
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
                description: "Image file to identify (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG)",
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
            error: "Missing 'image' file in form data",
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
            error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
            code: 400,
          };
        }

        const result = await processImageIdentification(file);

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
];