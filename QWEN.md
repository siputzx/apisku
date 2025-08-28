# Project Context for Qwen Code (Updated)

## Project Overview

This is a TypeScript-based API server built using the Elysia framework, designed to serve as a RESTful API with dynamic route loading capabilities. The server is intended to be run with Bun.

Key features of this project include:
- Dynamic API route loading from the `router` directory
- Rate limiting and security middleware
- WebSocket monitoring endpoint
- Static file serving from the `public` directory
- Integration with MongoDB for database operations
- Discord bot integration
- Email service integration
- Browser automation service (using Playwright)
- Built-in file watching for hot reloading of routes

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) runtime installed
- MongoDB instance (local or remote, configured via `MONGODB_URI`)

### Development
To start the development server with hot reloading:
```bash
bun run dev
```

### Production
To start the server in production mode:
```bash
bun run start
```

### Building
To build the project:
```bash
bun run build
```

### Testing
To run tests:
```bash
bun run test
```

## Development Conventions

### Project Structure
- `src/`: Contains the main source code
  - `config/`: Configuration files
  - `middleware/`: Elysia middleware components
  - `routes/`: Route definitions (static routes)
  - `services/`: Service layer implementations (database, discord, email, browser)
  - `monitoring/`: Monitoring related code
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
  - `models/`: Mongoose models for database interactions
- `router/`: Directory for dynamic API route files (loaded at runtime)
- `public/`: Static files served by the server
- `tmp/`: Temporary files (also served statically)

### Route Definitions
Dynamic routes are loaded from `.ts` or `.js` files in the `router/` directory. Each file should export an array of route objects or a single route object with the following structure:
```ts
interface ApiRoute {
  category: string
  name: string
  metode: "GET" | "POST"
  endpoint: string
  run: (context: RouteContext) => Promise<any>
  isPublic?: boolean
  isPremium?: boolean
  isMaintenance?: boolean
  description?: string
  parameters?: any[]
  requestBody?: any
  example?: any
}
```

The `RouteContext` object passed to the `run` function contains:
- `req`: The Elysia request object (including query parameters, body, headers)
- `res`: The Elysia response object (for setting status codes, headers)
- `guf`: A utility function (`GetUploadFile.guf`) for handling file uploads from multipart form data.
- `saveMedia`: A utility function (`MediaUtils.saveMedia`) for saving a Buffer to the `tmp` directory and returning a public URL.
- `solveBypass`: A utility function that provides access to various bypass mechanisms (WAF, Turnstile, etc.).

### Coding Style
- Uses TypeScript with modern ES modules
- Follows a class-based architecture for services and main server components
- Uses Elysia's functional approach for route definitions and middleware
- Emphasis on logging with a custom `Logger` utility
- Environment variables are managed through a centralized `config` object

### Security
- Implements rate limiting through `EndpointRateLimiter` middleware
- Adds security headers to all responses
- Supports API key authentication for premium endpoints via `AuthMiddleware`
- Includes anti-spam and DDoS protection mechanisms

### Monitoring
- Provides a `/monitor` endpoint for real-time stats
- WebSocket endpoint `/ws/monitor` for live updates
- Detailed logging for request handling and errors
- Built-in `/debug/routes` endpoint to inspect loaded routes

## API Route Conventions (Learned from Examples)

### File Structure
- Routes are organized in the `router/` directory by category (e.g., `ai`, `downloader`, `canvas`, `sticker`).
- Each file within a category represents one or more related endpoints, usually for a specific service or functionality.
- Files are typically named after the main service they interact with (e.g., `gemini.ts`, `tiktokdl.ts`, `welcomev1.ts`, `combot.ts`).

### Route Object Details

1.  **`metode`**: Specifies the HTTP method, either `"GET"` or `"POST"`.
2.  **`endpoint`**: The API path, should start with `/api/` (e.g., `/api/ai/gemini`, `/api/d/tiktok`, `/api/canvas/welcomev1`, `/api/sticker/combot-search`). Dynamic parameters are denoted with colons (e.g., `/api/user/:id`).
3.  **`name`**: A human-readable name for the endpoint.
4.  **`category`**: The category this endpoint belongs to (used for documentation and organization). Should match the directory name in `router/`.
5.  **`description`**: A detailed description of what the endpoint does.
6.  **`tags`**: An array of string tags for categorization/searching in documentation.
7.  **`example`**: A string showing example query parameters for a GET request (e.g., `"?text=Hello&param=value"`).
8.  **`parameters`**: An array defining query/path parameters for GET requests, following OpenAPI/Swagger specification.
9.  **`requestBody`**: An object defining the structure of the JSON body for POST requests, following OpenAPI/Swagger specification.
10. **`isPublic`**: Boolean indicating if the endpoint is publicly accessible without an API key. Defaults to `false` if not specified.
11. **`isPremium`**: Boolean indicating if an API key is required to access this endpoint. Checked by the server's dynamic route handler.
12. **`isMaintenance`**: Boolean indicating if the endpoint is temporarily disabled.
13. **`run`**: An asynchronous function that contains the core logic for the endpoint.
    - It receives a `context` object.
    - It should validate input parameters/body.
    - It performs the necessary actions (calling scrapers, processing data, generating images, etc.).
    - It returns a JSON object (for data responses) or a `Response` object (for binary data like images).
    - Error handling is crucial; errors should be caught and returned with appropriate status codes (4xx for client errors, 5xx for server errors).

