import axios from "axios"
import * as crypto from "crypto"

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

interface MusixmatchScraper {
  api: {
    base: string,
    search: string,
  },
  headers: {
    authority: string,
    accept: string,
    pragma: string,
    "accept-language": string,
    cookie: string,
    origin: string,
    referer: string,
    "user-agent": string,
  },
  secret: string | null,
  getSecret: () => Promise<string | { error: string }>,
  signature: (url: string) => Promise<string | { error: string }>,
  request: (endpoint: string, params?: Record<string, any>) => Promise<any>,
  searchTracks: (track_query: string, page?: number) => Promise<any>,
}

const musixmatchScraper: MusixmatchScraper = {
  api: {
    base: "https://www.musixmatch.com/ws/1.1/",
    search: "https://www.musixmatch.com/search",
  },

  headers: {
    authority: "www.musixmatch.com",
    accept: "application/json",
    pragma: "akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-extracted-values, akamai-x-get-ssl-client-session-id, akamai-x-get-true-cache-key, akamai-x-serial-no, akamai-x-get-request-id, akamai-x-get-nonces, akamai-x-get-client-ip, akamai-x-feo-trace, akamai-x-cache-debug, akamai-x-real-client-ip, akamai-x-network-status, akamai-x-client-behavior-tracking, akamai-x-error-debug, akamai-x-geo-data, akamai-x-ip-version, akamai-x-session-attributes, akamai-x-protocol-trace, akamai-x-request-priority, akamai-x-response-timings, akamai-x-backend-info, akamai-x-edge-node-info, akamai-x-region-latency, akamai-x-cache-persistence, akamai-x-url-query-debug, akamai-x-time-sync, akamai-x-cookie-debug, akamai-x-auth-token-debug, akamai-x-content-length-debug, akamai-x-origin-server-timing, akamai-x-dns-debug, akamai-x-throughput-analysis, akamai-x-bypass-cache-control, akamai-x-akamai-integrity-trace, akamai-x-custom-header-debug, akamai-x-data-integrity-check, akamai-x-edge-node-response, akamai-x-ssl-handshake-timing, akamai-x-redirect-history, akamai-x-ab-test-debug, akamai-x-session-debug, akamai-x-user-segment-analysis, akamai-x-anomaly-detection, akamai-x-cache-flush-history, akamai-x-preflight-options, akamai-x-client-cert-info, akamai-x-forwarded-proto-debug, akamai-x-response-verification, akamai-x-routing-details, akamai-x-ab-testing-params, akamai-x-cache-expiry-info, akamai-x-geo-location-override, akamai-x-access-control-debug, akamai-x-data-compression-debug, akamai-x-image-optimization-debug, akamai-x-video-optimization-debug, akamai-x-cdn-rules-engine-debug, akamai-x-dynamic-content-debug, akamai-x-object-expiry-time, akamai-x-streaming-debug, akamai-x-performance-monitoring, akamai-x-client-usage-metrics, akamai-x-client-location-trace, akamai-x-cookie-injection-trace, akamai-x-token-auth-debug, akamai-x-ssl-policy-trace, akamai-x-origin-timing-breakdown, akamai-x-edge-node-performance, akamai-x-network-optimization-debug, akamai-x-policy-override-debug, akamai-x-cache-query-timings, akamai-x-cache-hit-rate-trace, akamai-x-backend-request-details, akamai-x-error-analysis-debug, akamai-x-cache-policy-debug, akamai-x-server-side-debugging, akamai-x-custom-metrics-analysis, akamai-x-user-behavior-analysis, akamai-x-url-routing-debug, akamai-x-forwarded-ip-debug, akamai-x-content-filtering-debug, akamai-x-policy-evaluation-debug, akamai-x-header-manipulation-trace, akamai-x-response-validation-debug, akamai-x-cache-persistence-trace, akamai-x-edge-routing-trace, akamai-x-cdn-performance-trace, akamai-x-query-string-analysis-debug, akamai-x-policy-injection-debug, akamai-x-client-throttling-trace, akamai-x-debug-level-max, akamai-x-request-routing-trace, akamai-x-cache-strategy-debug, akamai-x-origin-health-check, akamai-x-bot-detection-trace, akamai-x-request-correlation-id, akamai-x-edge-optimization-trace, akamai-x-traffic-management-debug, akamai-x-security-policy-trace, akamai-x-rate-limiting-debug, akamai-x-request-tracking-id, akamai-x-edge-authentication-trace, akamai-x-cache-invalidation-trace, akamai-x-origin-selection-trace, akamai-x-content-negotiation-debug, akamai-x-dynamic-optimization-trace, akamai-x-edge-compression-debug, akamai-x-traffic-shaping-trace, akamai-x-security-events-trace, akamai-x-bot-management-debug, akamai-x-edge-caching-trace, akamai-x-request-prioritization-debug",
    "accept-language": "en-US,en;q=0.9",
    cookie: "mxm_bab=AB",
    origin: "https://www.musixmatch.com",
    referer: "https://www.musixmatch.com/",
    "user-agent": "Postify/1.0.0",
  },

  secret: null,

  async getSecret() {
    if (this.secret) return this.secret
    const api = await axios
      .get(this.api.search, { headers: this.headers })
      .then((res) =>
        res.data.match(/src="([^"]*\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/)[1]
      )
      .catch(() => ({
        error: "Kagak nemu link signature key nya bree, manual aja yak.. itu signature nya dah gua kasih 👍🏻",
      }))
    if (api.error) return api

    return axios
      .get(api, { headers: this.headers })
      .then((res) => {
        const match = res.data.match(/from\(\s*"(.*?)"\s*\.split/)
        if (!match) return { error: "Sorry bree, stringnya kagak ada 🙃" }
        this.secret = Buffer.from(match[1].split("").reverse().join(""), "base64").toString(
          "utf-8"
        )
        return this.secret
      })
      .catch((error) => ({ error: error.message }))
  },

  async signature(url) {
    if (!this.secret) {
      const secret = await this.getSecret()
      if (typeof secret !== "string" && secret.error) return secret
    }
    const date = new Date()
    const message =
      url +
      date.getFullYear() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0")
    const hmac = crypto.createHmac("sha256", this.secret!)
    hmac.update(message)
    return "&signature=" + encodeURIComponent(hmac.digest("base64")) + "&signature_protocol=sha256"
  },

  async request(endpoint, params = {}) {
    const url =
      `${this.api.base}${endpoint}?` +
      new URLSearchParams({ ...params, app_id: "community-app-v1.0", format: "json" })
    const signature = await this.signature(url)
    if (typeof signature !== "string" && signature.error) return signature
    return axios
      .get(url + signature, { headers: this.headers })
      .then((res) => res.data)
      .catch((error) => ({ error: error.message }))
  },

  searchTracks: (track_query, page = 1) => {
    if (!track_query) return Promise.resolve({ error: "Query Tracknya mana?" })
    return musixmatchScraper.request("track.search", {
      q: track_query,
      f_has_lyrics: "true",
      page_size: 100,
      page,
      country: "id",
    })
  },
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/musixmatch",
    name: "musixmatch",
    category: "Search",
    description: "This API endpoint allows you to search for tracks on Musixmatch. You can specify a track title or artist as a query parameter. The API will return a list of tracks that match your search query, including details such as track name, artist name, and track ID. This can be used to find specific songs or artists for various applications, such as lyric finders or music information services. The endpoint supports robust search capabilities to help users find relevant music data quickly and efficiently.",
    tags: ["SEARCH", "MUSIC", "LYRICS"],
    example: "?query=garam dan madu",
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
        description: "The track title or artist to search for on Musixmatch",
        example: "garam dan madu",
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
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await musixmatchScraper.searchTracks(query.trim())
        if (data.error) {
          return { status: false, error: data.error, code: 500 }
        }
        return {
          status: true,
          data: data.message.body.track_list,
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
    endpoint: "/api/s/musixmatch",
    name: "musixmatch",
    category: "Search",
    description: "This API endpoint allows you to search for tracks on Musixmatch using a JSON request body. You can provide a track title or artist as the 'query' field in the JSON payload. The API will process your request and return a list of tracks that match your search criteria, including detailed information about each track such as its name, artist, and Musixmatch track ID. This endpoint is ideal for applications requiring structured data submission for music searches, ensuring efficient and accurate retrieval of track information.",
    tags: ["SEARCH", "MUSIC", "LYRICS"],
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
                description: "The track title or artist to search for on Musixmatch",
                example: "garam dan madu",
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
          error: "Query parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await musixmatchScraper.searchTracks(query.trim())
        if (data.error) {
          return { status: false, error: data.error, code: 500 }
        }
        return {
          status: true,
          data: data.message.body.track_list,
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