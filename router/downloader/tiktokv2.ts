import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import fs from "fs";

class TikTokScraper {
  private genericUserAgent: string;
  private debug: boolean;

  constructor(debug: boolean = false) {
    this.genericUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
    this.debug = debug;
  }

  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`[DEBUG] ${message}`, data ? data : '');
    }
  }

  private async shortener(url: string): Promise<string> {
    return url;
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      this.log("JWT decode error:", error);
      return null;
    }
  }

  private async getInitialCookies() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));
    
    const headers = {
      "User-Agent": this.genericUserAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "max-age=0",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "sec-ch-ua": '"Chromium";v="124", "Not A(Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"'
    };

    await client.get("https://www.tiktok.com/", { headers });
    return { jar, client, headers };
  }

  async getDownloadLinks(URL: string) {
    try {
      this.log("Fetching download links for URL:", URL);

      const response = await axios.get("https://musicaldown.com/en", {
        headers: {
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          referer: "https://musicaldown.com/download",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
        },
      });

      const $ = cheerio.load(response.data);
      const url_name = $("#link_url").attr("name");
      const token_name = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("name");
      const token_ = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(2)").attr("value");
      const verify = $("#submit-form > div").find("div:nth-child(1) > input[type=hidden]:nth-child(3)").attr("value");

      if (!url_name || !token_name || !token_ || !verify) {
        throw new Error("Failed to extract form data from musicaldown.com");
      }

      const data: { [key: string]: string } = {
        [url_name]: URL,
        [token_name]: token_,
        verify: verify,
      };

      this.log("Form data prepared:", data);

      const respon = await axios.request({
        url: "https://musicaldown.com/download",
        method: "post",
        data: new URLSearchParams(Object.entries(data)),
        headers: {
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://musicaldown.com",
          referer: "https://musicaldown.com/en",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          cookie: response.headers["set-cookie"]?.join("; "),
        },
      });

      const ch = cheerio.load(respon.data);
      let result: { video?: string[], audio?: string, photo?: string[] } = {};

      const hdLink = ch('a[data-event="hd_download_click"]').attr("href");
      const mp4Link = ch('a[data-event="mp4_download_click"]').attr("href");
      const watermarkLink = ch('a[data-event="watermark_download_click"]').attr("href");
      const mp3Link = ch('a[data-event="mp3_download_click"]').attr("href");

      this.log("Found links:", { hdLink, mp4Link, watermarkLink, mp3Link });

      const videoLinks = [];
      if (hdLink && hdLink.includes('token=')) {
        const token = hdLink.split('token=')[1];
        const decoded = this.decodeJWT(token);
        if (decoded && decoded.url) {
          videoLinks.push(await this.shortener(decoded.url));
          this.log("HD video URL decoded:", decoded.url);
        }
      }

      if (mp4Link && mp4Link.includes('token=')) {
        const token = mp4Link.split('token=')[1];
        const decoded = this.decodeJWT(token);
        if (decoded && decoded.url) {
          videoLinks.push(await this.shortener(decoded.url));
          this.log("MP4 video URL decoded:", decoded.url);
        }
      }

      if (watermarkLink && watermarkLink.includes('token=')) {
        const token = watermarkLink.split('token=')[1];
        const decoded = this.decodeJWT(token);
        if (decoded && decoded.url) {
          videoLinks.push(await this.shortener(decoded.url));
          this.log("Watermark video URL decoded:", decoded.url);
        }
      }

      result.video = videoLinks.length > 0 ? videoLinks : [];

      if (mp3Link && mp3Link.includes('token=')) {
        const token = mp3Link.split('token=')[1];
        const decoded = this.decodeJWT(token);
        if (decoded && decoded.url) {
          result.audio = await this.shortener(decoded.url);
          this.log("MP3 audio URL decoded:", decoded.url);
        }
      }

      const images: string[] = [];
      ch(".card-action.center > a").each((i, elem) => {
        const href = ch(elem).attr("href");
        if (href && href.includes('token=')) {
          const token = href.split('token=')[1];
          const decoded = this.decodeJWT(token);
          if (decoded && decoded.cover) {
            images.push(decoded.cover);
          }
        }
      });

      if (images.length > 0) {
        result.photo = await Promise.all(images.map((img) => this.shortener(img)));
      }

      const slideButton = ch("#SlideButton");
      if (slideButton.length > 0) {
        try {
          const scriptContent = ch("#SlideButton").parent().find("script").text();
          const slideDataMatch = scriptContent.match(/data:\s*['"](.*?)['"]/);
          if (slideDataMatch) {
            const slideData = slideDataMatch[1];
            const slideRes = await axios.request({
              url: "https://render.muscdn.app/slider",
              method: "post",
              data: new URLSearchParams({ data: slideData }),
              headers: {
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
                accept: "application/json",
                "content-type": "application/x-www-form-urlencoded",
                origin: "https://musicaldown.com",
                referer: "https://musicaldown.com/photo/download",
              },
            });
            
            if (slideRes.data.success) {
              result.video = [await this.shortener(slideRes.data.url)];
            }
          }
        } catch (slideError) {
          this.log("Slideshow conversion error:", slideError);
        }
      }

      this.log("Download links result:", result);
      return result;

    } catch (err: any) {
      this.log("Error in getDownloadLinks:", err.message);
      throw err;
    }
  }

  async scrape(input: string) {
    try {
      this.log("Starting scrape for URL:", input);
      
      const { client, headers } = await this.getInitialCookies();
      this.log("Initial cookies obtained");

      const first = await client.get(input, { 
        headers, 
        maxRedirects: 0, 
        validateStatus: (s: number) => s >= 200 && s < 400 
      });
      
      let redirectUrl = first.headers.location || input;
      this.log("Initial redirect URL:", redirectUrl);

      if (redirectUrl.includes("/photo/")) {
        redirectUrl = redirectUrl.replace("/photo/", "/video/");
        this.log("Modified redirect URL:", redirectUrl);
      }

      const { data: html } = await client.get(redirectUrl, { headers, maxRedirects: 10 });
      this.log("HTML content received");

      if (!html.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")) {
        this.log("Universal data not found in HTML");
        return { error: "content.data_not_found" };
      }

      const json = html.split('<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">')[1].split("</script>")[0];
      const data = JSON.parse(json);
      this.log("Parsed JSON data:", data);

      const videoDetail = data["__DEFAULT_SCOPE__"]["webapp.video-detail"];
      
      if (!videoDetail) {
        this.log("Video detail not found");
        return { error: "content.detail_not_found" };
      }

      if (videoDetail.statusMsg) {
        this.log("Video unavailable:", videoDetail.statusMsg);
        return { error: "content.post.unavailable" };
      }

      const item = videoDetail.itemInfo.itemStruct;
      const postId = item.id || "";
      this.log("Post ID:", postId);

      const downloadLinks = await this.getDownloadLinks(input);
      this.log("Download links obtained:", downloadLinks);

      const result = {
        metadata: {
          stats: {
            likeCount: item.stats.diggCount,
            playCount: item.stats.playCount,
            commentCount: item.stats.commentCount,
            shareCount: item.stats.shareCount,
          },
          title: item.imagePost?.title || "",
          description: item.desc,
          hashtags: item.textExtra.filter((extra: any) => extra.type === 1).map((extra: any) => extra.hashtagName),
          locationCreated: item.locationCreated,
          suggestedWords: item.suggestedWords,
        },
        download: downloadLinks,
      };

      this.log("Final result:", result);
      
      return {
        success: true,
        data: result,
        postId: postId,
      };
    } catch (error: any) {
      this.log("Error in scrape:", error.message);
      return { error: "fetch.fail", message: error.message };
    }
  }
}

async function scrapeTiktokV2(url: string) {
  try {
    const scraper = new TikTokScraper()
    return await scraper.scrape(url)
  } catch (error: any) {
    console.error("Tiktok v2 scrape error:", error)
    return { error: "Failed to scrape TikTok data", message: error.message }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/tiktok/v2",
    name: "tiktok v2",
    category: "Downloader",
    description: "This API endpoint allows you to download TikTok videos and photos by providing a TikTok URL. It scrapes the necessary information from the TikTok page, including video/photo metadata and direct download links. This can be used for archival purposes, content analysis, or integrating TikTok content into other applications. The API supports both video and image posts, providing respective download links. It handles redirects and extracts the post ID to ensure accurate data retrieval. The response includes detailed metadata like like count, play count, comment count, share count, title, description, hashtags, and location created, along with direct download URLs for the media.",
    tags: ["DOWNLOADER", "TIKTOK", "VIDEO", "PHOTO", "SOCIAL MEDIA"],
    example: "?url=https://vt.tiktok.com/ZSjXNEnbC/",
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
        description: "TikTok URL",
        example: "https://vt.tiktok.com/ZSjXNEnbC/",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {}

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
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeTiktokV2(url.trim())

        if (result && "error" in result) {
          return {
            status: false,
            error: result.message || "Failed to scrape TikTok data",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.data,
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
    endpoint: "/api/d/tiktok/v2",
    name: "tiktok v2",
    category: "Downloader",
    description: "This API endpoint allows you to download TikTok videos and photos by providing a TikTok URL in the request body. It scrapes the necessary information from the TikTok page, including video/photo metadata and direct download links. This can be used for archival purposes, content analysis, or integrating TikTok content into other applications. The API supports both video and image posts, providing respective download links. It handles redirects and extracts the post ID to ensure accurate data retrieval. The response includes detailed metadata like like count, play count, comment count, share count, title, description, hashtags, and location created, along with direct download URLs for the media.",
    tags: ["DOWNLOADER", "TIKTOK", "VIDEO", "PHOTO", "SOCIAL MEDIA"],
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
                description: "TikTok URL",
                example: "https://vt.tiktok.com/ZSjXNEnbC/",
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
          error: "URL must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrapeTiktokV2(url.trim())

        if (result && "error" in result) {
          return {
            status: false,
            error: result.message || "Failed to scrape TikTok data",
            code: 500,
          }
        }

        return {
          status: true,
          data: result.data,
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
