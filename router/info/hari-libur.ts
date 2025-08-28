import axios from "axios"
import * as cheerio from "cheerio"

const wikipediaData = {
  events: [
    { date: "01-03", event: "Hari Amal Bhakti Kementerian Agama" },
    { date: "01-04", event: "Hari Braille Sedunia" },
    { date: "01-05", event: "Hari Korps Wanita Angkatan Laut" },
    { date: "01-10", event: "Hari Gerakan Satu Juta Pohon" },
    { date: "01-10", event: "Hari Lingkungan Hidup Indonesia" },
    { date: "01-10", event: "Hari Tritura" },
    { date: "01-11", event: "Hari Tuli Nasional" },
    { date: "01-15", event: "Hari Dharma Samudera" },
    { date: "01-17", event: "Hari Kebangkitan Bahasa Sunda" },
    { date: "01-22", event: "Hari Pejalan Kaki Nasional" },
    { date: "01-25", event: "Hari Gizi Nasional" },
    { date: "01-26", event: "Hari Kepabeanan Internasional" },
    { date: "01-31", event: "Hari Lahir Nahdlatul Ulama" },
    { date: "02-02", event: "Hari Lahan Basah Sedunia" },
    { date: "02-04", event: "Hari Kanker Sedunia" },
    { date: "02-05", event: "Hari Peristiwa Kapal Tujuh Provinsi" },
    { date: "02-09", event: "Hari Kavaleri" },
    { date: "02-09", event: "Hari Pers Nasional" },
    { date: "02-13", event: "Hari Radio Sedunia" },
    { date: "02-14", event: "Hari PETA" },
    { date: "02-14", event: "Hari Peduli Moral" },
    { date: "02-14", event: "Hari Raya Pemilihan Umum" },
    { date: "02-15", event: "Hari Kanker Anak Sedunia" },
    { date: "02-19", event: "Hari KOHANUDNAS" },
    { date: "02-20", event: "Hari Keadilan Sosial Sedunia" },
    { date: "02-21", event: "Hari Bahasa Ibu Internasional" },
    { date: "02-21", event: "Hari Peduli Sampah Nasional" },
    { date: "02-22", event: "Hari Istiqlal" },
    { date: "02-23", event: "Hari Klub Rotary" },
    { date: "02-24", event: "Hari Lahir IPNU" },
    { date: "02-28", event: "Hari Gizi Nasional Indonesia" },
    { date: "03-01", event: "Hari Kehakiman Nasional" },
    { date: "03-02", event: "Hari Lahir IPPNU" },
    { date: "03-06", event: "Hari Kostrad" },
    { date: "03-08", event: "Hari Wanita Internasional" },
    { date: "03-09", event: "Hari Musik Nasional" },
    { date: "03-11", event: "Hari Supersemar" },
    { date: "03-15", event: "Hari Konsumen Sedunia" },
    { date: "03-16", event: "Hari Bakti Rimbawan" },
    { date: "03-17", event: "Hari Perawat Nasional" },
    { date: "03-20", event: "Hari Dongeng Sedunia" },
    { date: "03-21", event: "Hari Puisi Sedunia" },
    { date: "03-21", event: "Hari Sindrom Down" },
    { date: "03-21", event: "Hari Hutan Sedunia" },
    { date: "03-22", event: "Hari Air Sedunia" },
    { date: "03-23", event: "Hari Meteorologi Sedunia" },
    { date: "03-24", event: "Hari Tuberkulosis Sedunia" },
    { date: "03-27", event: "Hari Teater Sedunia" },
    { date: "03-29", event: "Hari Filateli Indonesia" },
    { date: "03-30", event: "Hari Film Nasional" },
    { date: "03-31", event: "Hari KOPASKA" },
    { date: "04-01", event: "Hari Bank Dunia" },
    { date: "04-02", event: "Hari Autisme Sedunia" },
    { date: "04-06", event: "Hari Nelayan Nasional" },
    { date: "04-07", event: "Hari Kesehatan Internasional" },
    { date: "04-09", event: "Hari TNI AU" },
    { date: "04-15", event: "Hari Zeni TNI" },
    { date: "04-16", event: "Hari Kopassus" },
    { date: "04-21", event: "Hari Kartini" },
    { date: "04-22", event: "Hari Bumi" },
    { date: "04-23", event: "Hari Buku Sedunia" },
    { date: "04-24", event: "Hari Angkutan Nasional" },
    { date: "04-25", event: "Hari Malaria Sedunia" },
    { date: "04-26", event: "Hari Kesiapsiagaan Bencana" },
    { date: "04-29", event: "Hari Tari Sedunia" },
    { date: "05-01", event: "Hari Buruh Sedunia" },
    { date: "05-02", event: "Hari Pendidikan Nasional" },
    { date: "05-03", event: "Hari Kebebasan Pers Sedunia" },
    { date: "05-05", event: "Hari Bidan Internasional" },
    { date: "05-08", event: "Hari Palang Merah Sedunia" },
    { date: "05-17", event: "Hari Buku Nasional" },
    { date: "05-20", event: "Hari Kebangkitan Nasional" },
    { date: "05-21", event: "Hari Peringatan Reformasi" },
    { date: "05-22", event: "Hari Biodiversitas" },
    { date: "05-29", event: "Hari Lanjut Usia" },
    { date: "05-31", event: "Hari Tanpa Tembakau" },
    { date: "06-01", event: "Hari Lahir Pancasila" },
    { date: "06-05", event: "Hari Lingkungan Hidup" },
    { date: "06-14", event: "Hari Donor Darah" },
    { date: "06-17", event: "Hari Dermaga" },
    { date: "06-21", event: "Hari Krida Pertanian" },
    { date: "06-22", event: "Hari Ulang Tahun Jakarta" },
    { date: "06-24", event: "Hari Bidan Nasional" },
    { date: "06-26", event: "Hari Anti Narkoba" },
    { date: "07-01", event: "Hari Bhayangkara" },
    { date: "07-02", event: "Hari Kelautan Nasional" },
    { date: "07-12", event: "Hari Koperasi" },
    { date: "07-22", event: "Hari Kejaksaan" },
    { date: "07-23", event: "Hari Anak Nasional" },
    { date: "07-27", event: "Hari Sungai Nasional" },
    { date: "07-29", event: "Hari Bhakti TNI AU" },
    { date: "08-05", event: "Hari Dharma Wanita" },
    { date: "08-08", event: "Hari ASEAN" },
    { date: "08-14", event: "Hari Pramuka" },
    { date: "08-17", event: "Hari Kemerdekaan RI" },
    { date: "08-18", event: "Hari Konstitusi" },
    { date: "08-19", event: "Hari Departemen Luar Negeri" },
    { date: "08-24", event: "Hari TVRI" },
    { date: "09-01", event: "Hari Polwan" },
    { date: "09-08", event: "Hari Literasi Sedunia" },
    { date: "09-09", event: "Hari Olahraga Nasional" },
    { date: "09-11", event: "Hari Radio Nasional" },
    { date: "09-17", event: "Hari Perhubungan Nasional" },
    { date: "09-24", event: "Hari Tani" },
    { date: "09-28", event: "Hari Kereta Api" },
    { date: "09-30", event: "Hari G30S PKI" },
    { date: "10-01", event: "Hari Kesaktian Pancasila" },
    { date: "10-02", event: "Hari Batik Nasional" },
    { date: "10-05", event: "Hari TNI" },
    { date: "10-16", event: "Hari Pangan Sedunia" },
    { date: "10-22", event: "Hari Santri Nasional" },
    { date: "10-28", event: "Hari Sumpah Pemuda" },
    { date: "10-29", event: "Hari Stroke Sedunia" },
    { date: "10-30", event: "Hari Keuangan" },
    { date: "11-10", event: "Hari Pahlawan" },
    { date: "11-12", event: "Hari Ayah Nasional" },
    { date: "11-14", event: "Hari Brimob" },
    { date: "11-15", event: "Hari Marinir" },
    { date: "11-25", event: "Hari Guru" },
    { date: "11-28", event: "Hari Menanam Pohon" },
    { date: "11-29", event: "Hari KORPRI" },
    { date: "12-01", event: "Hari AIDS Sedunia" },
    { date: "12-04", event: "Hari Artileri" },
    { date: "12-09", event: "Hari Anti Korupsi" },
    { date: "12-10", event: "Hari HAM" },
    { date: "12-13", event: "Hari Nusantara" },
    { date: "12-19", event: "Hari Bela Negara" },
    { date: "12-22", event: "Hari Ibu" },
    { date: "12-25", event: "Hari Natal" },
  ],
}

