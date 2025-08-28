import axios from "axios"
import * as puppeteer from "puppeteer"

class NIKChecker {
  private browser: puppeteer.Browser | null = null

  async checkNIK(nik: string) {
    try {
      let dptData: any = null
      let parseData: any = null

      try {
        [dptData, parseData] = await Promise.all([
          this.cekDPT(nik),
          this.nikParse(nik),
        ])
      } catch (error) {
        parseData = await this.nikParse(nik)
      }

      const combinedResult = {
        nik: nik,
        status: "success",
        data: {
          nama: dptData?.nama || "Tidak ditemukan",
          kelamin: parseData?.kelamin || "Tidak dapat diparsing",
          tempat_lahir: parseData?.lahir_lengkap || "Tidak dapat diparsing",
          usia: parseData?.tambahan?.usia || "Tidak dapat diparsing",
          provinsi: dptData?.provinsi || parseData?.provinsi?.nama || "Tidak ditemukan",
          kabupaten: dptData?.kabupaten || parseData?.kotakab?.nama || "Tidak ditemukan",
          kecamatan: dptData?.kecamatan || parseData?.kecamatan?.nama || "Tidak ditemukan",
          kelurahan: dptData?.kelurahan || "Tidak ditemukan",
          tps: dptData?.tps || "Tidak ditemukan",
          alamat: dptData?.alamat || "Tidak ditemukan",
          koordinat: {
            lat: dptData?.lat || null,
            lon: dptData?.lon || null,
          },
          zodiak: parseData?.tambahan?.zodiak || "Tidak dapat diparsing",
          ultah_mendatang: parseData?.tambahan?.ultah || "Tidak dapat diparsing",
          pasaran: parseData?.tambahan?.pasaran || "Tidak dapat diparsing",
        },
        metadata: {
          metode_pencarian: dptData?.metode || "Parse NIK Only",
          kode_wilayah: parseData?.kode_wilayah || "Unknown",
          nomor_urut: parseData?.nomor_urut || "Unknown",
          kategori_usia: parseData?.tambahan?.kategori_usia || "Unknown",
          jenis_wilayah: parseData?.kotakab?.jenis || "Unknown",
          timestamp: new Date().toISOString(),
        },
      }

      if (dptData?.lhp && Array.isArray(dptData.lhp) && dptData.lhp.length > 0) {
        Object.assign(combinedResult, { data_lhp: dptData.lhp })
        Object.assign(combinedResult.data, { jumlah_lhp: dptData.lhp.length })
      }

      return combinedResult
    } catch (error: any) {
      return {
        nik: nik,
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    } finally {
      if (this.browser) {
        try {
          await this.browser.close()
          this.browser = null
        } catch (closeError: any) {
          console.error("Error saat menutup browser:", closeError.message)
        }
      }
    }
  }

  async cekDPT(nik: string) {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })

      const page = await this.browser.newPage()

      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36")
      await page.setViewport({ width: 1366, height: 768 })
      await page.setRequestInterception(true)

      let token: string | null = null
      let responseData: any = null

