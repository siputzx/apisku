import axios from "axios"

const subjects: { [key: string]: string } = {
  bindo: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/bindo.json",
  tik: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/tik.json",
  pkn: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/pkn.json",
  bing: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/bing.json",
  penjas: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/penjas.json",
  pai: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/pai.json",
  matematika: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/matematika.json",
  jawa: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/jawa.json",
  ips: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/ips.json",
  ipa: "https://gist.githubusercontent.com/siputzx/298d2d3bd5901494537b9848e35dab9f/raw/25f5dcfef0d97141c555c2bbb94fe1f3d1f76cb3/ipa.json",
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getRandomQuestions<T>(questions: T[], count: number): T[] {
  const shuffled = shuffleArray(questions)
  return shuffled.slice(0, count)
}

async function scrapeQuiz(matapelajaran: string, jumlahsoal: string | number) {
  try {
    if (!subjects[matapelajaran]) {
      throw new Error(`Mata pelajaran '${matapelajaran}' tidak tersedia`)
    }

    const numQuestions = Math.max(5, Math.min(10, parseInt(jumlahsoal as string) || 5))

    const response = await axios.get(subjects[matapelajaran], {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const allQuestions = response.data

    if (allQuestions.length < numQuestions) {
      throw new Error(`Jumlah soal yang diminta (${numQuestions}) melebihi soal yang tersedia (${allQuestions.length})`)
    }

    const selectedQuestions = getRandomQuestions(allQuestions, numQuestions)

    const transformedQuestions = selectedQuestions.map((question: any) => {
      const correctAnswer = question.jawaban_benar.teks

      const answerValues = question.semua_jawaban.map((option: any) => {
        const optionKey = Object.keys(option)[0]
        return option[optionKey]
      })

      const shuffledAnswers = shuffleArray(answerValues)

      const keys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
      const availableKeys = keys.slice(0, shuffledAnswers.length)

      const newAnswerOptions = shuffledAnswers.map((value, index) => {
        return { [availableKeys[index]]: value }
      })

      let correctOption: string | null = null
      for (const option of newAnswerOptions) {
        const optionKey = Object.keys(option)[0]
        const optionValue = option[optionKey]
        if (optionValue === correctAnswer) {
          correctOption = optionKey
          break
        }
      }

      return {
        pertanyaan: question.pertanyaan,
        semua_jawaban: newAnswerOptions,
        jawaban_benar: correctOption || "a",
      }
    })

    return {
      matapelajaran,
      jumlah_soal: numQuestions,
      soal: transformedQuestions,
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get quiz data: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/cc-sd",
    name: "cerdas cermat",
    category: "Games",
    description: "This API endpoint provides random quiz questions for 'Cerdas Cermat' (smart competition), categorized by various school subjects. Users can specify the subject and the desired number of questions (between 5 and 10). The API shuffles the questions and their answer choices, returning a set of unique questions along with their scrambled options and the correct answer key. This endpoint is ideal for educational applications, quiz games, or e-learning platforms that require dynamic and challenging quiz content.",
    tags: ["Games", "Quiz", "Education", "Cerdas Cermat", "School"],
    example: "?matapelajaran=matematika&jumlahsoal=5",
    parameters: [
      {
        name: "matapelajaran",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: ["bindo", "tik", "pkn", "bing", "penjas", "pai", "matematika", "jawa", "ips", "ipa"],
        },
        description: "Subject for the quiz questions (e.g., 'matematika', 'ipa', 'ips').",
        example: "matematika",
      },
      {
        name: "jumlahsoal",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 5,
          maximum: 10,
          default: 5,
        },
        description: "Number of questions to generate (minimum 5, maximum 10).",
        example: 5,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { matapelajaran, jumlahsoal } = req.query || {}

      if (!matapelajaran) {
        return {
          status: false,
          error: "Parameter matapelajaran is required",
          available_subjects: Object.keys(subjects),
          code: 400,
        }
      }

      if (typeof matapelajaran !== "string" || matapelajaran.trim().length === 0) {
        return {
          status: false,
          error: "Parameter matapelajaran must be a non-empty string",
          code: 400,
        }
      }

      const validSubjects = Object.keys(subjects)
      if (!validSubjects.includes(matapelajaran.trim())) {
        return {
          status: false,
          error: `Invalid matapelajaran. Available subjects: ${validSubjects.join(", ")}`,
          code: 400,
        }
      }

      let numSoalValidated: number | undefined
      if (jumlahsoal !== undefined && jumlahsoal !== null) {
        numSoalValidated = parseInt(jumlahsoal as string)
        if (isNaN(numSoalValidated) || numSoalValidated < 5 || numSoalValidated > 10) {
          return {
            status: false,
            error: "Parameter jumlahsoal must be an integer between 5 and 10",
            code: 400,
          }
        }
      }

      try {
        const data = await scrapeQuiz(matapelajaran.trim(), numSoalValidated || 5)

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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
    endpoint: "/api/games/cc-sd",
    name: "cerdas cermat",
    category: "Games",
    description: "This API endpoint provides random quiz questions for 'Cerdas Cermat' (smart competition), categorized by various school subjects. Users can specify the subject and the desired number of questions (between 5 and 10). The API shuffles the questions and their answer choices, returning a set of unique questions along with their scrambled options and the correct answer key. This endpoint is ideal for educational applications, quiz games, or e-learning platforms that require dynamic and challenging quiz content.",
    tags: ["Games", "Quiz", "Education", "Cerdas Cermat", "School"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["matapelajaran"],
            properties: {
              matapelajaran: {
                type: "string",
                enum: ["bindo", "tik", "pkn", "bing", "penjas", "pai", "matematika", "jawa", "ips", "ipa"],
                description: "Subject for the quiz questions (e.g., 'matematika', 'ipa', 'ips').",
                example: "matematika",
              },
              jumlahsoal: {
                type: "integer",
                minimum: 5,
                maximum: 10,
                default: 5,
                description: "Number of questions to generate (minimum 5, maximum 10).",
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
      const { matapelajaran, jumlahsoal } = req.body || {}

      if (!matapelajaran) {
        return {
          status: false,
          error: "Parameter matapelajaran is required",
          available_subjects: Object.keys(subjects),
          code: 400,
        }
      }

      if (typeof matapelajaran !== "string" || matapelajaran.trim().length === 0) {
        return {
          status: false,
          error: "Parameter matapelajaran must be a non-empty string",
          code: 400,
        }
      }

      const validSubjects = Object.keys(subjects)
      if (!validSubjects.includes(matapelajaran.trim())) {
        return {
          status: false,
          error: `Invalid matapelajaran. Available subjects: ${validSubjects.join(", ")}`,
          code: 400,
        }
      }

      let numSoalValidated: number | undefined
      if (jumlahsoal !== undefined && jumlahsoal !== null) {
        numSoalValidated = parseInt(jumlahsoal as string)
        if (isNaN(numSoalValidated) || numSoalValidated < 5 || numSoalValidated > 10) {
          return {
            status: false,
            error: "Parameter jumlahsoal must be an integer between 5 and 10",
            code: 400,
          }
        }
      }

      try {
        const data = await scrapeQuiz(matapelajaran.trim(), numSoalValidated || 5)

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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