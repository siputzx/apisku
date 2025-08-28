import axios from "axios"
import * as cheerio from "cheerio"
import Base64 from "crypto-js/enc-base64"
import Utf8 from "crypto-js/enc-utf8"
import qs from "qs"
import FormData from "form-data"
import * as Uri from "uri-js"
import * as cookie from "cookie"

declare const proxy: () => string | null

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

class RecaptchaBypass {
  private url: string
  private key: string

  constructor({ url, key }: { url: string; key: string }) {
    this.url = url
    this.key = key
  }

  async getCaptchaToken() {
    try {
      const uri = Uri.parse(this.url)
      const domain = Base64.stringify(Utf8.parse(`${uri.scheme}://${uri.host}:443`)).replace(
        /=/g,
        ".",
      )

      const recaptchaOut = await axios
        .get(proxy() + `https://www.google.com/recaptcha/api.js?render=${this.key}`)
        .then((res) => res.data)
      const vToken = recaptchaOut.substring(
        recaptchaOut.indexOf("/releases/") + 10,
        recaptchaOut.indexOf("/recaptcha__en.js"),
      )

      const anchorOut = await axios
        .get(
          proxy() +
            `https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=flicklax&k=${this.key}&co=${domain}&v=${vToken}`,
        )
        .then((res) => res.data)

      const $ = cheerio.load(anchorOut)
      const recaptchaToken = $("#recaptcha-token").attr("value")

      if (!recaptchaToken) {
        throw new Error("Failed to extract recaptcha-token")
      }

      const data = {
        v: vToken,
        reason: "q",
        k: this.key,
        c: recaptchaToken,
        sa: "",
        co: domain,
      }

      const tokenOut = await axios
        .post(proxy() + `https://www.google.com/recaptcha/api2/reload?k=${this.key}`, qs.stringify(data), {
          headers: { referer: "https://www.google.com/recaptcha/api2/" },
        })
        .then((res) => res.data)

      const tokenMatch = tokenOut.match(/"rresp","(.+?)"/)
      if (!tokenMatch) {
        throw new Error("Failed to extract reCAPTCHA response token")
      }

      return { status: "Recaptcha Bypassed", token: tokenMatch[1] }
    } catch (error: any) {
      throw new Error(`reCAPTCHA bypass failed: ${error.message}`)
    }
  }
}

async function getBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  const response = await axios.get(url, { 
    headers,
    responseType: 'arraybuffer'
  })
  return Buffer.from(response.data)
}

async function validateTextInputs(
  url: string,
  texts: string[],
): Promise<{ html: string; cookies: string | null }> {
  const initialResponse = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
    },
  })

  const html = initialResponse.data
  const $ = cheerio.load(html)
  const textInputs = $('input[name="text[]"]').length

  if (texts.length !== textInputs) {
    throw new Error(
      `This effect requires exactly ${textInputs} text input(s), but ${texts.length} provided`,
    )
  }

  const setCookieHeader = initialResponse.headers['set-cookie']
  const cookies = setCookieHeader ? (Array.isArray(setCookieHeader) ? setCookieHeader.join(', ') : setCookieHeader) : null

  return { html, cookies }
}