function getTodayDate(): string {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${month}-${day}`
}

function getDayDifference(date1: string, date2: string): number {
  const [month1, day1] = date1.split("-").map(Number)
  const [month2, day2] = date2.split("-").map(Number)

  const currentYear = new Date().getFullYear()
  const d1 = new Date(currentYear, month1 - 1, day1)
  let d2 = new Date(currentYear, month2 - 1, day2)

  if (d2 < d1) {
    d2 = new Date(currentYear + 1, month2 - 1, day2)
  }

  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function standardizeEventName(event: string): string {
  let standardName = event
    .toLowerCase()
    .replace(/hari raya/g, "hari")
    .replace(/cuti bersama /g, "")
    .replace(/tahun baru /gi, "")
    .replace(/ tahun .* kongzili/gi, "")
    .replace(/ tahun .* saka/gi, "")
    .replace(/ \d{4}$/g, "")
    .trim()

  standardName = standardName.replace(/ \d{4}.*$/, "")

  return standardName
}

function isHoliday(event: string): boolean {
  const holidayKeywords = [
    "libur",
    "natal",
    "nyepi",
    "waisak",
    "idul",
    "imlek",
    "ascension",
    "ascensi",
    "kenaikan",
    "maulid",
    "isra",
    "tahun baru",
    "cuti bersama",
  ]

  const eventLower = event.toLowerCase()
  return holidayKeywords.some((keyword) => eventLower.includes(keyword))
}

function isNationalDay(event: string): boolean {
  const nationalKeywords = [
    "nasional",
    "indonesia",
    "nusantara",
    "proklamasi",
    "kemerdekaan",
    "pancasila",
    "kebangkitan",
    "pahlawan",
    "kesaktian",
    "sumpah pemuda",
  ]

  const eventLower = event.toLowerCase()
  return nationalKeywords.some((keyword) => eventLower.includes(keyword))
}

interface EventData {
  date: string
  event: string
  source: string
  standardName?: string
}

async function scrapeAndCombineEvents() {
  try {
    const response = await axios.get("https://www.tanggalan.com/", {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(response.data)
    const events = new Map<string, EventData>()
    const holidays = new Map<string, EventData>()
    const nationalDays = new Map<string, EventData>()

    function addEvent(date: string, event: string, source: string) {
      const standardName = standardizeEventName(event)
      const key = `${date}-${standardName}`

      if (!events.has(key) || source === "web") {
        events.set(key, {
          date,
          event,
          source,
          standardName,
        })

        if (isHoliday(event)) {
          holidays.set(key, {
            date,
            event,
            source,
          })
        }

        if (isNationalDay(event)) {
          nationalDays.set(key, {
            date,
            event,
            source,
          })
        }
      }
    }

    $("article ul").each((_, monthElement) => {
      const monthName = $(monthElement).find("a").first().text().trim()
      const monthNumber = getMonthNumber(monthName)

      $(monthElement)
        .find("table tbody tr")
        .each((_, row) => {
          const date = $(row).find("td").first().text().trim()
          const event = $(row).find("td").last().text().trim()

          const formattedDate = formatDate(monthNumber, date)

          if (formattedDate !== "00-00" && monthNumber !== "00") {
            if (event.includes(" dan ")) {
              event.split(" dan ").forEach((singleEvent) => {
                addEvent(formattedDate, singleEvent.trim(), "web")
              })
            } else {
              addEvent(formattedDate, event, "web")
            }
          }
        })
    })

    wikipediaData.events.forEach((event) => {
      addEvent(event.date, event.event, "wikipedia")
    })

    const today = getTodayDate()

    function convertMapToSortedArray(map: Map<string, EventData>): EventData[] {
      return Array.from(map.values()).sort((a, b) => {
        const [aMonth, aDay] = a.date.split("-").map(Number)
        const [bMonth, bDay] = b.date.split("-").map(Number)
        return aMonth === bMonth ? aDay - bDay : aMonth - bMonth
      })
    }

    function getUpcomingEvents(eventsArray: EventData[], count = 5) {
      return eventsArray
        .map((event) => ({
          ...event,
          daysUntil: getDayDifference(today, event.date),
        }))
        .filter((event) => event.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, count)
    }

    const allEvents = convertMapToSortedArray(events)
    const allHolidays = convertMapToSortedArray(holidays)
    const allNationalDays = convertMapToSortedArray(nationalDays)

    function cleanEventData(eventsArray: EventData[]) {
      return eventsArray.map(({ standardName, ...event }) => event)
    }

    const responseData = {
      hari_ini: {
        tanggal: today,
        events: cleanEventData(
          allEvents.filter((event) => event.date === today),
        ),
      },
      mendatang: {
        event_nasional: cleanEventData(getUpcomingEvents(allNationalDays)),
        hari_libur: cleanEventData(getUpcomingEvents(allHolidays)),
      },
      data: {
        hari_libur: cleanEventData(allHolidays),
        hari_nasional: cleanEventData(allNationalDays),
        semua_event: cleanEventData(allEvents),
      },
      statistik: {
        total_event: allEvents.length,
        total_hari_libur: allHolidays.length,
        total_hari_nasional: allNationalDays.length,
      },
    }

    return responseData
  } catch (error: any) {
    console.error("Error:", error)
    throw error
  }
}

function getMonthNumber(monthName: string): string {
  const cleanMonth = monthName.toLowerCase().replace(/[0-9]/g, "").trim()

  const months: { [key: string]: string } = {
    januari: "01",
    februari: "02",
    maret: "03",
    april: "04",
    mei: "05",
    juni: "06",
    juli: "07",
    agustus: "08",
    september: "09",
    oktober: "10",
    november: "11",
    desember: "12",
  }

  return months[cleanMonth] || "00"
}

function formatDate(month: string, date: string): string {
  if (date.includes("-")) {
    date = date.split("-")[0]
  }

  const dateNum = parseInt(date, 10)
  if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
    return "00-00"
  }

  return `${month}-${dateNum.toString().padStart(2, "0")}`
}

async function scrapeLiburNasional() {
  try {
    return await scrapeAndCombineEvents()
  } catch (error: any) {
    console.error("Error during scraping:", error.message)
    throw error
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/info/event-Indonesia",
    name: "Indonesia event",
    category: "Info",
    description: "This API endpoint provides comprehensive information about national holidays and other important events in Indonesia. It aggregates data from various sources, including Wikipedia and the Tanggalan website, to offer details on today's events, upcoming national events, and holidays. The response includes structured data on all recorded holidays and national days, as well as statistics on the total number of events. This endpoint is useful for applications requiring a calendar of Indonesian national events, such as planning tools, news platforms, or educational resources.",
    tags: ["Info", "Indonesia", "Holiday"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapeLiburNasional()
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
    endpoint: "/api/info/event-indonesia",
    name: "Indonesia event",
    category: "Info",
    description: "This API endpoint provides comprehensive information about national holidays and other important events in Indonesia. It aggregates data from various sources, including Wikipedia and the Tanggalan website, to offer details on today's events, upcoming national events, and holidays. The response includes structured data on all recorded holidays and national days, as well as statistics on the total number of events. This endpoint is useful for applications requiring a calendar of Indonesian national events, such as planning tools, news platforms, or educational resources.",
    tags: ["Info", "Indonesia", "Holiday"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const result = await scrapeLiburNasional()
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