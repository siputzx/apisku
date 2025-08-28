import axios from "axios"

class PinterestScraper {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = "https://id.pinterest.com/resource/BaseSearchResource/get/"
    this.headers = {
      "authority": "id.pinterest.com",
      "accept": "application/json, text/javascript, */*, q=0.01",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      "cookie": "csrftoken=c6c1ae81f3fa623853339b4174673ad8; _pinterest_sess=TWc9PSYvZ2RGcU1Ra2FweVMxb3p5MUI0L2lQcXhsbGNUS2xib21KalZWOG0wazFBQmdmRW9aOGk5MGtYMzRmWlRSUCtkcjFjMlIxRXVNRGxNZDQ4Q0JvVFJiUVNZK2JmeEZsczJ2UklWdC9kKzFuYz0mWVFpMVVDQ0hSYUExQTBveTZ5ZG1FVTdwN1FjPQ==; _auth=0; _routing_id=\"abd2e5b5-17e4-4fd3-aa85-67640f0c6ff3\"; sessionFunnelEventLogged=1",
      "origin": "https://id.pinterest.com",
      "referer": "https://id.pinterest.com/",
      "screen-dpr": "1.5891023874282837",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
      "sec-ch-ua-full-version-list": "\"Not A(Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"132.0.6961.0\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": "\"\"",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-ch-ua-platform-version": "\"\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "x-app-version": "f1222d7",
      "x-csrftoken": "c6c1ae81f3fa623853339b4174673ad8",
      "x-pinterest-appstate": "background",
      "x-pinterest-pws-handler": "www/search/[scope].js",
      "x-requested-with": "XMLHttpRequest",
    }
  }

  private async makeRequest(params: Record<string, any>, isPost: boolean = true) {
    const url = new URL(this.baseUrl)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

    try {
      const response = isPost
        ? await axios.post(url.toString(), new URLSearchParams(params).toString(), {
            headers: { ...this.headers, "x-pinterest-source-url": `/search/pins/?q=${encodeURIComponent(params.query)}&rs=typed` },
            responseType: "json",
            decompress: true,
          })
        : await axios.get(this.baseUrl + "?" + new URLSearchParams(params), {
            headers: { ...this.headers, "x-pinterest-source-url": `/search/pins/?q=${encodeURIComponent(params.query)}&rs=typed`, "x-pinterest-appstate": "active" },
            responseType: "json",
            decompress: true,
          })

      return response.data
    } catch (error: any) {
      console.error("Error fetching data:", error.message)
      return null
    }
  }

  private formatResults(results: any[]) {
    return results.map((item) => {
      let videoUrl: string | null = null
      if (item.videos?.video_list) {
        const firstVideoKey = Object.keys(item.videos.video_list)[0]
        videoUrl = item.videos.video_list[firstVideoKey]?.url
        if (videoUrl && firstVideoKey.includes("HLS") && videoUrl.includes("m3u8")) {
          videoUrl = videoUrl.replace("hls", "720p").replace("m3u8", "mp4")
        }
      }

      return {
        pin: `https://www.pinterest.com/pin/${item.id ?? ""}`,
        link: item.link ?? null,
        created_at: item.created_at
          ? new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "",
        id: item.id ?? "",
        image_url: item.images?.orig?.url ?? null,
        video_url: videoUrl,
        gif_url: item.embed?.src && item.embed?.type === "gif" ? item.embed.src : null,
        grid_title: item.grid_title ?? "",
        description: item.description ?? "",
        type: item.videos ? "video" : item.embed?.type === "gif" ? "gif" : "image",
        pinner: {
          username: item.pinner?.username ?? "",
          full_name: item.pinner?.full_name ?? "",
          follower_count: item.pinner?.follower_count ?? 0,
          image_small_url: item.pinner?.image_small_url ?? "",
        },
        board: {
          id: item.board?.id ?? "",
          name: item.board?.name ?? "",
          url: item.board?.url ?? "",
          pin_count: item.board?.pin_count ?? 0,
        },
        reaction_counts: item.reaction_counts ?? {},
        dominant_color: item.dominant_color ?? "",
        seo_alt_text: item.seo_alt_text ?? item.alt_text ?? "",
      }
    })
  }

  public async scrape(query: string, typeFilter: string | null = null) {
    const initialParams = {
      source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
      data: JSON.stringify({
        options: {
          applied_unified_filters: null,
          appliedProductFilters: "---",
          article: null,
          auto_correction_disabled: false,
          corpus: null,
          customized_rerank_type: null,
          domains: null,
          dynamicPageSizeExpGroup: null,
          filters: null,
          journey_depth: null,
          page_size: null,
          price_max: null,
          price_min: null,
          query_pin_sigs: null,
          query,
          redux_normalize_feed: true,
          request_params: null,
          rs: "typed",
          scope: "pins",
          selected_one_bar_modules: null,
          seoDrawerEnabled: false,
          source_id: null,
          source_module_id: null,
          source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
          top_pin_id: null,
          top_pin_ids: null,
        },
        context: {},
      }),
      query,
      _: Date.now(),
    }

    const firstResponse = await this.makeRequest(initialParams, false)
    if (!firstResponse) return []

    const firstResults = firstResponse.resource_response?.data?.results ?? []
    let allResults = this.formatResults(firstResults)

    const bookmark = firstResponse.resource_response?.bookmark
    if (bookmark) {
      const nextParams = {
        ...initialParams,
        data: JSON.stringify({
          options: {
            ...JSON.parse(initialParams.data).options,
            bookmarks: [bookmark],
          },
          context: {},
        }),
      }

      const secondResponse = await this.makeRequest(nextParams)
      if (secondResponse && secondResponse.resource_response?.data?.results) {
        const secondResults = this.formatResults(secondResponse.resource_response.data.results)
        allResults = [...allResults, ...secondResults]
      }
    }

    if (typeFilter) {
      allResults = allResults.filter((result) => result.type === typeFilter)
    }

    return allResults
  }

  public async getImages(query: string) {
    return this.scrape(query, "image")
  }

  public async getVideos(query: string) {
    return this.scrape(query, "video")
  }

  public async getGifs(query: string) {
    return this.scrape(query, "gif")
  }
}

