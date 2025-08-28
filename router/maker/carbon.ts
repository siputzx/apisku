import { Buffer } from "buffer"
const { chromium } = require('playwright');

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {  
  const headers: { [key: string]: string } = {  
    "Content-Type": "image/png",  
    "Content-Length": buffer.length.toString(),  
    "Cache-Control": "public, max-age=3600",  
  }  
  
  if (filename) {  
    headers["Content-Disposition"] = `inline; filename="${filename}"`  
  }  
  
  return new Response(buffer, { headers })  
}  
  
async function CarbonifyV1(code: string, title?: string) {  
  const browser = await chromium.launch({ headless: true });  
  const page = await browser.newPage();  
  
  try {  
    await page.goto('https://carbon.now.sh/?bg=rgba%28171%2C+184%2C+195%2C+1%29&t=seti&wt=none&l=auto&width=680&ds=true&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=56px&ph=56px&ln=false&fl=1&fm=Hack&fs=14px&lh=133%25&si=false&es=2x&wm=false');  
  
    await page.waitForLoadState('networkidle');  
  
    await page.evaluate((code) => {  
      const editor = document.querySelector('.CodeMirror').CodeMirror;  
      editor.setValue(code);  
    }, code);  
  
    if (title) {  
      await page.locator('input[aria-label="Image title"]').fill(title);  
    }  
      
    const exportContainer = page.locator('#export-container');  
    const screenshot = await exportContainer.screenshot({   
      type: 'png'  
    });  
      
    await browser.close();  
    return Buffer.from(screenshot);  
  } catch (error: any) {  
    await browser.close();  
    console.error("Scraper Error:", error.message);  
    throw new Error("Failed to generate image from code");  
  }  
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/carbonify",
    name: "carbonify",
    category: "Maker",
    description: "This API endpoint allows users to generate visually appealing images from code snippets, often referred to as 'carbonizing' code. It takes a code string as input and returns an image (PNG format) of the code with syntax highlighting and a stylish background. This is useful for sharing code snippets on social media, presentations, or documentation, making them more readable and aesthetically pleasing. The endpoint supports various programming languages and provides a quick way to convert raw code into a shareable image. The output is a direct image file, making it easy to embed or display.",
    tags: ["Maker", "Image", "Code"],
    example: "?input=const siputzx Production&title=My Code",
    parameters: [
      {
        name: "input",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
        },
        description: "The code snippet to carbonify",
        example: "console.log('Hello, World!');",
      },
      {
        name: "title",
        in: "query",
        required: false,
        schema: {
          type: "string",
          maxLength: 100,
        },
        description: "Optional title for the image",
        example: "My Function",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { input, title } = req.query || {}

      if (!input) {
        return {
          status: false,
          error: "Input code is required",
          code: 400,
        }
      }

      if (typeof input !== "string" || input.trim().length === 0) {
        return {
          status: false,
          error: "Input must be a non-empty string",
          code: 400,
        }
      }

      if (input.length > 5000) {
        return {
          status: false,
          error: "Input code must be less than 5000 characters",
          code: 400,
        }
      }

      if (title && (typeof title !== "string" || title.length > 100)) {
        return {
          status: false,
          error: "Title must be a string with maximum 100 characters",
          code: 400,
        }
      }

      try {
        const imageBuffer = await CarbonifyV1(input.trim(), title)

        return createImageResponse(imageBuffer)
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
    endpoint: "/api/m/carbonify",
    name: "carbonify",
    category: "Maker",
    description: "This API endpoint allows users to generate visually appealing images from code snippets, often referred to as 'carbonizing' code. It takes a code string as input in the request body and returns an image (PNG format) of the code with syntax highlighting and a stylish background. This is useful for sharing code snippets on social media, presentations, or documentation, making them more readable and aesthetically pleasing. The endpoint supports various programming languages and provides a quick way to convert raw code into a shareable image. The output is a direct image file, making it easy to embed or display.",
    tags: ["Maker", "Image", "Code"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["input"],
            properties: {
              input: {
                type: "string",
                description: "The code snippet to carbonify",
                example: "const siputzx Production",
                minLength: 1,
                maxLength: 5000,
              },
              title: {
                type: "string",
                description: "Optional title for the image",
                example: "My Function",
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
    async run({ req }) {
      const { input, title } = req.body || {}

      if (!input) {
        return {
          status: false,
          error: "Input code is required",
          code: 400,
        }
      }

      if (typeof input !== "string" || input.trim().length === 0) {
        return {
          status: false,
          error: "Input must be a non-empty string",
          code: 400,
        }
      }

      if (input.length > 5000) {
        return {
          status: false,
          error: "Input code must be less than 5000 characters",
          code: 400,
        }
      }

      if (title && (typeof title !== "string" || title.length > 100)) {
        return {
          status: false,
          error: "Title must be a string with maximum 100 characters",
          code: 400,
        }
      }

      try {
        const imageBuffer = await CarbonifyV1(input.trim(), title)

        return createImageResponse(imageBuffer)
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