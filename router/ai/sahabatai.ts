import axios from "axios";

async function sahabatAIChat(message: string, cookie: string) {
  try {
    const response = await axios({
      method: "post",
      url: "https://sahabat-ai.com/v1/chat/session",
      headers: {
        "authority": "sahabat-ai.com",
        "accept": "text/event-stream, application/json",
        "accept-language": "en",
        "content-type": "application/json",
        "cookie": `sID=${cookie}`,
        "origin": "https://sahabat-ai.com",
        "referer": "https://sahabat-ai.com/chat",
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "x-client-id": "android",
      },
      data: { message: message },
      responseType: "stream",
    });

    let result = "";
    await new Promise<void>((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.type === "result_stream") {
                result += data.data;
              }
            } catch (parseError) {
              // Ignore non-JSON lines
            }
          }
        });
      });

      response.data.on("end", () => {
        resolve();
      });

      response.data.on("error", (error: Error) => {
        reject(error);
      });
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to get response from API");
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/sahabat-ai",
    name: "sahabat ai",
    category: "AI",
    description: "This API endpoint provides AI-generated responses from the 'sahabat-ai' service by accepting a text query via a GET request. It is designed for simple, direct conversational or content generation tasks, making it ideal for integrations where a quick, straightforward request-response model is required. The API expects a 'content' query parameter containing the user's message. It uses a session cookie to maintain context and provides a text-based response from the AI. The endpoint handles errors gracefully, ensuring that issues with the request or the AI service are communicated clearly to the user.",
    tags: ["AI", "Natural Language Processing", "Chatbot", "Text Generation", "Sahabat AI"],
    example: "?content=kamu%20siapa%2C%20kamu%20di%20buat%20oleh%20siapa%20dan%20kamu%20berasal%20dari%20mana%3F",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
        },
        description: "Text content for AI processing",
        example: "Tell me a short story.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { content } = req.query || {};
      const cookie = "eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJhdWQiOlsiZ29qZWsiXSwiYnJvd3Nlcl9mYW1pbHkiOiJjaHJvbWUiLCJkYXQiOnsiYWN0aXZlIjoidHJ1ZSIsImJsYWNrbGlzdGVkIjoiZmFsc2UiLCJjb3VudHJ5X2NvZGUiOiIrNjIiLCJjcmVhdGVkX2F0IjoiMjAyNS0wNy0zMFQwNjowODoyMVoiLCJlbWFpbCI6IiIsImVtYWlsX3ZlcmlmaWVkIjoiZmFsc2UiLCJnb3BheV9hY2NvdW50X2lkIjoiMDEtNDI4ZTRlYmM2OWJhNGIwOTg2MTc0MWMyM2ViYjU5YjQtMzgiLCJpZCI6Ijg2MTAzMjc2NCIsIm5hbWUiOiJzYWhhYmF0IDE5ODU5ZjIzMzEwMjE2IiwibnVtYmVyIjoiODUxOTQ3NjkwNjgiLCJwaG9uZSI6Iis2Mjg1MTk0NzY5MDY4Iiwic2lnbmVkX3VwX2NvdW50cnkiOiJJRCIsIndhbGxldF9pZCI6IiJ9LCJleHAiOjE3NjAzMDk0MTMsImlhdCI6MTc1NzMxNTUxMiwiaXNzIjoiZ29pZCIsImp0aSI6IjRhYTlkMjJiLTE0YzItNDQwZC05NjhlLTY4ZmVhOGQ0NWVjMyIsInBsYXRmb3JtIjoic2FoYWJhdC13ZWIiLCJzY29wZXMiOltdLCJzaWQiOiIzYzI4Y2U2OS1kZWFhLTQ3NDEtOTc2Mi0yNWYyNWYzNGYyNTQiLCJzdWIiOiI1YjY3MzM3MC04OGU4LTQ3ZTItYjE2Yy1hOTIwY2Y0OWVkNTAiLCJ0b2tlbl92ZXJzaW9uIjoiMS4xIiwidWlkIjoiODYxMDMyNzY0IiwidXR5cGUiOiJjdXN0b21lciJ9.DBvA_HmFEHFD89D7bFRIc0JhrTc4VoU8hbFxTFrCieHbHFNsdx0OTmQwnKzKTdgHHU7lsf_V29zO-5jjJQhBrLs7vL7kaoUyHS11r2sSPa-KdObuWbIIANX5hz8N0t_8MHchmfRnkdBUMaSkZy02RIuaUS_eUxkvyAJZBcDi1SQ";

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        };
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await sahabatAIChat(content.trim(), cookie.trim());

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
            code: 500,
          };
        }

        return {
          status: true,
          data: result,
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
    endpoint: "/api/ai/sahabat-ai",
    name: "sahabat ai",
    category: "AI",
    description: "This API endpoint provides AI-generated responses from the 'sahabat-ai' service by accepting a text query via a POST request. It is designed for simple, direct conversational or content generation tasks, making it ideal for integrations where a quick, straightforward request-response model is required. The API expects a 'content' query parameter containing the user's message. It uses a session cookie to maintain context and provides a text-based response from the AI. The endpoint handles errors gracefully, ensuring that issues with the request or the AI service are communicated clearly to the user.",
    tags: ["AI", "Natural Language Processing", "Chatbot", "Text Generation", "Sahabat AI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "string",
                description: "Text content for AI processing",
                example: "Explain quantum physics simply.",
                minLength: 1,
                maxLength: 1000,
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
      const { content } = req.body || {};
      const cookie = "eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJhdWQiOlsiZ29qZWsiXSwiYnJvd3Nlcl9mYW1pbHkiOiJjaHJvbWUiLCJkYXQiOnsiYWN0aXZlIjoidHJ1ZSIsImJsYWNrbGlzdGVkIjoiZmFsc2UiLCJjb3VudHJ5X2NvZGUiOiIrNjIiLCJjcmVhdGVkX2F0IjoiMjAyNS0wNy0zMFQwNjowODoyMVoiLCJlbWFpbCI6IiIsImVtYWlsX3ZlcmlmaWVkIjoiZmFsc2UiLCJnb3BheV9hY2NvdW50X2lkIjoiMDEtNDI4ZTRlYmM2OWJhNGIwOTg2MTc0MWMyM2ViYjU5YjQtMzgiLCJpZCI6Ijg2MTAzMjc2NCIsIm5hbWUiOiJzYWhhYmF0IDE5ODU5ZjIzMzEwMjE2IiwibnVtYmVyIjoiODUxOTQ3NjkwNjgiLCJwaG9uZSI6Iis2Mjg1MTk0NzY5MDY4Iiwic2lnbmVkX3VwX2NvdW50cnkiOiJJRCIsIndhbGxldF9pZCI6IiJ9LCJleHAiOjE3NjAzMDk0MTMsImlhdCI6MTc1NzMxNTUxMiwiaXNzIjoiZ29pZCIsImp0aSI6IjRhYTlkMjJiLTE0YzItNDQwZC05NjhlLTY4ZmVhOGQ0NWVjMyIsInBsYXRmb3JtIjoic2FoYWJhdC13ZWIiLCJzY29wZXMiOltdLCJzaWQiOiIzYzI4Y2U2OS1kZWFhLTQ3NDEtOTc2Mi0yNWYyNWYzNGYyNTQiLCJzdWIiOiI1YjY3MzM3MC04OGU4LTQ3ZTItYjE2Yy1hOTIwY2Y0OWVkNTAiLCJ0b2tlbl92ZXJzaW9uIjoiMS4xIiwidWlkIjoiODYxMDMyNzY0IiwidXR5cGUiOiJjdXN0b21lciJ9.DBvA_HmFEHFD89D7bFRIc0JhrTc4VoU8hbFxTFrCieHbHFNsdx0OTmQwnKzKTdgHHU7lsf_V29zO-5jjJQhBrLs7vL7kaoUyHS11r2sSPa-KdObuWbIIANX5hz8N0t_8MHchmfRnkdBUMaSkZy02RIuaUS_eUxkvyAJZBcDi1SQ";

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        };
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await sahabatAIChat(content.trim(), cookie.trim());

        if (!result) {
          return {
            status: false,
            error: "No result returned from the API",
            code: 500,
          };
        }

        return {
          status: true,
          data: result,
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