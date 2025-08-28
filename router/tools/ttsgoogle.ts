import axios from "axios"
import { Buffer } from "buffer"

const ck = `# Netscape HTTP Cookie File
# http://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file!  Do not edit.

.gemini.google.com	TRUE	/	FALSE	1771146485	_ga	GA1.1.1119144039.1723713365
.gemini.google.com	TRUE	/	FALSE	1739973360	_gcl_au	1.1.2088761144.1732197360
.google.com	TRUE	/	FALSE	1750386349	SEARCH_SAMESITE	CgQI75wB
.google.com	TRUE	/	FALSE	1769954360	SID	g.a000rwgHeGZrz9y_SUE3vLuLRAXa7PXu23AI8lR26-MAZyNrYy7qsNu0SJeu7CsQtSI0V1UizAACgYKAYUSARASFQHGX2MiqjNwsRM3J-H6Qjtq4RWzrhoVAUF8yKrpTl7a6E8qpIp2obumt6mA0076
.google.com	TRUE	/	TRUE	1769954360	__Secure-1PSID	g.a000rwgHeGZrz9y_SUE3vLuLRAXa7PXu23AI8lR26-MAZyNrYy7qUdMFbWyuwMFTt-bk3Ve5awACgYKAQ4SARASFQHGX2MiYZI6LzvRvy6oikfkw1EQXxoVAUF8yKrBjPOyinpCh2hWbnxebrLx0076
.google.com	TRUE	/	TRUE	1769954360	__Secure-3PSID	g.a000rwgHeGZrz9y_SUE3vLuLRAXa7PXu23AI8lR26-MAZyNrYy7qpr5DN7XGdRxP0mZmmHaQlQACgYKAbQSARASFQHGX2MigJd5isCZCLCyWwGuBHKeTxoVAUF8yKre3I4qP1UJtMJR1I3xaw_x0076
.google.com	TRUE	/	FALSE	1769954360	HSID	AcK2pYSICr0m5vnfx
.google.com	TRUE	/	TRUE	1769954360	SSID	A6hnDJO-5GUFxInVg
.google.com	TRUE	/	FALSE	1769954360	APISID	_YUMvJaRkbLz8SDp/Aazx_-GbIamNBEqsP
.google.com	TRUE	/	TRUE	1769954360	SAPISID	CaxTa_5jC8MVeX3Y/A_wZ5nFoW6k_h0QIp
.google.com	TRUE	/	TRUE	1769954360	__Secure-1PAPISID	CaxTa_5jC8MVeX3Y/A_wZ5nFoW6k_h0QIp
.google.com	TRUE	/	TRUE	1769954360	__Secure-3PAPISID	CaxTa_5jC8MVeX3Y/A_wZ5nFoW6k_h0QIp
.google.com	TRUE	/	TRUE	1742215973	AEC	AZ6Zc-WmCBxLx0He79__0pKbzfh9twPSn6-xYcsbw7Q_xqv2vEbhKJg56gE
.google.com	TRUE	/	TRUE	1752397421	NID	520=OKPQHnBwmHTTNxZ070FbVf_h5Hn5SrsXpKIqTYJOS6XsXfDsm11iN3XPdDdx4fjdhBJcPJ9StgtRrYFoZ8wGLFGaG5sSjl6SMADT2HVqoUAG-aykutROexxYKAH-XYtT9x8Q7Gd1da27fiYS_TINFqI7GTsQYurRqTRkQITx9D7x0kj-NuSZv9NxBmB4kUQw8oFniCZUgMXvEO1OEoJOzHH7K2MHrmLw9x1KQpZATFKbbqKF2aUMkXCz3Oti_O4nJgsj54D31XXwVNJtZ_17D0BCu9u88VNUlE217YQYGlewbsxWXuBtrlm1oAc7ECn8OEd8C4fmPhxR_qh9_DvfhkHhwDpLLB4fG_5j97Ly-x_YUTqezLoX2S8TXVPSTG0abYhfdfMK6xfonUFBeUivvSGd8Np9QA6Ofb1kvo1xaKyThKPI7iF_8w2YSf1MNggNMpvOAhRaVIUCruLz1Enq3BjZfxR03KfpagghbhXwGM2bsYTgysL7QPo4LHMvbkm4_1Nhwj6Q4sldOuLA80JpuliwirDaCV4mu4xsE_P-UtoXf-LPI3zdu6YMyDrYVcV_p64-c23zkXz3-WAm2VALpiRNc7jwDT1gIYI8VRggcF52iB-gGmANT2jELxN1xOhkKuyJ02z6t6PXa2afhpnPt8ruxzZAAW5kYwYj0my2ABc5vyEcIxADShK3dA5pe63RxToXaLzXIC_3dh4SWW3bMmCMGeVggS_cVGfFVzvQyfyUmurEp1gRK-_oKGSHZTm868M4x25o80F0tX9Ha1ZjL1VKpqMg3XfQYHCz-QvUTzpnGKXmdQJzwLjJoVC8ftaUGQgPW3KoQhDFdla2JgwALHRfbpdkQBz0PEVeV9tSptz1fgrVny2tGpVeI9GEVIv0gw3u3yU3liSVkV-8cTjq15qdeMGaYExbVReDK6FEQ2kMVWH-8ApDgAmNq-EzncLGvbDu0mS1h2PGW3GrJBvz21PYQs6QJd7CyvT2Opdcik2rO6YeyQsv9ee5uiWPLb3l_IsSmQqvPgCXTakwgTe7stfYWqInZhX0RR6Pu17K1jhGQoS2_Aun_86tsdjt8uj21Fmau6eEOvA-c0Yu7uI_YtdMBrERhTHQV0WWsZjIUUGRqOB0mgo8qvfLo-Q
.gemini.google.com	TRUE	/	FALSE	1771147280	_ga_WC57KJ50ZZ	GS1.1.1736586220.31.1.1736587280.0.0.0
.google.com	TRUE	/	FALSE	1768123282	SIDCC	AKEyXzUFrVmrAZefkhMFOvyhoXB4ikUB0T1_FT_iL-Hop7C3ETIsYF9qcDQMRYQ04z3JztOt9g
.google.com	TRUE	/	TRUE	1768123282	__Secure-1PSIDCC	AKEyXzVlohFJD5W1aSItN3iiqVWFeQfI6KedW0HwWjt4XaalwSkVVMrsqpdSUuRI6n19DNaV0Go
.google.com	TRUE	/	TRUE	1768123282	__Secure-3PSIDCC	AKEyXzUThroVqIUO__h4c1CSs88LzursapxSgy0wR8t_CGj4BeQ_Koqe6RQiLBPbtFI3s8iYqg`

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "audio/mpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}


