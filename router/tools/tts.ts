import axios from "axios"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "audio/wav",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function getTtsAudio(text: string, voice: string, rate: string, pitch: string, volume: string): Promise<Buffer> {
  const apiUrl = `https://iniapi-tts.hf.space/generate?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}&volume=${encodeURIComponent(volume)}&pitch=${encodeURIComponent(pitch)}`

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        "accept": "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Not-A.Brand";v="99", "Chromium";v="124"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      responseType: "arraybuffer",
      timeout: 30000,
    })
    return Buffer.from(response.data)
  } catch (error: any) {
    console.error("TTS API Error:", error.message)
    throw new Error(`Failed to generate TTS audio: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/tts",
    name: "tts",
    category: "Tools",
    description: "This API endpoint converts text into speech (TTS) using a highly customizable synthesis engine. You can specify the text to be spoken, choose from a variety of voices, and adjust parameters such as speech rate, pitch, and volume. This tool is perfect for creating audio content from text, developing accessible applications, or integrating voice capabilities into any system. It provides high-quality audio output, allowing for natural and expressive speech generation.",
    tags: ["TOOLS", "TTS", "Speech"],
    example: "?text=halo%20piye%20kabare&voice=jv-ID-DimasNeural&rate=0%25&pitch=0Hz&volume=0%25",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Text to convert",
        example: "halo piye kabare",
      },
      {
        name: "voice",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Voice for TTS",
        example: "jv-ID-DimasNeural",
      },
      {
        name: "rate",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Speech rate",
        example: "0%",
      },
      {
        name: "pitch",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Speech pitch",
        example: "0Hz",
      },
      {
        name: "volume",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Speech volume",
        example: "0%",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, voice, rate, pitch, volume } = req.query || {}

      if (!text || !voice || !rate || !pitch || !volume) {
        return {
          status: false,
          error: "All parameters (text, voice, rate, pitch, volume) must be provided",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }
      if (typeof voice !== "string" || voice.trim().length === 0) {
        return {
          status: false,
          error: "Voice must be a non-empty string",
          code: 400,
        }
      }
      if (typeof rate !== "string" || rate.trim().length === 0) {
        return {
          status: false,
          error: "Rate must be a non-empty string",
          code: 400,
        }
      }
      if (typeof pitch !== "string" || pitch.trim().length === 0) {
        return {
          status: false,
          error: "Pitch must be a non-empty string",
          code: 400,
        }
      }
      if (typeof volume !== "string" || volume.trim().length === 0) {
        return {
          status: false,
          error: "Volume must be a non-empty string",
          code: 400,
        }
      }

      try {
        const audioBuffer = await getTtsAudio(text.trim(), voice.trim(), rate.trim(), pitch.trim(), volume.trim())
        return createImageResponse(audioBuffer, "audio.wav")
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
    endpoint: "/api/tools/tts",
    name: "tts",
    category: "Tools",
    description: "This API endpoint converts text into speech (TTS) using a highly customizable synthesis engine via a JSON request body. You can specify the text to be spoken, choose from a variety of voices, and adjust parameters such as speech rate, pitch, and volume. This tool is perfect for creating audio content from text, developing accessible applications, or integrating voice capabilities into any system. It provides high-quality audio output, allowing for natural and expressive speech generation.",
    tags: ["TOOLS", "TTS", "Speech"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["text", "voice", "rate", "pitch", "volume"],
            properties: {
              text: {
                type: "string",
                description: "Text to convert",
                example: "halo piye kabare",
                minLength: 1,
                maxLength: 1000,
              },
              voice: {
                type: "string",
                description: "Voice for TTS",
                example: "jv-ID-DimasNeural",
                minLength: 1,
                maxLength: 100,
              },
              rate: {
                type: "string",
                description: "Speech rate",
                example: "0%",
                minLength: 1,
                maxLength: 10,
              },
              pitch: {
                type: "string",
                description: "Speech pitch",
                example: "0Hz",
                minLength: 1,
                maxLength: 10,
              },
              volume: {
                type: "string",
                description: "Speech volume",
                example: "0%",
                minLength: 1,
                maxLength: 10,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, voice, rate, pitch, volume } = req.body || {}

      if (!text || !voice || !rate || !pitch || !volume) {
        return {
          status: false,
          error: "All parameters (text, voice, rate, pitch, volume) must be provided",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string",
          code: 400,
        }
      }
      if (typeof voice !== "string" || voice.trim().length === 0) {
        return {
          status: false,
          error: "Voice must be a non-empty string",
          code: 400,
        }
      }
      if (typeof rate !== "string" || rate.trim().length === 0) {
        return {
          status: false,
          error: "Rate must be a non-empty string",
          code: 400,
        }
      }
      if (typeof pitch !== "string" || pitch.trim().length === 0) {
        return {
          status: false,
          error: "Pitch must be a non-empty string",
          code: 400,
        }
      }
      if (typeof volume !== "string" || volume.trim().length === 0) {
        return {
          status: false,
          error: "Volume must be a non-empty string",
          code: 400,
        }
      }

      try {
        const audioBuffer = await getTtsAudio(text.trim(), voice.trim(), rate.trim(), pitch.trim(), volume.trim())
        return createImageResponse(audioBuffer, "audio.wav")
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