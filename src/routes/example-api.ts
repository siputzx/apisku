import type { ApiRoute } from "../types/index"

// Example API route - you can create more files like this in the routes directory
const exampleRoutes: ApiRoute[] = [
  {
    category: "example",
    name: "Hello World",
    metode: "GET",
    endpoint: "/api/hello",
    description: "Simple hello world endpoint",
    parameters: [
      {
        name: "name",
        in: "query",
        description: "Name to greet",
        required: false,
        schema: { type: "string" },
      },
    ],
    example: "?name=World",
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    run: async ({ req }) => {
      const name = req.query.name || "World"
      return {
        status: true,
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
      }
    },
  },
  {
    category: "example",
    name: "Echo POST",
    metode: "POST",
    endpoint: "/api/echo",
    description: "Echo back the request body",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    run: async ({ req }) => {
      return {
        status: true,
        echo: req.body,
        timestamp: new Date().toISOString(),
      }
    },
  },
]

export default exampleRoutes
