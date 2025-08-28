import axios from "axios"

async function getTwitterProfile(username: string) {
  try {
    const response = await axios({
      method: "get",
      url: `https://x.com/i/api/graphql/32pL5BWe9WKeSK1MoPvFQQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22${username}%22%7D&features=%7B%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22subscriptions_feature_can_gift_premium%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Afalse%7D`,
      headers: {
        authority: "x.com",
        accept: "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        cookie:
          'guest_id=v1%3A173113403636768133; night_mode=2; guest_id_marketing=v1%3A173113403636768133; guest_id_ads=v1%3A173113403636768133; kdt=WhWkA7mjXj3JCksW2Mw21sEGANqSyG6wQPRiKko7; auth_token=72f94efba48d660d8b1220c5a1fa5b7a03a77c48; ct0=a0b42c9fa97da6bf8505d9fd66cbe549c3b4a33d028d877fb0ae9a1d1b61d814fa831a4f097249ee4dea9a41f5050d12bda9806ce1816e5522572b2f0a81a3bc4f9a9bd2f2fdf4edef38a7759d03648f; twid=u%3D1862865097519190016; personalization_id="v1_+FrUK12ti301D4y6jI2JcQ=="; lang=en',
        referer: `https://x.com/${username}`,
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "x-client-transaction-id":
          "U6llPAccL2VsbsUSw5MzIIdND/pdWmUi60m8RttQAqln3y8pN7aQHUjy4U1Bre2KZS2bOFCunV2HE2h+fljdQ5pMnWINUA",
        "x-client-uuid": "b3b16766-6240-466f-8e29-143e283afdb3",
        "x-csrf-token":
          "a0b42c9fa97da6bf8505d9fd66cbe549c3b4a33d028d877fb0ae9a1d1b61d814fa831a4f097249ee4dea9a41f5050d12bda9806ce1816e5522572b2f0a81a3bc4f9a9bd2f2fdf4edef38a7759d03648f",
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
      },
      timeout: 30000,
    })

    const userData = response.data.data.user.result
    const legacy = userData.legacy

    let profileImageUrl = legacy.profile_image_url_https
    if (profileImageUrl) {
      profileImageUrl = profileImageUrl.replace("_normal.", "_400x400.")
    }

    const cleanData = {
      id: userData.rest_id,
      username: legacy.screen_name,
      name: legacy.name,
      verified: userData.is_blue_verified,
      verified_type: legacy.verified_type || null,
      description: legacy.description,
      location: legacy.location,
      created_at: legacy.created_at,
      stats: {
        tweets: legacy.statuses_count,
        following: legacy.friends_count,
        followers: legacy.followers_count,
        likes: legacy.favourites_count,
        media: legacy.media_count,
      },
      profile: {
        image: profileImageUrl,
        banner: legacy.profile_banner_url || null,
      },
    }

    return cleanData
  } catch (error: any) {
    console.error("Error:", error.message)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/twitter",
    name: "twitter",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified Twitter (X) user using their username as a query parameter. It fetches detailed user data including their ID, username, display name, verification status, biography, location, account creation date, and various statistics such as tweet count, followers, following, likes, and media count. It also provides URLs for their profile image and banner. This is useful for applications requiring Twitter user data for display, analysis, or integration.",
    tags: ["Stalker", "Twitter", "X", "User", "Profile"],
    example: "?user=siputzx",
    parameters: [
      {
        name: "user",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The Twitter (X) username to stalk",
        example: "siputzx",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { user } = req.query || {}

      if (!user) {
        return {
          status: false,
          error: "Parameter 'user' is required",
          code: 400,
        }
      }

      if (typeof user !== "string" || user.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'user' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await getTwitterProfile(user.trim())
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
    endpoint: "/api/stalk/twitter",
    name: "twitter",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public profile information for a specified Twitter (X) user using their username in a JSON request body. It fetches detailed user data including their ID, username, display name, verification status, biography, location, account creation date, and various statistics such as tweet count, followers, following, likes, and media count. It also provides URLs for their profile image and banner. This is useful for applications requiring Twitter user data for display, analysis, or integration.",
    tags: ["Stalker", "Twitter", "X", "User", "Profile"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["user"],
            properties: {
              user: {
                type: "string",
                description: "The Twitter (X) username to stalk",
                example: "siputzx",
                minLength: 1,
                maxLength: 255,
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { user } = req.body || {}

      if (!user) {
        return {
          status: false,
          error: "Parameter 'user' is required",
          code: 400,
        }
      }

      if (typeof user !== "string" || user.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'user' must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await getTwitterProfile(user.trim())
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