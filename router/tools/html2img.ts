import { chromium } from "playwright"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function convertHtmlToImage(htmlCode: string) {
  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.setContent(htmlCode, { waitUntil: "domcontentloaded", timeout: 30000 })
    await page.waitForTimeout(1000)

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    })
    return screenshotBuffer
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/code2img",
    name: "code2img",
    category: "Tools",
    description: "This API endpoint converts provided HTML code into a PNG image. It leverages a headless browser to render the HTML content and then captures a full-page screenshot. This is useful for generating visual representations of web content, creating thumbnails, or embedding dynamic HTML as static images in applications where direct HTML rendering is not feasible or desired. The service supports a wide range of HTML and CSS features, ensuring high-fidelity rendering.",
    tags: ["Tools", "Image", "HTML"],
    example: "?htmlCode=%3Ch1%3EHello%20World!%3C/h1%3E",
    parameters: [
      {
        name: "htmlCode",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10000,
        },
        description: "The HTML code to convert to an image.",
        example: "<h1>Hello World!</h1><p style=\"color: blue;\">This is a test.</p>",
      },
    ],
    isPublic: false,
    isPremium: true,
    isMaintenance: false,
    async run({ req }) {
      const { htmlCode } = req.query || {}

      if (!htmlCode) {
        return { status: false, error: "Parameter 'htmlCode' is required", code: 400 }
      }

      if (typeof htmlCode !== "string" || htmlCode.trim().length === 0) {
        return { status: false, error: "Parameter 'htmlCode' must be a non-empty string", code: 400 }
      }

      try {
        const screenshotBuffer = await convertHtmlToImage(htmlCode.trim())
        return createImageResponse(screenshotBuffer, "html-to-image.png")
      } catch (error: any) {
        console.error(error)
        return {
          status: false,
          error: error.message || "Error generating image from HTML code",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/code2img",
    name: "code2img",
    category: "Tools",
    description: "This API endpoint converts provided HTML code into a PNG image. It leverages a headless browser to render the HTML content and then captures a full-page screenshot. This is useful for generating visual representations of web content, creating thumbnails, or embedding dynamic HTML as static images in applications where direct HTML rendering is not feasible or desired. The service supports a wide range of HTML and CSS features, ensuring high-fidelity rendering.",
    tags: ["Tools", "Image", "HTML"],
    example: "",
    isPublic: false,
    isPremium: true,
    isMaintenance: false,
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["htmlCode"],
            properties: {
              htmlCode: {
                type: "string",
                description: "The HTML code to convert to an image.",
                example: "<h1>Hello World!</h1><p style=\"color: blue;\">This is a test.</p>",
                minLength: 1,
                maxLength: 10000,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    async run({ req }) {
      const { htmlCode } = req.body || {}

      if (!htmlCode) {
        return { status: false, error: "Parameter 'htmlCode' is required", code: 400 }
      }

      if (typeof htmlCode !== "string" || htmlCode.trim().length === 0) {
        return { status: false, error: "Parameter 'htmlCode' must be a non-empty string", code: 400 }
      }

      try {
        const screenshotBuffer = await convertHtmlToImage(htmlCode.trim())
        return createImageResponse(screenshotBuffer, "html-to-image.png")
      } catch (error: any) {
        console.error(error)
        return {
          status: false,
          error: error.message || "Error generating image from HTML code",
          code: 500,
        }
      }
    },
  },
]