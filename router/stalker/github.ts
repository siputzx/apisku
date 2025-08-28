import axios from "axios"

async function githubstalk(user: string) {
  try {
    const { data } = await axios.get("https://api.github.com/users/" + user)
    const hasil = {
      username: data.login || null,
      nickname: data.name || null,
      bio: data.bio || null,
      id: data.id || null,
      nodeId: data.node_id || null,
      profile_pic: data.avatar_url || null,
      url: data.html_url || null,
      type: data.type || null,
      admin: data.site_admin || false,
      company: data.company || null,
      blog: data.blog || null,
      location: data.location || null,
      email: data.email || null,
      public_repo: data.public_repos || 0,
      public_gists: data.public_gists || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      created_at: data.created_at || null,
      updated_at: data.updated_at || null,
    }
    return hasil
  } catch (error: any) {
    throw new Error("User not found or API error: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/github",
    name: "github",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve detailed profile information for any GitHub user. By providing a GitHub username, you can access public data such as their username, nickname, bio, profile picture URL, repository count, follower/following counts, and more. This is useful for applications requiring GitHub user data lookup, profile display, or analysis of developer activity.",
    tags: ["Stalker", "GitHub", "User", "Profile"],
    example: "?user=octocat",
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
        description: "GitHub username",
        example: "octocat",
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
        const result = await githubstalk(user.trim())
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
    endpoint: "/api/stalk/github",
    name: "github",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve detailed profile information for any GitHub user. By providing a GitHub username in the request body, you can access public data such as their username, nickname, bio, profile picture URL, repository count, follower/following counts, and more. This is useful for applications requiring GitHub user data lookup, profile display, or analysis of developer activity.",
    tags: ["Stalker", "GitHub", "User", "Profile"],
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
                description: "GitHub username",
                example: "octocat",
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
        const result = await githubstalk(user.trim())
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