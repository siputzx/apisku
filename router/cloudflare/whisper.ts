import axios from "axios"

declare const CloudflareAi: () => string | null

const speechToText = async (audioUrl: string, model: string) => {
  try {
    const { data } = await axios.post(
      CloudflareAi() + "/speech-to-text",
      {
        model: model,
        audioUrl: audioUrl,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
          Referer: "https://ai.clauodflare.workers.dev/",
        },
        timeout: 30000,
      },
    )
    return data
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to convert speech to text from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/cf/whisper",
    name: "whisper",
    category: "CloudflareAi",
    description: "This API endpoint transcribes speech from an audio URL into text using a Cloudflare AI model, specifically the Whisper model. This is invaluable for applications requiring voice-to-text conversion, such as transcribing meetings, creating captions for videos, or enabling voice commands in applications. Users provide the audio file's URL as a query parameter and can optionally specify a custom AI model. The default model is '@cf/openai/whisper', known for its high accuracy in speech recognition.",
    tags: ["AI", "Speech-to-Text", "Cloudflare", "Audio Processing", "Whisper"],
    example: "audioUrl=https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav&model=@cf/openai/whisper",
    parameters: [
      {
        name: "audioUrl",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "The URL of the audio file to transcribe",
        example: "https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav",
      },
      {
        name: "model",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Custom AI model to use for speech-to-text",
        example: "@cf/openai/whisper",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { audioUrl, model } = req.query || {}

      if (typeof audioUrl !== "string" || audioUrl.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter 'audioUrl' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https?:\/\/\S+$/.test(audioUrl.trim())) {
        return {
          status: false,
          error: "Invalid URL format for 'audioUrl'",
          code: 400,
        }
      }

      const sttModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/openai/whisper"

      try {
        const result = await speechToText(audioUrl.trim(), sttModel)

        if (!result) {
          return {
            status: false,
            error: "No transcription result for the provided audio",
            code: 500,
          }
        }

        return {
          status: true,
          data: result,
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
    endpoint: "/api/cf/whisper",
    name: "whisper",
    category: "CloudflareAi",
    description: "This API endpoint transcribes speech from an audio URL into text using a Cloudflare AI model. It accepts the audio URL and an optional custom model in a JSON request body. This is invaluable for applications requiring voice-to-text conversion, such as transcribing meetings, creating captions for videos, or enabling voice commands in applications. The default model is '@cf/openai/whisper', known for its high accuracy in speech recognition.",
    tags: ["AI", "Speech-to-Text", "Cloudflare", "Audio Processing", "Whisper"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              audioUrl: {
                type: "string",
                format: "url",
                description: "The URL of the audio file to transcribe",
                example: "https://example.com/speech.mp3",
                minLength: 1,
                maxLength: 2048,
              },
              model: {
                type: "string",
                description: "Custom AI model to use for speech-to-text",
                example: "@cf/openai/whisper",
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ["audioUrl"],
            additionalProperties: false,
          },
          example: {
            audioUrl: "https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav",
            model: "@cf/openai/whisper",
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { audioUrl, model } = req.body || {}

      if (typeof audioUrl !== "string" || audioUrl.trim().length === 0) {
        return {
          status: false,
          error: "Request body must contain 'audioUrl' and it must be a non-empty string",
          code: 400,
        }
      }

      if (!/^https?:\/\/\S+$/.test(audioUrl.trim())) {
        return {
          status: false,
          error: "Invalid URL format for 'audioUrl'",
          code: 400,
        }
      }

      const sttModel = typeof model === "string" && model.trim().length > 0 ? model.trim() : "@cf/openai/whisper"

      try {
        const result = await speechToText(audioUrl.trim(), sttModel)

        if (!result) {
          return {
            status: false,
            error: "No transcription result for the provided audio",
            code: 500,
          }
        }

        return {
          status: true,
          data: result,
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