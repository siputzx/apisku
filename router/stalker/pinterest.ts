import axios from "axios"

async function getUserProfile(username: string, cookies: string = "") {
  if (!username) {
    return {
      status: false,
      code: 400,
      result: { message: "Username cannot be empty." },
    }
  }

  const baseURL = "https://www.pinterest.com"
  const headers = {
    accept: "application/json, text/javascript, */*, q=0.01",
    referer: "https://www.pinterest.com/",
    "user-agent": "Postify/1.0.0",
    "x-app-version": "xxx",
    "x-pinterest-appstate": "active",
    "x-pinterest-pws-handler": "www/[username]/[slug].js",
    "x-pinterest-source-url": `/${username}/`,
    "x-requested-with": "XMLHttpRequest",
    cookie: cookies,
  }

  const client = axios.create({ baseURL, headers })

  if (!cookies) {
    try {
      const res = await client.get("/")
      const setCookies = res.headers["set-cookie"]
      if (setCookies) {
        cookies = setCookies.map((c: string) => c.split(";")[0].trim()).join("; ")
        client.defaults.headers.cookie = cookies
      }
    } catch (err: any) {
      return {
        status: false,
        code: 500,
        result: { message: "Failed to initialize cookies." },
      }
    }
  }

  try {
    const params = {
      source_url: `/${username}/`,
      data: JSON.stringify({
        options: {
          username,
          field_set_key: "profile",
          isPrefetch: false,
        },
        context: {},
      }),
      _: Date.now(),
    }

    const { data } = await client.get("/resource/UserResource/get/", { params })

    if (!data.resource_response.data) {
      return {
        status: false,
        code: 404,
        result: { message: "User not found." },
      }
    }

    const userx = data.resource_response.data
    return {
      status: true,
      code: 200,
      result: {
        id: userx.id,
        username: userx.username,
        full_name: userx.full_name || "",
        bio: userx.about || "",
        email: userx.email || null,
        type: userx.type || "user",
        profile_url: `https://pinterest.com/${userx.username}`,
        image: {
          small: userx.image_small_url || null,
          medium: userx.image_medium_url || null,
          large: userx.image_large_url || null,
          original: userx.image_xlarge_url || null,
        },
        stats: {
          pins: userx.pin_count || 0,
          followers: userx.follower_count || 0,
          following: userx.following_count || 0,
          boards: userx.board_count || 0,
          likes: userx.like_count || 0,
          saves: userx.save_count || 0,
        },
        website: userx.website_url || null,
        domain_url: userx.domain_url || null,
        domain_verified: userx.domain_verified || false,
        explicitly_followed_by_me: userx.explicitly_followed_by_me || false,
        implicitly_followed_by_me: userx.implicitly_followed_by_me || false,
        location: userx.location || null,
        country: userx.country || null,
        is_verified: userx.verified_identity || false,
        is_partner: userx.is_partner || false,
        is_indexed: userx.indexed || false,
        is_tastemaker: userx.is_tastemaker || false,
        is_employee: userx.is_employee || false,
        is_blocked: userx.blocked_by_me || false,
        meta: {
          first_name: userx.first_name || null,
          last_name: userx.last_name || null,
          full_name: userx.full_name || "",
          locale: userx.locale || null,
          gender: userx.gender || null,
          partner: {
            is_partner: userx.is_partner || false,
            partner_type: userx.partner_type || null,
          },
        },
        account_type: userx.account_type || null,
        personalize_pins: userx.personalize || false,
        connected_to_etsy: userx.connected_to_etsy || false,
        has_password: userx.has_password || true,
        has_mfa: userx.has_mfa || false,
        created_at: userx.created_at || null,
        last_login: userx.last_login || null,
        social_links: {
          twitter: userx.twitter_url || null,
          facebook: userx.facebook_url || null,
          instagram: userx.instagram_url || null,
          youtube: userx.youtube_url || null,
          etsy: userx.etsy_url || null,
        },
        custom_gender: userx.custom_gender || null,
        pronouns: userx.pronouns || null,
        board_classifications: userx.board_classifications || {},
        interests: userx.interests || [],
      },
    }
  } catch (error: any) {
    return {
      status: false,
      code: error.response?.status || 500,
      result: { message: "Server error. Please try again later." },
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/pinterest",
    name: "pinterest",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified Pinterest user using their username as a query parameter. It provides detailed data including their ID, full name, bio, profile image URLs (small, medium, large, original), statistics on pins, followers, following, boards, likes, and saves. Additionally, it provides information about their website, location, country, verification status, and social media links. This is useful for applications requiring Pinterest user data for display or analysis.",
    tags: ["Stalker", "Pinterest", "User", "Profile"],
    example: "?q=dims",
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
        description: "The Pinterest username",
        example: "dims",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { q } = req.query || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter (username) is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter (username) must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await getUserProfile(q.trim())
        if (!data.status) {
          return {
            status: false,
            error: data.result.message,
            code: data.code,
          }
        }
        return {
          status: true,
          data: data.result,
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
    endpoint: "/api/stalk/pinterest",
    name: "pinterest",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified Pinterest user using their username in a JSON request body. It provides detailed data including their ID, full name, bio, profile image URLs (small, medium, large, original), statistics on pins, followers, following, boards, likes, and saves. Additionally, it provides information about their website, location, country, verification status, and social media links. This is useful for applications requiring Pinterest user data for display or analysis.",
    tags: ["Stalker", "Pinterest", "User", "Profile"],
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
                description: "The Pinterest username",
                example: "dims",
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
      const { q } = req.body || {}

      if (!q) {
        return {
          status: false,
          error: "Query parameter (username) is required",
          code: 400,
        }
      }

      if (typeof q !== "string" || q.trim().length === 0) {
        return {
          status: false,
          error: "Query parameter (username) must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await getUserProfile(q.trim())
        if (!data.status) {
          return {
            status: false,
            error: data.result.message,
            code: data.code,
          }
        }
        return {
          status: true,
          data: data.result,
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