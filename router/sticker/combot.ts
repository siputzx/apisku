import axios from "axios"
import * as cheerio from "cheerio"
declare const proxy: () => string | null

async function scrapeCombotSticker(q: string, page: number) {
  try {
    const response = await axios.get(
      proxy() + `https://combot.org/stickers?q=${encodeURIComponent(q)}&page=${page}`,
      {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9,id;q=0.8",
          "accept-encoding": "gzip, deflate, br",
          "cache-control": "no-cache, no-store, must-revalidate",
          pragma:
            "akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-extracted-values, akamai-x-get-ssl-client-session-id, akamai-x-get-true-cache-key, akamai-x-serial-no, akamai-x-get-request-id, akamai-x-get-nonces, akamai-x-get-client-ip, akamai-x-feo-trace, akamai-x-debug-info, akamai-x-cache-debug, akamai-x-real-client-ip, akamai-x-network-status, akamai-x-client-behavior-tracking, akamai-x-error-debug, akamai-x-geo-data, akamai-x-ip-version, akamai-x-session-attributes, akamai-x-protocol-trace, akamai-x-request-priority, akamai-x-response-timings, akamai-x-backend-info, akamai-x-edge-node-info, akamai-x-region-latency, akamai-x-cache-persistence, akamai-x-url-query-debug, akamai-x-time-sync, akamai-x-cookie-debug, akamai-x-auth-token-debug, akamai-x-content-length-debug, akamai-x-origin-server-timing, akamai-x-dns-debug, akamai-x-throughput-analysis, akamai-x-bypass-cache-control, akamai-x-akamai-integrity-trace, akamai-x-custom-header-debug, akamai-x-data-integrity-check, akamai-x-edge-node-response, akamai-x-ssl-handshake-timing, akamai-x-redirect-history, akamai-x-ab-test-debug, akamai-x-session-debug, akamai-x-user-segment-analysis, akamai-x-anomaly-detection, akamai-x-cache-flush-history, akamai-x-preflight-options, akamai-x-client-cert-info, akamai-x-forwarded-proto-debug, akamai-x-response-verification, akamai-x-routing-details, akamai-x-ab-testing-params, akamai-x-cache-expiry-info, akamai-x-geo-location-override, akamai-x-access-control-debug, akamai-x-data-compression-debug, akamai-x-image-optimization-debug, akamai-x-video-optimization-debug, akamai-x-cdn-rules-engine-debug, akamai-x-dynamic-content-debug, akamai-x-object-expiry-time, akamai-x-streaming-debug, akamai-x-performance-monitoring, akamai-x-client-usage-metrics, akamai-x-client-location-trace, akamai-x-cookie-injection-trace, akamai-x-token-auth-debug, akamai-x-ssl-policy-trace, akamai-x-origin-timing-breakdown, akamai-x-edge-node-performance, akamai-x-network-optimization-debug, akamai-x-policy-override-debug, akamai-x-cache-query-timings, akamai-x-cache-hit-rate-trace, akamai-x-backend-request-details, akamai-x-error-analysis-debug, akamai-x-cache-policy-debug, akamai-x-server-side-debugging, akamai-x-custom-metrics-analysis, akamai-x-user-behavior-analysis, akamai-x-url-routing-debug, akamai-x-forwarded-ip-debug, akamai-x-content-filtering-debug, akamai-x-policy-evaluation-debug, akamai-x-header-manipulation-trace, akamai-x-response-validation-debug, akamai-x-cache-persistence-trace, akamai-x-edge-routing-trace, akamai-x-cdn-performance-trace, akamai-x-query-string-analysis-debug, akamai-x-policy-injection-debug, akamai-x-client-throttling-trace, akamai-x-debug-level-max, akamai-x-request-routing-trace, akamai-x-cache-strategy-debug, akamai-x-origin-health-check, akamai-x-bot-detection-trace, akamai-x-request-correlation-id, akamai-x-edge-optimization-trace, akamai-x-traffic-management-debug, akamai-x-security-policy-trace, akamai-x-rate-limiting-debug, akamai-x-request-tracking-id, akamai-x-edge-authentication-trace, akamai-x-cache-invalidation-trace, akamai-x-origin-selection-trace, akamai-x-content-negotiation-debug, akamai-x-dynamic-optimization-trace, akamai-x-edge-compression-debug, akamai-x-traffic-shaping-trace, akamai-x-security-events-trace, akamai-x-bot-management-debug, akamai-x-edge-caching-trace, akamai-x-request-prioritization-debug",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "cf-device-type": "desktop",
          "cf-visitor": '{"scheme":"https"}',
          cookie: `cf_clearance=${Date.now().toString(36)}`,
          "x-forwarded-for": `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          "x-requested-with": "XMLHttpRequest",
        },
        timeout: 30000,
        retry: {
          limit: 3,
          methods: ["GET"],
          statusCodes: [408, 413, 429, 500, 502, 503, 504],
          calculateDelay: ({ attemptCount }) => Math.min(1000 * Math.pow(2, attemptCount), 10000),
        },
      },
    )

    const $ = cheerio.load(response.data)
    const results: any[] = []

    $(".stickerset").each(function () {
      try {
        const dataStr = $(this).attr("data-data")
        const data = JSON.parse(dataStr || "{}")

        const title = $(this).find(".stickerset__title").text().trim()

        const stickers: string[] = []
        $(this)
          .find(".stickerset__image")
          .each(function () {
            const stickerUrl = $(this).attr("data-src")
            if (stickerUrl) {
              stickers.push(stickerUrl)
            }
          })

        const addLink = $(this).find('a[href^="https://t.me/addstickers/"]').attr("href")

        results.push({
          id: data._id,
          title: title,
          created_date: data.created_date,
          updated_date: data.updated_date,
          sticker_type: data.sticker_type,
          total_stickers: data.stickers ? data.stickers.length : 0,
          sticker_urls: stickers,
          add_sticker_url: addLink,
        })
      } catch (err: any) {
        console.error(`Error parsing sticker set:`, err.message)
      }
    })

    const totalPages = [...$(".pagination li a")]
      .map((el) => parseInt($(el).text().trim()))
      .filter((n) => !isNaN(n))
      .reduce((max, curr) => Math.max(max, curr), 0)

    return { results, totalPages }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/sticker/combot-search",
    name: "combot sticker",
    category: "Sticker",
    description:
      "This API allows you to search for Telegram sticker packs on Combot.org. You can specify a search query and a page number to retrieve results. The API will return details about each sticker pack, including its title, creation and update dates, sticker type, total number of stickers, a list of sticker image URLs, and a direct link to add the sticker pack to Telegram.",
    tags: ["Sticker", "Search", "Telegram"],
    example: "?q=jomok nye&page=1",
    parameters: [
      {
        name: "q",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "Search query for stickers",
        example: "jomok nye",
      },
      {
        name: "page",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
        description: "Page number for results",
        example: 1,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q, page = 1 } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Parameter 'q' is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'q' must be a non-empty string",
          code: 400,
        }
      }

      if (typeof page !== "string" || isNaN(parseInt(page))) {
        return {
          status: false,
          error: "Parameter 'page' must be a number",
          code: 400,
        }
      }

      const pageNum = parseInt(page)
      if (pageNum < 1) {
        return {
          status: false,
          error: "Parameter 'page' must be 1 or greater",
          code: 400,
        }
      }

      try {
        const data = await scrapeCombotSticker(q.trim(), pageNum)

        if (!data || data.results.length === 0) {
          return {
            status: false,
            error: "No sticker packs found for the given query",
            code: 404,
          }
        }

        return {
          status: true,
          data: data,
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
    endpoint: "/api/sticker/combot-search",
    name: "combot sticker",
    category: "Sticker",
    description:
      "This API allows you to search for Telegram sticker packs on Combot.org by providing a search query and an optional page number in the request body (JSON). It returns detailed information about each sticker pack found, including its title, dates of creation and update, sticker type, the total count of stickers, an array of sticker image URLs, and a direct link to add the sticker pack to Telegram.",
    tags: ["Sticker", "Search", "Telegram"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["q"],
            properties: {
              q: {
                type: "string",
                description: "The search query for stickers",
                example: "jomok nye",
                minLength: 1,
                maxLength: 255,
              },
              page: {
                type: "integer",
                description: "The page number for search results",
                example: 1,
                minimum: 1,
                default: 1,
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
      const { q, page = 1 } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Parameter 'q' is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'q' must be a non-empty string",
          code: 400,
        }
      }

      if (typeof page !== "number" || page < 1) {
        return {
          status: false,
          error: "Parameter 'page' must be a number and 1 or greater",
          code: 400,
        }
      }

      try {
        const data = await scrapeCombotSticker(q.trim(), page)

        if (!data || data.results.length === 0) {
          return {
            status: false,
            error: "No sticker packs found for the given query",
            code: 404,
          }
        }

        return {
          status: true,
          data: data,
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