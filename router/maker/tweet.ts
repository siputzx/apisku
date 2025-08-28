import { chromium } from "playwright"
import moment from "moment-timezone"
import fs from "fs"
import path from "path"
import axios from "axios"

declare const proxy: () => string | null

const CONFIG = {
  viewport: { width: 375, height: 812 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
  url: "https://www.tweetgen.com/create/tweet.html",
  tmpDir: path.join(__dirname, "../../tmp"),
}

async function handleProfilePictureUpload(page: any, imageSource: Buffer | string) {
  try {
    await page.waitForSelector("#pfp")
    await page.evaluate(() => {
      document.querySelector<HTMLElement>("#pfp")?.click()
    })

    await page.waitForSelector('#pfpModal[style*="display: block"]', {
      timeout: 5000,
    })

    let filePath: string
    if (Buffer.isBuffer(imageSource)) {
      filePath = await saveBufferToFile(imageSource)
    } else if (typeof imageSource === "string" && imageSource.startsWith("http")) {
      const response = await axios.get(imageSource, { responseType: "arraybuffer" })
      filePath = await saveBufferToFile(Buffer.from(response.data))
    } else {
      throw new Error("Invalid image source. Must be a URL or Buffer.")
    }

    const fileInput = await page.waitForSelector("#pfpFiles")
    await fileInput.setInputFiles(filePath)

    await page.waitForTimeout(2000)

    await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>("#pfpModal")
      if (modal) {
        const doneButton = modal.querySelector<HTMLElement>(".modal-footer .btn-primary")
        if (doneButton) doneButton.click()
      }
    })

    await page.waitForFunction(
      () => {
        const modal = document.querySelector<HTMLElement>("#pfpModal")
        return !modal || modal.style.display === "none" || !modal.classList.contains("show")
      },
      { timeout: 5000 },
    )

    await page.waitForTimeout(1000)

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error: any) {
    await page
      .evaluate(() => {
        const modal = document.querySelector<HTMLElement>("#pfpModal")
        if (modal) {
          modal.style.display = "none"
          modal.classList.remove("show")
        }
      })
      .catch((e: any) => console.log("Failed to close modal:", e))
    throw error
  }
}

async function handleTweetImageUpload(page: any, imageSource: Buffer | string) {
  try {
    await page.waitForSelector(".tweetDropdown")
    await page.click(".tweetDropdown")

    await page.waitForSelector('.tweetOptions button[onclick="queryModal(\'img\')"]', {
      timeout: 5000,
    })
    await page.click('.tweetOptions button[onclick="queryModal(\'img\')"]')

    await page.waitForSelector('#imgModal[style*="display: block"]', {
      timeout: 5000,
    })

    let filePath: string
    if (Buffer.isBuffer(imageSource)) {
      filePath = await saveBufferToFile(imageSource)
    } else if (typeof imageSource === "string" && imageSource.startsWith("http")) {
      const response = await axios.get(imageSource, { responseType: "arraybuffer" })
      filePath = await saveBufferToFile(Buffer.from(response.data))
    } else {
      throw new Error("Invalid image source. Must be a URL or Buffer.")
    }

    const fileInput = await page.waitForSelector("#imgFiles")
    await fileInput.setInputFiles(filePath)

    await page.waitForTimeout(2000)

    await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>("#imgModal")
      if (modal) {
        const doneButton = modal.querySelector<HTMLElement>(".modal-footer .btn-primary")
        if (doneButton) doneButton.click()
      }
    })

    await page.waitForFunction(
      () => {
        const modal = document.querySelector<HTMLElement>("#imgModal")
        return !modal || modal.style.display === "none" || !modal.classList.contains("show")
      },
      { timeout: 5000 },
    )

    await page.waitForTimeout(1000)

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error: any) {
    await page
      .evaluate(() => {
        const modal = document.querySelector<HTMLElement>("#imgModal")
        if (modal) {
          modal.style.display = "none"
          modal.classList.remove("show")
        }
      })
      .catch((e: any) => console.log("Failed to close modal:", e))
    throw error
  }
}

async function saveBufferToFile(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG.tmpDir)) {
      fs.mkdirSync(CONFIG.tmpDir, { recursive: true })
    }

    const tempFileName = path.join(CONFIG.tmpDir, `${Date.now()}.png`)
    fs.writeFile(tempFileName, buffer, (err) => {
      if (err) return reject(err)
      resolve(tempFileName)
    })
  })
}

