import axios from "axios"

const modes: { [key: string]: (string | number)[] } = {
  noob: [-3, 3, -3, 3, "+-", 15e3, 10],
  easy: [-10, 10, -10, 10, "*/+-", 2e4, 40],
  medium: [-40, 40, -20, 20, "*/+-", 4e4, 150],
  hard: [-100, 100, -70, 70, "*/+-", 6e4, 350],
  extreme: [-999999, 999999, -999999, 999999, "*/", 99999, 9999],
  impossible: [
    -99999999999,
    99999999999,
    -99999999999,
    999999999999,
    "*/",
    3e4,
    35e3,
  ],
  impossible2: [
    -999999999999999,
    999999999999999,
    -999,
    999,
    "/",
    3e4,
    5e4,
  ],
  impossible3: [
    -999999999999999999,
    999999999999999999,
    -999999999999999999,
    999999999999999999,
    "*/",
    1e5,
    1e5,
  ],
  impossible4: [
    -999999999999999999999,
    999999999999999999999,
    -999999999999999999999,
    999999999999999999999,
    "*/",
    5e5,
    5e5,
  ],
  impossible5: [
    -999999999999999999999999,
    999999999999999999999999,
    -999999999999999999999999,
    999999999999999999999999,
    "*/",
    1e6,
    1e6,
  ],
}

const operators: { [key: string]: string } = {
  "+": "+",
  "-": "-",
  "*": "×",
  "/": "÷",
}

function randomInt(from: number, to: number): number {
  if (from > to) [from, to] = [to, from]
  from = Math.floor(from)
  to = Math.floor(to)
  return Math.floor((to - from) * Math.random() + from)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function scrape(level: string) {
  const [a1, a2, b1, b2, ops, time, bonus] = modes[level] as [
    number,
    number,
    number,
    number,
    string,
    number,
    number,
  ]
  let a = randomInt(a1, a2)
  let b = randomInt(b1, b2)
  const op = pickRandom([...ops])
  let result: number

  if (op === "/") {
    while (b === 0) {
      b = randomInt(b1, b2)
    }
    result = a
    a = result * b
  } else {
    result = new Function(`return ${a} ${op.replace("/", "*")} ${b < 0 ? `(${b})` : b}`)()
  }

  return {
    str: `${a} ${operators[op]} ${b}`,
    mode: level,
    time: time,
    bonus: bonus,
    result: result,
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/maths",
    name: "maths",
    category: "Games",
    description: "This API endpoint generates a random math problem based on a specified difficulty level. Users can choose from various levels like 'noob', 'easy', 'medium', 'hard', 'extreme', and 'impossible' to get a problem tailored to their skill. Each problem includes the mathematical expression, the chosen difficulty mode, a time limit for solving, a bonus for correct answers, and the correct result. This endpoint is ideal for educational apps, brain training games, or any platform requiring dynamic arithmetic challenges.",
    tags: ["Games", "Math", "Quiz", "Brain Training", "Education"],
    example: "?level=easy",
    parameters: [
      {
        name: "level",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: Object.keys(modes),
        },
        description: "Difficulty level of the math problem",
        example: "easy",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { level } = req.query || {}

      if (level && typeof level !== "string") {
        return {
          status: false,
          error: "Parameter level must be a string",
          code: 400,
        }
      }

      const validLevels = Object.keys(modes)
      const randomLevel =
        level && validLevels.includes(level as string) ? (level as string) : pickRandom(validLevels)

      try {
        const mathProblem = await scrape(randomLevel)

        if (!mathProblem) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: mathProblem,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        console.error(error)
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
    endpoint: "/api/games/maths",
    name: "maths",
    category: "Games",
    description: "This API endpoint generates a random math problem based on a specified difficulty level. Users can choose from various levels like 'noob', 'easy', 'medium', 'hard', 'extreme', and 'impossible' to get a problem tailored to their skill. Each problem includes the mathematical expression, the chosen difficulty mode, a time limit for solving, a bonus for correct answers, and the correct result. This endpoint is ideal for educational apps, brain training games, or any platform requiring dynamic arithmetic challenges.",
    tags: ["Games", "Math", "Quiz", "Brain Training", "Education"],
    example: "",
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              level: {
                type: "string",
                enum: Object.keys(modes),
                description: "Difficulty level of the math problem",
                example: "easy",
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
      const { level } = req.body || {}

      if (level && typeof level !== "string") {
        return {
          status: false,
          error: "Parameter level must be a string",
          code: 400,
        }
      }

      const validLevels = Object.keys(modes)
      const randomLevel =
        level && validLevels.includes(level as string) ? (level as string) : pickRandom(validLevels)

      try {
        const mathProblem = await scrape(randomLevel)

        if (!mathProblem) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: mathProblem,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        console.error(error)
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]