const parseCookies = (cookieString: string): { [key: string]: string } => {
  const cookies: { [key: string]: string } = {}
  const lines = cookieString.split("\n")

  lines.forEach((line) => {
    if (
      line.startsWith(".google.com") ||
      line.startsWith(".gemini.google.com")
    ) {
      const parts = line.split("\t")
      if (parts.length >= 7) {
        cookies[parts[5]] = parts[6]
      }
    }
  })
  return cookies
}

async function extractBase64(response: string): Promise<string> {
  try {
    const lines = response.split("\n")
    for (const line of lines) {
      if (line.includes("wrb.fr") && line.includes("XqA3Ic")) {
        const jsonData = JSON.parse(line)
        const firstElement = jsonData[0]
        const base64String = firstElement[2]
        return base64String.replace(/^"/, "").replace(/"$/, "").replace(/\\"/g, "").trim()
      }
    }
    throw new Error("Base64 data not found in response")
  } catch (error: any) {
    throw new Error("Error extracting base64: " + error.message)
  }
}

async function getGeminiToken(): Promise<{ at: string | null, sid: string | null }> {
  try {
    const cookies = parseCookies(ck)
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ")
    const bardRes = await axios.get("https://gemini.google.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        Cookie: cookieString,
      },
      timeout: 30000,
    })

    const bardText = bardRes.data
    const tokens = { at: null, sid: null }

    const atMatch = bardText.match(/"FdrFJe":"([^"]+)"/)
    if (atMatch) tokens.sid = atMatch[1]

    const SNlM0eMatch = bardText.match(/"SNlM0e":"([^"]+)"/)
    if (SNlM0eMatch) tokens.at = SNlM0eMatch[1]

    return tokens
  } catch (error: any) {
    throw new Error("Error getting Gemini tokens: " + error.message)
  }
}

