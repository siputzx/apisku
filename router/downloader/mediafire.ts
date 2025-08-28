import { chromium } from "playwright";
import * as cheerio from "cheerio";

async function mediafireScrape(url: string) {
  let browser: any;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: true,
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const page = await context.newPage();

    // Block unnecessary resources to speed up loading
    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Navigate to the URL
    try {
      await page.goto(url, {
        timeout: 60000,
        waitUntil: "networkidle",
      });
    } catch (navError) {
      console.log("Navigation issue, trying alternative approach...");
      // Continue anyway
    }

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Handle popups or overlays
    try {
      const popupSelectors = [
        ".close-btn",
        ".modal-close",
        '[data-dismiss="modal"]',
        ".popup-close",
      ];

      for (const selector of popupSelectors) {
        const popup = await page.$(selector);
        if (popup) {
          await popup.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      // Ignore popup handling errors
    }

    // Enhanced file info extraction
    const fileInfo = await page.evaluate(() => {
      // Get file name
      const getFileName = () => {
        const selectors = [
          ".filename",
          ".dl-filename",
          "h1.filename",
          ".file-title",
          ".file_name",
          ".dl-file-name",
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            return element.textContent.trim();
          }
        }

        // Try to extract from page title
        const title = document.title;
        if (title && title.includes(" - ")) {
          return title.split(" - ")[0].trim();
        }

        return "Unknown";
      };

      // Get file size
      const getFileSize = () => {
        const selectors = [
          ".details > li:first-child > span",
          ".file_size",
          ".dl-info > div:first-child",
          ".file-size",
          ".size",
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            return element.textContent.trim();
          }
        }

        // Try to find size in download button text
        const downloadBtn = document.querySelector("#downloadButton");
        if (downloadBtn && downloadBtn.textContent) {
          const sizeMatch = downloadBtn.textContent.match(
            /\((\d+\.?\d*\s*[KMGT]?B)\)/i
          );
          if (sizeMatch) {
            return sizeMatch[1];
          }
        }

        // Try to find size in body text
        const allText = document.body.innerText;
        const sizeMatch = allText.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        if (sizeMatch) {
          return sizeMatch[0];
        }

        return "Unknown";
      };

      // Get other metadata
      const getDescription = () => {
        const element = document.querySelector(
          ".description p:not(.description-subheading)"
        );
        return element ? element.textContent?.trim() || "" : "";
      };

      const getUploadDate = () => {
        const uploadElement = Array.from(
          document.querySelectorAll(".details li")
        ).find((li) => li.textContent?.includes("Uploaded"));
        return (
          uploadElement?.querySelector("span")?.textContent?.trim() || ""
        );
      };

      const getFileType = () => {
        const element = document.querySelector(".filetype span:first-child");
        return element ? element.textContent?.trim() || "" : "";
      };

      const getCompatibility = () => {
        const compatSelect = document.getElementById(
          "compat-select"
        ) as HTMLSelectElement;
        if (compatSelect) {
          const selectedOption = compatSelect.options[compatSelect.selectedIndex];
          return selectedOption ? selectedOption.textContent?.trim() || "" : "";
        }
        return "";
      };

      // Get initial download link (might be scrambled)
      const getDownloadLink = () => {
        const downloadBtn = document.querySelector(
          "#downloadButton, a.input.popsok, a[data-scrambled-url]"
        );
        
        if (downloadBtn && downloadBtn.getAttribute("data-scrambled-url")) {
          try {
            const scrambledUrl = downloadBtn.getAttribute("data-scrambled-url");
            const decodedUrl = atob(scrambledUrl!);
            console.log("Decoded URL:", decodedUrl);
            return decodedUrl;
          } catch (e) {
            console.log("Failed to decode scrambled URL:", e);
          }
        }

        // Fallback methods
        const selectors = [
          "#downloadButton",
          "a.input.popsok",
          ".download_file_link",
          "a.gbtnprimary",
          'a[href*="download"]',
          'a[aria-label*="Download"]',
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector) as HTMLAnchorElement;
          if (element && element.href && !element.href.includes("javascript:")) {
            let href = element.href;
            if (href.startsWith("//")) {
              href = "https:" + href;
            } else if (href.startsWith("/")) {
              href = window.location.origin + href;
            }
            return href;
          }
        }

        return null;
      };

      return {
        name: getFileName(),
        size: getFileSize(),
        description: getDescription(),
        uploadDate: getUploadDate(),
        fileType: getFileType(),
        compatibility: getCompatibility(),
        link: getDownloadLink(),
      };
    });

    console.log("Extracted File Info:", fileInfo);

    // If no link found, try clicking download button and wait for scrambled URL
    if (!fileInfo.link) {
      console.log("Attempting to trigger download button for scrambled URL...");
      
      try {
        // Wait for download button to be ready
        await page.waitForSelector("#downloadButton", { timeout: 10000 });
        
        // Click the download button
        await page.click("#downloadButton");
        
        // Wait for scrambled URL to appear
        await page.waitForFunction(
          () => {
            const btn = document.querySelector("#downloadButton");
            return btn && btn.getAttribute("data-scrambled-url");
          },
          { timeout: 15000 }
        );

        // Extract the scrambled URL
        const scrambledLink = await page.evaluate(() => {
          const downloadBtn = document.querySelector("#downloadButton");
          if (downloadBtn && downloadBtn.getAttribute("data-scrambled-url")) {
            try {
              const scrambledUrl = downloadBtn.getAttribute("data-scrambled-url");
              return atob(scrambledUrl!);
            } catch (e) {
              return null;
            }
          }
          return null;
        });

        if (scrambledLink) {
          fileInfo.link = scrambledLink;
          console.log("Successfully extracted scrambled URL:", scrambledLink);
        }
      } catch (e) {
        console.log("Failed to extract scrambled URL:", e);
        
        // Final fallback - try network interception
        let interceptedUrl: string | null = null;
        
        page.on('request', (request) => {
          const reqUrl = request.url();
          if (reqUrl.includes('mediafire.com') && 
              (reqUrl.includes('download') || reqUrl.match(/\.(zip|rar|exe|apk|pdf|mp4|mp3)$/i))) {
            interceptedUrl = reqUrl;
          }
        });

        try {
          await page.click("#downloadButton");
          await page.waitForTimeout(5000);
          
          if (interceptedUrl) {
            fileInfo.link = interceptedUrl;
            console.log("Successfully intercepted download URL:", interceptedUrl);
          }
        } catch (clickError) {
          console.log("Failed final fallback:", clickError);
        }
      }
    }

    // Get file extension and MIME type
    const fileExtensionMatch = fileInfo.name?.match(/\.([a-zA-Z0-9]+)$/);
    const fileExtension = fileExtensionMatch ? fileExtensionMatch[1].toLowerCase() : "";

    const mimeTypeMap: { [key: string]: string } = {
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      txt: "text/plain",
      exe: "application/x-msdownload",
      apk: "application/vnd.android.package-archive",
    };

    const mimeType = mimeTypeMap[fileExtension] || "application/octet-stream";

    // Get meta tags
    const metaTags = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("meta")).reduce(
        (acc: { [key: string]: string }, meta) => {
          const name = meta.getAttribute("name") || meta.getAttribute("property");
          const content = meta.getAttribute("content");
          if (name && content && name !== "undefined") {
            acc[name.split(":")[1] || name] = content;
          }
          return acc;
        },
        {}
      );
    });

    await browser.close();
    
    return {
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      description: fileInfo.description,
      uploadDate: fileInfo.uploadDate,
      fileType: fileInfo.fileType,
      compatibility: fileInfo.compatibility,
      downloadLink: fileInfo.link,
      mimeType,
      fileExtension,
      meta: metaTags,
    };
  } catch (error: any) {
    console.error("Scraping Error:", error.message);
    throw new Error(`Failed to scrape MediaFire: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/d/mediafire",
    name: "mediafire",
    category: "Downloader",
    description:
      "This API endpoint allows you to retrieve detailed download information for a file hosted on MediaFire. By providing a MediaFire URL, the API will scrape the page to extract critical details such as the file name, direct download link, file size, description, upload date, file type, compatibility information, and relevant metadata from the page's meta tags. It also attempts to determine the MIME type based on the file extension. This is particularly useful for automated downloading or integrating MediaFire links into other applications. The scraping process handles potential redirects to ensure the correct download link is obtained. The output provides a structured object containing all the extracted data.",
    tags: ["DOWNLOADER", "MediaFire", "File Scraper"],
    example:
      "?url=https://www.mediafire.com/file/iojnikfucf67q74/Base_Bot_Simpel.zip/file",
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
        description: "MediaFire file URL",
        example:
          "https://www.mediafire.com/file/iojnikfucf67q74/Base_Bot_Simpel.zip/file",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {};

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        };
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        };
      }

      if (!/^https?:\/\/(www\.)?mediafire\.com\//.test(url.trim())) {
        return {
          status: false,
          error: "Invalid MediaFire URL format",
          code: 400,
        };
      }

      try {
        const data = await mediafireScrape(url.trim());

        if (!data || !data.downloadLink) {
          return {
            status: false,
            error: "Failed to extract download link from MediaFire",
            code: 500,
          };
        }

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/d/mediafire",
    name: "mediafire",
    category: "Downloader",
    description:
      "This API endpoint allows you to retrieve detailed download information for a file hosted on MediaFire by providing its URL in the request body. By providing a MediaFire URL, the API will scrape the page to extract critical details such as the file name, direct download link, file size, description, upload date, file type, compatibility information, and relevant metadata from the page's meta tags. It also attempts to determine the MIME type based on the file extension. This is particularly useful for automated downloading or integrating MediaFire links into other applications. The scraping process handles potential redirects to ensure the correct download link is obtained. The output provides a structured object containing all the extracted data.",
    tags: ["DOWNLOADER", "MediaFire", "File Scraper"],
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
                description: "MediaFire file URL",
                example:
                  "https://www.mediafire.com/file/iojnikfucf67q74/Base_Bot_Simpel.zip/file",
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
      const { url } = req.body || {};

      if (!url) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        };
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter must be a non-empty string",
          code: 400,
        };
      }

      if (!/^https?:\/\/(www\.)?mediafire\.com\//.test(url.trim())) {
        return {
          status: false,
          error: "Invalid MediaFire URL format",
          code: 400,
        };
      }

      try {
        const data = await mediafireScrape(url.trim());

        if (!data || !data.downloadLink) {
          return {
            status: false,
            error: "Failed to extract download link from MediaFire",
            code: 500,
          };
        }

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
];