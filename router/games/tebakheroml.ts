import axios from "axios"
import * as cheerio from "cheerio"

const characters: string[] = [
  "Aamon",
  "Assassin",
  "Jungler",
  "Akai",
  "Tank",
  "Aldous",
  "Fighter",
  "Alice",
  "Alpha",
  "Alucard",
  "Angela",
  "Support",
  "Roamer",
  "Argus",
  "EXP Laner",
  "Arlott",
  "Atlas",
  "Aulus",
  "Aurora",
  "Mage",
  "Badang",
  "Balmond",
  "Bane",
  "Barats",
  "Baxia",
  "Beatrix",
  "Marksman",
  "Gold Laner",
  "Belerick",
  "Benedetta",
  "Brody",
  "Bruno",
  "Carmilla",
  "Caecilion",
  "Mid Laner",
  "Chou",
  "Figter",
  "Cici",
  "Claude",
  "Clint",
  "Cyclops",
  "Diggie",
  "Dyrroth",
  "Edith",
  "Esmeralda",
  "Estes",
  "Eudora",
  "Fanny",
  "Faramis",
  "Floryn",
  "Franco",
  "Fredrinn",
  "Freya",
  "Gatotkaca",
  "Gloo",
  "Gord",
  "Granger",
  "Grock",
  "Guinevere",
  "Gusion",
  "Hanabi",
  "Hanzo",
  "Harith",
  "Harley",
  "Hayabusa",
  "Helcurt",
  "Hilda",
  "Hylos",
  "Irithel",
  "Ixia",
  "Jawhead",
  "Johnson",
  "Joy",
  "Asassin",
  "Julian",
  "Kadita",
  "Kagura",
  "Kaja",
  "Karina",
  "Karrie",
  "Khaleed",
  "Khufra",
  "Kimmy",
  "Lancelot",
  "Layla",
  "Leomord",
  "Lesley",
  "Ling",
  "Lolita",
  "Lunox",
  "Luo Yi",
  "Lylia",
  "Martis",
  "Masha",
  "Mathilda",
  "Melissa",
  "Minotaur",
  "Minsitthar",
  "Miya",
  "Moskov",
  "Nana",
  "Natalia",
  "Natan",
  "Novaria",
  "Odette",
  "Paquito",
  "Pharsa",
  "Phoveus",
  "Popol and Kupa",
  "Rafaela",
  "Roger",
  "Ruby",
  "Saber",
  "Selena",
  "Silvanna",
  "Sun",
  "Terizla",
  "Thamuz",
  "Tigreal",
  "Uranus",
  "Vale",
  "Valentina",
  "Valir",
  "Vexana",
  "Wanwan",
  "Xavier",
  "Yin",
  "Yu Zhong",
  "Yve",
  "Zhask",
  "Zilong",
]

async function scrape() {
  try {
    const query = characters[Math.floor(Math.random() * characters.length)]
    const url = `https://mobile-legends.fandom.com/wiki/${query}/Audio/id`
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    const $ = cheerio.load(response.data)
    const audioSrc = $("audio")
      .map((i, el) => $(el).attr("src"))
      .get() as string[]
    const randomAudio = audioSrc[Math.floor(Math.random() * audioSrc.length)]

    if (!randomAudio) {
      throw new Error(`No audio found for character: ${query}`)
    }

    return { name: query, audio: randomAudio }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to fetch hero audio data")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/tebakheroml",
    name: "tebak hero ml",
    category: "Games",
    description: "This API endpoint provides a random Mobile Legends: Bang Bang hero and one of their in-game audio quotes. Users can utilize this endpoint to create a 'Guess the Hero' game, where players listen to the audio and identify the character. The response includes the hero's name and a URL to their audio quote, making it suitable for interactive quiz applications, fan-made games, or content related to Mobile Legends.",
    tags: ["Games", "Mobile Legends", "MLBB", "Quiz", "Audio", "Entertainment"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

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
    endpoint: "/api/games/tebakheroml",
    name: "tebak hero ml",
    category: "Games",
    description: "This API endpoint provides a random Mobile Legends: Bang Bang hero and one of their in-game audio quotes. Users can utilize this endpoint to create a 'Guess the Hero' game, where players listen to the audio and identify the character. The response includes the hero's name and a URL to their audio quote, making it suitable for interactive quiz applications, fan-made games, or content related to Mobile Legends.",
    tags: ["Games", "Mobile Legends", "MLBB", "Quiz", "Audio", "Entertainment"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

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