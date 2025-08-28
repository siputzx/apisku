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

async function getRandomBlueArchiveImage() {
  try {
    const GIST_URL = "https://gist.githubusercontent.com/siputzx/e985e0566c0529df3a2289fd64047d21/raw/1568d9d26ee25dbe82fb0bdf51b5c88727e3f602/bluearchive.json"
    const { data: images } = await axios.get(GIST_URL, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error("No image URLs found in the GIST.")
    }

    const randomImageUrl = images[Math.floor(Math.random() * images.length)]
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
    throw new Error("Failed to get random Blue Archive image from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/blue-archive",
    name: "random blue archive",
    category: "Random",
    description: "This API endpoint provides a random image from the popular game 'Blue Archive'. It fetches image URLs from a curated GitHub Gist and returns a binary image response. This can be used for various applications requiring random image content related to Blue Archive, such as fan-made apps, entertainment bots, or personal projects. The endpoint ensures a direct image delivery for seamless integration.",
    tags: ["Random", "Image", "Blue Archive", "Anime"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomBlueArchiveImage()
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
    endpoint: "/api/r/blue-archive",
    name: "random blue archive",
    category: "Random",
    description: "This API endpoint provides a random image from the popular game 'Blue Archive' via a POST request. It fetches image URLs from a curated GitHub Gist and returns a binary image response. This can be used for applications that prefer POST requests for fetching content related to Blue Archive, such as dynamic content loading or internal system calls. The endpoint ensures a direct image delivery for seamless integration.",
    tags: ["Random", "Image", "Blue Archive", "Anime"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomBlueArchiveImage()
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