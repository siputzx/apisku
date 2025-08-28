import axios from "axios";
import * as https from "node:https";
import UserAgent from "user-agents";
import FormData from "form-data";
import * as crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { Buffer } from "buffer";

const UPLOAD = "https://kolorize.cc/api/upload";
const TICKET = "https://kolorize.cc/ticket";
const LOOKUP = "https://kolorize.cc/api/lookup";

const agent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false,
});

const userAgent = new UserAgent();
const ua = userAgent.random().toString();

let headersList = {
  "authority": "kolorize.cc",
  "accept": "*/*",
  "accept-language": "id-ID,id;q=0.9",
  "cache-control": "no-cache",
  "origin": "https://kolorize.cc",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "referer": "https://kolorize.cc/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": ua,
};

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers = {
    "Content-Type": "image/webp",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return new Response(buffer, { headers });
};

async function _req({ url, method = "GET", data = null, params = null, head = null, response = "json" }: { url: string; method?: string; data?: any; params?: any; head?: any; response?: "json" | "arraybuffer" | "stream" }) {
  try {
    let headers: { [key: string]: string } = {};
    let param: any;
    let datas: any;

    if (head && (head == "original" || head == "ori")) {
      const uri = new URL(url);
      headers = {
        authority: uri.hostname,
        origin: "https://" + uri.hostname,
        "Cache-Control": "no-cache",
        "user-agent": ua,
      };
    } else if (head && typeof head == "object") {
      headers = head;
    }
    if (params && typeof params == "object") {
      param = params;
    } else {
      param = "";
    }
    if (data) {
      datas = data;
    } else {
      datas = "";
    }

    const options = {
      url: url,
      method: method,
      headers,
      timeout: 30_000,
      responseType: response as "json" | "arraybuffer" | "stream",
      httpsAgent: agent,
      withCredentials: true,
      validateStatus: (status: number) => {
        return status <= 500;
      },
      ...(!datas ? {} : { data: datas }),
      ...(!params ? {} : { params: param }),
    };
    const res = await axios.request(options);

    if (res.headers["set-cookie"]) {
      res.headers["set-cookie"].forEach((v: string) => {
        if (head && typeof head === "object") {
          head["cookie"] = v.split(";")[0];
        }
      });
    }

    return res;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

async function _upload(buffer: Buffer, fileName = "image.jpg") {
  const form = new FormData();
  form.append("files", buffer, {
    filename: fileName,
    contentType: "image/jpeg",
  });

  const res = await _req({
    url: UPLOAD,
    method: "POST",
    data: form,
    head: {
      ...headersList,
      ...form.getHeaders(),
    },
  });

  return res.data;
}

async function _getTicket(data: any, prompt: string) {
  const payload = {
    "type": "colorize_v2",
    "fnKey": data.results[0].sourceKey,
    "w": data.results[0].w,
    "h": data.results[0].h,
    "prompt": prompt,
    "tries": 0,
    "seq": 0,
    "dpi": data.results[0].dpi,
  };

  const res = await _req({
    url: TICKET,
    method: "POST",
    data: payload,
    head: headersList,
  });

  return res.data;
}

async function _lookup(id: string) {
  const payload = {
    "keyOrUrl": id,
    "mode": 3,
    "r": 1.5,
    "forceH": 0,
  };

  let res = await _req({
    url: LOOKUP,
    method: "POST",
    data: payload,
    head: headersList,
  });

  return res.data;
}

function _task(ticket: string) {
  let results: string[] = [];
  return new Promise<string>(async (resolve, reject) => {
    try {
      const res = await _req({
        url: TICKET,
        method: "GET",
        params: {
          ticket,
        },
        response: "stream",
        head: headersList,
      });

      res.data.on("data", (data: Buffer) => {
        results.push(data.toString());
      });
      res.data.on("end", () => {
        resolve(results.pop() as string);
      });
      res.data.on("error", (error: Error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function ColorizeImageFromUrl(imageUrl: string, prompt: string) {
  const kb = await _req({
    url: imageUrl,
    method: "GET",
    response: "arraybuffer",
    head: "ori",
  });
  const buffer = Buffer.from(kb.data);
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Unsupported file type, only images are allowed.");
  }
  const fileName = `image.${fileType.ext}`;

  const upload = await _upload(buffer, fileName);
  const ticket = await _getTicket(upload, prompt);
  const task = await _task(ticket.ticket);
  const jTask = JSON.parse(task);
  const lookup2 = await _lookup(jTask.outputKey);

  if (!lookup2 || !lookup2.imgUrl) {
    throw new Error("Failed to get result image URL.");
  }

  return {
    prompt: jTask.prompt,
    outputKey: jTask.outputKey,
    buffer: Buffer.from(lookup2.imgUrl.replace("data:image/webp;base64,", ""), "base64"),
  };
}

async function ColorizeImageFromFile(imageBuffer: Buffer, prompt: string, fileName = "image.jpg") {
  const fileType = await fileTypeFromBuffer(imageBuffer);
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Unsupported file type, only images are allowed.");
  }
  const finalFileName = fileName || `image.${fileType.ext}`;

  const upload = await _upload(imageBuffer, finalFileName);
  const ticket = await _getTicket(upload, prompt);
  const task = await _task(ticket.ticket);
  const jTask = JSON.parse(task);
  const lookup2 = await _lookup(jTask.outputKey);

  if (!lookup2 || !lookup2.imgUrl) {
    throw new Error("Failed to get result image URL.");
  }

  return {
    prompt: jTask.prompt,
    outputKey: jTask.outputKey,
    buffer: Buffer.from(lookup2.imgUrl.replace("data:image/webp;base64,", ""), "base64"),
  };
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/colorize",
    name: "colorize",
    category: "Tools",
    description: "This API endpoint colorizes a grayscale image using a provided URL. Users can submit the URL of a grayscale image, and the API will process it to add color, returning the colorized image as a WebP buffer. This tool is ideal for restoring old photos or enhancing black and white images with realistic colors.",
    tags: ["TOOLS", "IMAGE", "COLORIZE", "PHOTO-EDITING"],
    example: "?url=https://files.catbox.moe/258vhm.jpg",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "The URL of the grayscale image to colorize.",
        example: "https://files.catbox.moe/258vhm.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { url } = req.query || {};

      if (!url) {
        return {
          status: false,
          error: "Parameter 'url' is required.",
          code: 400,
        };
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'url' must be a non-empty string.",
          code: 400,
        };
      }

      try {
        new URL(url.trim());

        const result = await ColorizeImageFromUrl(url.trim(), "colorize image");

        return createImageResponse(result.buffer);
      } catch (error: any) {
        console.error("Error:", error);
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/colorize",
    name: "colorize",
    category: "Tools",
    description: "This API endpoint colorizes a grayscale image from an uploaded file. Users can send a grayscale image file via multipart/form-data, and the API will process it to add color, returning the colorized image as a WebP buffer. This method is suitable for direct image uploads, enabling users to enhance black and white images with realistic colors.",
    tags: ["TOOLS", "IMAGE", "COLORIZE", "PHOTO-EDITING"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["image"],
            properties: {
              image: {
                type: "string",
                format: "binary",
                description: "The grayscale image file to colorize.",
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, guf }) {
      try {
        const { file, type, isImage, isValid, size, name } = await guf(
          req,
          "image",
        );

        if (!file) {
          return {
            status: false,
            error: "File 'image' is required in multipart/form-data.",
            code: 400,
          };
        }

        if (!isValid) {
          return {
            status: false,
            error: `Invalid file: ${name}. Size must be between 1 byte and 10MB`,
            code: 400,
          };
        }

        if (!isImage) {
          return {
            status: false,
            error: `Invalid file type: ${type}. Only image files are supported.`,
            code: 400,
          };
        }

        const result = await ColorizeImageFromFile(file, "colorize image", name);

        return createImageResponse(result.buffer);
      } catch (error: any) {
        console.error("Error:", error);
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
];