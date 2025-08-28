import { faker } from "@faker-js/faker"

async function generateFakeData(type: string, count: number) {
  let data
  switch (type) {
    case "person":
      data = Array.from({ length: Number(count) }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        phone: faker.phone.number(),
        birthDate: faker.date.past(),
        gender: faker.person.gender(),
      }))
      break
    case "company":
      data = Array.from({ length: Number(count) }, () => ({
        name: faker.company.name(),
        catchPhrase: faker.company.catchPhrase(),
        address: faker.location.streetAddress(),
        website: faker.internet.url(),
      }))
      break
    case "product":
      data = Array.from({ length: Number(count) }, () => ({
        name: faker.commerce.productName(),
        price: faker.commerce.price(),
        category: faker.commerce.department(),
        description: faker.commerce.productDescription(),
      }))
      break
    case "address":
      data = Array.from({ length: Number(count) }, () => ({
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        zipCode: faker.location.zipCode(),
      }))
      break
    case "internet":
      data = Array.from({ length: Number(count) }, () => ({
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
        url: faker.internet.url(),
      }))
      break
    case "finance":
      data = Array.from({ length: Number(count) }, () => ({
        accountNumber: faker.finance.accountNumber(),
        amount: faker.finance.amount(),
        currency: faker.finance.currencyName(),
      }))
      break
    case "vehicle":
      data = Array.from({ length: Number(count) }, () => ({
        manufacturer: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        type: faker.vehicle.type(),
      }))
      break
    case "lorem":
      data = Array.from({ length: Number(count) }, () => ({
        word: faker.lorem.word(),
        sentence: faker.lorem.sentence(),
        paragraph: faker.lorem.paragraph(),
      }))
      break
    case "date":
      data = Array.from({ length: Number(count) }, () => ({
        past: faker.date.past(),
        future: faker.date.future(),
        recent: faker.date.recent(),
      }))
      break
    default:
      throw new Error("Invalid type for fake data generation.")
  }
  return data
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/fake-data",
    name: "fake data",
    category: "Tools",
    description: "This API endpoint allows you to generate various types of fake data for development and testing purposes. You can specify the type of data to generate (e.g., person, company, product, address, internet, finance, vehicle, lorem, date) and the number of entries you need. This is incredibly useful for populating databases, mocking API responses, or creating realistic test scenarios without using real sensitive information. Each data type comes with a predefined set of relevant fields, offering a quick and efficient way to get dummy data.",
    tags: ["Tools", "Data", "Generator"],
    example: "?type=person&count=5",
    parameters: [
      {
        name: "type",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: [
            "person",
            "company",
            "product",
            "address",
            "internet",
            "finance",
            "vehicle",
            "lorem",
            "date",
          ],
        },
        description: "Type of data",
        example: "person",
      },
      {
        name: "count",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          default: 1,
          minimum: 1,
          maximum: 100,
        },
        description: "Number of entries",
        example: "5",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const availableTypes = [
        "person",
        "company",
        "product",
        "address",
        "internet",
        "finance",
        "vehicle",
        "lorem",
        "date",
      ]
      const { type, count = 1 } = req.query || {}

      if (!type) {
        return {
          status: false,
          error: "Type is required",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      if (typeof type !== "string" || !availableTypes.includes(type.trim())) {
        return {
          status: false,
          error: "Invalid type provided",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      const parsedCount = Number(count)
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 100) {
        return {
          status: false,
          error: "Count must be a number between 1 and 100",
          code: 400,
        }
      }

      try {
        const result = await generateFakeData(type.trim(), parsedCount)
        return {
          status: true,
          count: result.length,
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
    endpoint: "/api/tools/fake-data",
    name: "fake data",
    category: "Tools",
    description: "This API endpoint allows you to generate various types of fake data for development and testing purposes using a JSON request body. You can specify the type of data to generate (e.g., person, company, product, address, internet, finance, vehicle, lorem, date) and the number of entries you need. This is incredibly useful for populating databases, mocking API responses, or creating realistic test scenarios without using real sensitive information. Each data type comes with a predefined set of relevant fields, offering a quick and efficient way to get dummy data.",
    tags: ["Tools", "Data", "Generator"],
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
                enum: [
                  "person",
                  "company",
                  "product",
                  "address",
                  "internet",
                  "finance",
                  "vehicle",
                  "lorem",
                  "date",
                ],
                description: "The type of fake data to generate",
                example: "person",
              },
              count: {
                type: "integer",
                default: 1,
                minimum: 1,
                maximum: 100,
                description: "The number of fake data entries to generate",
                example: 5,
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
      const availableTypes = [
        "person",
        "company",
        "product",
        "address",
        "internet",
        "finance",
        "vehicle",
        "lorem",
        "date",
      ]
      const { type, count = 1 } = req.body || {}

      if (!type) {
        return {
          status: false,
          error: "Type is required",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      if (typeof type !== "string" || !availableTypes.includes(type.trim())) {
        return {
          status: false,
          error: "Invalid type provided",
          availableTypes: availableTypes,
          code: 400,
        }
      }

      const parsedCount = Number(count)
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 100) {
        return {
          status: false,
          error: "Count must be a number between 1 and 100",
          code: 400,
        }
      }

      try {
        const result = await generateFakeData(type.trim(), parsedCount)
        return {
          status: true,
          count: result.length,
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