### Handling Requests

- **GET Requests**: Parameters are accessed via `req.query`.
- **POST Requests**: JSON body is accessed via `req.body`. File uploads (multipart/form-data) are handled using the `guf` utility provided in the context.

### Utility Functions in Context

1.  **`guf(req, fieldName)`**:
    - Used for handling file uploads in POST requests.
    - `req`: The request object from the route context.
    - `fieldName`: The name of the field in the multipart form data.
    - Returns an object: `{ file: Buffer, type: string, isImage: boolean, isValid: boolean, size: number, name: string }` or `null` if the file is not found or invalid.
    - Example: `const avatarFile = await guf(req, "avatar")`

2.  **`saveMedia(buffer, fileType)`**:
    - Saves a `Buffer` to the `tmp/` directory.
    - `buffer`: The data to save.
    - `fileType`: Optional extension (e.g., `"jpg"`, `"png"`, `"mp4"`).
    - Returns a Promise that resolves to the public URL of the saved file.
    - Example: `const imageUrl = await saveMedia(imageBuffer, "jpg")`

3.  **`solveBypass()`**:
    - Provides access to various web scraping bypass utilities.
    - Returns an object with methods like `wafSession`, `solveTurnstileMin`, `solveTurnstileMax`, `getSource`.
    - These are used for advanced web scraping scenarios where sites have protection mechanisms.

### Response Format

- For JSON data responses, the convention is to return an object with a `status` boolean and a `data` field:
  ```ts
  return {
    status: true,
    data: { /* ... result data ... */ },
    timestamp: new Date().toISOString(),
  }
  ```
  Or for errors:
  ```ts
  return {
    status: false,
    error: "Error message",
    code: 400, // Appropriate HTTP status code
  }
  ```

- For binary data responses (like images), a `Response` object is created directly:
  ```ts
  return new Response(buffer, { headers })
  ```
  Utility functions like `createImageResponse` (seen in `welcomev1.ts`) can be used to standardize this.

### File Organization Example

Based on the examples analyzed, a typical route file (`router/<category>/<service>.ts`) might look like this:

```ts
// Import necessary modules
import axios from "axios"
// ... other imports

// Core scraping/generation logic function
async function scrapeOrGenerateData(param1: string, param2: string) {
  // ... implementation using axios, cheerio, canvas, etc. ...
  return {
    result: "data"
  }
}

// Export the route definitions
export default [
  // GET Endpoint
  {
    metode: "GET",
    endpoint: "/api/<category>/<service-endpoint>", // e.g., /api/downloader/tiktok
    name: "<Service Name>", // e.g., "TikTok Downloader"
    category: "<Category>", // e.g., "Downloader" (matches directory name)
    description: "Description of what this GET endpoint does.",
    tags: ["Downloader", "TikTok", "..."],
    example: "?param1=value1&param2=value2",
    parameters: [
      // ... OpenAPI parameter definitions ...
    ],
    isPremium: false, // or true
    isMaintenance: false, // or true
    isPublic: true, // or false
    async run({ req }) { // Destructure context for GET
      const { param1, param2 } = req.query || {}

      // 1. Validate inputs
      if (!param1 || typeof param1 !== "string") {
         return {
          status: false,
          error: "param1 is required and must be a string",
          code: 400,
         }
      }

      try {
        // 2. Call core logic
        const result = await scrapeOrGenerateData(param1, param2)

        // 3. Return success response
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        // 4. Handle errors
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500, // Or appropriate error code
        }
      }
    }
  },
  // POST Endpoint
  {
    metode: "POST",
    endpoint: "/api/<category>/<service-endpoint>", // Same endpoint, different method
    name: "<Service Name>",
    category: "<Category>",
    description: "Description of what this POST endpoint does.",
    tags: ["Downloader", "TikTok", "..."],
    requestBody: {
      // ... OpenAPI requestBody definition ...
    },
    isPremium: false, // or true
    isMaintenance: false, // or true
    isPublic: true, // or false
    async run({ req, guf, saveMedia }) { // Destructure context for POST, including utilities
      const { param1, param2 } = req.body || {}
      
      // For file uploads:
      // const uploadedFile = await guf(req, "fieldName")
      // if (!uploadedFile || !uploadedFile.isValid) { ... }

      // 1. Validate inputs
      if (!param1 || typeof param1 !== "string") {
         return {
          status: false,
          error: "param1 is required and must be a string",
          code: 400,
         }
      }

      try {
        // 2. Call core logic
        const result = await scrapeOrGenerateData(param1, param2)

        // 3. Return success response
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        // 4. Handle errors
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    }
  }
]
```
This updated `QWEN.md` provides a comprehensive understanding of how to create new API routes for this project, based on the analysis of existing route files.

