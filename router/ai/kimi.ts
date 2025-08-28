import axios, { AxiosInstance } from "axios"
import crypto from "crypto"

interface KimiResponse {
  id: string
  name: string
  created_at: string
  status: string
}

interface StreamData {
  event: string
  text?: string
  content?: string
  view?: string
  loading?: boolean
  [key: string]: any
}

interface ChatResult {
  response: string
  title: string
  chatId: string
}

class KimiScraper {
  private baseURL = "https://www.kimi.com/api"
  private token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTc1NjQ0NzA1MSwiaWF0IjoxNzUzODU1MDUxLCJqdGkiOiJkMjRyOGlxaTU5NzQwYnFyY3JnMCIsInR5cCI6ImFjY2VzcyIsImFwcF9pZCI6ImtpbWkiLCJzdWIiOiJkMjRyOGlxaTU5NzQwYnFyY3JmZyIsInNwYWNlX2lkIjoiZDI0cjhpaWk1OTc0MGJxcmNuNmciLCJhYnN0cmFjdF91c2VyX2lkIjoiZDI0cjhpaWk1OTc0MGJxcmNuNjAiLCJzc2lkIjoiMTczMTQyNzM0ODU0NTY5NTI5MCIsImRldmljZV9pZCI6Ijc1MzI3NDI2OTg2MjU3MjUxODgiLCJyZWdpb24iOiJvdmVyc2VhcyJ9.Ib8Lsmcdaela6fRspLeYRjr5P6JzZtCer10FD2uroDrC-4BUShPvdb5qKgPQo4XZFjunNJYSnzh-C9kcmZ3i_g"
  private deviceId: string
  private axiosInstance: AxiosInstance

  constructor() {
    this.deviceId = this.generateDeviceId()
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'authorization': `Bearer ${this.token}`,
        'content-type': 'application/json',
        'cookie': `kimi-auth=${this.token}`,
        'origin': 'https://www.kimi.com',
        'r-timezone': 'Asia/Jakarta',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'x-language': 'zh-CN',
        'x-msh-device-id': this.deviceId,
        'x-msh-platform': 'web',
        'x-traffic-id': this.deviceId
      }
    })
  }

  private generateDeviceId(): string {
    return crypto.randomBytes(8).readBigUInt64BE(0).toString()
  }

  private async createChatSession(sessionName: string = "未命名会话"): Promise<KimiResponse> {
    try {
      const validSessionName = sessionName || "未命名会话"
      
      const response = await this.axiosInstance.post('/chat', {
        name: validSessionName,
        born_from: "home",
        kimiplus_id: "kimi",
        is_example: false,
        source: "web",
        tags: []
      })

      return response.data
    } catch (error: any) {
      console.error('❌ Error creating chat session:', error.response?.data || error.message)
      throw error
    }
  }

  private async sendMessage(chatId: string, message: string, useSearch: boolean = true): Promise<ChatResult> {
    return new Promise((resolve, reject) => {
      const requestData = {
        kimiplus_id: "kimi",
        extend: { sidebar: true },
        model: "k2",
        use_search: useSearch,
        messages: [{ role: "user", content: message }],
        refs: [],
        history: [],
        scene_labels: [],
        use_semantic_memory: false,
        use_deep_research: false
      }

      this.axiosInstance.post(`/chat/${chatId}/completion/stream`, requestData, {
        responseType: 'stream'
      }).then(response => {
        let fullResponse = ''
        let sessionTitle = ''
        
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamData = JSON.parse(line.slice(6))
                
                switch (data.event) {
                  case 'rename':
                    sessionTitle = data.text || ''
                    break
                    
                  case 'cmpl':
                    if (data.text && data.view === 'cmpl') {
                      fullResponse += data.text
                    }
                    break
                    
                  case 'all_done':
                    resolve({
                      response: fullResponse,
                      title: sessionTitle,
                      chatId: chatId
                    })
                    return
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        })
        
        response.data.on('error', (error: Error) => {
          reject(error)
        })
        
      }).catch(error => {
        reject(error)
      })
    })
  }

  private validateToken(): boolean {
    try {
      const parts = this.token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp < now) {
        console.warn('⚠️ Token sudah expired!')
        return false
      }
      
      return true
    } catch (error: any) {
      console.error('❌ Error validating token:', error.message)
      return false
    }
  }

  private generateNaturalHeaders(): Promise<void> {
    const userAgents = [
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ]
    
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
    this.axiosInstance.defaults.headers['user-agent'] = randomUA
    
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 2000 + 1000)
    })
  }

  async chat(message: string, sessionName?: string): Promise<{
    sessionId: string
    sessionName: string
    question: string
    answer: string
  }> {
    try {
      if (!this.validateToken()) {
        throw new Error('Token tidak valid atau expired')
      }

      await this.generateNaturalHeaders()
      const session = await this.createChatSession(sessionName)
      await new Promise(resolve => setTimeout(resolve, 1500))
      const result = await this.sendMessage(session.id, message)
      
      return {
        sessionId: session.id,
        sessionName: result.title || session.name,
        question: message,
        answer: result.response
      }
      
    } catch (error: any) {
      console.error('❌ Chat error:', error)
      throw error
    }
  }
}

async function scrape(content: string): Promise<string> {
  try {
    const scraper = new KimiScraper()
    const result = await scraper.chat(content)
    return result.answer
  } catch (error: any) {
    console.error("Kimi API Error:", error.message)
    throw new Error("Failed to get response from Kimi API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/kimi",
    name: "kimi",
    category: "AI",
    description: "This API endpoint allows users to get AI responses from the Kimi service by providing text content as a query parameter. It's designed for conversational AI interactions, content generation, and question-answering tasks. The API requires a 'content' parameter containing the input text for the AI to process.",
    tags: ["AI", "Natural Language Processing", "Text Generation", "Chatbot", "Conversation"],
    example: "?content=Hello%20Kimi,%20explain%20quantum%20physics",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Text content for AI processing",
        example: "What is the meaning of life?",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }: { req: any }) {
      const { content } = req.query || {}

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 2000) {
        return {
          status: false,
          error: "Content parameter must not exceed 2000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
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
    endpoint: "/api/ai/kimi",
    name: "kimi",
    category: "AI",
    description: "This API endpoint enables users to obtain AI responses from the Kimi service by submitting text content within a JSON request body. It supports advanced conversational AI features, content generation, and complex query processing. The API expects a JSON object with a 'content' field containing the text for AI processing.",
    tags: ["AI", "Natural Language Processing", "Text Generation", "Chatbot", "Conversation"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "string",
                description: "Text content for AI processing",
                example: "Write a creative story about time travel.",
                minLength: 1,
                maxLength: 2000,
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
    async run({ req }: { req: any }) {
      const { content } = req.body || {}

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 2000) {
        return {
          status: false,
          error: "Content parameter must not exceed 2000 characters",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
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