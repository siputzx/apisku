import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

declare const proxy: () => string | null;

puppeteer.use(StealthPlugin());

async function searchYouCom(queryText: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const cookies = [{"domain":"you.com","expirationDate":1753066860.339816,"hostOnly":true,"httpOnly":false,"name":"safesearch_guest","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"Moderate"},{"domain":".you.com","expirationDate":1782012590.579163,"hostOnly":false,"httpOnly":false,"name":"uuid_guest","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"120e9105-dc66-4042-a13c-005fe9b2b690"},{"domain":"you.com","expirationDate":1782012590.579383,"hostOnly":true,"httpOnly":true,"name":"uuid_guest_backup","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"120e9105-dc66-4042-a13c-005fe9b2b690"},{"domain":"you.com","expirationDate":1753066842.862795,"hostOnly":true,"httpOnly":false,"name":"total_query_count","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"0"},{"domain":".you.com","expirationDate":1750647662.568775,"hostOnly":false,"httpOnly":true,"name":"DFN-2yned8lLabp3qXjVMojrv96n4nM","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"fFuh6ZeRqFmwNagfd0iVoNxApUegw01p1DVUNWSgFNc"},{"domain":".you.com","expirationDate":1781924461.569028,"hostOnly":false,"httpOnly":true,"name":"DSR","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMmpJbnU3SWpjMkp1eFJad1psWHBZRUpQQkFvIiwidHlwIjoiSldUIn0.eyJhbXIiOlsib2F1dGgiXSwiYXV0aDBJZCI6bnVsbCwiY3JlYXRlVGltZSI6MTc1MDQ3NDg2MCwiZHJuIjoiRFNSIiwiZHYiOjEsImVtYWlsIjoic2lwdXR6eC5wcm9kdWN0aW9uQGdtYWlsLmNvbSIsImV4cCI6MTc4MTkyNDQ2MywiZnRpIjoiSjJ5bmVleDRFUWl5WmxweXVtWmdncEhlY3A5YyIsImdpdmVuTmFtZSI6InNpcHV0engiLCJpYXQiOjE3NTA0NzQ4NjMsImlzcyI6IlAyakludHRSTXVYcHlZWk1iVmNzYzRDOVowUlQiLCJqdGkiOiJKMnluZWV4NEVRaXlabHB5dW1aZ2dwSGVjcDljIiwibGFzdE5hbWUiOiJwcm9kdWN0aW9uIiwibG9naW5JZHMiOlsiZ29vZ2xlLTExNTU3NTYxNzMyNzg2MTEzMjE0NCIsInNpcHV0engucHJvZHVjdGlvbkBnbWFpbC5jb20iXSwibmFtZSI6InNpcHV0enggcHJvZHVjdGlvbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMTmJBOXFFOVh2elZWem01cHlQMEN3U3VsVFVIRW9yN29XdDlNNDVCOGFrNVhDalc0PXM5Ni1jIiwic3R5dGNoSWQiOm51bGwsInN1YiI6IlUyeW5lZWMwNmh4TWJXRGJjQ25KMVZuYXhaOTUiLCJzdWJzY3JpcHRpb25UaWVyIjpudWxsLCJ0ZW5hbnRDdXN0b21BdHRyaWJ1dGVzIjp7ImlzRW50ZXJwcmlzZSI6Int7dGVuYW50LmN1c3RvbUF0dHJpYnV0ZXMuaXNFbnRlcnByaXNlfX0iLCJuYW1lIjoie3t0ZW5hbnQubmFtZX19In0sInRlbmFudEludml0YXRpb24iOm51bGwsInRlbmFudEludml0ZXIiOm51bGwsInVzZXJJZCI6IlUyeW5lZWMwNmh4TWJXRGJjQ25KMVZuYXhaOTUiLCJ2ZXJpZmllZEVtYWlsIjp0cnVlfQ.Tyh2JlR7VQH9T_yPgc5RmpHi36_I24rdaDqU36HmAMss3grO3nkk1E46nVwgliOx_5UOZxrBGweKyhiJcnZoyVg9Zmy0JVetnVY9ByagEJdgGWcvfT7_YYy9Qn1yEHAMupmO85S0pQOCJ9SEZ5zL3CyGiwGlljv9f63xfHH6hbC89YU8C1cAv96Ia4OkJ9FmydH4ITO2CEHX3YL1g64kwRLu65jQt-JaRknBwO0mDNgCdkVHfGowAypFRWUxhCVahY4mm_zdckz0ctqlUVfG49M6AAn27kJR6JcvU-n9Ex-55T-RKbCQY16E2vFWWF6hw7Ooowal1Ca9mBh4yy9vYw"},{"domain":".you.com","expirationDate":1785034868,"hostOnly":false,"httpOnly":false,"name":"ab.storage.deviceId.dcee0642-d796-4a7b-9e56-a0108e133b07","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"g%3A2201a653-0ff1-d736-1c0e-80632de5d07c%7Ce%3Aundefined%7Cc%3A1750474844800%7Cl%3A1750474862935"},{"domain":".you.com","expirationDate":1785034868,"hostOnly":false,"httpOnly":false,"name":"ab.storage.userId.dcee0642-d796-4a7b-9e56-a0108e133b07","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"g%3AU2yneec06hxMbWDbcCnJ1VnaxZ95%7Ce%3Aundefined%7Cc%3A1750474862918%7Cl%3A1750474862939"},{"domain":"you.com","expirationDate":1753068588.123372,"hostOnly":true,"httpOnly":false,"name":"ld_context","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"%7B%22kind%22%3A%22user%22%2C%22key%22%3A%22120e9105-dc66-4042-a13c-005fe9b2b690%22%2C%22email%22%3A%22siputzx.production%40gmail.com%22%2C%22userCreatedAt%22%3A%222025-06-21T03%3A01%3A00.000Z%22%2C%22country%22%3A%22ID%22%2C%22userAgent%22%3A%22Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F132.0.0.0%20Mobile%20Safari%2F537.36%22%2C%22secUserAgent%22%3A%22%5C%22Not%20A(Brand%5C%22%3Bv%3D%5C%228%5C%22%2C%20%5C%22Chromium%5C%22%3Bv%3D%5C%22132%5C%22%22%2C%22tenantId%22%3A%22UNKNOWN%22%7D"},{"domain":"you.com","expirationDate":1753068569.142714,"hostOnly":true,"httpOnly":false,"name":"safesearch_0f23627ff44a90c4969969e4d29cbb9292186d5d5e51eb335cf87c30af4e7c78","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"Moderate"},{"domain":"you.com","expirationDate":1753068571.898132,"hostOnly":true,"httpOnly":false,"name":"youchat_personalization","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"true"},{"domain":"you.com","expirationDate":1753068571.898909,"hostOnly":true,"httpOnly":false,"name":"youchat_smart_learn","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"true"},{"domain":".you.com","expirationDate":1781924464.56854,"hostOnly":false,"httpOnly":true,"name":"DS","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLMmpJbnU3SWpjMkp1eFJad1psWHBZRUpQQkFvIiwidHlwIjoiSldUIn0.eyJhbXIiOlsib2F1dGgiXSwiYXV0aDBJZCI6bnVsbCwiY3JlYXRlVGltZSI6MTc1MDQ3NDg2MCwiZHJuIjoiRFMiLCJlbWFpbCI6InNpcHV0engucHJvZHVjdGlvbkBnbWFpbC5jb20iLCJleHAiOjE3NTE2ODQ0NjYsImdpdmVuTmFtZSI6InNpcHV0engiLCJpYXQiOjE3NTA0NzQ4NjYsImlzcyI6IlAyakludHRSTXVYcHlZWk1iVmNzYzRDOVowUlQiLCJsYXN0TmFtZSI6InByb2R1Y3Rpb24iLCJsb2dpbklkcyI6WyJnb29nbGUtMTE1NTc1NjE3MzI3ODYxMTMyMTQ0Iiwic2lwdXR6eC5wcm9kdWN0aW9uQGdtYWlsLmNvbSJdLCJuYW1lIjoic2lwdXR6eCBwcm9kdWN0aW9uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xOYkE5cUU5WHZ6VlZ6bTVweVAwQ3dTdWxUVUhFb3I3b1d0OU00NUI4YWs1WENqVzQ9czk2LWMiLCJyZXhwIjoiMjAyNi0wNi0yMFQwMzowMTowNloiLCJzdHl0Y2hJZCI6bnVsbCwic3ViIjoiVTJ5bmVlYzA2aHhNYldEYmNDbkoxVm5heFo5NSIsInN1YnNjcmlwdGlvblRpZXIiOm51bGwsInRlbmFudEN1c3RvbUF0dHJpYnV0ZXMiOnsiaXNFbnRlcnByaXNlIjoie3t0ZW5hbnQuY3VzdG9tQXR0cmlidXRlcy5pc0VudGVycHJpc2V9fSIsIm5hbWUiOiJ7e3RlbmFudC5uYW1lfX0ifSwidGVuYW50SW52aXRhdGlvbiI6bnVsbCwidGVuYW50SW52aXRlciI6bnVsbCwidXNlcklkIjoiVTJ5bmVlYzA2aHhNYldEYmNDbkoxVm5heFo5NSIsInZlcmlmaWVkRW1haWwiOnRydWV9.pR_FjscE9Ad4HmNCSiEcmMwI7YfvPzdJtcwFpjTaPOSRdDI8VkBZUwmYkl4pAZohmbCIlllgbrNeC9u-f0Qmv93s8_yPnIXxqVQPdXT6qk0rJR0JVf4yMMABpOs4qE2-_aFivJsPi92u1jqZMpdIjXLxRi56qB7UwEIb2JZ6fgx7Fdep0umYrUyL90jVs4TdZtc-AaCRMzAIAikWuA4BIFdPwSovfqet6VHQ-aHejJb5LfRLdq7XnUxQnPqfJMjjIZtm8BdCb7aCVJPCkzktT_F8kxzXOxlB-wDXtg9GuTckdSx7tZg07xtHHXTkXw5URbfLj36n5dab9LA7YwAxlA"},{"domain":".you.com","hostOnly":false,"httpOnly":true,"name":"_cfuvid","path":"/","sameSite":"no_restriction","secure":true,"session":true,"storeId":"0","value":"O_1Ebh7T_1IWf4hemjhDbzCRaeOFs0FCjKv6rBdcqds-1750474867632-0.0.1.1-604800000"},{"domain":"you.com","expirationDate":1753068574.397498,"hostOnly":true,"httpOnly":false,"name":"youpro_subscription","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"false"},{"domain":"you.com","expirationDate":1753068574.398219,"hostOnly":true,"httpOnly":false,"name":"you_subscription","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"freemium"},{"domain":"you.com","hostOnly":true,"httpOnly":false,"name":"daily_query_count","path":"/","sameSite":"unspecified","secure":false,"session":true,"storeId":"0","value":"0"},{"domain":"you.com","hostOnly":true,"httpOnly":false,"name":"daily_query_date","path":"/","sameSite":"unspecified","secure":false,"session":true,"storeId":"0","value":"Sat%20Jun%2021%202025"},{"domain":".you.com","expirationDate":1785036573,"hostOnly":false,"httpOnly":false,"name":"ab.storage.sessionId.dcee0642-d796-4a7b-9e56-a0108e133b07","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"g%3A292a8299-06ff-e3e0-61ac-729c7603b622%7Ce%3A1750478373159%7Cc%3A1750474862931%7Cl%3A1750476573159"}]
    await page.setCookie(...cookies);

    let chatTokens: string[] = [];
    let citations: any[] = [];
    let isDone = false;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/streamingSearch")) {
        try {
          const buffer = await response.buffer();
          const text = buffer.toString("utf-8");
          const events = text.split("\n\n").filter((e) => e.trim());

          for (const event of events) {
            const lines = event.split("\n");
            let eventType = "";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.replace("event: ", "").trim();
              } else if (line.startsWith("data: ")) {
                data = line.replace("data: ", "").trim();
              }
            }

            if (eventType && data) {
              try {
                const parsedData = JSON.parse(data);

                if (eventType === "youChatToken" && parsedData.youChatToken) {
                  chatTokens.push(parsedData.youChatToken);
                }

                if (eventType === "thirdPartySearchResults" && parsedData.search?.third_party_search_results) {
                  citations = parsedData.search.third_party_search_results.map((r: any) => ({
                    title: r.name || r.snippet,
                    url: r.url,
                    source: r.displayUrl,
                  }));
                }

                if (eventType === "youChatUpdate" && parsedData.i === 3 && parsedData.msg === "Responding" && parsedData.done === true) {
                  isDone = true;
                }
              } catch (e) {
                console.error("Failed to parse data for event:", eventType, e);
              }
            }
          }
        } catch (e) {
          console.error("Failed to process stream:", e);
        }
      }
    });

    await page.goto("https://you.com/?chatMode=default", {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector("textarea#search-input-textarea");
    await page.type("textarea#search-input-textarea", queryText, {
      delay: 30,
    });
    await page.click("button[type=\"submit\"]");

    const maxWait = 20000;
    const waitUntilDone = Date.now() + maxWait;

    while (!isDone && Date.now() < waitUntilDone) {
      await new Promise((res) => setTimeout(res, 250));
    }

    if (!isDone) {
      await browser.close();
    }

    return {
      response: chatTokens.join(""),
      citations: citations,
    };
  } catch (error) {
    console.error("Error in searchYouCom:", error);
    await browser.close();
    throw error;
  }
}