const scraper = new PinterestScraper()

export default [
  {
    metode: "GET",
    endpoint: "/api/s/pinterest",
    name: "pinterest",
    category: "Search",
    description: "This API endpoint allows you to search for various media types on Pinterest, including images, videos, and GIFs. You can specify a search query to find relevant content. The results will include details such as the Pinterest pin URL, original link, creation date, image URL, video URL (if applicable), GIF URL (if applicable), title, description, and information about the pinner and board. This is useful for applications requiring visual content search from Pinterest.",
    tags: ["Search", "Image", "Video", "GIF"],
    example: "?query=cat&type=image",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "The search query for Pinterest (e.g., 'cat', 'nature wallpaper').",
        example: "cat",
      },
      {
        name: "type",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["image", "video", "gif"],
        },
        description: "Optional filter to return specific media type (image, video, or gif).",
        example: "image",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query, type } = req.query || {}

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

      if (type && typeof type !== "string") {
        return {
          status: false,
          error: "Type parameter must be a string",
          code: 400,
        }
      }

      if (type && !["image", "video", "gif"].includes(type.trim().toLowerCase())) {
        return {
          status: false,
          error: "Type parameter must be 'image', 'video', or 'gif'",
          code: 400,
        }
      }

      try {
        const result = await scraper.scrape(query.trim(), (type as string)?.trim().toLowerCase() || null)

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
    endpoint: "/api/s/pinterest",
    name: "pinterest",
    category: "Search",
    description: "This API endpoint allows you to search for various media types on Pinterest, including images, videos, and GIFs, by providing a JSON request body. You can specify a search query to find relevant content. The results will include details such as the Pinterest pin URL, original link, creation date, image URL, video URL (if applicable), GIF URL (if applicable), title, description, and information about the pinner and board. This is useful for applications requiring visual content search from Pinterest.",
    tags: ["Search", "Image", "Video", "GIF"],
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
                description: "The search query for Pinterest (e.g., 'cat', 'nature wallpaper').",
                example: "cat",
                minLength: 1,
                maxLength: 1000,
              },
              type: {
                type: "string",
                enum: ["image", "video", "gif"],
                description: "Optional filter to return specific media type (image, video, or gif).",
                example: "image",
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
      const { query, type } = req.body || {}

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

      if (type && typeof type !== "string") {
        return {
          status: false,
          error: "Type parameter must be a string",
          code: 400,
        }
      }

      if (type && !["image", "video", "gif"].includes(type.trim().toLowerCase())) {
        return {
          status: false,
          error: "Type parameter must be 'image', 'video', or 'gif'",
          code: 400,
        }
      }

      try {
        const result = await scraper.scrape(query.trim(), (type as string)?.trim().toLowerCase() || null)

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