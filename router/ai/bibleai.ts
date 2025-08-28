import axios from "axios"

const validTranslations = {
  "IRVBen": "Indian Revised Version (Bengali)",
  "CUV": "Chinese Union Version",
  "nld1939": "Dutch 1939 Petrus Canisiusvertaling",
  "NBG": "Dutch NBG 1951",
  "ESV": "English Standard Version",
  "NASB20": "New American Standard Bible 2020",
  "ASV14": "American Standard Version 1914",
  "KJV11": "King James Version 1611",
  "LSG": "Louis Segond (French)",
  "LUT": "Luther Bible (German)",
  "IRVHin": "Indian Revised Version (Hindi)",
  "PaBa": "Pavitra Bible (Hindi)",
  "TB": "Alkitab Terjemahan Baru 1974 (Indonesian)",
  "DB1885": "Diodati Bibbia 1885 (Italian)",
  "NR06": "Nuova Riveduta 2006 (Italian)",
  "polUBG": "Polish Biblia Gdańska",
  "AA": "Almeida Atualizada (Portuguese)",
  "RVR09": "Reina Valera 1909 (Spanish)",
  "SKB": "Svenska Kärnbibeln",
  "SV1917": "Swedish 1917 Bible",
  "KJV": "King James Version (Thai)",
  "IRVUrd": "Indian Revised Version (Urdu)",
  "DGV": "Kitab-e-Muqaddas (Urdu)",
  "ERVVI": "Easy-to-Read Vietnamese Version",
}

function isValidTranslation(abbreviation: string): boolean {
  return Object.keys(validTranslations).includes(abbreviation)
}

async function searchBibleAI(question: string, translationAbbr: string = "TB") {
  if (!isValidTranslation(translationAbbr)) {
    throw new Error(`Translation "${translationAbbr}" is not valid.`)
  }

  const encodedQuestion = encodeURIComponent(question)

  const config = {
    method: "GET",
    url: `https://api.bibleai.com/v2/search?question=${encodedQuestion}&translation=${translationAbbr}&filters[]=bible&filters[]=books&filters[]=articles&pro=true&language=en-US&id=`,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 12; itel S665L Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua": "\"Android WebView\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?1",
      "app-version": "1.2.0",
      "device-agent": "itel S665L Build/SP1A.210812.016 Android 12",
      "origin": "https://localhost",
      "x-requested-with": "bible.ai.search",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "sec-fetch-storage-access": "active",
      "referer": "https://localhost/",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "priority": "u=1, i",
    },
    timeout: 30000,
  }

  try {
    const { data: response } = await axios.request(config)
    return { answer: response.data.answer, sources: response.data.sources, metadata: response.data.metadata }
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`)
    } else if (error.request) {
      throw new Error("Network Error: No response received from API")
    } else {
      throw new Error(`Request Error: ${error.message}`)
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/bibleai",
    name: "Bible AI",
    category: "AI",
    description: "This API endpoint allows users to search the Bible and related content using artificial intelligence. You can ask questions or provide topics, and the AI will provide answers, relevant verses, and additional resources. The endpoint supports various Bible translations, enabling users to specify their preferred version for the search. This is ideal for researchers, students, or anyone seeking quick and accurate information from biblical texts across different translations.",
    tags: ["Bible", "Search", "Religious", "AI", "Scripture"],
    example: "?question=love&translation=TB",
    parameters: [
      {
        name: "question",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Question or topic to search in the Bible",
        example: "What is faith?",
      },
      {
        name: "translation",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: Object.keys(validTranslations),
        },
        description: "Bible translation abbreviation",
        example: "ESV",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { question, translation } = req.query || {}

      if (!question) {
        return {
          status: false,
          error: "Parameter \"question\" is required",
          code: 400,
        }
      }

      if (typeof question !== "string" || question.trim().length === 0) {
        return {
          status: false,
          error: "Question must be a non-empty string",
          code: 400,
        }
      }

      if (question.length > 1000) {
        return {
          status: false,
          error: "Question must be less than 1000 characters",
          code: 400,
        }
      }

      const selectedTranslation = (translation as string)?.toUpperCase() || "TB"

      if (!isValidTranslation(selectedTranslation)) {
        return {
          status: false,
          error: `Invalid translation "${selectedTranslation}". Valid translations: ${Object.keys(validTranslations).join(", ")}`,
          code: 400,
        }
      }

      try {
        const response = await searchBibleAI(question.trim(), selectedTranslation)

        return {
          status: true,
          data: {
            question: question,
            translation: validTranslations[selectedTranslation as keyof typeof validTranslations],
            translationCode: selectedTranslation,
            results: response,
          },
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
    endpoint: "/api/ai/bibleai",
    name: "Bible AI",
    category: "AI",
    description: "This API endpoint enables users to search the Bible and related content via a POST request with an AI-powered engine. You can submit questions or topics in the request body, and the AI will provide comprehensive answers, relevant biblical verses, and supplementary articles. The endpoint allows for specifying a preferred Bible translation, making it adaptable for various user needs. This is an excellent tool for developers building applications that require in-depth biblical research, theological study, or quick scriptural references.",
    tags: ["Bible", "Search", "Religious", "AI", "Scripture"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["question"],
            properties: {
              question: {
                type: "string",
                description: "Question or topic to search in the Bible",
                example: "What does the Bible say about forgiveness?",
                minLength: 1,
                maxLength: 1000,
              },
              translation: {
                type: "string",
                description: "Bible translation abbreviation (optional)",
                enum: Object.keys(validTranslations),
                example: "KJV",
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
      const { question, translation } = req.body || {}

      if (!question) {
        return {
          status: false,
          error: "Parameter \"question\" is required",
          code: 400,
        }
      }

      if (typeof question !== "string" || question.trim().length === 0) {
        return {
          status: false,
          error: "Question must be a non-empty string",
          code: 400,
        }
      }

      if (question.length > 1000) {
        return {
          status: false,
          error: "Question must be less than 1000 characters",
          code: 400,
        }
      }

      const selectedTranslation = (translation as string)?.toUpperCase() || "TB"

      if (!isValidTranslation(selectedTranslation)) {
        return {
          status: false,
          error: `Invalid translation "${selectedTranslation}". Valid translations: ${Object.keys(validTranslations).join(", ")}`,
          code: 400,
        }
      }

      try {
        const response = await searchBibleAI(question.trim(), selectedTranslation)

        return {
          status: true,
          data: {
            question: question,
            translation: validTranslations[selectedTranslation as keyof typeof validTranslations],
            translationCode: selectedTranslation,
            results: response,
          },
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