async function captureGeneratedImage(page: any): Promise<Buffer> {
  try {
    await page.waitForSelector('#generatedImgModal[style*="display: block"]', {
      timeout: 10000,
    })

    const imageElement = await page.waitForSelector('#generatedImgModal img[src^="blob:"]')
    const imageUrl = await imageElement.getAttribute("src")
    if (!imageUrl) {
      throw new Error("Image URL not found.")
    }

    const response = await page.goto(imageUrl)
    const buffer = await response.body()

    await page.evaluate(() => {
      const modal = document.querySelector<HTMLElement>("#generatedImgModal")
      if (modal) {
        const doneButton = modal.querySelector<HTMLElement>(".modal-footer .btn-primary")
        if (doneButton) doneButton.click()
      }
    })

    return buffer
  } catch (error: any) {
    throw error
  }
}

async function editContent(page: any, selector: string, newText: string) {
  try {
    await page.click(selector)
    await page.keyboard.press("Control+A")
    await page.keyboard.press("Delete")
    await page.keyboard.type(newText)
  } catch (error: any) {
    throw new Error(`Failed to edit content at ${selector}: ${error.message}`)
  }
}

interface TweetOptions {
  profile?: string | Buffer
  image?: string | Buffer | null
  theme?: string
  retweets: number
  quotes: number
  likes: number
  client?: string
}

