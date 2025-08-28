import axios from "axios"
import * as cheerio from "cheerio"
import * as queryString from "querystring"

const baseURL = "http://images.google.com/search?"

const imageFileExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg"]

interface ImageRef {
  url: string
  width: number
  height: number
}

function addSiteExcludePrefix(s: string): string {
  return "-site:" + s
}

function containsAnyImageFileExtension(s: string): boolean {
  const lowercase = s.toLowerCase()
  return imageFileExtensions.some((ext) => lowercase.includes(ext))
}

async function scrapeGoogleImages(
  searchTerm: string,
  queryStringAddition: string | null = null,
  filterOutDomains: string[] = ["gstatic.com"],
  userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
): Promise<ImageRef[]> {
  try {
    let url =
      baseURL +
      queryString.stringify({
        tbm: "isch",
        q: searchTerm,
      })

    if (filterOutDomains && filterOutDomains.length > 0) {
      url += encodeURIComponent(
        " " + filterOutDomains.map(addSiteExcludePrefix).join(" "),
      )
    }

    if (queryStringAddition) {
      url += queryStringAddition
    }

    const reqOpts = {
      url,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 30000,
    }

    const { data: body } = await axios(reqOpts)

    const $ = cheerio.load(body)
    const scripts = $("script")
    const scriptContents: string[] = []

    for (let i = 0; i < scripts.length; ++i) {
      if (scripts[i].children.length > 0) {
        const content = (scripts[i].children[0] as any).data
        if (content && containsAnyImageFileExtension(content)) {
          scriptContents.push(content)
        }
      }
    }

    const allRefs = scriptContents.flatMap(collectImageRefs)
    const cleanedRefs = allRefs.map(cleanImageRef).filter(isValidRef)
    const uniqueRefs = removeDuplicates(cleanedRefs)

    return uniqueRefs
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from Google Images API")
  }

  function collectImageRefs(content: string): ImageRef[] {
    const refs: ImageRef[] = []
    const patterns = [
      /\["(https?:\/\/[^"]+?)",(\d+),(\d+)\]/g,
      /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|bmp|svg)[^"]*?)"/gi,
    ]

    patterns.forEach(function (pattern) {
      let result
      while ((result = pattern.exec(content)) !== null) {
        if (result.length >= 4) {
          let ref: ImageRef = {
            url: result[1],
            width: +result[3] || 0,
            height: +result[2] || 0,
          }
          if (domainIsOK(ref.url) && isImageUrl(ref.url)) {
            refs.push(ref)
          }
        } else if (result.length >= 2) {
          let ref: ImageRef = {
            url: result[1],
            width: 0,
            height: 0,
          }
          if (domainIsOK(ref.url) && isImageUrl(ref.url)) {
            refs.push(ref)
          }
        }
      }
    })

    return refs
  }

  function cleanImageRef(ref: ImageRef): ImageRef {
    let cleanUrl = ref.url
      .replace(/\\u003d/g, "=")
      .replace(/\\u0026/g, "&")
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\u0022/g, "\"")
      .replace(/\\u0027/g, "'")
      .replace(/\\"/g, "\"")
      .replace(/\\\//g, "/")
      .replace(/\\n/g, "")
      .replace(/\\t/g, "")
      .replace(/\\r/g, "")
      .replace(/\\/g, "")

    try {
      cleanUrl = decodeURIComponent(cleanUrl)
    } catch (e) {
      // ignore decode errors
    }

    return {
      url: cleanUrl,
      width: ref.width,
      height: ref.height,
    }
  }

  function isValidRef(ref: ImageRef): boolean {
    return (
      ref.url &&
      ref.url.startsWith("http") &&
      ref.url.length > 10 &&
      !ref.url.includes("undefined") &&
      !ref.url.includes("null")
    )
  }

  function removeDuplicates(refs: ImageRef[]): ImageRef[] {
    const seen = new Set<string>()
    return refs.filter(function (ref) {
      if (seen.has(ref.url)) {
        return false
      }
      seen.add(ref.url)
      return true
    })
  }

  function isImageUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase()
    return imageFileExtensions.some(function (ext) {
      return lowerUrl.includes(ext)
    })
  }

  function domainIsOK(url: string): boolean {
    if (!filterOutDomains) {
      return true
    } else {
      return filterOutDomains.every(skipDomainIsNotInURL)
    }

    function skipDomainIsNotInURL(skipDomain: string): boolean {
      return url.indexOf(skipDomain) === -1
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/images",
    name: "google image",
    category: "Search",
    description: "This API endpoint allows users to search for images on Google Images by providing a search query. It scrapes image URLs, widths, and heights directly from Google's image search results. The endpoint provides a powerful way to integrate Google Image search capabilities into applications, allowing for the retrieval of relevant images based on user input. It also includes filtering capabilities to exclude specific domains from the search results, ensuring more targeted and useful outcomes.",
    tags: ["Search", "Image", "Google"],
    example: "?query=siputzx",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The search term for Google Images",
        example: "siputzx",
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

      try {
        const results = await scrapeGoogleImages(query.trim())
        return {
          status: true,
          data: results,
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
    endpoint: "/api/images",
    name: "google image",
    category: "Search",
    description: "This API endpoint allows users to search for images on Google Images by providing a search query in the request body. It scrapes image URLs, widths, and heights directly from Google's image search results. The endpoint provides a powerful way to integrate Google Image search capabilities into applications, allowing for the retrieval of relevant images based on user input. It also includes filtering capabilities to exclude specific domains from the search results, ensuring more targeted and useful outcomes.",
    tags: ["Search", "Image", "Google"],
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
                description: "The search term for Google Images",
                example: "siputzx",
                minLength: 1,
                maxLength: 255,
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

      try {
        const results = await scrapeGoogleImages(query.trim())
        return {
          status: true,
          data: results,
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