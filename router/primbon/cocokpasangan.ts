import axios from "axios"
import * as cheerio from "cheerio"

async function scrape(nama1: string, nama2: string) {
  try {
    const response = await axios.get(
      `https://primbon.com/kecocokan_nama_pasangan.php?nama1=${nama1}&nama2=${nama2}&proses=+Submit%21+`,
      {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )
    const $ = cheerio.load(response.data)
    const fetchText = $("#body").text()

    let hasil
    try {
      hasil = {
        nama_anda: nama1,
        nama_pasangan: nama2,
        sisi_positif: fetchText.split("Sisi Positif Anda: ")[1].split("Sisi Negatif Anda: ")[0].trim(),
        sisi_negatif: fetchText.split("Sisi Negatif Anda: ")[1].split("< Hitung Kembali")[0].trim(),
        gambar: "https://primbon.com/ramalan_kecocokan_cinta2.png",
        catatan:
          "Untuk melihat kecocokan jodoh dengan pasangan, dapat dikombinasikan dengan primbon Ramalan Jodoh (Jawa), Ramalan Jodoh (Bali), numerologi Kecocokan Cinta, Ramalan Perjalanan Hidup Suami Istri, dan makna dari Tanggal Jadian/Pernikahan.",
      }
    } catch (e) {
      hasil = {
        status: false,
        message: "Error, Mungkin Input Yang Anda Masukkan Salah",
      }
    }
    return hasil
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/primbon/kecocokan_nama_pasangan",
    name: "kecocokan nama pasangan",
    category: "Primbon",
    description:
      "This API endpoint allows users to check the compatibility of two names according to Primbon. It takes two names as input and returns details about their positive and negative aspects, along with a related image and additional notes for further compatibility checks. This is useful for those interested in traditional Indonesian beliefs about relationship compatibility.",
    tags: ["Primbon", "Compatibility", "Relationship", "Names", "Culture"],
    example: "?nama1=putu&nama2=keyla",
    parameters: [
      {
        name: "nama1",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "The first name for compatibility.",
        example: "putu",
      },
      {
        name: "nama2",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "The second name for compatibility.",
        example: "keyla",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { nama1, nama2 } = req.query || {}

      if (!nama1 || typeof nama1 !== "string" || nama1.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nama1' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!nama2 || typeof nama2 !== "string" || nama2.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nama2' is required and must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(nama1.trim(), nama2.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
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
    endpoint: "/api/primbon/kecocokan_nama_pasangan",
    name: "kecocokan nama pasangan",
    category: "Primbon",
    description:
      "This API endpoint allows users to check the compatibility of two names according to Primbon. It takes two names in the request body and returns details about their positive and negative aspects, along with a related image and additional notes for further compatibility checks. This is useful for those interested in traditional Indonesian beliefs about relationship compatibility.",
    tags: ["Primbon", "Compatibility", "Relationship", "Names", "Culture"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["nama1", "nama2"],
            properties: {
              nama1: {
                type: "string",
                description: "The first name for compatibility.",
                example: "putu",
                minLength: 1,
                maxLength: 100,
              },
              nama2: {
                type: "string",
                description: "The second name for compatibility.",
                example: "keyla",
                minLength: 1,
                maxLength: 100,
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
      const { nama1, nama2 } = req.body || {}

      if (!nama1 || typeof nama1 !== "string" || nama1.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nama1' is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!nama2 || typeof nama2 !== "string" || nama2.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nama2' is required and must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await scrape(nama1.trim(), nama2.trim())

        if (!result) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
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