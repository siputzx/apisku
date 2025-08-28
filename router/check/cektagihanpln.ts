import axios from "axios"

async function scrapeTagihanListrik(nopel: string) {
  try {
    const response = await axios.get(
      `https://listrik.okcek.com/dd.php?nopel=${nopel}`,
      {
        headers: {
          authority: "listrik.okcek.com",
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          referer: `https://listrik.okcek.com/hasil.php?nopel=${nopel}`,
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
        },
      },
    )

    const rawData = response.data

    if (rawData?.data?.status !== "success") {
      throw new Error("Data tidak ditemukan.")
    }

    return {
      jenis_tagihan: rawData.data[0][2],
      no_pelanggan: rawData.data[1][2],
      nama_pelanggan: rawData.data[2][2],
      tarif_daya: rawData.data[3][2],
      bulan_tahun: rawData.data[4][2],
      stand_meter: rawData.data[5][2],
      total_tagihan: rawData.data[6][2],
    }
  } catch (error: any) {
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/check/tagihanpln",
    name: "tagihan listrik",
    category: "Check",
    description:
      "This API endpoint allows you to check your monthly PLN electricity bill information using your customer number (nopel) via a query parameter. It retrieves details such as the type of bill, customer number, customer name, power tariff, billing month/year, meter stand, and total bill amount. This is useful for individuals or applications needing to quickly verify PLN electricity bills.",
    tags: ["CHECK", "PLN", "Electricity", "Bill"],
    example: "?nopel=443100003506",
    parameters: [
      {
        name: "nopel",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 20,
        },
        description: "Nomor pelanggan PLN",
        example: "443100003506",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { nopel } = req.query || {}

      if (!nopel) {
        return {
          status: false,
          error: "Parameter 'nopel' diperlukan.",
          code: 400,
        }
      }

      if (typeof nopel !== "string" || nopel.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nopel' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const formattedData = await scrapeTagihanListrik(nopel.trim())
        return {
          status: true,
          data: formattedData,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error:
            error.message === "Data tidak ditemukan."
              ? "Data tidak ditemukan."
              : error.message || "Terjadi kesalahan pada server.",
          code: error.message === "Data tidak ditemukan." ? 404 : 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/check/tagihanpln",
    name: "tagihan listrik",
    category: "Check",
    description:
      "This API endpoint allows you to check your monthly PLN electricity bill information using your customer number (nopel) via a JSON request body. It retrieves details such as the type of bill, customer number, customer name, power tariff, billing month/year, meter stand, and total bill amount. This is useful for individuals or applications needing to quickly verify PLN electricity bills.",
    tags: ["CHECK", "PLN", "Electricity", "Bill"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["nopel"],
            properties: {
              nopel: {
                type: "string",
                description: "Nomor pelanggan PLN",
                example: "443100003506",
                minLength: 1,
                maxLength: 20,
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
      const { nopel } = req.body || {}

      if (!nopel) {
        return {
          status: false,
          error: "Parameter 'nopel' diperlukan dalam body.",
          code: 400,
        }
      }

      if (typeof nopel !== "string" || nopel.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'nopel' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const formattedData = await scrapeTagihanListrik(nopel.trim())
        return {
          status: true,
          data: formattedData,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error:
            error.message === "Data tidak ditemukan."
              ? "Data tidak ditemukan."
              : error.message || "Terjadi kesalahan pada server.",
          code: error.message === "Data tidak ditemukan." ? 404 : 500,
        }
      }
    },
  },
]