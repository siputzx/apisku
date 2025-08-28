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

async function getRandomWaifuImage() {
  try {
    const API_URL = "https://api.waifu.pics/sfw/waifu"
    const { data } = await axios.get(API_URL, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!data || !data.url) {
      throw new Error("Invalid response from external API: Missing image URL.")
    }

    const imageUrl = data.url
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    return Buffer.from(imageResponse.data, "binary")
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get random waifu image from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/waifu",
    name: "random waifu",
    category: "Random",
    description: "This API endpoint provides a random waifu image. It fetches the image from a popular waifu API and returns it directly as a binary response. This is ideal for applications, websites, or bots that need to display charming and random anime waifu images to their users, adding a touch of visual appeal and engagement.",
    tags: ["Random", "Image", "Anime", "Waifu"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomWaifuImage()
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
    endpoint: "/api/r/waifu",
    name: "random waifu",
    category: "Random",
    description: "This API endpoint allows you to retrieve a random waifu image using a POST request. It fetches the image from an external waifu API and returns it as a binary response. This is suitable for applications that prefer POST requests for content retrieval, such as dynamic content loading or specific backend integrations, ensuring a consistent delivery of delightful waifu images.",
    tags: ["Random", "Image", "Anime", "Waifu"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomWaifuImage()
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