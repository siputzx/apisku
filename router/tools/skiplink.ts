export default [
  {
    metode: "GET",
    endpoint: "/api/tools/skiplink",
    name: "Skiplink Bypass",
    category: "Tools",
    description: "This API endpoint bypasses link shorteners using bypass.city service with Turnstile token solving. It takes a shortener URL and returns the bypassed direct link.",
    tags: ["Tools", "SKIPLINK", "BYPASS", "TURNSTILE", "LINKVERTISE"],
    example: "?url=https://linkvertise.com/514008/hydrogen-gateway-1",
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
        description: "Link shortener URL to bypass",
        example: "https://linkvertise.com/514008/hydrogen-gateway-1",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, solveBypass }) {
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

      // Validasi format URL
      try {
        new URL(url.trim());
      } catch {
        return {
          status: false,
          error: "Invalid URL format",
          code: 400,
        };
      }

      try {
        // Solve Turnstile untuk bypass.city
        const bypass = await solveBypass();
        const token = await bypass.solveTurnstileMin("https://bypass.city/", "0x4AAAAAAAGzw6rXeQWJ_y2P");

        if (!token) {
          return {
            status: false,
            error: "Failed to solve Turnstile challenge for bypass.city",
            code: 500,
          };
        }

        // Request ke bypass.city API dengan token
        const response = await fetch("https://api2.bypass.city/bypass", {
          method: "POST",
          headers: {
            "authority": "api2.bypass.city",
            "accept": "*/*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "origin": "https://bypass.city",
            "referer": "https://bypass.city/",
            "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "token": token,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
            "x-captcha-provider": "TURNSTILE",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        });

        if (!response.ok) {
          return {
            status: false,
            error: `Bypass.city API error: ${response.status} ${response.statusText}`,
            code: response.status,
          };
        }

        const result = await response.json();

        if (!result) {
          return {
            status: false,
            error: "No response from bypass.city API",
            code: 500,
          };
        }

        return {
          status: true,
          data: result,
          originalUrl: url.trim(),
          timestamp: new Date().toISOString(),
        };

      } catch (error) {
        return {
          status: false,
          error: error.message || "Failed to bypass link",
          code: 500,
        };
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/skiplink",
    name: "Skiplink Bypass",
    category: "Tools",
    description: "This API endpoint bypasses link shorteners using bypass.city service with Turnstile token solving. It takes a shortener URL via JSON request body and returns the bypassed direct link.",
    tags: ["Tools", "SKIPLINK", "BYPASS", "TURNSTILE", "LINKVERTISE"],
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
                description: "Link shortener URL to bypass",
                example: "https://linkvertise.com/514008/hydrogen-gateway-1",
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
    async run({ req, solveBypass }) {
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

      // Validasi format URL
      try {
        new URL(url.trim());
      } catch {
        return {
          status: false,
          error: "Invalid URL format",
          code: 400,
        };
      }

      try {
        // Solve Turnstile untuk bypass.city
        const bypass = await solveBypass();
        const token = await bypass.solveTurnstileMin("https://bypass.city/", "0x4AAAAAAAGzw6rXeQWJ_y2P");

        if (!token) {
          return {
            status: false,
            error: "Failed to solve Turnstile challenge for bypass.city",
            code: 500,
          };
        }

        // Request ke bypass.city API dengan token
        const response = await fetch("https://api2.bypass.city/bypass", {
          method: "POST",
          headers: {
            "authority": "api2.bypass.city",
            "accept": "*/*",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "origin": "https://bypass.city",
            "referer": "https://bypass.city/",
            "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "token": token,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
            "x-captcha-provider": "TURNSTILE",
          },
          body: JSON.stringify({
            url: url.trim(),
          }),
        });

        if (!response.ok) {
          return {
            status: false,
            error: `Bypass.city API error: ${response.status} ${response.statusText}`,
            code: response.status,
          };
        }

        const result = await response.json();

        if (!result) {
          return {
            status: false,
            error: "No response from bypass.city API",
            code: 500,
          };
        }

        return {
          status: true,
          data: result,
          originalUrl: url.trim(),
          timestamp: new Date().toISOString(),
        };

      } catch (error) {
        return {
          status: false,
          error: error.message || "Failed to bypass link",
          code: 500,
        };
      }
    },
  },
]