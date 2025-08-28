import axios from "axios"

async function npmstalk(packageName: string) {
  try {
    let stalk = await axios.get("https://registry.npmjs.org/" + packageName)
    let versions = stalk.data.versions
    let allver = Object.keys(versions)
    let verLatest = allver[allver.length - 1]
    let verPublish = allver[0]
    let packageLatest = versions[verLatest]
    return {
      name: packageName,
      versionLatest: verLatest,
      versionPublish: verPublish,
      versionUpdate: allver.length,
      latestDependencies: Object.keys(packageLatest.dependencies || {}).length,
      publishDependencies: Object.keys(
        versions[verPublish].dependencies || {},
      ).length,
      publishTime: stalk.data.time.created,
      latestPublishTime: stalk.data.time[verLatest],
    }
  } catch (error: any) {
    throw new Error(`Error fetching NPM package info: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/check/npm",
    name: "npm",
    category: "Check",
    description:
      "This API endpoint allows you to retrieve detailed information about a specified NPM package. You can get details such as the latest version, initial published version, total number of updates, dependency counts for both the latest and initial versions, and their respective publication timestamps. This is useful for developers and tools needing to monitor or gather data on NPM packages.",
    tags: ["Check", "NPM", "Package", "Development"],
    example: "?packageName=axios",
    parameters: [
      {
        name: "packageName",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The name of the NPM package",
        example: "axios",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { packageName } = req.query || {}

      if (!packageName) {
        return {
          status: false,
          error: "Package name parameter is required",
          code: 400,
        }
      }

      if (typeof packageName !== "string" || packageName.trim().length === 0) {
        return {
          status: false,
          error: "Package name must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await npmstalk(packageName.trim())
        return {
          status: true,
          data: data,
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
    endpoint: "/api/stalk/npm",
    name: "npm",
    category: "Check",
    description:
      "This API endpoint allows you to retrieve detailed information about a specified NPM package using a JSON request body. You can get details such as the latest version, initial published version, total number of updates, dependency counts for both the latest and initial versions, and their respective publication timestamps. This is useful for developers and tools needing to monitor or gather data on NPM packages.",
    tags: ["Check", "NPM", "Package", "Development"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["packageName"],
            properties: {
              packageName: {
                type: "string",
                description: "The name of the NPM package",
                example: "axios",
                minLength: 1,
                maxLength: 255,
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
      const { packageName } = req.body || {}

      if (!packageName) {
        return {
          status: false,
          error: "Package name parameter is required",
          code: 400,
        }
      }

      if (typeof packageName !== "string" || packageName.trim().length === 0) {
        return {
          status: false,
          error: "Package name must be a non-empty string",
          code: 400,
        }
      }

      try {
        const data = await npmstalk(packageName.trim())
        return {
          status: true,
          data: data,
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