      page.on("request", async (request) => {
        if (request.url().includes("cekdptonline.kpu.go.id/v2") && request.method() === "POST") {
          const postData = request.postData()
          if (postData) {
            try {
              const data = JSON.parse(postData)
              if (data.query && data.query.includes("findNikSidalih")) {
                const tokenMatch = data.query.match(/token:"([^"]+)"/i)
                if (tokenMatch && tokenMatch[1]) {
                  token = tokenMatch[1]
                }
              }
            } catch (e: any) {
              console.error("Error parsing post data:", e.message)
            }
          }
        }
        request.continue()
      })

      page.on("response", async (response) => {
        if (response.url().includes("cekdptonline.kpu.go.id/v2") && response.request().method() === "POST") {
          try {
            const data = await response.json()
            if (data && data.data && data.data.findNikSidalih) {
              const receivedNik = data.data.findNikSidalih.nik
              if (receivedNik && receivedNik.startsWith(nik.substring(0, 6))) {
                responseData = data.data.findNikSidalih
              }
            }
          } catch (e: any) {
            console.error("Error parsing response:", e.message)
          }
        }
      })

      await page.goto("https://cekdptonline.kpu.go.id/", { waitUntil: "networkidle2", timeout: 60000 })

      const extractedToken = await page.evaluate(() => {
        try {
          const nextDataElement = document.getElementById("__NEXT_DATA__")
          if (nextDataElement) {
            const nextData = JSON.parse(nextDataElement.textContent || "{}")
            if (nextData && nextData.props && nextData.props.pageProps && nextData.props.pageProps.token) {
              return nextData.props.pageProps.token
            }
          }

          const scripts = document.getElementsByTagName("script")
          for (let i = 0; i < scripts.length; i++) {
            const scriptContent = scripts[i].innerText
            if (scriptContent.includes("token")) {
              const tokenMatch = scriptContent.match(/token[\s]*:[\s]*['"]([^'"]+)['"]/)
              if (tokenMatch && tokenMatch[1]) {
                return tokenMatch[1]
              }
            }
          }

          return null
        } catch (e: any) {
          return null
        }
      })

      if (extractedToken) {
        token = extractedToken
      }

      try {
        await page.waitForSelector("input[type=\"text\"]", { timeout: 30000 })

        await page.evaluate(() => {
          const inputField = document.querySelector('input[type="text"]') as HTMLInputElement | null
          if (inputField) inputField.value = ""
        })

        await page.type('input[type="text"]', nik)

        const buttons = await page.$$("button")
        let buttonClicked = false

        for (const button of buttons) {
          const buttonText = await page.evaluate((el) => el.textContent, button)
          if (buttonText && (buttonText.toLowerCase().includes("cari") || buttonText.toLowerCase().includes("search"))) {
            await button.click()
            buttonClicked = true
            break
          }
        }

        if (!buttonClicked) {
          await page.evaluate(() => {
            const form = document.querySelector("form") as HTMLFormElement | null
            if (form) form.submit()
          })
        }

        await new Promise((resolve) => setTimeout(resolve, 8000))

        const newToken = await page.evaluate(() => {
          try {
            const nextDataElement = document.getElementById("__NEXT_DATA__")
            if (nextDataElement) {
              const nextData = JSON.parse(nextDataElement.textContent || "{}")
              if (nextData && nextData.props && nextData.props.pageProps && nextData.props.pageProps.token) {
                return nextData.props.pageProps.token
              }
            }
            return null
          } catch (e: any) {
            return null
          }
        })

        if (newToken) {
          token = newToken
        }
      } catch (error: any) {
        console.error("Error saat melakukan pencarian NIK:", error.message)
      }

      if (responseData) {
        await this.browser.close()
        this.browser = null
        return responseData
      }

      if (!token) {
        throw new Error("Token tidak dapat diperoleh")
      }

      const response = await axios.post("https://cekdptonline.kpu.go.id/v2", {
        query: `
          {
            findNikSidalih (
                nik:"${nik}",
                wilayah_id:0,
                token:"${token}",
              ){
              nama,
              nik,
              nkk,
              provinsi,
              kabupaten,
              kecamatan,
              kelurahan,
              tps,
              alamat,
              lat,
              lon,
              metode,
              lhp {
                    nama,
                    nik,
                    nkk,
                    kecamatan,
                    kelurahan,
                    tps,
                    id,
                    flag,
                    source,
                    alamat,
                    lat,
                    lon,
                    metode
              }
            }
          }
        `,
      }, {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Origin": "https://cekdptonline.kpu.go.id",
          "Referer": "https://cekdptonline.kpu.go.id/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        },
      })

      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }

      if (response.data && response.data.data && response.data.data.findNikSidalih) {
        return response.data.data.findNikSidalih
      } else {
        throw new Error("Data DPT tidak ditemukan")
      }
    } catch (error: any) {
      if (this.browser) {
        try {
          await this.browser.close()
          this.browser = null
        } catch (closeError: any) {
          console.error("Error saat menutup browser:", closeError.message)
        }
      }
      throw new Error(`Error cek DPT: ${error.message}`)
    }
  }

  async nikParse(nik: string) {
    try {
      const provincesRes = await axios.get("https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json")
      const provinces: { [key: string]: string } = Object.fromEntries(provincesRes.data.map((p: any) => [p.id, p.name.toUpperCase()]))

      nik = nik.toString()
      if (nik.length !== 16 || !provinces[nik.slice(0, 2)]) {
        throw new Error("NIK tidak valid: panjang atau kode provinsi salah")
      }

      const provinceId = nik.slice(0, 2)
      const regenciesRes = await axios.get(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      const regencies: { [key: string]: string } = Object.fromEntries(regenciesRes.data.map((r: any) => [r.id, r.name.toUpperCase()]))

      if (!regencies[nik.slice(0, 4)]) {
        throw new Error("NIK tidak valid: kode kabupaten/kota salah")
      }

      const regencyId = nik.slice(0, 4)
      const districtsRes = await axios.get(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`)
      const districts: { [key: string]: string } = Object.fromEntries(districtsRes.data.map((d: any) => [d.id.slice(0, -1), `${d.name.toUpperCase()}`]))

      if (!districts[nik.slice(0, 6)]) {
        throw new Error("NIK tidak valid: kode kecamatan salah")
      }

      const province = provinces[provinceId]
      const city = regencies[regencyId]
      const subdistrict = districts[nik.slice(0, 6)]
      const day = parseInt(nik.slice(6, 8))
      const month = parseInt(nik.slice(8, 10))
      const yearCode = nik.slice(10, 12)
      const uniqCode = nik.slice(12, 16)

      const gender = day > 40 ? "PEREMPUAN" : "LAKI-LAKI"
      const birthDay = day > 40 ? (day - 40).toString().padStart(2, "0") : day.toString().padStart(2, "0")
      const birthYear = parseInt(yearCode) < new Date().getFullYear().toString().slice(-2) ? `20${yearCode}` : `19${yearCode}`
      const birthDate = `${birthDay}/${month.toString().padStart(2, "0")}/${birthYear}`
      const birth = new Date(parseInt(birthYear), month - 1, parseInt(birthDay))

      if (isNaN(birth.getTime())) {
        throw new Error("Tanggal lahir tidak valid")
      }

      const today = new Date()
      let years = today.getFullYear() - birth.getFullYear()
      let months = today.getMonth() - birth.getMonth()
      let remainingDays = today.getDate() - birth.getDate()

      if (remainingDays < 0) {
        remainingDays += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
        months--
      }
      if (months < 0) {
        months += 12
        years--
      }

      const age = `${years} Tahun ${months} Bulan ${remainingDays} Hari`

      let ageCategory = ""
      if (years < 12) ageCategory = "Anak-anak"
      else if (years < 18) ageCategory = "Remaja"
      else if (years < 60) ageCategory = "Dewasa"
      else ageCategory = "Lansia"

      const nextBirthday = new Date(today.getMonth() < month - 1 ? today.getFullYear() : today.getFullYear() + 1, month - 1, parseInt(birthDay))
      const timeDiff = nextBirthday.getTime() - today.getTime()
      const monthsLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30))
      const daysLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24))
      const birthdayCountdown = `${monthsLeft} Bulan ${daysLeft} Hari`

      const baseDate = new Date(1970, 0, 2)
      const diffDays = Math.floor((birth.getTime() - baseDate.getTime() + 86400000) / (1000 * 60 * 60 * 24))
      const pasaranIndex = Math.round((diffDays % 5) * 2) / 2
      const pasaranNames = ["Wage", "Kliwon", "Legi", "Pahing", "Pon"]
      const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      const birthDateFull = `${birthDay} ${monthNames[month - 1]} ${birthYear}`
      const pasaran = `${dayNames[birth.getDay()]} ${pasaranNames[pasaranIndex] || ""}, ${birthDay} ${monthNames[month - 1]} ${birthYear}`

      let zodiac = ""
      if ((month === 1 && day >= 20) || (month === 2 && day < 19)) zodiac = "Aquarius"
      else if ((month === 2 && day >= 19) || (month === 3 && day < 21)) zodiac = "Pisces"
      else if ((month === 3 && day >= 21) || (month === 4 && day < 20)) zodiac = "Aries"
      else if ((month === 4 && day >= 20) || (month === 5 && day < 21)) zodiac = "Taurus"
      else if ((month === 5 && day >= 21) || (month === 6 && day < 22)) zodiac = "Gemini"
      else if ((month === 6 && day >= 21) || (month === 7 && day < 23)) zodiac = "Cancer"
      else if ((month === 7 && day >= 23) || (month === 8 && day < 23)) zodiac = "Leo"
      else if ((month === 8 && day >= 23) || (month === 9 && day < 23)) zodiac = "Virgo"
      else if ((month === 9 && day >= 23) || (month === 10 && day < 24)) zodiac = "Libra"
      else if ((month === 10 && day >= 24) || (month === 11 && day < 23)) zodiac = "Scorpio"
      else if ((month === 11 && day >= 23) || (month === 12 && day < 22)) zodiac = "Sagitarius"
      else if ((month === 12 && day >= 22) || (month === 1 && day < 20)) zodiac = "Capricorn"

      const regencyType = city.includes("KOTA") ? "Kota" : "Kabupaten"
      const areaCode = `${provinceId}.${regencyId.slice(2)}.${nik.slice(4, 6)}`

      return {
        nik,
        kelamin: gender,
        lahir: birthDate,
        lahir_lengkap: birthDateFull,
        provinsi: {
          kode: provinceId,
          nama: province,
        },
        kotakab: {
          kode: regencyId,
          nama: city,
          jenis: regencyType,
        },
        kecamatan: {
          kode: nik.slice(0, 6),
          nama: subdistrict,
        },
        kode_wilayah: areaCode,
        nomor_urut: uniqCode,
        tambahan: {
          pasaran,
          usia: age,
          kategori_usia: ageCategory,
          ultah: `${birthdayCountdown} Lagi`,
          zodiak: zodiac,
        },
      }
    } catch (error: any) {
      throw new Error(`Error parsing NIK: ${error.message}`)
    }
  }
}

const nikChecker = new NIKChecker()

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/nik-checker",
    name: "nik checker",
    category: "Tools",
    description: "This API endpoint provides a comprehensive NIK (Nomor Induk Kependudukan - Indonesian National ID Number) checker. It retrieves information related to the NIK, including personal data, regional details, and DPT (Daftar Pemilih Tetap - Permanent Voter List) status if available. Users can input a 16-digit NIK, and the API will attempt to parse the NIK for embedded information like gender, date of birth, age, zodiac sign, and Javanese calendar market day. Additionally, it tries to fetch DPT data from the KPU (Komisi Pemilihan Umum - General Elections Commission) website to provide details such as name, address, polling station (TPS), and geographical coordinates. This tool is useful for verifying NIK data, understanding demographic information, and checking voter registration status.",
    tags: ["TOOLS", "NIK", "CHECKER", "INDONESIA"],
    example: "?nik=3202285909840005",
    parameters: [
      {
        name: "nik",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 16,
          maxLength: 16,
          pattern: "^[0-9]{16}$",
        },
        description: "16-digit Indonesian National ID number",
        example: "3202285909840005",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { nik } = req.query || {}

      if (!nik) {
        return {
          status: false,
          error: "NIK parameter is required",
          code: 400,
        }
      }

      if (typeof nik !== "string" || nik.trim().length === 0) {
        return {
          status: false,
          error: "NIK must be a non-empty string",
          code: 400,
        }
      }

      if (!/^[0-9]{16}$/.test(nik.trim())) {
        return {
          status: false,
          error: "NIK must be exactly 16 digits and contain only numbers",
          code: 400,
        }
      }

      try {
        const result = await nikChecker.checkNIK(nik.trim())

        if (result.status === "error") {
          return {
            status: false,
            error: result.error,
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
    endpoint: "/api/tools/nik-checker",
    name: "nik checker",
    category: "Tools",
    description: "This API endpoint provides a comprehensive NIK (Nomor Induk Kependudukan - Indonesian National ID Number) checker. It retrieves information related to the NIK, including personal data, regional details, and DPT (Daftar Pemilih Tetap - Permanent Voter List) status if available. Users can input a 16-digit NIK in the request body, and the API will attempt to parse the NIK for embedded information like gender, date of birth, age, zodiac sign, and Javanese calendar market day. Additionally, it tries to fetch DPT data from the KPU (Komisi Pemilihan Umum - General Elections Commission) website to provide details such as name, address, polling station (TPS), and geographical coordinates. This tool is useful for verifying NIK data, understanding demographic information, and checking voter registration status.",
    tags: ["TOOLS", "NIK", "CHECKER", "INDONESIA"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["nik"],
            properties: {
              nik: {
                type: "string",
                pattern: "^[0-9]{16}$",
                description: "16-digit Indonesian National ID number",
                example: "3202285909840005",
                minLength: 16,
                maxLength: 16,
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
      const { nik } = req.body || {}

      if (!nik) {
        return {
          status: false,
          error: "NIK parameter is required",
          code: 400,
        }
      }

      if (typeof nik !== "string" || nik.trim().length === 0) {
        return {
          status: false,
          error: "NIK must be a non-empty string",
          code: 400,
        }
      }

      if (!/^[0-9]{16}$/.test(nik.trim())) {
        return {
          status: false,
          error: "NIK must be exactly 16 digits and contain only numbers",
          code: 400,
        }
      }

      try {
        const result = await nikChecker.checkNIK(nik.trim())

        if (result.status === "error") {
          return {
            status: false,
            error: result.error,
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