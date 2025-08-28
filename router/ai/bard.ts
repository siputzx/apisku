import axios from "axios"
declare const proxy: () => string | null

async function bard(query: string) {
  const headers = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
    "sec-ch-ua-arch": "\"x86\"",
    "sec-ch-ua-bitness": "\"64\"",
    "sec-ch-ua-full-version": "\"132.0.6961.0\"",
    "sec-ch-ua-full-version-list": "\"Not A(Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"132.0.6961.0\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "\"\"",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-ch-ua-platform-version": "\"\"",
    "sec-ch-ua-wow64": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": "SID=g.a000xgjZzrQfaZEtfrx6RTCW0Q2eNdm21jCoqu6_6gbIG_5BW1UqfX3rVgA9pY_NUmooLdFOtgACgYKAXMSARESFQHGX2MiStGZcVw3-iYoPwyj8zrLZxoVAUF8yKrAb4ZtewtJKgYqiP8F-xvf0076; __Secure-1PSID=g.a000xgjZzrQfaZEtfrx6RTCW0Q2eNdm21jCoqu6_6gbIG_5BW1UqEWHMHU14F9OS04MFWXsY7gACgYKAYQSARESFQHGX2MidwdmCRTP1XVih97lZJXIcBoVAUF8yKrcN4up_gHiXrkm5wXkr5eG0076; __Secure-3PSID=g.a000xgjZzrQfaZEtfrx6RTCW0Q2eNdm21jCoqu6_6gbIG_5BW1UqY8mGYteZRFfIWjoBiKGCIQACgYKAUoSARESFQHGX2MiRWwwFAvVah8tWyG4XCcJURoVAUF8yKrZcR32U-uyYhsGALqzmIMC0076; HSID=AvmQH0mdl2zBBDDhL; SSID=AL95Dq3nk9IaZOYq9; APISID=2U3-vhdc_snKMweT/AbWKabVcqy1wp0V8m; SAPISID=Io4ANmKtsIQJ6av7/AiZQRUuMKrKtvpamz; __Secure-1PAPISID=Io4ANmKtsIQJ6av7/AiZQRUuMKrKtvpamz; __Secure-3PAPISID=Io4ANmKtsIQJ6av7/AiZQRUuMKrKtvpamz; SEARCH_SAMESITE=CgQIkZ4B; AEC=AVh_V2jx-ygytAWOkdx3Dp-eJgXq2XMY7j28_SPz6l7Ly3JV35AU2K5kbas; NID=524=fgD6K7XFmo5jIfmBF952UZA4owuGNI5ESUmyxZbMQ3tw7f2C20hvREmH1Y6iBUtON8ZzJrkUNdO8c6Fem3aWrBGFKSqN8bOSjS6ipNvxMDfAAqPfLvCw9JVOVSop9qQMA9OpcOM84PaYM6FkUDpwFudEaktUQcoPqOWrExFSp0r9T3XAwM6wYO1o4l58dV7cg0Ie3I2wASVe2RemkdEk7O0TLUh4wTvk9_lfAZbdeXro4QTXCWBqXGfJAVGadstl0QzfJK2eq9Y6g3E; _gcl_au=1.1.694955648.1750223942; _ga=GA1.1.770133012.1750223946; _ga_WC57KJ50ZZ=GS2.1.s1750223946$o1$g1$t1750224696$j48$l0$h0; SIDCC=AKEyXzUfWhB1Uz7zi8AWogT0h1bSsuHnUH-MBEXUGoTa7TTkVkTcahlnzznu9m4aNhNmxDw9Hw; __Secure-1PSIDCC=AKEyXzWj-dKAyEYtgjFqlCP_opyky_ObERiwqUaML3q6G5jXMZeXqn6tR2i5jrhiCh4j4Mp-eQ; __Secure-3PSIDCC=AKEyXzVS4X4jKeszJyynIPdsAoMgZdAyOvq6wERqNvbHs3blb1xGv0JEE-Y67GTH74_AcNM5BQ;",
    "x-client-data": "COXZygE=",
    "x-goog-ext-525001261-jspb": "[1,null,null,null,\"9ec249fc9ad08861\"]",
    "x-same-domain": "1",
    "Referer": "https://gemini.google.com/",
    "Referrer-Policy": "origin",
  }

  try {
    const initialResponse = await fetch(proxy() + "https://gemini.google.com", { headers })
    const html = await initialResponse.text()
    const wizRegex = /window\.WIZ_global_data\s*=\s*({[\s\S]*?});/
    const match = html.match(wizRegex)
    const wizData = match ? eval(`(${match[1]})`) : null

    if (wizData) {
      const params = new URLSearchParams({
        bl: "boq_assistant-bard-web-server_20250313.10_p5",
        "f.sid": wizData.FdrFJe,
        hl: "id",
        _reqid: Math.floor(Math.random() * 9000000 + 1000000).toString(),
        rt: "c",
      })

      const data = new URLSearchParams({
        "f.req": `[null,"[[\\"${query}\\"],null,[\\"\\",\\"\\",\\"\\\"]]\"]`,
        at: wizData.SNlM0e,
      })

      const streamResponse = await fetch(proxy() + `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${params}`, {
        method: "POST",
        headers: headers,
        body: data,
      })

      const responseData = await streamResponse.text()
      let int =
        responseData.split('null,[[\\"')![1]?.split('\\"')[0] ||
        responseData.split('null,[["')![1]?.split('"')[0]
      let baris = responseData.split("\n")
      let lastLine = ""

      for (let i = baris.length - 1; i >= 0; i--) {
        if (baris[i].includes(int)) {
          lastLine = baris[i]
          break
        }
      }

      let chat = JSON.parse(lastLine)[0][2]
      let son = JSON.parse(chat)[4]
      let text = son[0][1][0]
      return text.replace(/\*\*/g, "*")
    }
    throw new Error("Failed to get wizData from Google Bard.")
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/bard",
    name: "bard",
    category: "AI",
    description:
      "This API endpoint allows you to interact with Google Bard by sending a query and receiving a text-based response. It's designed for simple conversational AI interactions, enabling users to ask questions or provide prompts and get relevant information back from the Bard model. The API handles the underlying requests to Google's Gemini service and extracts the core text response for easy consumption. This can be used for chatbots, content generation, or integrating AI Q&A into applications. The output is a plain text response from Bard, with bold formatting converted to asterisks for simplicity.",
    tags: ["AI", "Google Bard", "Chatbot", "NLP", "Generative AI"],
    example: "?query=siapa itu siputzx?",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The query to send to Google Bard",
        example: "Tell me about the history of artificial intelligence.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await bard(query.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
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
    endpoint: "/api/ai/bard",
    name: "bard",
    category: "AI",
    description:
      "This API endpoint allows you to interact with Google Bard by sending a query in the request body and receiving a text-based response. It's designed for simple conversational AI interactions, enabling users to ask questions or provide prompts and get relevant information back from the Bard model. The API handles the underlying requests to Google's Gemini service and extracts the core text response for easy consumption. This can be used for chatbots, content generation, or integrating AI Q&A into applications. The output is a plain text response from Bard, with bold formatting converted to asterisks for simplicity.",
    tags: ["AI", "Google Bard", "Chatbot", "NLP", "Generative AI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The query to send to Google Bard",
                example: "What is the capital of France?",
                minLength: 1,
                maxLength: 1000,
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
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Query parameter in body is required",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string",
          code: 400,
        }
      }

      if (query.length > 1000) {
        return {
          status: false,
          error: "Query must be less than 1000 characters",
          code: 400,
        }
      }

      try {
        const result = await bard(query.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
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