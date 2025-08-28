import axios from "axios"
import * as cheerio from "cheerio"

async function generateVcc(type: string, count: number) {
  const cards = []
  for (let i = 0; i < count; i++) {
    const response = await axios({
      method: "post",
      url: "https://neapay.com/online-tools/credit-card-number-generator-validator.html",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      },
      data: `bin=${type}&generate=`,
    })

    const $ = cheerio.load(response.data)
    const cardFront = $(".card-front")
    const cardBack = $(".card-back")

    cards.push({
      cardNumber: cardFront
        .find("pre")
        .eq(0)
        .text()
        .trim()
        .replace(/\s+/g, ""),
      expirationDate: cardFront.find("pre").eq(1).text().trim(),
      cardholderName: cardFront.find("pre").eq(2).text().trim(),
      cvv: cardBack.find("pre").eq(0).text().trim(),
    })
  }
  return cards
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/vcc-generator",
    name: "vcc generator",
    category: "Tools",
    description:
      "This API endpoint allows you to generate virtual credit card (VCC) details for various card types. You can specify the type of card (e.g., Visa, MasterCard) and the number of cards to generate (up to a maximum of 5). The API will return generated card details including card number, expiration date, cardholder name, and CVV. This tool can be useful for testing payment systems or for educational purposes where dummy card data is required.",
    tags: ["TOOLS", "VCC", "GENERATOR"],
    example: "?type=MasterCard&count=3",
    parameters: [
      {
        name: "type",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: ["Visa", "MasterCard", "Amex", "CUP", "JCB", "Diners", "RuPay"],
        },
        description: "Credit card type",
        example: "Visa",
      },
      {
        name: "count",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          default: 1,
        },
        description: "Number of VCCs",
        example: 3,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { type, count = 1 } = req.query || {}

      const availableTypes = [
        "Visa",
        "MasterCard",
        "Amex",
        "CUP",
        "JCB",
        "Diners",
        "RuPay",
      ]

      if (!type) {
        return {
          status: false,
          error: "Card type is required.",
          code: 400,
        }
      }

      if (typeof type !== "string" || type.trim().length === 0) {
        return {
          status: false,
          error: "Card type must be a non-empty string.",
          code: 400,
        }
      }

      if (!availableTypes.includes(type.trim())) {
        return {
          status: false,
          error: "Invalid card type.",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      const parsedCount = parseInt(String(count).trim(), 10)
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 5) {
        return {
          status: false,
          error: "Count must be an integer between 1 and 5.",
          code: 400,
        }
      }

      try {
        const cards = await generateVcc(type.trim(), parsedCount)
        return {
          status: true,
          count: cards.length,
          data: cards,
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
    endpoint: "/api/tools/vcc-generator",
    name: "vcc generator",
    category: "Tools",
    description:
      "This API endpoint allows you to generate virtual credit card (VCC) details for various card types. You can specify the type of card (e.g., Visa, MasterCard) and the number of cards to generate (up to a maximum of 5) using a JSON request body. The API will return generated card details including card number, expiration date, cardholder name, and CVV. This tool can be useful for testing payment systems or for educational purposes where dummy card data is required.",
    tags: ["TOOLS", "VCC", "GENERATOR"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["type"],
            properties: {
              type: {
                type: "string",
                enum: ["Visa", "MasterCard", "Amex", "CUP", "JCB", "Diners", "RuPay"],
                description: "Credit card type",
                example: "Visa",
              },
              count: {
                type: "integer",
                minimum: 1,
                maximum: 5,
                default: 1,
                description: "Number of VCCs",
                example: 3,
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
      const { type, count = 1 } = req.body || {}

      const availableTypes = [
        "Visa",
        "MasterCard",
        "Amex",
        "CUP",
        "JCB",
        "Diners",
        "RuPay",
      ]

      if (!type) {
        return {
          status: false,
          error: "Card type is required.",
          code: 400,
        }
      }

      if (typeof type !== "string" || type.trim().length === 0) {
        return {
          status: false,
          error: "Card type must be a non-empty string.",
          code: 400,
        }
      }

      if (!availableTypes.includes(type.trim())) {
        return {
          status: false,
          error: "Invalid card type.",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      const parsedCount = parseInt(String(count).trim(), 10)
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 5) {
        return {
          status: false,
          error: "Count must be an integer between 1 and 5.",
          code: 400,
        }
      }

      try {
        const cards = await generateVcc(type.trim(), parsedCount)
        return {
          status: true,
          count: cards.length,
          data: cards,
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