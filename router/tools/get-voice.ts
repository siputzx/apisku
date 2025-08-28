import axios from "axios"

async function scrapeVoices() {
  try {
    const response = await axios.get(
      "https://iniapi-tts.hf.space/voices",
      {
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
        timeout: 30000,
      },
    )
    return response.data.data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/voices",
    name: "list voice",
    category: "Tools",
    description: "This API endpoint provides a comprehensive list of available voices that can be used for Text-to-Speech (TTS) functionalities. It fetches real-time data from an external TTS service, offering a variety of voice options, including different languages, genders, and tones. Developers can utilize this list to integrate diverse voice capabilities into their applications, allowing for more dynamic and user-friendly audio outputs. The response includes details for each voice, such as its unique identifier and language code, facilitating easy selection and implementation.",
    tags: ["Tools", "TTS", "Voice"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeVoices()
        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }
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
    endpoint: "/api/tools/voices",
    name: "list voice",
    category: "Tools",
    description: "This API endpoint provides a comprehensive list of available voices that can be used for Text-to-Speech (TTS) functionalities. It fetches real-time data from an external TTS service, offering a variety of voice options, including different languages, genders, and tones. Developers can utilize this list to integrate diverse voice capabilities into their applications, allowing for more dynamic and user-friendly audio outputs. The response includes details for each voice, such as its unique identifier and language code, facilitating easy selection and implementation.",
    tags: ["Tools", "TTS", "Voice"],
    example: "",
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {},
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrapeVoices()
        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }
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