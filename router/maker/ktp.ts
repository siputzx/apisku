import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"
import * as FileType from "file-type"
declare const proxy: () => string | null

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function scrapeEktpGet(query: {
  provinsi: string
  kota: string
  nik: string
  nama: string
  ttl: string
  jenis_kelamin: string
  golongan_darah: string
  alamat: string
  "rt/rw": string
  "kel/desa": string
  kecamatan: string
  agama: string
  status: string
  pekerjaan: string
  kewarganegaraan: string
  masa_berlaku: string
  terbuat: string
  pas_photo: string
}) {
  const {
    provinsi,
    kota,
    nik,
    nama,
    ttl,
    jenis_kelamin,
    golongan_darah,
    alamat,
    "rt/rw": rt_rw,
    "kel/desa": kel_desa,
    kecamatan,
    agama,
    status,
    pekerjaan,
    kewarganegaraan,
    masa_berlaku,
    terbuat,
    pas_photo,
  } = query

  registerFont(assets.font.get("ARRIAL"), { family: "Arial" })
  registerFont(assets.font.get("OCR"), { family: "Ocr" })
  registerFont(assets.font.get("SIGN"), { family: "Sign" })

  const template = await loadImage(assets.image.get("TEMPLATE"))
  const pasPhoto = await loadImage(proxy() + pas_photo)

  const width = 850
  const height = 530
  const radius = 20

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#F0F0F0"
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(width - radius, 0)
  ctx.quadraticCurveTo(width, 0, width, radius)
  ctx.lineTo(width, height - radius)
  ctx.quadraticCurveTo(width, height, width - radius, height)
  ctx.lineTo(radius, height)
  ctx.quadraticCurveTo(0, height, 0, height - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.fill()

  ctx.drawImage(template, 0, 0, width, height)

  ctx.fillStyle = "black"
  ctx.font = "bold 25px Arial"
  ctx.textAlign = "center"
  ctx.fillText(`PROVINSI ${provinsi.toUpperCase()}`, width / 2, 45)
  ctx.fillText(`${kota.toUpperCase()}`, width / 2, 75)

  ctx.textAlign = "left"
  ctx.font = "35px Ocr"
  ctx.fillText(nik, 205, 140)

  ctx.font = "bold 20px Arial"

  const valueX = 225
  ctx.fillText(nama.toUpperCase(), valueX, 180)
  ctx.fillText(ttl.toUpperCase(), valueX, 205)
  ctx.fillText(jenis_kelamin.toUpperCase(), valueX, 230)
  ctx.fillText(golongan_darah.toUpperCase(), 550, 230)
  ctx.fillText(alamat.toUpperCase(), valueX, 255)
  ctx.fillText(rt_rw.toUpperCase(), valueX, 282)
  ctx.fillText(kel_desa.toUpperCase(), valueX, 307)
  ctx.fillText(kecamatan.toUpperCase(), valueX, 332)
  ctx.fillText(agama.toUpperCase(), valueX, 358)
  ctx.fillText(status.toUpperCase(), valueX, 383)
  ctx.fillText(pekerjaan.toUpperCase(), valueX, 409)
  ctx.fillText(kewarganegaraan.toUpperCase(), valueX, 434)
  ctx.fillText(masa_berlaku.toUpperCase(), valueX, 459)

  const photoX = 635
  const photoY = 150
  const photoWidth = 180
  const photoHeight = 240

  const photoCanvas = createCanvas(photoWidth, photoHeight)
  const photoCtx = photoCanvas.getContext("2d")

  photoCtx.fillStyle = "#FF0000"
  photoCtx.fillRect(0, 0, photoWidth, photoHeight)

  const aspectRatio = pasPhoto.width / pasPhoto.height
  let srcWidth, srcHeight, srcX, srcY

  if (aspectRatio > photoWidth / photoHeight) {
    srcHeight = pasPhoto.height
    srcWidth = srcHeight * (photoWidth / photoHeight)
    srcX = (pasPhoto.width - srcWidth) / 2
    srcY = 0
  } else {
    srcWidth = pasPhoto.width
    srcHeight = srcWidth * (photoHeight / photoWidth)
    srcX = 0
    srcY = (pasPhoto.height - srcHeight) / 2
  }

  photoCtx.drawImage(pasPhoto, srcX, srcY, srcWidth, srcHeight, 0, 0, photoWidth, photoHeight)

  ctx.drawImage(photoCanvas, photoX, photoY, photoWidth, photoHeight)

  ctx.textAlign = "center"
  ctx.font = "16px Arial"
  ctx.fillText(kota.toUpperCase(), photoX + photoWidth / 2, photoY + photoHeight + 35)
  ctx.fillText(terbuat, photoX + photoWidth / 2, photoY + photoHeight + 60)

  const signName = nama.split(" ")[0]
  ctx.font = "36px Sign"
  ctx.fillText(signName, photoX + photoWidth / 2, photoY + photoHeight + 110)

  return canvas.toBuffer("image/png", { quality: 0.95 })
}

async function scrapeEktpPost(
  body: {
    provinsi: string
    kota: string
    nik: string
    nama: string
    ttl: string
    jenis_kelamin: string
    golongan_darah: string
    alamat: string
    "rt/rw": string
    "kel/desa": string
    kecamatan: string
    agama: string
    status: string
    pekerjaan: string
    kewarganegaraan: string
    masa_berlaku: string
    terbuat: string
  },
  file: Buffer,
) {
  const {
    provinsi,
    kota,
    nik,
    nama,
    ttl,
    jenis_kelamin,
    golongan_darah,
    alamat,
    "rt/rw": rt_rw,
    "kel/desa": kel_desa,
    kecamatan,
    agama,
    status,
    pekerjaan,
    kewarganegaraan,
    masa_berlaku,
    terbuat,
  } = body

  registerFont(assets.font.get("ARRIAL"), { family: "Arial" })
  registerFont(assets.font.get("OCR"), { family: "Ocr" })
  registerFont(assets.font.get("SIGN"), { family: "Sign" })

  const template = await loadImage(assets.image.get("TEMPLATE"))
  const pasPhoto = await loadImage(file)

  const width = 850
  const height = 530
  const radius = 20

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#F0F0F0"
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(width - radius, 0)
  ctx.quadraticCurveTo(width, 0, width, radius)
  ctx.lineTo(width, height - radius)
  ctx.quadraticCurveTo(width, height, width - radius, height)
  ctx.lineTo(radius, height)
  ctx.quadraticCurveTo(0, height, 0, height - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.fill()

  ctx.drawImage(template, 0, 0, width, height)

  ctx.fillStyle = "black"
  ctx.font = "bold 25px Arial"
  ctx.textAlign = "center"
  ctx.fillText(`PROVINSI ${provinsi.toUpperCase()}`, width / 2, 45)
  ctx.fillText(`${kota.toUpperCase()}`, width / 2, 75)

  ctx.textAlign = "left"
  ctx.font = "35px Ocr"
  ctx.fillText(nik, 205, 140)

  ctx.font = "bold 20px Arial"

  const valueX = 225
  ctx.fillText(nama.toUpperCase(), valueX, 180)
  ctx.fillText(ttl.toUpperCase(), valueX, 205)
  ctx.fillText(jenis_kelamin.toUpperCase(), valueX, 230)
  ctx.fillText(golongan_darah.toUpperCase(), 550, 230)
  ctx.fillText(alamat.toUpperCase(), valueX, 255)
  ctx.fillText(rt_rw.toUpperCase(), valueX, 282)
  ctx.fillText(kel_desa.toUpperCase(), valueX, 307)
  ctx.fillText(kecamatan.toUpperCase(), valueX, 332)
  ctx.fillText(agama.toUpperCase(), valueX, 358)
  ctx.fillText(status.toUpperCase(), valueX, 383)
  ctx.fillText(pekerjaan.toUpperCase(), valueX, 409)
  ctx.fillText(kewarganegaraan.toUpperCase(), valueX, 434)
  ctx.fillText(masa_berlaku.toUpperCase(), valueX, 459)

  const photoX = 635
  const photoY = 150
  const photoWidth = 180
  const photoHeight = 240

  const photoCanvas = createCanvas(photoWidth, photoHeight)
  const photoCtx = photoCanvas.getContext("2d")

  photoCtx.fillStyle = "#FF0000"
  photoCtx.fillRect(0, 0, photoWidth, photoHeight)

  const aspectRatio = pasPhoto.width / pasPhoto.height
  let srcWidth, srcHeight, srcX, srcY

  if (aspectRatio > photoWidth / photoHeight) {
    srcHeight = pasPhoto.height
    srcWidth = srcHeight * (photoWidth / photoHeight)
    srcX = (pasPhoto.width - srcWidth) / 2
    srcY = 0
  } else {
    srcWidth = pasPhoto.width
    srcHeight = srcWidth * (photoHeight / photoWidth)
    srcX = 0
    srcY = (pasPhoto.height - srcHeight) / 2
  }

  photoCtx.drawImage(pasPhoto, srcX, srcY, srcWidth, srcHeight, 0, 0, photoWidth, photoHeight)

  ctx.drawImage(photoCanvas, photoX, photoY, photoWidth, photoHeight)

  ctx.textAlign = "center"
  ctx.font = "16px Arial"
  ctx.fillText(body.kota.toUpperCase(), photoX + photoWidth / 2, photoY + photoHeight + 35)
  ctx.fillText(body.terbuat, photoX + photoWidth / 2, photoY + photoHeight + 60)

  const signName = body.nama.split(" ")[0]
  ctx.font = "36px Sign"
  ctx.fillText(signName, photoX + photoWidth / 2, photoY + photoHeight + 110)

  return canvas.toBuffer("image/png", { quality: 0.95 })
}

async function isValidImageBuffer(buffer: Buffer) {
  const type = await FileType.fromBuffer(buffer)
  return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/m/ektp",
    name: "ektp generator",
    category: "Maker",
    description:
      "This API generates a simulated Indonesian e-KTP (Kartu Tanda Penduduk) image based on the provided query parameters. Users can input various personal details such as province, city, NIK (National Identification Number), name, date of birth, gender, blood type, address, RT/RW, sub-district/village, district, religion, marital status, occupation, citizenship, validity period, issue date, and a URL for a passport-style photo. The API then renders these details onto an e-KTP template and returns the generated image as a PNG buffer. This tool is useful for creating mock e-KTP images for testing, development, or educational purposes, allowing developers to simulate real-world e-KTP data and visualize how it would appear on the card.",
    tags: ["MAKER", "IMAGE", "GENERATOR"],
    example:
      "?provinsi=JAWA%20BARAT&kota=BANDUNG&nik=1234567890123456&nama=John%20Doe&ttl=Bandung,%2001-01-1990&jenis_kelamin=Laki-laki&golongan_darah=O&alamat=Jl.%20Contoh%20No.%20123&rt/rw=001/002&kel/desa=Sukajadi&kecamatan=Sukajadi&agama=Islam&status=Belum%20Kawin&pekerjaan=Pegawai%20Swasta&kewarganegaraan=WNI&masa_berlaku=Seumur%20Hidup&terbuat=01-01-2023&pas_photo=https://i.pinimg.com/736x/0b/9f/0a/0b9f0a92a598e6c22629004c1027d23f.jpg",
    parameters: [
      {
        name: "provinsi",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The province.",
        example: "JAWA BARAT",
      },
      {
        name: "kota",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The city.",
        example: "BANDUNG",
      },
      {
        name: "nik",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 16, maxLength: 16 },
        description: "The National Identification Number.",
        example: "1234567890123456",
      },
      {
        name: "nama",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The full name.",
        example: "John Doe",
      },
      {
        name: "ttl",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The place and date of birth (e.g., Bandung, 01-01-1990).",
        example: "Bandung, 01-01-1990",
      },
      {
        name: "jenis_kelamin",
        in: "query",
        required: true,
        schema: { type: "string", enum: ["Laki-laki", "Perempuan"] },
        description: "The gender.",
        example: "Laki-laki",
      },
      {
        name: "golongan_darah",
        in: "query",
        required: true,
        schema: { type: "string", enum: ["A", "B", "AB", "O", "-"] },
        description: "The blood type.",
        example: "O",
      },
      {
        name: "alamat",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 200 },
        description: "The address.",
        example: "Jl. Contoh No. 123",
      },
      {
        name: "rt/rw",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 10 },
        description: "The RT/RW (neighborhood/community unit).",
        example: "001/002",
      },
      {
        name: "kel/desa",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The sub-district/village.",
        example: "Sukajadi",
      },
      {
        name: "kecamatan",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The district.",
        example: "Sukajadi",
      },
      {
        name: "agama",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 50 },
        description: "The religion.",
        example: "Islam",
      },
      {
        name: "status",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 50 },
        description: "The marital status.",
        example: "Belum Kawin",
      },
      {
        name: "pekerjaan",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 100 },
        description: "The occupation.",
        example: "Pegawai Swasta",
      },
      {
        name: "kewarganegaraan",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 50 },
        description: "The citizenship.",
        example: "WNI",
      },
      {
        name: "masa_berlaku",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 50 },
        description: "The validity period.",
        example: "Seumur Hidup",
      },
      {
        name: "terbuat",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 50 },
        description: "The date of issue.",
        example: "01-01-2023",
      },
      {
        name: "pas_photo",
        in: "query",
        required: true,
        schema: { type: "string", format: "url", minLength: 1 },
        description: "URL of the passport photo.",
        example: "https://i.pinimg.com/736x/0b/9f/0a/0b9f0a92a598e6c22629004c1027d23f.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const {
        provinsi,
        kota,
        nik,
        nama,
        ttl,
        jenis_kelamin,
        golongan_darah,
        alamat,
        "rt/rw": rt_rw,
        "kel/desa": kel_desa,
        kecamatan,
        agama,
        status,
        pekerjaan,
        kewarganegaraan,
        masa_berlaku,
        terbuat,
        pas_photo,
      } = req.query || {}

      if (
        !provinsi ||
        !kota ||
        !nik ||
        !nama ||
        !ttl ||
        !jenis_kelamin ||
        !golongan_darah ||
        !alamat ||
        !rt_rw ||
        !kel_desa ||
        !kecamatan ||
        !agama ||
        !status ||
        !pekerjaan ||
        !kewarganegaraan ||
        !masa_berlaku ||
        !terbuat ||
        !pas_photo
      ) {
        return {
          status: false,
          error: "Missing required parameters",
          code: 400,
        }
      }

      if (typeof provinsi !== "string" || provinsi.trim().length === 0) {
        return { status: false, error: "Parameter 'provinsi' must be a non-empty string", code: 400 }
      }
      if (typeof kota !== "string" || kota.trim().length === 0) {
        return { status: false, error: "Parameter 'kota' must be a non-empty string", code: 400 }
      }
      if (typeof nik !== "string" || nik.trim().length !== 16) {
        return { status: false, error: "Parameter 'nik' must be a 16-digit string", code: 400 }
      }
      if (typeof nama !== "string" || nama.trim().length === 0) {
        return { status: false, error: "Parameter 'nama' must be a non-empty string", code: 400 }
      }
      if (typeof ttl !== "string" || ttl.trim().length === 0) {
        return { status: false, error: "Parameter 'ttl' must be a non-empty string", code: 400 }
      }
      if (typeof jenis_kelamin !== "string" || !["Laki-laki", "Perempuan"].includes(jenis_kelamin.trim())) {
        return { status: false, error: "Parameter 'jenis_kelamin' must be 'Laki-laki' or 'Perempuan'", code: 400 }
      }
      if (typeof golongan_darah !== "string" || !["A", "B", "AB", "O", "-"].includes(golongan_darah.trim())) {
        return { status: false, error: "Parameter 'golongan_darah' must be 'A', 'B', 'AB', 'O', or '-'", code: 400 }
      }
      if (typeof alamat !== "string" || alamat.trim().length === 0) {
        return { status: false, error: "Parameter 'alamat' must be a non-empty string", code: 400 }
      }
      if (typeof rt_rw !== "string" || rt_rw.trim().length === 0) {
        return { status: false, error: "Parameter 'rt/rw' must be a non-empty string", code: 400 }
      }
      if (typeof kel_desa !== "string" || kel_desa.trim().length === 0) {
        return { status: false, error: "Parameter 'kel/desa' must be a non-empty string", code: 400 }
      }
      if (typeof kecamatan !== "string" || kecamatan.trim().length === 0) {
        return { status: false, error: "Parameter 'kecamatan' must be a non-empty string", code: 400 }
      }
      if (typeof agama !== "string" || agama.trim().length === 0) {
        return { status: false, error: "Parameter 'agama' must be a non-empty string", code: 400 }
      }
      if (typeof status !== "string" || status.trim().length === 0) {
        return { status: false, error: "Parameter 'status' must be a non-empty string", code: 400 }
      }
      if (typeof pekerjaan !== "string" || pekerjaan.trim().length === 0) {
        return { status: false, error: "Parameter 'pekerjaan' must be a non-empty string", code: 400 }
      }
      if (typeof kewarganegaraan !== "string" || kewarganegaraan.trim().length === 0) {
        return { status: false, error: "Parameter 'kewarganegaraan' must be a non-empty string", code: 400 }
      }
      if (typeof masa_berlaku !== "string" || masa_berlaku.trim().length === 0) {
        return { status: false, error: "Parameter 'masa_berlaku' must be a non-empty string", code: 400 }
      }
      if (typeof terbuat !== "string" || terbuat.trim().length === 0) {
        return { status: false, error: "Parameter 'terbuat' must be a non-empty string", code: 400 }
      }
      if (typeof pas_photo !== "string" || pas_photo.trim().length === 0) {
        return { status: false, error: "Parameter 'pas_photo' must be a non-empty string", code: 400 }
      }

      try {
        const buffer = await scrapeEktpGet({
          provinsi: provinsi.trim(),
          kota: kota.trim(),
          nik: nik.trim(),
          nama: nama.trim(),
          ttl: ttl.trim(),
          jenis_kelamin: jenis_kelamin.trim(),
          golongan_darah: golongan_darah.trim(),
          alamat: alamat.trim(),
          "rt/rw": (rt_rw as string).trim(),
          "kel/desa": (kel_desa as string).trim(),
          kecamatan: kecamatan.trim(),
          agama: agama.trim(),
          status: status.trim(),
          pekerjaan: pekerjaan.trim(),
          kewarganegaraan: kewarganegaraan.trim(),
          masa_berlaku: masa_berlaku.trim(),
          terbuat: terbuat.trim(),
          pas_photo: pas_photo.trim(),
        })

        return createImageResponse(buffer)
      } catch (error) {
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
    endpoint: "/api/m/ektp",
    name: "ektp generator",
    category: "Maker",
    description:
      "This API generates a simulated Indonesian e-KTP (Kartu Tanda Penduduk) image using data provided in the request body and an uploaded passport-style photo. Users can supply personal details such as province, city, NIK (National Identification Number), name, date of birth, gender, blood type, address, RT/RW, sub-district/village, district, religion, marital status, occupation, citizenship, validity period, and issue date. The endpoint expects a 'multipart/form-data' content type where the image file is included as 'pas_photo'. The API processes these inputs to create a realistic e-KTP image, returning it as a PNG buffer. This is ideal for applications requiring the generation of mock e-KTPs with specific data and image uploads, facilitating testing, demonstrations, or educational simulations.",
    tags: ["MAKER", "IMAGE", "GENERATOR"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: [
              "provinsi",
              "kota",
              "nik",
              "nama",
              "ttl",
              "jenis_kelamin",
              "golongan_darah",
              "alamat",
              "rt/rw",
              "kel/desa",
              "kecamatan",
              "agama",
              "status",
              "pekerjaan",
              "kewarganegaraan",
              "masa_berlaku",
              "terbuat",
              "pas_photo",
            ],
            properties: {
              provinsi: { type: "string", description: "The province.", example: "JAWA BARAT", minLength: 1, maxLength: 100 },
              kota: { type: "string", description: "The city.", example: "BANDUNG", minLength: 1, maxLength: 100 },
              nik: { type: "string", description: "The National Identification Number.", example: "1234567890123456", minLength: 16, maxLength: 16 },
              nama: { type: "string", description: "The full name.", example: "John Doe", minLength: 1, maxLength: 100 },
              ttl: { type: "string", description: "The place and date of birth (e.g., Bandung, 01-01-1990).", example: "Bandung, 01-01-1990", minLength: 1, maxLength: 100 },
              jenis_kelamin: { type: "string", enum: ["Laki-laki", "Perempuan"], description: "The gender.", example: "Laki-laki" },
              golongan_darah: { type: "string", enum: ["A", "B", "AB", "O", "-"], description: "The blood type.", example: "O" },
              alamat: { type: "string", description: "The address.", example: "Jl. Contoh No. 123", minLength: 1, maxLength: 200 },
              "rt/rw": { type: "string", description: "The RT/RW (neighborhood/community unit).", example: "001/002", minLength: 1, maxLength: 10 },
              "kel/desa": { type: "string", description: "The sub-district/village.", example: "Sukajadi", minLength: 1, maxLength: 100 },
              kecamatan: { type: "string", description: "The district.", example: "Sukajadi", minLength: 1, maxLength: 100 },
              agama: { type: "string", description: "The religion.", example: "Islam", minLength: 1, maxLength: 50 },
              status: { type: "string", description: "The marital status.", example: "Belum Kawin", minLength: 1, maxLength: 50 },
              pekerjaan: { type: "string", description: "The occupation.", example: "Pegawai Swasta", minLength: 1, maxLength: 100 },
              kewarganegaraan: { type: "string", description: "The citizenship.", example: "WNI", minLength: 1, maxLength: 50 },
              masa_berlaku: { type: "string", description: "The validity period.", example: "Seumur Hidup", minLength: 1, maxLength: 50 },
              terbuat: { type: "string", description: "The date of issue.", example: "01-01-2023", minLength: 1, maxLength: 50 },
              pas_photo: { type: "string", format: "binary", description: "The passport photo (JPG, JPEG, PNG, GIF, WEBP)." },
            },
          },
          encoding: {
            pas_photo: { contentType: "image/png, image/jpeg, image/jpg, image/webp, image/gif" },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      const {
        provinsi,
        kota,
        nik,
        nama,
        ttl,
        jenis_kelamin,
        golongan_darah,
        alamat,
        "rt/rw": rt_rw,
        "kel/desa": kel_desa,
        kecamatan,
        agama,
        status,
        pekerjaan,
        kewarganegaraan,
        masa_berlaku,
        terbuat,
      } = req.body || {}

      if (
        !provinsi ||
        !kota ||
        !nik ||
        !nama ||
        !ttl ||
        !jenis_kelamin ||
        !golongan_darah ||
        !alamat ||
        !rt_rw ||
        !kel_desa ||
        !kecamatan ||
        !agama ||
        !status ||
        !pekerjaan ||
        !kewarganegaraan ||
        !masa_berlaku ||
        !terbuat
      ) {
        return {
          status: false,
          error: "Missing required parameters",
          code: 400,
        }
      }

      if (typeof provinsi !== "string" || provinsi.trim().length === 0) {
        return { status: false, error: "Parameter 'provinsi' must be a non-empty string", code: 400 }
      }
      if (typeof kota !== "string" || kota.trim().length === 0) {
        return { status: false, error: "Parameter 'kota' must be a non-empty string", code: 400 }
      }
      if (typeof nik !== "string" || nik.trim().length !== 16) {
        return { status: false, error: "Parameter 'nik' must be a 16-digit string", code: 400 }
      }
      if (typeof nama !== "string" || nama.trim().length === 0) {
        return { status: false, error: "Parameter 'nama' must be a non-empty string", code: 400 }
      }
      if (typeof ttl !== "string" || ttl.trim().length === 0) {
        return { status: false, error: "Parameter 'ttl' must be a non-empty string", code: 400 }
      }
      if (typeof jenis_kelamin !== "string" || !["Laki-laki", "Perempuan"].includes(jenis_kelamin.trim())) {
        return { status: false, error: "Parameter 'jenis_kelamin' must be 'Laki-laki' or 'Perempuan'", code: 400 }
      }
      if (typeof golongan_darah !== "string" || !["A", "B", "AB", "O", "-"].includes(golongan_darah.trim())) {
        return { status: false, error: "Parameter 'golongan_darah' must be 'A', 'B', 'AB', 'O', or '-'", code: 400 }
      }
      if (typeof alamat !== "string" || alamat.trim().length === 0) {
        return { status: false, error: "Parameter 'alamat' must be a non-empty string", code: 400 }
      }
      if (typeof rt_rw !== "string" || rt_rw.trim().length === 0) {
        return { status: false, error: "Parameter 'rt/rw' must be a non-empty string", code: 400 }
      }
      if (typeof kel_desa !== "string" || kel_desa.trim().length === 0) {
        return { status: false, error: "Parameter 'kel/desa' must be a non-empty string", code: 400 }
      }
      if (typeof kecamatan !== "string" || kecamatan.trim().length === 0) {
        return { status: false, error: "Parameter 'kecamatan' must be a non-empty string", code: 400 }
      }
      if (typeof agama !== "string" || agama.trim().length === 0) {
        return { status: false, error: "Parameter 'agama' must be a non-empty string", code: 400 }
      }
      if (typeof status !== "string" || status.trim().length === 0) {
        return { status: false, error: "Parameter 'status' must be a non-empty string", code: 400 }
      }
      if (typeof pekerjaan !== "string" || pekerjaan.trim().length === 0) {
        return { status: false, error: "Parameter 'pekerjaan' must be a non-empty string", code: 400 }
      }
      if (typeof kewarganegaraan !== "string" || kewarganegaraan.trim().length === 0) {
        return { status: false, error: "Parameter 'kewarganegaraan' must be a non-empty string", code: 400 }
      }
      if (typeof masa_berlaku !== "string" || masa_berlaku.trim().length === 0) {
        return { status: false, error: "Parameter 'masa_berlaku' must be a non-empty string", code: 400 }
      }
      if (typeof terbuat !== "string" || terbuat.trim().length === 0) {
        return { status: false, error: "Parameter 'terbuat' must be a non-empty string", code: 400 }
      }

      try {
        const { file, isValid, isImage } = await guf(req, "pas_photo")

        if (!file) {
          return {
            status: false,
            error: "Missing passport photo file in form data",
            code: 400,
          }
        }

        if (!isValid) {
          return {
            status: false,
            error: "Invalid file: 'pas_photo'. Size must be between 1 byte and 10MB",
            code: 400,
          }
        }

        if (!isImage) {
          return {
            status: false,
            error: "Invalid file type: 'pas_photo'. Supported: JPG, JPEG, PNG, GIF, WEBP",
            code: 400,
          }
        }

        const buffer = await scrapeEktpPost(
          {
            provinsi: provinsi.trim(),
            kota: kota.trim(),
            nik: nik.trim(),
            nama: nama.trim(),
            ttl: ttl.trim(),
            jenis_kelamin: jenis_kelamin.trim(),
            golongan_darah: golongan_darah.trim(),
            alamat: alamat.trim(),
            "rt/rw": (rt_rw as string).trim(),
            "kel/desa": (kel_desa as string).trim(),
            kecamatan: kecamatan.trim(),
            agama: agama.trim(),
            status: status.trim(),
            pekerjaan: pekerjaan.trim(),
            kewarganegaraan: kewarganegaraan.trim(),
            masa_berlaku: masa_berlaku.trim(),
            terbuat: terbuat.trim(),
          },
          file,
        )

        return createImageResponse(buffer)
      } catch (error) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]