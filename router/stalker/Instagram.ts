import axios from "axios"
import { CookieJar } from "tough-cookie"
import { wrapper } from "axios-cookiejar-support"

const axiosInstance = wrapper(
  axios.create({
    jar: new CookieJar(),
    withCredentials: true,
  }),
)

async function getInstagramProfile(username: string) {
  try {
    const response = await axiosInstance.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          authority: "www.instagram.com",
          accept: "*/*",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          referer: `https://www.instagram.com/${username}/`,
          "sec-ch-prefers-color-scheme": "dark",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-full-version-list":
            '"Not A(Brand";v="8.0.0.0", "Chromium";v="132.0.6961.0"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": '""',
          "sec-ch-ua-platform": '"Linux"',
          "sec-ch-ua-platform-version": '""',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          cookie:
            "csrftoken=osAtGItPXdetQOXtk2IlfZ; datr=ygJMaBFtokCgDHvSHpjRBiXR; ig_did=4AFB2614-B27A-463C-88D7-634A167A23D1; wd=1920x1080; mid=aEwCygALAAHnO0uXycs4-HkvZeZG; sessionid=75086953446%3ALqM9SCJSJJPYrD%3A4%3AAYdwuPXeTKFCPJbqnTFQGAbgG2IfbURP2VfPfzxT3Q; ds_user_id=75086953446; test_cookie=CheckForPermission; rur=\"NHA\\05475086953446\\0541781347937:01fe12f36cf41d26997c1995e45932f9a5e40c0ef5a5b864d86fa9754ed35c02d84bcaaa\"; fr=0rCiWOeBYaEZXYH8n.AWd4Iig2nahuF2uWYU04c7KXjlPbQWzHENGywbL-2SUyVFw0ABI.BoTALh..AAA.0.0.BoTALh.AWcEW18FI8ojvwAthdIOYdr_Hhc",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
          "x-ig-app-id": "936619743392459",
        },
        decompress: true,
      },
    )

    const user = response.data.data.user

    const simplifiedProfile = {
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      external_url: user.external_url,
      bio_links: user.bio_links.map((link: any) => ({
        title: link.title,
        url: link.url,
      })),
      profile_pic_url: user.profile_pic_url,
      is_business_account: user.is_business_account,
      is_private: user.is_private,
      is_verified: user.is_verified,
      followers_count: user.edge_followed_by.count,
      following_count: user.edge_follow.count,
      posts_count: user.edge_owner_to_timeline_media.count,
      posts: user.edge_owner_to_timeline_media.edges.map((edge: any) => ({
        id: edge.node.id,
        shortcode: edge.node.shortcode,
        is_video: edge.node.is_video,
        video_url: edge.node.is_video ? edge.node.video_url : null,
        thumbnail_url: edge.node.thumbnail_src || edge.node.display_url,
        caption: edge.node.edge_media_to_caption.edges[0]?.node.text || "",
        view_count: edge.node.is_video ? edge.node.video_view_count : null,
        like_count: edge.node.edge_liked_by.count,
        comment_count: edge.node.edge_media_to_comment.count,
        timestamp: edge.node.taken_at_timestamp,
      })),
    }

    return simplifiedProfile
  } catch (error: any) {
    console.error("Error fetching Instagram profile:", error.message)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/instagram",
    name: "instagram",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve detailed profile information for any Instagram user by providing their username as a query parameter. It fetches public data such as their full name, biography, profile picture URL, follower and following counts, post count, and details about their recent posts including captions, like counts, and comments. This is ideal for applications needing to display Instagram user profiles or analyze public Instagram data.",
    tags: ["Stalker", "Instagram", "Profile", "User"],
    example: "?username=google",
    parameters: [
      {
        name: "username",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The Instagram username",
        example: "google",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username } = req.query || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
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

      try {
        const data = await getInstagramProfile(username.trim())
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
    endpoint: "/api/stalk/instagram",
    name: "instagram",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve detailed profile information for any Instagram user by providing their username in the request body. It fetches public data such as their full name, biography, profile picture URL, follower and following counts, post count, and details about their recent posts including captions, like counts, and comments. This is ideal for applications needing to display Instagram user profiles or analyze public Instagram data.",
    tags: ["Stalker", "Instagram", "Profile", "User"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["username"],
            properties: {
              username: {
                type: "string",
                description: "The Instagram username",
                example: "google",
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
      const { username } = req.body || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
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

      try {
        const data = await getInstagramProfile(username.trim())
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