async function makeGeminiRequest(query: string, language: string): Promise<string> {
  const cookies = parseCookies(ck)
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ")
  const url = "https://gemini.google.com/_/BardChatUi/data/batchexecute"
  const tokens = await getGeminiToken()
  const params = {
    rpcids: "XqA3Ic",
    "source-path": "/app",
    bl: "boq_assistant-bard-web-server_20250226.06_p2",
    "f.sid": tokens.sid,
    hl: "id",
    "_reqid": "1951413",
    rt: "c",
  }

  const headers = {
    "authority": "gemini.google.com",
    "accept": "*/*",
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "origin": "https://gemini.google.com",
    "referer": "https://gemini.google.com/",
    "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
    "sec-ch-ua-mobile": "?1",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
    Cookie: cookieString,
  }

  const message = query.replace(/\n/g, "\\\\n")
  const data = new URLSearchParams()
  data.append("f.req", `[[["XqA3Ic","[null,\\"${message}\\",\\"${language}\\",null,2]",null,"generic"]]]`)
  data.append("at", tokens.at!)

  const response = await axios.post(url, data.toString(), { params, headers, timeout: 30000 })
  return response.data
}

async function getAudio(query: string, language: string = "ja-JP"): Promise<string> {
  const result = await makeGeminiRequest(query, language)
  return await extractBase64(result)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/ttsgoogle",
    name: "tts google",
    category: "Tools",
    description: "This API endpoint converts text into speech using Google's Text-to-Speech (TTS) capabilities, leveraging Google Gemini's underlying infrastructure. It requires specific cookies to function, which are hardcoded within the API for demonstration purposes. Users can provide text as a query parameter, and the API will return the spoken audio in MP3 format. This is ideal for generating natural-sounding voiceovers, integrating voice responses into applications, or testing Google's TTS quality for various languages. Note: The reliability of this endpoint may vary due to its reliance on hardcoded cookies and external services.",
    tags: ["TOOLS", "TTS", "Google"],
    example: "?text=halo%20semua",
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
        description: "Text to convert to speech",
        example: "halo semua",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text } = req.query || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required.",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const base64Audio = await getAudio(text.trim())

        if (!base64Audio) {
          throw new Error("Failed to get audio")
        }

        const audioBuffer = Buffer.from(base64Audio, "base64")

        return createImageResponse(audioBuffer)

      } catch (error: any) {
        console.error("TTS Google Error:", error.message)
        return {
          status: false,
          error: error.message || "An internal server error occurred.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/ttsgoogle",
    name: "tts google",
    category: "Tools",
    description: "This API endpoint converts text into speech using Google's Text-to-Speech (TTS) capabilities, leveraging Google Gemini's underlying infrastructure. It requires specific cookies to function, which are hardcoded within the API for demonstration purposes. Users can provide text in the JSON request body, and the API will return the spoken audio in MP3 format. This is ideal for generating natural-sounding voiceovers, integrating voice responses into applications, or testing Google's TTS quality for various languages. Note: The reliability of this endpoint may vary due to its reliance on hardcoded cookies and external services.",
    tags: ["TOOLS", "TTS", "Google"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["text"],
            properties: {
              text: {
                type: "string",
                description: "The text to convert to speech",
                example: "halo semua",
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
      const { text } = req.body || {}

      if (!text) {
        return {
          status: false,
          error: "Parameter 'text' is required.",
          code: 400,
        }
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const base64Audio = await getAudio(text.trim())

        if (!base64Audio) {
          throw new Error("Failed to get audio")
        }

        const audioBuffer = Buffer.from(base64Audio, "base64")

        return createImageResponse(audioBuffer)

      } catch (error: any) {
        console.error("TTS Google Error:", error.message)
        return {
          status: false,
          error: error.message || "An internal server error occurred.",
          code: 500,
        }
      }
    },
  },
]