async function scrapeTweet(name: string, username: string, tweetText: string, options: TweetOptions): Promise<Buffer> {
  let browser: any = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
    })

    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      userAgent: CONFIG.userAgent,
      acceptDownloads: true,
    })

    const page = await context.newPage()

    page.on("dialog", async (dialog: any) => {
      await dialog.accept()
    })

    await page.goto(CONFIG.url)

    if (options.profile) {
      await handleProfilePictureUpload(page, options.profile)
    }

    if (options.image && options.image !== "null") {
      await handleTweetImageUpload(page, options.image)
    }

    await page.waitForTimeout(2000)

    await editContent(page, "#name", name)
    await editContent(page, "#username", username)
    await editContent(page, "#tweetText", tweetText)

    if (options.theme === "light") {
      await page.click("#themeLight")
    } else if (options.theme === "dim") {
      await page.click("#themeDim")
    } else if (options.theme === "dark") {
      await page.click("#themeDark")
    } else {
      await page.click("#themeLight")
    }

    await page.click(".tweetDropdown")
    await page.click("text=Toggle verified badge")

    await editContent(page, "#retweets", options.retweets.toString() || "0")
    await editContent(page, "#quotes", options.quotes.toString() || "0")
    await editContent(page, "#likes", options.likes.toString() || "0")

    const now = moment().tz("Asia/Jakarta")
    const hours = now.format("HH")
    const minutes = now.format("mm")
    const day = now.format("DD")
    const month = now.format("MMM")
    const year = now.format("YYYY")

    await page.click("text=12:00 PM")
    await page.fill("#timeInput", `${hours}:${minutes}`)
    await page.fill("#dayInput", day)
    await page.selectOption("#monthInput", month)
    await page.fill("#yearInput", year)
    await page.click("text=Done")

    await editContent(page, "#client", options.client || "Twitter for iPhone")

    await page.click("#generateButton")

    const imageBuffer = await captureGeneratedImage(page)
    return imageBuffer
  } catch (error: any) {
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

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

export default [
  {
    metode: "GET",
    endpoint: "/api/m/tweet",
    name: "tweet generator",
    category: "Maker",
    description: "This API endpoint allows you to generate a realistic-looking tweet image by providing various parameters such as profile picture, display name, username, tweet content, an optional image within the tweet, theme (dark, light, or dim), retweet count, quote count, like count, and the client from which the tweet was posted. It is useful for creating mockups, social media content, or testing purposes.",
    tags: ["MAKER", "IMAGE", "TWEET"],
    example: "?profile=https://avatars.githubusercontent.com/u/159487561?v=4&name=siputzx&username=siputzx&tweet=Hello%20World&image=null&theme=dark&retweets=1000&quotes=200&likes=5000&client=Twitter%20for%20iPhone",
    parameters: [
      {
        name: "profile",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Profile picture URL",
        example: "https://avatars.githubusercontent.com/u/159487561?v=4",
      },
      {
        name: "name",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Display name",
        example: "siputzx",
      },
      {
        name: "username",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Username",
        example: "siputzx",
      },
      {
        name: "tweet",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 500,
        },
        description: "Tweet content",
        example: "Hello World",
      },
      {
        name: "image",
        in: "query",
        required: false,
        schema: {
          type: "string",
          nullable: true,
        },
        description: "Tweet image URL",
        example: "null",
      },
      {
        name: "theme",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: ["dark", "light", "dim"],
        },
        description: "Tweet theme",
        example: "dark",
      },
      {
        name: "retweets",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "Number of retweets",
        example: 1000,
      },
      {
        name: "quotes",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "Number of quotes",
        example: 200,
      },
      {
        name: "likes",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 0,
        },
        description: "Number of likes",
        example: 5000,
      },
      {
        name: "client",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Client name",
        example: "Twitter for iPhone",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { profile, name, username, tweet, image, theme, retweets, quotes, likes, client } = req.query || {}

      if (!profile) {
        return {
          status: false,
          error: "Profile URL is required",
          code: 400,
        }
      }
      if (typeof profile !== "string" || profile.trim().length === 0) {
        return {
          status: false,
          error: "Profile must be a non-empty string",
          code: 400,
        }
      }

      if (!name) {
        return {
          status: false,
          error: "Name is required",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string",
          code: 400,
        }
      }

      if (!username) {
        return {
          status: false,
          error: "Username is required",
          code: 400,
        }
      }
      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      if (!tweet) {
        return {
          status: false,
          error: "Tweet content is required",
          code: 400,
        }
      }
      if (typeof tweet !== "string" || tweet.trim().length === 0) {
        return {
          status: false,
          error: "Tweet content must be a non-empty string",
          code: 400,
        }
      }

      if (image !== undefined && typeof image !== "string") {
        return {
          status: false,
          error: "Image must be a string URL or 'null'",
          code: 400,
        }
      }

      if (!theme) {
        return {
          status: false,
          error: "Theme is required",
          code: 400,
        }
      }
      if (typeof theme !== "string" || !["dark", "light", "dim"].includes(theme.trim())) {
        return {
          status: false,
          error: "Invalid theme. Must be 'dark', 'light', or 'dim'",
          code: 400,
        }
      }

      const parsedRetweets = Number(retweets)
      if (isNaN(parsedRetweets) || parsedRetweets < 0) {
        return {
          status: false,
          error: "Retweets must be a valid non-negative number",
          code: 400,
        }
      }

      const parsedQuotes = Number(quotes)
      if (isNaN(parsedQuotes) || parsedQuotes < 0) {
        return {
          status: false,
          error: "Quotes must be a valid non-negative number",
          code: 400,
        }
      }

      const parsedLikes = Number(likes)
      if (isNaN(parsedLikes) || parsedLikes < 0) {
        return {
          status: false,
          error: "Likes must be a valid non-negative number",
          code: 400,
        }
      }

      if (!client) {
        return {
          status: false,
          error: "Client is required",
          code: 400,
        }
      }
      if (typeof client !== "string" || client.trim().length === 0) {
        return {
          status: false,
          error: "Client must be a non-empty string",
          code: 400,
        }
      }

      const config = {
        profile: proxy() + profile.trim(),
        image: image === "null" ? null : image ? proxy() + image.trim() : null,
        theme: theme.trim(),
        retweets: parsedRetweets,
        quotes: parsedQuotes,
        likes: parsedLikes,
        client: client.trim(),
      }

      try {
        const imageBuffer = await scrapeTweet(name.trim(), username.trim(), tweet.trim(), config)
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
    endpoint: "/api/m/tweet",
    name: "tweet generator",
    category: "Maker",
    description: "This API endpoint allows you to generate a realistic-looking tweet image by providing various parameters as multipart/form-data, including uploaded files for profile picture and an optional image within the tweet. It is useful for creating mockups, social media content, or testing purposes.",
    tags: ["MAKER", "IMAGE", "TWEET"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["name", "username", "tweet", "theme", "retweets", "quotes", "likes", "client"],
            properties: {
              profile_file: {
                type: "string",
                format: "binary",
                description: "Profile picture file (image/png, image/jpeg, etc.)",
              },
              tweet_image_file: {
                type: "string",
                format: "binary",
                nullable: true,
                description: "Tweet image file (optional)",
              },
              name: {
                type: "string",
                description: "Display name for the tweet",
                example: "siputzx",
                minLength: 1,
                maxLength: 100,
              },
              username: {
                type: "string",
                description: "Username for the tweet (e.g., siputzx)",
                example: "siputzx",
                minLength: 1,
                maxLength: 100,
              },
              tweet: {
                type: "string",
                description: "The tweet content",
                example: "Hello World",
                minLength: 1,
                maxLength: 500,
              },
              theme: {
                type: "string",
                enum: ["dark", "light", "dim"],
                description: "Theme of the tweet (dark, light, or dim)",
                example: "dark",
              },
              retweets: {
                type: "integer",
                minimum: 0,
                description: "Number of retweets",
                example: 1000,
              },
              quotes: {
                type: "integer",
                minimum: 0,
                description: "Number of quotes",
                example: 200,
              },
              likes: {
                type: "integer",
                minimum: 0,
                description: "Number of likes",
                example: 5000,
              },
              client: {
                type: "string",
                description: "Client used to post the tweet (e.g., Twitter for iPhone)",
                example: "Twitter for iPhone",
                minLength: 1,
                maxLength: 100,
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const { name, username, tweet, theme, retweets, quotes, likes, client } = req.body || {}

      const profileFile = await guf(req, "profile_file")
      const tweetImageFile = await guf(req, "tweet_image_file")

      if (!profileFile || !profileFile.file) {
        return {
          status: false,
          error: "Missing required file: profile_file",
          code: 400,
        }
      }
      if (!profileFile.isValid) {
        return {
          status: false,
          error: `Invalid profile_file: ${profileFile.name}. Size must be between 1 byte and 10MB`,
          code: 400,
        }
      }
      if (!profileFile.isImage) {
        return {
          status: false,
          error: `Invalid profile_file type: ${profileFile.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      if (tweetImageFile && !tweetImageFile.isValid) {
        return {
          status: false,
          error: `Invalid tweet_image_file: ${tweetImageFile.name}. Size must be between 1 byte and 10MB`,
          code: 400,
        }
      }
      if (tweetImageFile && !tweetImageFile.isImage) {
        return {
          status: false,
          error: `Invalid tweet_image_file type: ${tweetImageFile.type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      if (!name) {
        return {
          status: false,
          error: "Name is required",
          code: 400,
        }
      }
      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name must be a non-empty string",
          code: 400,
        }
      }

      if (!username) {
        return {
          status: false,
          error: "Username is required",
          code: 400,
        }
      }
      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      if (!tweet) {
        return {
          status: false,
          error: "Tweet content is required",
          code: 400,
        }
      }
      if (typeof tweet !== "string" || tweet.trim().length === 0) {
        return {
          status: false,
          error: "Tweet content must be a non-empty string",
          code: 400,
        }
      }

      if (!theme) {
        return {
          status: false,
          error: "Theme is required",
          code: 400,
        }
      }
      if (typeof theme !== "string" || !["dark", "light", "dim"].includes(theme.trim())) {
        return {
          status: false,
          error: "Invalid theme. Must be 'dark', 'light', or 'dim'",
          code: 400,
        }
      }

      const parsedRetweets = Number(retweets)
      if (isNaN(parsedRetweets) || parsedRetweets < 0) {
        return {
          status: false,
          error: "Retweets must be a valid non-negative number",
          code: 400,
        }
      }

      const parsedQuotes = Number(quotes)
      if (isNaN(parsedQuotes) || parsedQuotes < 0) {
        return {
          status: false,
          error: "Quotes must be a valid non-negative number",
          code: 400,
        }
      }

      const parsedLikes = Number(likes)
      if (isNaN(parsedLikes) || parsedLikes < 0) {
        return {
          status: false,
          error: "Likes must be a valid non-negative number",
          code: 400,
        }
      }

      if (!client) {
        return {
          status: false,
          error: "Client is required",
          code: 400,
        }
      }
      if (typeof client !== "string" || client.trim().length === 0) {
        return {
          status: false,
          error: "Client must be a non-empty string",
          code: 400,
        }
      }

      const config = {
        profile: profileFile.file,
        image: tweetImageFile ? tweetImageFile.file : null,
        theme: theme.trim(),
        retweets: parsedRetweets,
        quotes: parsedQuotes,
        likes: parsedLikes,
        client: client.trim(),
      }

      try {
        const imageBuffer = await scrapeTweet(name.trim(), username.trim(), tweet.trim(), config)
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