async function textpro(url: string, text: string | string[]) {
  if (!/^https:\/\/textpro\.me\/.+\.html$/.test(url)) {
    throw new Error("Invalid URL: Must be a textpro.me URL ending in .html")
  }

  try {
    if (typeof text === "string") text = [text]

    const { html, cookies } = await validateTextInputs(url, text)

    if (!cookies) throw new Error("No cookies received")

    const parsedCookies: { [key: string]: string } = {}
    const cookieHeaders = Array.isArray(cookies) ? cookies : [cookies]

    cookieHeaders.forEach((cookieHeader) => {
      const individualCookies = cookieHeader.split(",")
      individualCookies.forEach((cookieStr) => {
        const mainCookie = cookieStr.split(";")[0].trim()
        if (mainCookie.includes("=")) {
          const parsed = cookie.parse(mainCookie)
          Object.assign(parsedCookies, parsed)
        }
      })
    })

    const cookieString = Object.entries(parsedCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ")

    const $ = cheerio.load(html)
    const token = $('input[name="token"]').attr("value")
    if (!token) throw new Error("Token not found in initial page")

    const recaptcha = new RecaptchaBypass({
      url: "https://textpro.me:443",
      key: "6LdoRvwpAAAAAErCE_lfjtk05CMJFA-jCSJsEhxf",
    })
    const { token: recaptchaToken } = await recaptcha.getCaptchaToken()

    const formData = new FormData()
    for (let t of text) formData.append("text[]", t)
    formData.append("grecaptcharesponse", recaptchaToken)
    formData.append("g-recaptcha-response", recaptchaToken)
    formData.append("token", token)
    formData.append("build_server", "https://textpro.me")
    formData.append("build_server_id", "1")

    const formResponse = await axios.post(proxy() + url, formData, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Origin: "https://textpro.me",
        Referer: url,
        Cookie: cookieString,
        ...formData.getHeaders(),
      },
    })

    const formHtml = formResponse.data
    const formValueMatch = /<div.*?id="form_value".*?>(.*?)<\/div>/s.exec(formHtml)
    if (!formValueMatch) {
      throw new Error("Form value not found")
    }

    let formValue
    try {
      formValue = JSON.parse(formValueMatch[1])
    } catch (parseError: any) {
      throw new Error("Failed to parse form value JSON")
    }

    const imageResponse = await axios.post(proxy() + "https://textpro.me/effect/create-image", qs.stringify(formValue), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://textpro.me",
        Referer: url,
        Cookie: cookieString,
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    const result: { fullsize_image?: string } = imageResponse.data
    if (!result.fullsize_image) {
      throw new Error("Failed to get image URL from response")
    }

    const imageUrl = `https://textpro.me${result.fullsize_image}`
    const imageBuffer = await getBuffer(imageUrl, {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
    })

    return imageBuffer
  } catch (error: any) {
    throw new Error(`Textpro scraping failed: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/textpro",
    name: "textpro",
    category: "Maker",
    description:
      "This API endpoint allows you to generate custom images using textpro.me effects by providing a TextPro URL and up to two text inputs. It supports various text effects available on the textpro.me website. The endpoint handles the entire process, including reCAPTCHA bypass, form submission, and image generation, returning the final image as a binary buffer. This is useful for creating personalized images programmatically, such as logos, banners, or stylized text for social media and web applications.",
    tags: ["TOOLS", "IMAGE", "TEXTPRO"],
    example:
      "?url=https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html&text1=Hello&text2=World",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "TextPro URL ending in .html",
        example: "https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html",
      },
      {
        name: "text1",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "First text input",
        example: "Hello",
      },
      {
        name: "text2",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Second text input (optional)",
        example: "World",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }: { req: any }) {
      const { url, text1, text2 } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!text1) {
        return {
          status: false,
          error: "text1 parameter is required",
          code: 400,
        }
      }

      if (typeof text1 !== "string" || text1.trim().length === 0) {
        return {
          status: false,
          error: "text1 must be a non-empty string",
          code: 400,
        }
      }

      if (text2 && (typeof text2 !== "string" || text2.trim().length === 0)) {
        return {
          status: false,
          error: "text2 must be a non-empty string if provided",
          code: 400,
        }
      }

      try {
        const texts = text2 ? [text1.trim(), text2.trim()] : [text1.trim()]
        const buffer = await textpro(url.trim(), texts)

        return createImageResponse(buffer)
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
    endpoint: "/api/m/textpro",
    name: "textpro",
    category: "Maker",
    description:
      "This API endpoint allows you to generate custom images using textpro.me effects by providing a TextPro URL and up to two text inputs in the request body. It supports various text effects available on the textpro.me website. The endpoint handles the entire process, including reCAPTCHA bypass, form submission, and image generation, returning the final image as a binary buffer. This is useful for creating personalized images programmatically, such as logos, banners, or stylized text for social media and web applications.",
    tags: ["TOOLS", "IMAGE", "TEXTPRO"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url", "text1"],
            properties: {
              url: {
                type: "string",
                description: "TextPro URL ending in .html",
                example: "https://textpro.me/create-neon-devil-wings-text-effect-online-free-1014.html",
                minLength: 1,
                maxLength: 1000,
              },
              text1: {
                type: "string",
                description: "First text input",
                example: "Hello",
                minLength: 1,
                maxLength: 100,
              },
              text2: {
                type: "string",
                description: "Second text input (optional)",
                example: "World",
                minLength: 1,
                maxLength: 100,
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
      const { url, text1, text2 } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      if (!text1) {
        return {
          status: false,
          error: "text1 parameter is required",
          code: 400,
        }
      }

      if (typeof text1 !== "string" || text1.trim().length === 0) {
        return {
          status: false,
          error: "text1 must be a non-empty string",
          code: 400,
        }
      }

      if (text2 && (typeof text2 !== "string" || text2.trim().length === 0)) {
        return {
          status: false,
          error: "text2 must be a non-empty string if provided",
          code: 400,
        }
      }

      try {
        const texts = text2 ? [text1.trim(), text2.trim()] : [text1.trim()]
        const buffer = await textpro(url.trim(), texts)

        return createImageResponse(buffer)
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