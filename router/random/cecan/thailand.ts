import axios from "axios"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function getRandomCecanThailandImage() {
  try {
    const GIST_URL = "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/cecan/thailand.json"
    const { data: imageUrls } = await axios.get(GIST_URL, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error("No image URLs found in the GIST.")
    }

    const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)]
    const imageResponse = await axios.get(randomImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    return Buffer.from(imageResponse.data, "binary")
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get random Thai cecan image from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/cecan/thailand",
    name: "random cecan thailand",
    category: "Random",
    description: "This API endpoint provides a random image of Thai 'cecan' (beautiful women). It fetches image URLs from a curated GitHub Gist and returns a binary image response. This can be used for various applications requiring random image content, such as chatbots, entertainment websites, or personal projects. The endpoint ensures a direct image delivery for seamless integration.",
    tags: ["Random", "Image", "Thailand"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomCecanThailandImage()
        return createImageResponse(imageData)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/r/cecan/thailand",
    name: "random cecan thailand",
    category: "Random",
    description: "This API endpoint provides a random image of Thai 'cecan' (beautiful women) via a POST request. It fetches image URLs from a curated GitHub Gist and returns a binary image response. This can be used for applications that prefer POST requests for fetching content, such as dynamic content loading or internal system calls. The endpoint ensures a direct image delivery for seamless integration.",
    tags: ["Random", "Image", "Thailand"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomCecanThailandImage()
        return createImageResponse(imageData)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]