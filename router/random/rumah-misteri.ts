import axios from "axios"
import * as cheerio from "cheerio"

function getRandomPage(): number {
  return Math.floor(Math.random() * 59) + 1
}

async function scrapeRumahMisteri() {
  try {
    const randomPage = getRandomPage()
    const url = `https://rumahmisteri.com/page/${randomPage}`
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const html = response.data
    const $ = cheerio.load(html)
    const posts: any[] = []

    $(".archive-grid-post-wrapper article").each((_, element) => {
      const post = {
        id: $(element).attr("id"),
        thumbnail: {
          url: $(element).find(".post-thumbnail").attr("href"),
          src: $(element).find(".post-thumbnail img").attr("src"),
          alt: $(element).find(".post-thumbnail img").attr("alt"),
          width: $(element).find(".post-thumbnail img").attr("width"),
          height: $(element).find(".post-thumbnail img").attr("height"),
          srcset: $(element).find(".post-thumbnail img").attr("srcset"),
          sizes: $(element).find(".post-thumbnail img").attr("sizes"),
        },
        categories: $(element).find(".post-cats-list .category-button a").map((_, cat) => ({
          name: $(cat).text(),
          url: $(cat).attr("href"),
        })).get(),
        meta: {
          published: {
            date: $(element).find(".entry-cat .posted-on a time.published").attr("datetime"),
            text: $(element).find(".entry-cat .posted-on a time.published").text(),
          },
          updated: {
            date: $(element).find(".entry-cat .posted-on a time.updated").attr("datetime"),
            text: $(element).find(".entry-cat .posted-on a time.updated").text(),
          },
          author: {
            name: $(element).find(".entry-cat .byline .author a").text(),
            url: $(element).find(".entry-cat .byline .author a").attr("href"),
          },
        },
        title: {
          text: $(element).find(".entry-title a").text(),
          url: $(element).find(".entry-title a").attr("href"),
        },
        content: $(element).find(".entry-content p").text().trim(),
        tags: $(element).find(".entry-footer .tags-links a").map((_, tag) => ({
          name: $(tag).text(),
          url: $(tag).attr("href"),
        })).get(),
        readMore: {
          text: $(element).find(".mt-readmore-btn").text().trim(),
          url: $(element).find(".mt-readmore-btn").attr("href"),
        },
      }
      posts.push(post)
    })

    if (posts.length === 0) {
      throw new Error("No posts found on the scraped page.")
    }

    return { page: randomPage, url, totalPosts: posts.length, posts }
  } catch (error: any) {
    console.error("Scraping Error:", error.message)
    throw new Error("Failed to retrieve data from Rumah Misteri")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/rumahmisteri",
    name: "rumah misteri",
    category: "Random",
    description: "This API endpoint provides random mystery stories from 'Rumah Misteri'. It scrapes data from the website, including post details such as ID, thumbnail information, categories, publication metadata (date, author), title, content summary, and related tags. Each request retrieves a different set of stories, making it ideal for applications that require fresh and intriguing content related to mysteries, horror, or unexplained phenomena. Developers can use this to enrich their platforms with captivating narratives.",
    tags: ["Random", "Mystery", "Stories", "Horror", "Scraper"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapeRumahMisteri()
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
    endpoint: "/api/r/rumahmisteri",
    name: "rumah misteri",
    category: "Random",
    description: "This API endpoint retrieves random mystery stories from 'Rumah Misteri' using a POST request. It functions as a web scraper, extracting comprehensive details for each story including post IDs, thumbnail data, categories, publication dates, authors, titles, content excerpts, and associated tags. This is suitable for applications that prefer or require POST requests for data retrieval, enabling developers to dynamically integrate captivating mystery and horror content into their platforms, ensuring a varied selection with each call.",
    tags: ["Random", "Mystery", "Stories", "Horror", "Scraper"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapeRumahMisteri()
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