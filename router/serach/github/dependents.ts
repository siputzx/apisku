import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeGitHubDependents(url: string, begin: number, end: number) {
  class GitHubScraper {
    headers: { [key: string]: string }
    githubUrl: string
    begin: number
    end: number
    uri: string
    allResults: any[]

    constructor(githubUrl: string, begin: number, end: number) {
      this.headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        TE: "Trailers",
      }

      this.githubUrl = githubUrl
      this.begin = begin
      this.end = end
      this.uri = this.convertToDependentsUrl(githubUrl)
      this.allResults = []
    }

    convertToDependentsUrl(githubUrl: string): string {
      const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/
      const match = githubUrl.match(regex)
      if (match) {
        const packageAuthor = match[1]
        const packageName = match[2]
        return `https://github.com/${packageAuthor}/${packageName}/network/dependents`
      } else {
        throw new Error("Invalid GitHub URL")
      }
    }

    extractDataFromHtml($: cheerio.CheerioAPI) {
      const jsonData: any[] = []

      $('div.Box-row[data-test-id="dg-repo-pkg-dependent"]').each(
        (index, element) => {
          const username = $(element)
            .find('a[data-hovercard-type="user"]')
            .text()
            .trim()
          const avatarUrl = $(element).find("img.avatar").attr("src")
          const repoName = $(element)
            .find('a[data-hovercard-type="repository"]')
            .text()
            .trim()
          const repoUrl = `https://github.com/${username}/${repoName}`
          const stars =
            parseInt(
              $(element).find("svg.octicon-star").parent().text().trim(),
              10,
            ) || 0
          const forks =
            parseInt(
              $(element).find("svg.octicon-repo-forked").parent().text().trim(),
              10,
            ) || 0

          jsonData.push({
            user: { username, avatar_url: avatarUrl },
            repository: { name: repoName, url: repoUrl },
            stars,
            forks,
          })
        },
      )

      return jsonData
    }

    async fetchPage(uri: string, pageIndex: number) {
      try {
        const response = await axios.get(uri, { headers: this.headers })
        const $ = cheerio.load(response.data)

        const pageData = this.extractDataFromHtml($)
        this.allResults.push(...pageData)

        return {
          html: response.data,
          data: pageData,
        }
      } catch (error: any) {
        console.error(`Failed to fetch page ${pageIndex + 1}:`, error.message)
        return null
      }
    }

    getPaginationUri(html: string) {
      const $ = cheerio.load(html)
      const paginationLink = $(
        'div.BtnGroup[data-test-selector="pagination"] a',
      )
        .last()
        .attr("href")
      return paginationLink ? `${paginationLink}` : null
    }

    async getJsons() {
      let currentUri = this.uri
      let currentPage = this.begin
      let totalItems = 0

      while (currentPage < this.end) {
        const result = await this.fetchPage(currentUri, currentPage)
        if (!result) break

        const nextUri = this.getPaginationUri(result.html)
        if (!nextUri) break

        currentUri = nextUri
        currentPage++
        totalItems += result.data.length
      }

      return {
        status: true,
        total: totalItems,
        page: currentPage - this.begin + 1,
        data: this.allResults,
      }
    }
  }

  const scraper = new GitHubScraper(url, parseInt(begin.toString()), parseInt(end.toString()))
  return await scraper.getJsons()
}

