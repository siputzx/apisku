import axios from "axios"
import { Buffer } from "buffer"

declare const proxy: () => string | null

async function scrape(text: string, cookie: string, options: {
  promptSystem?: string;
  imageUrl?: string | null;
  conversationID?: string | null;
  responseID?: string | null;
  choiceID?: string | null;
} = {}) {
  const {
    promptSystem = "",
    imageUrl = null,
    conversationID = null,
    responseID = null,
    choiceID = null,
  } = options

  const gemini = new GeminiAPI({
    cookie,
    systemPrompt: promptSystem,
    debug: false,
  })

  let imageBuffer: Buffer | undefined

  if (imageUrl) {
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
      imageBuffer = Buffer.from(imageResponse.data)
    } catch (error: any) {
      console.error("Error fetching image:", error.message)
      throw new Error("Failed to fetch image from URL")
    }
  }

  const queryOptions = {
    imageBuffer,
    conversationID,
    responseID,
    choiceID,
  }

  const result = await gemini.query(text, queryOptions)

  if (!result.aiResponse || result.aiResponse.includes("Error")) {
    throw new Error(result.aiResponse || "No response from API")
  }

  return {
    response: result.aiResponse,
    addition: result.addition || {},
    conversationID: result.conversationID,
    responseID: result.responseID,
    choiceID: result.choiceID,
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gemini",
    name: "gemini [ BETA ]",
    category: "AI",
    description: "This API endpoint provides a BETA version interface to interact with the Gemini AI model using GET requests. Users can send text prompts, along with optional system prompts, image URLs, and conversation context (conversationID, responseID, choiceID) to maintain continuity in dialogue. A valid Google Gemini authentication cookie is required for access. This endpoint is designed for experimental use and can be utilized for advanced AI interactions, including multimodal inputs (text and image) and stateful conversations. The response includes the AI's answer and additional metadata for conversation tracking and potential multimedia outputs.",
    tags: ["AI", "Gemini", "BETA", "Multimodal AI", "Conversational AI"],
    example: "?text=What is the capital of France?&cookie=g.a000xgjZzrQfaZEtfrx6RTCW0Q2eNdm21jCoqu6_6gbIG_5BW1UqEWHMHU14F9OS04MFWXsY7gACgYKAYQSARESFQHGX2MidwdmCRTP1XVih97lZJXIcBoVAUF8yKrcN4up_gHiXrkm5wXkr5eG0076&promptSystem=You are a helpful assistant.",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "The text content to process with Gemini",
        example: "Explain quantum physics simply.",
      },
      {
        name: "cookie",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 10,
          maxLength: 1000,
        },
        description: "Authentication cookie for Gemini API",
        example: "",
      },
      {
        name: "promptSystem",
        in: "query",
        required: false,
        schema: {
          type: "string",
          maxLength: 1000,
        },
        description: "Optional system prompt for the AI to guide its behavior",
        example: "Act as a professional physicist.",
      },
      {
        name: "imageUrl",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "url",
          maxLength: 500,
        },
        description: "Optional URL of an image to process with the text prompt",
        example: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Quantum_mechanics_model.svg/1200px-Quantum_mechanics_model.svg.png",
      },
      {
        name: "conversationID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional conversation ID to continue a previous dialogue",
        example: "",
      },
      {
        name: "responseID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional response ID from a previous Gemini response",
        example: "",
      },
      {
        name: "choiceID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional choice ID from a previous Gemini response",
        example: "",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, cookie, promptSystem, imageUrl } = req.query || {}
      const { conversationID, responseID, choiceID } = req.headers || {}

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!cookie || typeof cookie !== "string" || cookie.trim().length === 0) {
        return {
          status: false,
          error: "Cookie parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      const options: {
        promptSystem?: string;
        imageUrl?: string;
        conversationID?: string;
        responseID?: string;
        choiceID?: string;
      } = {}

      if (promptSystem && typeof promptSystem === "string") {
        options.promptSystem = promptSystem.trim()
      }
      if (imageUrl && typeof imageUrl === "string") {
        options.imageUrl = imageUrl.trim()
      }
      if (conversationID && typeof conversationID === "string") {
        options.conversationID = conversationID.trim()
      }
      if (responseID && typeof responseID === "string") {
        options.responseID = responseID.trim()
      }
      if (choiceID && typeof choiceID === "string") {
        options.choiceID = choiceID.trim()
      }

      try {
        const result = await scrape(text.trim(), cookie.trim(), options)

        const headersToSend: { [key: string]: string } = {}
        if (result.conversationID) headersToSend["conversationID"] = result.conversationID
        if (result.responseID) headersToSend["responseID"] = result.responseID
        if (result.choiceID) headersToSend["choiceID"] = result.choiceID

        return {
          status: true,
          data: {
            response: result.response,
            addition: result.addition || {},
          },
          headers: headersToSend,
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
    endpoint: "/api/ai/gemini",
    name: "gemini [ BETA ]",
    category: "AI",
    description: "This API endpoint offers a BETA version interface to interact with the Gemini AI model using POST requests. Users can send text prompts, along with optional system prompts, image URLs, and conversation context (conversationID, responseID, choiceID) within the JSON request body. A valid Google Gemini authentication cookie is required. This endpoint is designed for experimental use and facilitates advanced AI interactions, including multimodal inputs (text and image) and stateful conversations, making it suitable for complex application integrations requiring rich AI capabilities. The response includes the AI's answer and additional metadata for conversation tracking and potential multimedia outputs.",
    tags: ["AI", "Gemini", "BETA", "Multimodal AI", "Conversational AI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["content", "cookie"],
            properties: {
              content: {
                type: "string",
                description: "The text content to process with Gemini",
                example: "Describe the process of photosynthesis.",
                minLength: 1,
                maxLength: 2000,
              },
              cookie: {
                type: "string",
                description: "Authentication cookie for Gemini API",
                example: "",
                minLength: 10,
                maxLength: 1000,
              },
              promptSystem: {
                type: "string",
                description: "Optional system prompt for the AI to guide its behavior",
                example: "You are a helpful botanist.",
                maxLength: 1000,
              },
              imageUrl: {
                type: "string",
                format: "url",
                description: "Optional URL of an image to process with the text prompt",
                example: "",
                maxLength: 500,
              },
              conversationID: {
                type: "string",
                description: "Optional conversation ID to continue a previous dialogue",
                example: "",
              },
              responseID: {
                type: "string",
                description: "Optional response ID from a previous Gemini response",
                example: "",
              },
              choiceID: {
                type: "string",
                description: "Optional choice ID from a previous Gemini response",
                example: "",
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
      const { content: text, cookie, promptSystem, imageUrl, conversationID, responseID, choiceID } = req.body || {}

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!cookie || typeof cookie !== "string" || cookie.trim().length === 0) {
        return {
          status: false,
          error: "Cookie parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      const options: {
        promptSystem?: string;
        imageUrl?: string;
        conversationID?: string;
        responseID?: string;
        choiceID?: string;
      } = {}

      if (promptSystem && typeof promptSystem === "string") {
        options.promptSystem = promptSystem.trim()
      }
      if (imageUrl && typeof imageUrl === "string") {
        options.imageUrl = imageUrl.trim()
      }
      if (conversationID && typeof conversationID === "string") {
        options.conversationID = conversationID.trim()
      }
      if (responseID && typeof responseID === "string") {
        options.responseID = responseID.trim()
      }
      if (choiceID && typeof choiceID === "string") {
        options.choiceID = choiceID.trim()
      }

      try {
        const result = await scrape(text.trim(), cookie.trim(), options)

        const headersToSend: { [key: string]: string } = {}
        if (result.conversationID) headersToSend["conversationID"] = result.conversationID
        if (result.responseID) headersToSend["responseID"] = result.responseID
        if (result.choiceID) headersToSend["choiceID"] = result.choiceID

        return {
          status: true,
          data: {
            response: result.response,
            addition: result.addition || {},
          },
          headers: headersToSend,
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

class GeminiAPI {
  config: {
    cookie: string;
    systemPrompt: string;
    debug: boolean;
  };
  initialUrl: string;
  streamUrl: string;
  uploadUrl: string;
  headers: { [key: string]: string };
  wizData: any;

  constructor(config: { cookie: string; systemPrompt?: string; debug?: boolean }) {
    if (!config.cookie) throw new Error("Cookie required")
    this.config = {
      cookie: "__Secure-1PSID=" + config.cookie,
      systemPrompt: config.systemPrompt || "",
      debug: config.debug || false,
    }
    this.initialUrl = "https://gemini.google.com"
    this.streamUrl = "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate"
    this.uploadUrl = "https://push.clients6.google.com/upload/"
    this.headers = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-model": "\"itel S665L\"",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua-platform-version": "\"12.0.0\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-client-data": "COXZygE=",
      "x-goog-ext-525001261-jspb": "[1]",
      "x-same-domain": "1",
      cookie: this.config.cookie,
      Referer: "https://gemini.google.com/",
      "Referrer-Policy": "origin",
    }
    this.wizData = null
  }

  log(message: string) {
    if (this.config.debug) console.log(`\x1b[36m[GeminiAPI]\x1b[0m \x1b[35m${message}\x1b[0m`)
  }

  async fetchWizData() {
    this.log("🚀 Starting initialization...")
    this.log("🔒 Fetching WIZ data...")
    try {
      const response = await axios.get(proxy() + this.initialUrl, { headers: this.headers })
      const wizRegex = /window\.WIZ_global_data\s*=\s*({[\s\S]*?});/
      const match = response.data.match(wizRegex)
      this.wizData = match ? JSON.parse(match[1]) : null
      this.log(this.wizData ? "✅ WIZ data successfully fetched" : "❌ Failed to fetch WIZ data")
    } catch (error: any) {
      this.log(`❌ Error fetching WIZ data: ${error.message}`)
      this.wizData = null
    }
    return this.wizData
  }

  async uploadImage(fileName: string, fileBuffer: Buffer): Promise<string> {
    this.log("📤 Preparing to upload image...")
    if (!this.wizData) await this.fetchWizData()
    if (!this.wizData) {
      this.log("❌ No WIZ data available")
      return "Error: No WIZ data"
    }

    const fileSize = fileBuffer.byteLength
    const uploadHeaders = {
      ...this.headers,
      authority: "push.clients6.google.com",
      "sec-fetch-site": "same-site",
      "push-id": this.wizData.qKIAYe,
      origin: "https://gemini.google.com/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "x-client-pctx": this.wizData.Ylro7b,
      "x-goog-upload-command": "start",
      "x-goog-upload-header-content-length": fileSize.toString(),
      "x-goog-upload-protocol": "resumable",
      "x-tenant-id": "bard-storage",
    }

    try {
      this.log("🌐 Sending initial upload request...")
      const startResponse = await axios.post(proxy() + this.uploadUrl, `File name: ${fileName}`, { headers: uploadHeaders })
      const uploadUrl = startResponse.headers["x-goog-upload-url"] as string
      if (!uploadUrl) {
        this.log("❌ No upload URL received")
        return "Error: No upload URL"
      }
      this.log(`🔗 Upload URL received: ${uploadUrl}`)

      const uploadFileHeaders = {
        ...uploadHeaders,
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        "x-goog-upload-command": "upload, finalize",
        "x-goog-upload-offset": "0",
      }

      this.log("📦 Uploading image file...")
      const uploadResponse = await axios.post(uploadUrl, fileBuffer, { headers: uploadFileHeaders })
      this.log("✅ Image uploaded successfully")
      return uploadResponse.data || uploadUrl.split("/").pop()!
    } catch (error: any) {
      this.log(`❌ Image upload failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }

  async fetchImageUrl(rawImageUrl: string): Promise<string | null> {
    this.log("📸 Fetching real image URL...")
    const imageHeaders = {
      authority: new URL(rawImageUrl).hostname,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-model": "\"itel S665L\"",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua-platform-version": "\"12.0.0\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "x-client-data": "COXZygE=",
    }

    try {
      const firstResponse = await axios.get(rawImageUrl, {
        headers: imageHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
      })
      const redirectUrl = firstResponse.headers.location as string
      if (!redirectUrl) {
        this.log("❌ No redirect URL found")
        return null
      }

      const secondHeaders = {
        authority: new URL(redirectUrl).hostname,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        cookie: this.config.cookie,
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "x-client-data": "COXZygE=",
      }

      const secondResponse = await axios.get(redirectUrl, {
        headers: secondHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
      })
      const finalUrl = secondResponse.headers.location as string
      if (!finalUrl) {
        this.log("❌ No final URL found")
        return null
      }
      return finalUrl
    } catch (error: any) {
      this.log(`❌ Error fetching image URL: ${error.message}`)
      return null
    }
  }

  async query(query: string, options: {
    imageBuffer?: Buffer;
    conversationID?: string | null;
    responseID?: string | null;
    choiceID?: string | null;
  } = {}) {
    if (!query) throw new Error("Query required")
    this.log(`💬 Processing query: \x1b[31m${query}\x1b[0m`)
    if (!this.wizData) await this.fetchWizData()
    if (!this.wizData) {
      this.log("❌ No WIZ data available")
      return { aiResponse: "Error: No WIZ data", conversationID: null, responseID: null, choiceID: null }
    }

    const { imageBuffer, conversationID, responseID, choiceID } = options
    const params = {
      bl: this.wizData.cfb2h,
      "f.sid": this.wizData.FdrFJe,
      hl: "id",
      _reqid: Math.floor(Math.random() * 9000000 + 1000000).toString(),
      rt: "c",
    }

    const messageStruct: any[] = [
      [query, 0, null, null, null, null, 0],
      ["id"],
      [conversationID || "", responseID || "", choiceID || "", null, null, null, null, null, null, ""],
      null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 1, null, null, null, null, null,
      ["putu", "", this.config.systemPrompt || "", null, null, null, null, null, 0, null, 1, null, null, null, []],
      null, null, 1, null, null, null, null, null, null, null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 1, null, null, null, null, [1],
    ]

    if (imageBuffer) {
      this.log("🖼️ Processing image input...")
      const imageLocation = await this.uploadImage("img.jpg", imageBuffer)
      if (imageLocation.includes("Error")) {
        this.log("❌ Image upload failed")
        return { aiResponse: imageLocation, conversationID: null, responseID: null, choiceID: null }
      }
      messageStruct[0][3] = [[[imageLocation, 1, null, "image/jpeg"], "image.jpeg", null, null, null, null, null, null, [0]]]
      this.log("✅ Image location added to message structure")
    }

    this.log("🌐 Sending query to Gemini API...")
    const data = {
      "f.req": JSON.stringify([null, JSON.stringify(messageStruct)]),
      at: this.wizData.SNlM0e,
    }

    let response: any
    try {
      response = await axios.post(proxy() + this.streamUrl, new URLSearchParams(data).toString(), { headers: this.headers, params })
    } catch (error: any) {
      this.log(`❌ Error sending query to Gemini: ${error.message}`)
      throw new Error(`Error sending query to Gemini: ${error.message}`)
    }

    const lines = response.data.split("\n")
    let messageText = "", newConversationID: string | null = null, newResponseID: string | null = null, newChoiceID: string | null = null, rawImageUrl: string | null = null, youtubeUrl: string | null = null, ImageSearch: string | null = null

    this.log("📑 Parsing API response...")
    for (const line of lines) {
      if (!line.startsWith("[[\"wrb.fr\"")) continue
      try {
        const parsedLineMatch = line.match(/\[\["wrb\.fr".*\]\]/)
        if (!parsedLineMatch) continue

        const parsedLine = JSON.parse(parsedLineMatch[0])
        if (parsedLine[0]?.[2]) {
          const parsedChat = JSON.parse(parsedLine[0][2])
          if (parsedChat[4]?.[0]?.[1]?.[0] && parsedChat[4][0][1][0].length > messageText.length) {
            messageText = parsedChat[4][0][1][0]
          }
          if (parsedChat[1]?.length >= 2) {
            newConversationID = parsedChat[1][0]
            newResponseID = parsedChat[1][1]
          }
          if (parsedChat[4]?.[0]?.[0]) {
            newChoiceID = parsedChat[4][0][0]
          }
          if (parsedChat[4]?.[0]?.[12]?.[7]?.[0]?.[0]?.[0]?.[3]?.[3]) {
            rawImageUrl = parsedChat[4][0][12][7][0][0][0][3][3]
          }
          if (parsedChat[4]?.[0]?.[12]?.[1]?.[0]?.[0]?.[0]?.[0]) {
            ImageSearch = parsedChat[4][0][12][1][0][0][0][0]
          }
          if (parsedChat[4]?.[0]?.[12]?.[34]?.[0]?.[1]?.[105]?.[1]?.[0]?.[4]) {
            const url = parsedChat[4][0][12][34][0][1][105][1][0][4]
            if (url.includes("youtube.com") || url.includes("music.youtube.com")) {
              youtubeUrl = url
            }
          }
        }
      } catch (e: any) {
        this.log(`❌ Error parsing line: ${e.message}`)
        continue
      }
    }

    if (messageText) {
      messageText = messageText
        .replace(/http:\/\/googleusercontent\.com\/action_card_content\/0/g, "")
        .replace(/http:\/\/googleusercontent\.com\/action_card_content\/0/g, "")
        .replace(/http:\/\/googleusercontent\.com\/image_collection\/image_retrieval\/\d+/g, "")
        .trim()
    }

    this.log(messageText ? "✅ Query processing completed" : "❌ No response data received")
    const result: {
      aiResponse: string;
      conversationID: string | null;
      responseID: string | null;
      choiceID: string | null;
      addition?: {
        generateImage?: string;
        play?: string;
        img?: string;
      };
    } = {
      aiResponse: messageText || "Error: No response data",
      conversationID: newConversationID,
      responseID: newResponseID,
      choiceID: newChoiceID,
    }

    const addition: {
      generateImage?: string;
      play?: string;
      img?: string;
    } = {}

    if (rawImageUrl) {
      const finalImageUrl = await this.fetchImageUrl(rawImageUrl)
      if (finalImageUrl) {
        addition.generateImage = finalImageUrl
      } else {
        this.log("❌ Failed to fetch final image URL")
      }
    }

    if (youtubeUrl) {
      addition.play = youtubeUrl
    }

    if (ImageSearch) {
      addition.img = ImageSearch
    }

    if (Object.keys(addition).length > 0) {
      result.addition = addition
    }

    return result
  }
}