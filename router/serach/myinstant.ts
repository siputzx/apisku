import axios from "axios"
import * as cheerio from "cheerio"

async function bypass(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,id;q=0.8",
        "accept-encoding": "gzip, deflate, br",
        "cache-control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, public, max-age=31536000, immutable, private, max-age=3600, must-revalidate, stale-while-revalidate=86400, stale-if-error=86400, s-maxage=31536000, post-check=0, pre-check=0, no-transform, vary=Accept-Encoding,User-Agent,Accept-Language, s-maxage=259200, max-age=300, max-age=600, max-age=60, max-age=7200, max-age=604800, stale-while-revalidate=43200, stale-if-error=7200, max-age=31536000, s-maxage=31536000, max-age=86400, s-maxage=259200, public, s-maxage=86400, max-age=3600, private, must-revalidate, max-age=0, no-cache, no-store, private, no-cache, no-store, must-revalidate, public, max-age=864400, stale-while-revalidate=43200, private, max-age=3600, stale-if-error=7200, no-store, no-cache, must-revalidate, proxy-revalidate",
        pragma:
          "akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-extracted-values, akamai-x-get-ssl-client-session-id, akamai-x-get-true-cache-key, akamai-x-serial-no, akamai-x-get-request-id, akamai-x-get-nonces, akamai-x-get-client-ip",
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120", "Microsoft Edge";v="120", "Opera";v="106", "Opera GX";v="106", "Brave";v="120", "Vivaldi";v="6.5", "Firefox";v="121", "Safari";v="17.2", "Samsung Internet";v="23.0", "UC Browser";v="15.5", "Yandex Browser";v="24.1", "QQ Browser";v="13.1", "Maxthon";v="7.1", "Seamonkey";v="2.53", "Pale Moon";v="33.0", "Waterfox";v="5.1", "Basilisk";v="2023.11", "K-Meleon";v="76.4", "Otter";v="1.0", "Midori";v="9.0", "Konqueror";v="21.12", "Falkon";v="3.2", "Qutebrowser";v="2.5", "Min";v="1.28", "Iridium";v="2023.07", "Epic Browser";v="103", "Comodo Dragon";v="114", "Comodo IceDragon";v="115", "Slimjet";v="37.0", "Avant Browser";v="2021", "Torch Browser";v="70", "Cent Browser";v="5.0", "Coc Coc";v="103", "360 Browser";v="13.2", "Sleipnir";v="6.4", "GreenBrowser";v="6.9", "Lunascape";v="6.15", "SlimBrowser";v="16.0", "BlackHawk";v="77", "Orbitum";v="56", "CyberFox";v="52.9", "IceCat";v="102", "Pale Moon Mobile";v="33.0", "Dooble";v="2023.11", "Aloha Browser";v="3.5", "CM Browser";v="5.22", "Phoenix Browser";v="5.5", "Puffin";v="9.7", "Dolphin";v="12.1", "Mercury Browser";v="9.4", "Atomic";v="7.5", "Cheetah Browser";v="7.2", "SalamWeb";v="5.1", "Kiwi Browser";v="120", "DuckDuckGo";v="7.65", "Bromite";v="112", "Ungoogled Chromium";v="120", "Beaker Browser";v="1.3", "Naver Whale";v="3.23"',
        "sec-ch-ua-mobile": "?0",
        "cf-device-type": "desktop",
        "cf-visitor": '{"scheme":"https"}',
        cookie: `cf_clearance=${Date.now().toString(36)}`,
        "x-forwarded-for": `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        "x-requested-with": "XMLHttpRequest",
      },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    })

    return response.data
  } catch (error: any) {
    return {
      status: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      code: error.response?.status || 500,
    }
  }
}

const myInstantsSearch = async (q: string) => {
  try {
    const result = await bypass("https://www.myinstants.com/en/search/?name=" + q)
    if (typeof result !== "string") {
      throw new Error("Invalid response from bypass function")
    }
    const $ = cheerio.load(result)
    const sounds: any[] = []

    $(".instant").each((_, element) => {
      const $instant = $(element)
      const playButton = $instant.find("button.small-button")
      const onclick = playButton.attr("onclick") || ""
      const soundUrl = onclick.match(/play\('([^']+)'/)?.[1] || ""
      const titleLink = $instant.find("a.instant-link")
      const title = titleLink.text().trim()
      const pageUrl = titleLink.attr("href")
      const shareButton = $instant.find(".webshare")
      const shareOnclick = shareButton.attr("onclick") || ""
      const instantId = shareOnclick.match(/'([^']+)'\)$/)?.[1] || ""

      sounds.push({
        title,
        instantId,
        shareUrl: `https://www.myinstants.com${pageUrl}`,
        soundUrl: soundUrl.startsWith("http")
          ? soundUrl
          : `https://www.myinstants.com${soundUrl}`,
      })
    })

    return {
      total: sounds.length,
      sounds,
    }
  } catch (error: any) {
    console.error("Error occurred:", error.message)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/myinstants",
    name: "my instants",
    category: "Search",
    description: "Search for instant sound clips on MyInstants.com using query parameters. This API endpoint allows users to find a variety of sound clips by providing a search query. The response includes details about each sound, such as its title, a unique instant ID, a shareable URL to the sound's page, and a direct URL to the sound file. This can be used for integrating sound searches into applications, bots, or any platform requiring quick access to a library of short audio clips.",
    tags: ["Search", "Audio", "Soundboard", "MyInstants", "Clips"],
    example: "?query=cihuyy",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "Search query",
        example: "cihuyy",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await myInstantsSearch(query.trim())

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
    endpoint: "/api/s/myinstants",
    name: "my instants",
    category: "Search",
    description: "Search for instant sound clips on MyInstants.com using JSON body. This API endpoint allows users to find a variety of sound clips by providing a search query in the request body. The response includes details about each sound, such as its title, a unique instant ID, a shareable URL to the sound's page, and a direct URL to the sound file. This can be used for integrating sound searches into applications, bots, or any platform requiring quick access to a library of short audio clips.",
    tags: ["Search", "Audio", "Soundboard", "MyInstants", "Clips"],
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
                description: "The search query for sound clips",
                example: "cihuyy",
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

      if (query.length > 100) {
        return {
          status: false,
          error: "Query must be less than 100 characters",
          code: 400,
        }
      }

      try {
        const result = await myInstantsSearch(query.trim())

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