## Qwen Added Memories
- Saya telah mempelajari struktur dan isi berbagai file router dalam proyek API ini, mencakup berbagai kategori seperti AI, downloader, canvas, sticker, tools, random, info, fun, anime, games, check, bypass, currency, apk, search, stalker, primbon, cloudflare, iloveimg, imgedit, maker, berita, get, dan aimage. Saya memahami pola dan struktur yang digunakan untuk mendefinisikan route API.
- Struktur umum definisi route: Setiap file route mengekspor array objek route. Setiap objek route memiliki properti: metode (GET/POST), endpoint (path API), name (nama endpoint), category (kategori), description (deskripsi), tags (tag untuk dokumentasi), example (contoh penggunaan), parameters (untuk GET) atau requestBody (untuk POST), isPublic (boolean), isPremium (boolean), isMaintenance (boolean), dan run (fungsi async handler). Fungsi run menerima konteks { req, res, guf, saveMedia, solveBypass } dan harus mereturn JSON { status, data, timestamp } untuk data atau Response object untuk binary (gambar). Validasi parameter dilakukan di awal fungsi run. Error ditangkap dan direturn dengan kode status yang sesuai.
- Kategori AI: Biasanya melibatkan integrasi dengan model AI atau layanan pihak ketiga (Gemini, Bard, Cloudflare AI). Fungsi handler seringkali menerima prompt teks dan parameter konfigurasi (cookie, system prompt, dll). Menggunakan utility seperti solveBypass untuk mengatasi proteksi web. Contoh: gemini.ts, bard.ts, dan file-file di direktori ai/aimage.
- Kategori Downloader: Fokus pada pengambilan konten dari platform online (TikTok, Instagram, YouTube). Menggunakan scraping web (cheerio, axios) untuk mengekstrak URL unduhan. File seringkali berisi class untuk mengelola interaksi dengan situs target (mendapatkan token, memproses script). Contoh: tiktokdl.ts.
- Kategori Canvas: Khusus untuk manipulasi gambar. Menggunakan library canvas untuk menggambar teks dan menempelkan gambar. Fungsi handler sering menerima parameter seperti teks, URL gambar/avatar/background. Memerlukan validasi URL gambar dan ukuran file. Menggunakan fungsi utilitas createImageResponse untuk mereturn buffer gambar. Contoh: welcomev1.ts.
- Kategori Sticker: Terkait dengan pencarian atau pembuatan stiker. Menggunakan scraping untuk mendapatkan data dari situs penyedia stiker. Fungsi handler biasanya menerima query pencarian dan parameter pagination. Contoh: combot.ts.
- Kategori Tools: Menyediakan utilitas umum seperti penerjemah, konversi teks, screenshot web. Fungsi handler menerima data input (teks, URL) dan parameter konfigurasi. Bisa menggunakan API pihak ketiga atau algoritma sederhana. Contoh: translate.ts, ssweb.ts.
- Kategori Random: Menyediakan konten acak seperti gambar atau teks. Sering mengambil data dari sumber eksternal (GitHub Gist, API publik). Fungsi handler biasanya tidak memerlukan parameter input yang kompleks. Contoh: random/cecan/japan.ts, games/tebakan.ts.
- Kategori Info: Menyediakan informasi dari sumber terpercaya seperti BMKG, cuaca, jadwal TV. Menggunakan scraping atau API resmi untuk mendapatkan data terkini. Struktur data yang dikembalikan seringkali kompleks dan informatif. Contoh: info/gempa.ts.
- Kategori Fun: Fokus pada hiburan dan permainan ringan. Melibatkan transformasi teks, teka-teki, atau permainan interaktif sederhana. Logika seringkali bersifat algoritmik dan tidak memerlukan integrasi eksternal yang kompleks. Contoh: fun/alay.ts, games/tebakan.ts.
- Kategori Anime: Scraping informasi seputar anime dari situs fansub atau database anime. Fungsi handler sering menerima query pencarian, ID anime, atau parameter episode. Mengembalikan detail seperti sinopsis, daftar episode, link streaming/unduh. Contoh: anime/anichin/search.ts.
- Kategori Games: Menyediakan permainan teka-teki atau kuis. Data pertanyaan/jawaban biasanya diambil dari database eksternal. Fungsi handler mengacak dan mereturn satu item dari database. Contoh: games/tebakan.ts.
- Kategori Check: Memeriksa status atau informasi spesifik seperti resi pengiriman, profil game, npm package. Fungsi handler menerima identifier unik (nomor resi, username, nama package) dan berinteraksi dengan API atau situs target. Contoh: check/checkresi.ts, check/profile-genshin.ts.
- Kategori Bypass: Menyediakan solusi untuk mengatasi proteksi web seperti CAPTCHA. Menggunakan utility khusus seperti solveBypass yang menyediakan fungsi seperti solveTurnstileMin. Fungsi handler menerima parameter seperti URL situs dan sitekey. Contoh: bypass/turnstilemin.ts.
- Kategori Currency: Menyediakan informasi dan konversi mata uang/crypto. Mengambil data dari berbagai API keuangan. Fungsi handler bisa menerima jumlah, mata uang asal dan tujuan untuk konversi. Contoh: currency/convert.ts.
- Kategori APK: Scraping informasi aplikasi dari store seperti Play Store, App Store. Fungsi handler menerima nama aplikasi sebagai query dan mereturn detail seperti nama, developer, rating, link unduh. Contoh: apk/playstore.ts.
- Kategori Search: Pencarian informasi dari berbagai sumber seperti GitHub, Google, DuckDuckGo. Fungsi handler menerima query pencarian dan mereturn hasil yang relevan. Bisa melibatkan scraping atau API search engine. Contoh: serach/github/dependents.ts, serach/duckduckgo.ts.
- Kategori Stalker: Mengambil informasi profil publik dari media sosial. Fungsi handler menerima username atau ID pengguna. Melibatkan scraping atau API resmi (jika tersedia). Contoh: stalker/Instagram.ts.
- Kategori Primbon: Menyediakan hasil perhitungan atau arti berdasarkan kepercayaan tradisional. Fungsi handler menerima data input seperti nama, tanggal lahir. Logika bisa berupa algoritma sederhana atau scraping dari situs primbon. Contoh: primbon/artinama.ts.
- Kategori Cloudflare: Menggunakan API Cloudflare AI untuk berbagai tugas seperti chat, terjemahan, klasifikasi gambar. Fungsi handler berinteraksi langsung dengan endpoint CloudflareAi(). Contoh: cloudflare/chat.ts.
- Kategori Iloveimg: Integrasi dengan layanan pengeditan gambar online Iloveimg. Melibatkan proses multi-langkah: mendapatkan task ID, upload file, eksekusi operasi (removebg, upscale), dan mengambil hasil. Menggunakan FormData untuk upload. Contoh: iloveimg/removebg.ts.
- Kategori Imgedit: Pengeditan gambar menggunakan layanan online atau library khusus. Bisa melibatkan AI untuk efek khusus (cartoon). Menggunakan teknik scraping untuk mendapatkan token/API key yang diperlukan. Contoh: imgedit/carton.ts.
- Kategori Maker: Pembuatan konten kreatif seperti teks bergaya (textpro), gambar gabungan. Seringkali melibatkan interaksi kompleks dengan situs pihak ketiga, termasuk bypass reCAPTCHA. Contoh: maker/textpro.ts.
- Kategori Berita: Scraping berita dari portal berita Indonesia. Fungsi handler biasanya tidak memerlukan parameter dan mereturn daftar artikel terbaru. Proses scraping mencakup ekstraksi judul, gambar, link, dan isi berita. Contoh: berita/cnn.ts.
- Kategori Get Data: Mengambil metadata atau informasi spesifik dari URL atau platform tertentu. Fungsi handler menerima URL sebagai parameter utama dan mengekstrak identifier untuk berinteraksi dengan API internal platform tersebut. Contoh: get/alightmotion.ts.
- Kategori AI Image: Khusus untuk pembuatan gambar menggunakan model AI. Fungsi handler menerima prompt teks dan menggunakan API AI (Cloudflare, Stability AI) untuk menghasilkan gambar. Mereturn buffer gambar langsung. Contoh: ai/aimage/flux-1-schnell.ts.