export default [
  {
    metode: "GET",
    endpoint: "/api/github/dependents",
    name: "dependents",
    category: "Search",
    description:
      "This API endpoint allows you to retrieve a list of repositories that depend on a specified GitHub repository. It scrapes the GitHub website to gather information about direct dependents, including their usernames, repository names, repository URLs, star counts, and fork counts. You can specify the GitHub repository URL and a page range to control the depth of the scrape. This is useful for analyzing project dependencies, identifying popular integrations, or understanding the ecosystem around a specific library or framework.",
    tags: ["GITHUB", "REPOSITORY", "DEPENDENTS", "SCRAPING", "DEVELOPER"],
    example: "?url=https://github.com/WhiskeySockets/Baileys&begin=0&end=2",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 200,
          pattern: "^https:\\/\\/github\\.com\\/[^\\/]+\\/[^\\/]+$",
        },
        description: "The GitHub repository URL",
        example: "https://github.com/WhiskeySockets/Baileys",
      },
      {
        name: "begin",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 0,
          maximum: 100,
        },
        description: "Starting page for scraping",
        example: 0,
      },
      {
        name: "end",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
        description: "Ending page for scraping",
        example: 2,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url, begin, end } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "GitHub URL is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      const githubUrlRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+$/
      if (!githubUrlRegex.test(url.trim())) {
        return {
          status: false,
          error: "Invalid GitHub URL format. Example: https://github.com/user/repo",
          code: 400,
        }
      }

      const parsedBegin = begin ? parseInt(begin as string, 10) : 0
      const parsedEnd = end ? parseInt(end as string, 10) : 2

      if (isNaN(parsedBegin) || parsedBegin < 0 || parsedBegin > 100) {
        return {
          status: false,
          error: "Begin page must be a non-negative integer between 0 and 100.",
          code: 400,
        }
      }

      if (isNaN(parsedEnd) || parsedEnd < 1 || parsedEnd > 100) {
        return {
          status: false,
          error: "End page must be a positive integer between 1 and 100.",
          code: 400,
        }
      }

      if (parsedBegin > parsedEnd) {
        return {
          status: false,
          error: "Begin page cannot be greater than end page.",
          code: 400,
        }
      }

      try {
        const results = await scrapeGitHubDependents(
          url.trim(),
          parsedBegin,
          parsedEnd,
        )
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
    endpoint: "/api/github/dependents",
    name: "dependents",
    category: "Search",
    description:
      "This API endpoint allows you to retrieve a list of repositories that depend on a specified GitHub repository. It scrapes the GitHub website to gather information about direct dependents, including their usernames, repository names, repository URLs, star counts, and fork counts. You can specify the GitHub repository URL and a page range to control the depth of the scrape. This is useful for analyzing project dependencies, identifying popular integrations, or understanding the ecosystem around a specific library or framework.",
    tags: ["GITHUB", "REPOSITORY", "DEPENDENTS", "SCRAPING", "DEVELOPER"],
    example: '{"url": "https://github.com/WhiskeySockets/Baileys", "begin": 0, "end": 2}',
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
                description: "The GitHub repository URL",
                example: "https://github.com/WhiskeySockets/Baileys",
                minLength: 1,
                maxLength: 200,
                pattern: "^https:\\/\\/github\\.com\\/[^\\/]+\\/[^\\/]+$",
              },
              begin: {
                type: "integer",
                description: "Starting page for scraping",
                example: 0,
                minimum: 0,
                maximum: 100,
              },
              end: {
                type: "integer",
                description: "Ending page for scraping",
                example: 2,
                minimum: 1,
                maximum: 100,
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
      const { url, begin, end } = req.body || {}

      if (!url) {
        return {
          status: false,
          error: "GitHub URL is required",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      const githubUrlRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+$/
      if (!githubUrlRegex.test(url.trim())) {
        return {
          status: false,
          error: "Invalid GitHub URL format. Example: https://github.com/user/repo",
          code: 400,
        }
      }

      const parsedBegin = begin ? parseInt(begin, 10) : 0
      const parsedEnd = end ? parseInt(end, 10) : 2

      if (isNaN(parsedBegin) || parsedBegin < 0 || parsedBegin > 100) {
        return {
          status: false,
          error: "Begin page must be a non-negative integer between 0 and 100.",
          code: 400,
        }
      }

      if (isNaN(parsedEnd) || parsedEnd < 1 || parsedEnd > 100) {
        return {
          status: false,
          error: "End page must be a positive integer between 1 and 100.",
          code: 400,
        }
      }

      if (parsedBegin > parsedEnd) {
        return {
          status: false,
          error: "Begin page cannot be greater than end page.",
          code: 400,
        }
      }

      try {
        const results = await scrapeGitHubDependents(
          url.trim(),
          parsedBegin,
          parsedEnd,
        )
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