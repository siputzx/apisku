import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeCekPotensiPenyakit(tgl: string, bln: string, thn: string) {
  try {
    const { data } = await axios({
      url: "https://primbon.com/cek_potensi_penyakit.php",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      data: new URLSearchParams({
        tanggal: tgl,
        bulan: bln,
        tahun: thn,
        hitung: " Submit! ",
      }),
      timeout: 30000,
    })

    let $ = cheerio.load(data)
    let fetchText = $("#body")
      .text()
      .replace(/\s{2,}/g, " ")
      .replace(/[\n\r\t]+/g, " ")
      .replace(
        /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\); /g,
        "",
      )
      .replace(/<<+\s*Kembali/g, "")
      .trim()

    if (!fetchText.includes("CEK POTENSI PENYAKIT (METODE PITAGORAS)")) {
      throw new Error("Data tidak ditemukan atau format tanggal tidak valid")
    }

    const hasil = {
      analisa: fetchText.split("CEK POTENSI PENYAKIT (METODE PITAGORAS)")[1].split("Sektor yg dianalisa:")[0].trim(),
      sektor: fetchText.split("Sektor yg dianalisa:")[1].split("Anda tidak memiliki elemen")[0].trim(),
      elemen: "Anda tidak memiliki elemen " + fetchText.split("Anda tidak memiliki elemen")[1].split("*")[0].trim(),
      catatan:
        "Potensi penyakit harus dipandang secara positif. Sakit pada daftar tidak berarti anda akan mengalami semuanya. Anda mungkin hanya akan mengalami 1 atau 2 macam penyakit. Pencegahan adalah yang terbaik, makanan yang sehat, olahraga teratur, istirahat yang cukup, hidup bahagia, adalah resep paling manjur untuk menghindari segala penyakit.",
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
    endpoint: "/api/primbon/cek_potensi_penyakit",
    name: "cek potensi penyakit",
    category: "Primbon",
    description:
      "This API endpoint allows users to check their potential disease risks based on their birth date, using the Pythagorean method as per Primbon calculations. It takes the day, month, and year of birth as input and provides an analysis of potential health issues, analyzed sectors, and missing elements, along with important preventive notes. This can be used for personal health awareness or numerological insights into well-being.",
    tags: ["Primbon", "Health", "Pitagoras", "Disease", "Numerology"],
    example: "?tgl=12&bln=05&thn=1998",
    parameters: [
      {
        name: "tgl",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 31,
        },
        description: "Day of birth (e.g., 12).",
        example: "12",
      },
      {
        name: "bln",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 12,
        },
        description: "Month of birth (e.g., 05 for May).",
        example: "05",
      },
      {
        name: "thn",
        in: "query",
        required: true,
        schema: {
          type: "integer",
          minimum: 1900,
          maximum: new Date().getFullYear(),
        },
        description: "Year of birth (e.g., 1998).",
        example: "1998",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { tgl, bln, thn } = req.query || {}

      if (!tgl || !bln || !thn) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' are required",
          code: 400,
        }
      }

      const parsedTgl = parseInt(tgl as string)
      const parsedBln = parseInt(bln as string)
      const parsedThn = parseInt(thn as string)

      if (isNaN(parsedTgl) || isNaN(parsedBln) || isNaN(parsedThn)) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' must be valid numbers",
          code: 400,
        }
      }

      if (parsedTgl < 1 || parsedTgl > 31) {
        return {
          status: false,
          error: "Day 'tgl' must be between 1 and 31",
          code: 400,
        }
      }

      if (parsedBln < 1 || parsedBln > 12) {
        return {
          status: false,
          error: "Month 'bln' must be between 1 and 12",
          code: 400,
        }
      }

      const currentYear = new Date().getFullYear()
      if (parsedThn < 1900 || parsedThn > currentYear) {
        return {
          status: false,
          error: `Year 'thn' must be between 1900 and ${currentYear}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeCekPotensiPenyakit(
          parsedTgl.toString(),
          parsedBln.toString(),
          parsedThn.toString(),
        )

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
    endpoint: "/api/primbon/cek_potensi_penyakit",
    name: "cek potensi penyakit",
    category: "Primbon",
    description:
      "This API endpoint allows users to check their potential disease risks based on their birth date, using the Pythagorean method as per Primbon calculations. It takes the day, month, and year of birth in the request body and provides an analysis of potential health issues, analyzed sectors, and missing elements, along with important preventive notes. This can be used for personal health awareness or numerological insights into well-being.",
    tags: ["Primbon", "Health", "Pitagoras", "Disease", "Numerology"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["tgl", "bln", "thn"],
            properties: {
              tgl: {
                type: "integer",
                description: "Day of birth (e.g., 12).",
                example: 12,
                minimum: 1,
                maximum: 31,
              },
              bln: {
                type: "integer",
                description: "Month of birth (e.g., 5 for May).",
                example: 5,
                minimum: 1,
                maximum: 12,
              },
              thn: {
                type: "integer",
                description: "Year of birth (e.g., 1998).",
                example: 1998,
                minimum: 1900,
                maximum: new Date().getFullYear(),
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
      const { tgl, bln, thn } = req.body || {}

      if (!tgl || !bln || !thn) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' are required",
          code: 400,
        }
      }

      const parsedTgl = tgl as number
      const parsedBln = bln as number
      const parsedThn = thn as number

      if (isNaN(parsedTgl) || isNaN(parsedBln) || isNaN(parsedThn)) {
        return {
          status: false,
          error: "Parameters 'tgl', 'bln', and 'thn' must be valid numbers",
          code: 400,
        }
      }

      if (parsedTgl < 1 || parsedTgl > 31) {
        return {
          status: false,
          error: "Day 'tgl' must be between 1 and 31",
          code: 400,
        }
      }

      if (parsedBln < 1 || parsedBln > 12) {
        return {
          status: false,
          error: "Month 'bln' must be between 1 and 12",
          code: 400,
        }
      }

      const currentYear = new Date().getFullYear()
      if (parsedThn < 1900 || parsedThn > currentYear) {
        return {
          status: false,
          error: `Year 'thn' must be between 1900 and ${currentYear}`,
          code: 400,
        }
      }

      try {
        const result = await scrapeCekPotensiPenyakit(
          parsedTgl.toString(),
          parsedBln.toString(),
          parsedThn.toString(),
        )

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