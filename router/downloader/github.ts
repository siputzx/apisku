import axios from "axios"
import { Buffer } from "buffer"

interface GitHubUrlParserOptions {
  userAgent?: string
  token?: string
}

class GitHubUrlParser {
  private headers: { [key: string]: string }

  constructor(options: GitHubUrlParserOptions = {}) {
    this.headers = {
      "User-Agent": options.userAgent || "github-data-fetcher",
      ...(options.token && { Authorization: `token ${options.token}` }),
    }
  }

  parseUrl(url: string) {
    const patterns = {
      repo: /https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/)?$/,
      file: /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/,
      raw: /https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/,
      gist: /https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/,
    }

    for (const [type, regex] of Object.entries(patterns)) {
      const match = url.match(regex)
      if (match) {
        return { type, match }
      }
    }

    throw new Error(
      "URL tidak valid. Format yang didukung: repo, file, raw, atau gist URL GitHub",
    )
  }

  async getRepoData(user: string, repo: string) {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}`
    const response = await axios.get(apiUrl, {
      headers: this.headers,
      timeout: 30000,
    })

    const {
      default_branch,
      description,
      stargazers_count,
      forks_count,
      topics,
    } = response.data

    return {
      type: "repository",
      owner: user,
      repo: repo,
      description,
      default_branch,
      stars: stargazers_count,
      forks: forks_count,
      topics,
      download_url: `https://github.com/${user}/${repo}/archive/refs/heads/${default_branch}.zip`,
      clone_url: `https://github.com/${user}/${repo}.git`,
      api_url: apiUrl,
    }
  }

  async getFileData(user: string, repo: string, branch: string, path: string) {
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`
    const response = await axios.get(apiUrl, {
      headers: this.headers,
      timeout: 30000,
    })

    return {
      type: "file",
      owner: user,
      repo: repo,
      branch,
      path,
      name: response.data.name,
      size: response.data.size,
      raw_url: response.data.download_url,
      content: Buffer.from(response.data.content, "base64").toString(),
      sha: response.data.sha,
      api_url: apiUrl,
    }
  }

  async getGistData(user: string, gistId: string) {
    const apiUrl = `https://api.github.com/gists/${gistId}`
    const response = await axios.get(apiUrl, {
      headers: this.headers,
      timeout: 30000,
    })

    const files = Object.entries(response.data.files).map(
      ([filename, file]: [string, any]) => ({
        name: filename,
        language: file.language,
        raw_url: file.raw_url,
        size: file.size,
        content: file.content,
      }),
    )

    return {
      type: "gist",
      owner: user,
      gist_id: gistId,
      description: response.data.description,
      files,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      comments: response.data.comments,
      api_url: apiUrl,
    }
  }

  async getData(url: string) {
    try {
      const { type, match } = this.parseUrl(url)

      switch (type) {
        case "repo":
          return await this.getRepoData(match[1], match[2])
        case "file":
          return await this.getFileData(match[1], match[2], match[3], match[4])
        case "gist":
          return await this.getGistData(match[1], match[2])
        default:
          throw new Error("Format URL tidak didukung")
      }
    } catch (error: any) {
      throw new Error(`Error mengambil data: ${error.message}`)
    }
  }
}

async function githubScrape(url: string) {
  const github = new GitHubUrlParser({})
  return await github.getData(url)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/github",
    name: "github",
    category: "Downloader",
    description: "This API endpoint allows you to fetch data from various GitHub URLs, including repositories, individual files, raw content, and Gists. By providing a valid GitHub URL, the API will parse the URL, determine its type, and retrieve relevant information such as repository details (stars, forks, topics), file content and metadata, or Gist files and their associated data. This is particularly useful for developers and tools needing programmatic access to GitHub content without direct API interaction complexities.",
    tags: ["Downloader", "GitHub", "Repository", "File", "Gist"],
    example: "?url=https://gist.github.com/siputzx/966268a3aa3c14695e80cc9f30da8e9f",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "GitHub URL (repo, file, raw, or gist)",
        example: "https://gist.github.com/siputzx/966268a3aa3c14695e80cc9f30da8e9f",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const url = req.query.url?.trim()

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await githubScrape(url)
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: error.message.includes("not found") ? 404 : 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/d/github",
    name: "github",
    category: "Downloader",
    description: "This API endpoint allows you to fetch data from various GitHub URLs, including repositories, individual files, raw content, and Gists. By providing a valid GitHub URL, the API will parse the URL, determine its type, and retrieve relevant information such as repository details (stars, forks, topics), file content and metadata, or Gist files and their associated data. This is particularly useful for developers and tools needing programmatic access to GitHub content without direct API interaction complexities.",
    tags: ["Downloader", "GitHub", "Repository", "File", "Gist"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "GitHub URL (repo, file, raw, or gist)",
                example: "https://gist.github.com/siputzx/966268a3aa3c14695e80cc9f30da8e9f",
                minLength: 1,
                maxLength: 1000,
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
      const { url } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await githubScrape(url.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: error.message.includes("not found") ? 404 : 500,
        }
      }
    },
  },
]