export default [{
  metode: "GET",
  endpoint: "/api/ai/youai",
  name: "You.com AI",
  category: "AI",
  description: "This API endpoint provides a service to get AI-generated responses from You.com based on a given text query. The API utilizes a headless browser with a stealth plugin to interact with the You.com website, mimicking a human user to perform a search and retrieve the streaming AI response. It captures the AI's chat tokens and any associated citations from third-party search results. The output is a structured JSON object containing the full AI response and a list of citation sources, making it useful for applications that require automated conversational AI with web-sourced context. It is designed to handle both simple queries and complex questions by waiting for the streaming response to complete.",
  tags: ["AI", "You.com", "Search"],
  example: "?text=what is AI",
  parameters: [{
    name: "text",
    in: "query",
    required: true,
    schema: {
      type: "string",
      minLength: 1,
      maxLength: 1000,
    },
    description: "Text to ask the AI",
    example: "apa itu AI",
  }, ],
  isPremium: false,
  isMaintenance: false,
  isPublic: true,
  async run({
    req
  }) {
    const {
      text
    } = req.query || {};

    if (!text) {
      return {
        status: false,
        error: "Parameter 'text' is required",
        code: 400,
      };
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return {
        status: false,
        error: "Parameter 'text' must be a non-empty string",
        code: 400,
      };
    }

    try {
      const response = await searchYouCom(text.trim());

      return {
        status: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: false,
        error: error.message || "Internal Server Error",
        code: 500,
      };
    }
  },
}, {
  metode: "POST",
  endpoint: "/api/ai/youai",
  name: "You.com AI",
  category: "AI",
  description: "This API endpoint provides a service to get AI-generated responses from You.com based on a given text query. The API utilizes a headless browser with a stealth plugin to interact with the You.com website, mimicking a human user to perform a search and retrieve the streaming AI response. It captures the AI's chat tokens and any associated citations from third-party search results. The output is a structured JSON object containing the full AI response and a list of citation sources, making it useful for applications that require automated conversational AI with web-sourced context. It is designed to handle both simple queries and complex questions by waiting for the streaming response to complete.",
  tags: ["AI", "You.com", "Search"],
  example: "",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              description: "Text to ask the AI",
              example: "apa itu AI?",
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
  async run({
    req
  }) {
    const {
      text
    } = req.body || {};

    if (!text) {
      return {
        status: false,
        error: "Parameter 'text' is required",
        code: 400,
      };
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return {
        status: false,
        error: "Parameter 'text' must be a non-empty string",
        code: 400,
      };
    }

    try {
      const response = await searchYouCom(text.trim());

      return {
        status: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: false,
        error: error.message || "Internal Server Error",
        code: 500,
      };
    }
  },
}, ];