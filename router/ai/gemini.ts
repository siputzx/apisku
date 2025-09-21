import axios from "axios";
import { Buffer } from "buffer";
import { URL } from "url";
import path from "path";

declare const proxy: () => string | null;

class GeminiAPI {
  config: {
    cookie: string;
    systemPrompt: string;
    debug: boolean;
  };
  initialUrl: string;
  streamUrl: string;
  uploadUrl: string;
  headers: { [key: string]: string };
  wizData: any;

  constructor(config: { cookie: string; systemPrompt?: string; debug?: boolean }) {
    if (!config.cookie) throw new Error("Cookie required")
    this.config = {
      cookie: "__Secure-1PSID=" + config.cookie,
      systemPrompt: config.systemPrompt || "",
      debug: config.debug || false,
    }
    this.initialUrl = "https://gemini.google.com"
    this.streamUrl = "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate"
    this.uploadUrl = "https://push.clients6.google.com/upload/"
    this.headers = {
      accept: "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-model": "\"itel S665L\"",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua-platform-version": "\"12.0.0\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-client-data": "COXZygE=",
      "x-goog-ext-525001261-jspb": "[1]",
      "x-same-domain": "1",
      cookie: this.config.cookie,
      Referer: "https://gemini.google.com/",
      "Referrer-Policy": "origin",
    }
    this.wizData = null
  }

  log(message: string) {
    if (this.config.debug) console.log(`\x1b[36m[GeminiAPI]\x1b[0m \x1b[35m${message}\x1b[0m`)
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  private async downloadFile(url: string): Promise<{ buffer: Buffer; fileName: string }> {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const urlObj = new URL(url);
    let fileName = path.basename(urlObj.pathname);
    
    if (!fileName || !path.extname(fileName)) {
      const contentType = response.headers['content-type'];
      fileName = `file_${Date.now()}${this.getExtFromMime(contentType)}`;
    }

    return {
      buffer: Buffer.from(response.data),
      fileName
    };
  }

  private getExtFromMime(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'application/pdf': '.pdf'
    };
    return mimeMap[mimeType] || '.bin';
  }

  private detectFileSignature(buffer: Buffer): { mimeType: string; fileType: string; ext: string } | null {
    const signatures = [
      { bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', type: 'image', ext: '.jpg' },
      { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mime: 'image/png', type: 'image', ext: '.png' },
      { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mime: 'image/gif', type: 'image', ext: '.gif' },
      { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mime: 'image/gif', type: 'image', ext: '.gif' },
      { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', type: 'image', ext: '.webp' },
      { bytes: [0x42, 0x4D], mime: 'image/bmp', type: 'image', ext: '.bmp' },
      
      { bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', type: 'video', ext: '.mp4' },
      { bytes: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', type: 'video', ext: '.mp4' },
      { bytes: [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', type: 'video', ext: '.mp4' },
      { bytes: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', type: 'video', ext: '.mp4' },
      { bytes: [0x66, 0x74, 0x79, 0x70], mime: 'video/mp4', type: 'video', ext: '.mp4', offset: 4 },
      { bytes: [0x1A, 0x45, 0xDF, 0xA3], mime: 'video/x-matroska', type: 'video', ext: '.mkv' },
      { bytes: [0x00, 0x00, 0x01, 0xBA], mime: 'video/mpeg', type: 'video', ext: '.mpg' },
      { bytes: [0x00, 0x00, 0x01, 0xB3], mime: 'video/mpeg', type: 'video', ext: '.mpg' },
      { bytes: [0x46, 0x4C, 0x56, 0x01], mime: 'video/x-flv', type: 'video', ext: '.flv' },
      { bytes: [0x1A, 0x45, 0xDF, 0xA3, 0x93, 0x42, 0x82, 0x88, 0x77, 0x65, 0x62, 0x6D], mime: 'video/webm', type: 'video', ext: '.webm' },
      
      { bytes: [0xFF, 0xFB], mime: 'audio/mpeg', type: 'audio', ext: '.mp3' },
      { bytes: [0xFF, 0xF3], mime: 'audio/mpeg', type: 'audio', ext: '.mp3' },
      { bytes: [0xFF, 0xF2], mime: 'audio/mpeg', type: 'audio', ext: '.mp3' },
      { bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', type: 'audio', ext: '.mp3' },
      { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'audio/wav', type: 'audio', ext: '.wav' },
      { bytes: [0x66, 0x4C, 0x61, 0x43], mime: 'audio/flac', type: 'audio', ext: '.flac' },
      { bytes: [0x4F, 0x67, 0x67, 0x53], mime: 'audio/ogg', type: 'audio', ext: '.ogg' },
      
      { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', type: 'document', ext: '.pdf' },
      { bytes: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip', type: 'archive', ext: '.zip' },
      { bytes: [0x50, 0x4B, 0x05, 0x06], mime: 'application/zip', type: 'archive', ext: '.zip' },
      { bytes: [0x50, 0x4B, 0x07, 0x08], mime: 'application/zip', type: 'archive', ext: '.zip' },
      { bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], mime: 'application/x-rar-compressed', type: 'archive', ext: '.rar' },
      { bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], mime: 'application/x-7z-compressed', type: 'archive', ext: '.7z' },
    ];

    for (const sig of signatures) {
      const offset = sig.offset || 0;
      if (buffer.length >= offset + sig.bytes.length) {
        const matches = sig.bytes.every((byte, index) => buffer[offset + index] === byte);
        if (matches) {
          return { mimeType: sig.mime, fileType: sig.type, ext: sig.ext };
        }
      }
    }

    if (buffer.length >= 12) {
      const ftypCheck = buffer.subarray(4, 8).toString('ascii');
      if (ftypCheck === 'ftyp') {
        const brand = buffer.subarray(8, 12).toString('ascii');
        if (['isom', 'mp41', 'mp42', 'avc1', 'iso2', 'iso4', 'iso5', 'iso6', 'mmp4', 'mp71'].includes(brand)) {
          return { mimeType: 'video/mp4', fileType: 'video', ext: '.mp4' };
        }
      }
    }

    return null;
  }

  private detectFileTypeAndMime(fileName: string, buffer?: Buffer): { mimeType: string; fileType: string } {
    const ext = path.extname(fileName).toLowerCase();
    
    this.log(`🔍 DEBUG: fileName = ${fileName}, extension = ${ext}`);
    
    if (buffer) {
      const signature = this.detectFileSignature(buffer);
      if (signature) {
        this.log(`🔍 DEBUG: Detected from signature - fileType = ${signature.fileType}, mimeType = ${signature.mimeType}, ext = ${signature.ext}`);
        return { mimeType: signature.mimeType, fileType: signature.fileType };
      }
    }
    
    let mimeType = "application/octet-stream";
    let fileType = "unknown";
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.tif'].includes(ext)) {
      fileType = "image";
      switch(ext) {
        case '.jpg':
        case '.jpeg':
          mimeType = "image/jpeg";
          break;
        case '.png':
          mimeType = "image/png";
          break;
        case '.gif':
          mimeType = "image/gif";
          break;
        case '.webp':
          mimeType = "image/webp";
          break;
        case '.bmp':
          mimeType = "image/bmp";
          break;
        case '.svg':
          mimeType = "image/svg+xml";
          break;
        default:
          mimeType = "image/png";
      }
    }
    else if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mpg', '.mpeg'].includes(ext)) {
      fileType = "video";
      switch(ext) {
        case '.mp4':
          mimeType = "video/mp4";
          break;
        case '.avi':
          mimeType = "video/x-msvideo";
          break;
        case '.mkv':
          mimeType = "video/x-matroska";
          break;
        case '.mov':
          mimeType = "video/quicktime";
          break;
        case '.webm':
          mimeType = "video/webm";
          break;
        default:
          mimeType = "video/mp4";
      }
    }
    else if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.amr'].includes(ext)) {
      fileType = "audio";
      switch(ext) {
        case '.mp3':
          mimeType = "audio/mpeg";
          break;
        case '.wav':
          mimeType = "audio/wav";
          break;
        case '.flac':
          mimeType = "audio/flac";
          break;
        case '.aac':
          mimeType = "audio/aac";
          break;
        case '.ogg':
          mimeType = "audio/ogg";
          break;
        case '.m4a':
          mimeType = "audio/mp4";
          break;
        default:
          mimeType = "audio/mpeg";
      }
    }
    else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'].includes(ext)) {
      fileType = "document";
      switch(ext) {
        case '.pdf':
          mimeType = "application/pdf";
          break;
        case '.doc':
        case '.docx':
          mimeType = "application/msword";
          break;
        case '.xls':
        case '.xlsx':
          mimeType = "application/vnd.ms-excel";
          break;
        case '.ppt':
        case '.pptx':
          mimeType = "application/vnd.ms-powerpoint";
          break;
        case '.txt':
          mimeType = "text/plain";
          break;
        default:
          mimeType = "application/pdf";
      }
    }
    else if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      fileType = "archive";
      switch(ext) {
        case '.zip':
          mimeType = "application/zip";
          break;
        case '.rar':
          mimeType = "application/x-rar-compressed";
          break;
        case '.7z':
          mimeType = "application/x-7z-compressed";
          break;
        default:
          mimeType = "application/zip";
      }
    }
    
    this.log(`🔍 DEBUG: Final detected fileType = ${fileType}, mimeType = ${mimeType}`);
    return { mimeType, fileType };
  }

  async fetchWizData() {
    this.log("🚀 Starting initialization...")
    this.log("🔒 Fetching WIZ data...")
    try {
      const response = await axios.get(this.initialUrl, { headers: this.headers })
      const wizRegex = /window\.WIZ_global_data\s*=\s*({[\s\S]*?});/
      const match = response.data.match(wizRegex)
      this.wizData = match ? JSON.parse(match[1]) : null
      this.log(this.wizData ? "✅ WIZ data fetched successfully" : "❌ Failed to fetch WIZ data")
    } catch (error: any) {
      this.log(`❌ Error fetching WIZ data: ${error.message}`)
      this.wizData = null
    }
    return this.wizData
  }

  async uploadImage(fileName: string, fileBuffer: Buffer): Promise<string> {
    this.log("📤 Preparing to upload file...")
    if (!this.wizData) await this.fetchWizData()
    if (!this.wizData) {
      this.log("❌ No WIZ data available")
      return "Error: No WIZ data"
    }

    const fileSize = fileBuffer.byteLength
    const uploadHeaders = {
      ...this.headers,
      authority: "push.clients6.google.com",
      "sec-fetch-site": "same-site",
      "push-id": this.wizData.qKIAYe,
      origin: "https://gemini.google.com/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "x-client-pctx": this.wizData.Ylro7b,
      "x-goog-upload-command": "start",
      "x-goog-upload-header-content-length": fileSize.toString(),
      "x-goog-upload-protocol": "resumable",
      "x-tenant-id": "bard-storage",
    }

    try {
      this.log("🌐 Sending initial upload request...")
      const startResponse = await axios.post(this.uploadUrl, `File name: ${fileName}`, { headers: uploadHeaders })
      const uploadUrl = startResponse.headers["x-goog-upload-url"] as string
      if (!uploadUrl) {
        this.log("❌ No upload URL received")
        return "Error: No upload URL"
      }

      const uploadFileHeaders = {
        ...uploadHeaders,
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        "x-goog-upload-command": "upload, finalize",
        "x-goog-upload-offset": "0",
      }

      this.log("📦 Uploading file...")
      const uploadResponse = await axios.post(uploadUrl, fileBuffer, { headers: uploadFileHeaders })
      this.log("✅ File uploaded successfully")
      return uploadResponse.data || uploadUrl.split("/").pop()!
    } catch (error: any) {
      this.log(`❌ File upload failed: ${error.message}`)
      return `Error: ${error.message}`
    }
  }

  async fetchImageUrl(rawImageUrl: string): Promise<string | null> {
    this.log("📸 Fetching real image URL...")
    const imageHeaders = {
      authority: new URL(rawImageUrl).hostname,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-model": "\"itel S665L\"",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-ch-ua-platform-version": "\"12.0.0\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "x-client-data": "COXZygE=",
    }

    try {
      const firstResponse = await axios.get(rawImageUrl, {
        headers: imageHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
      })
      const redirectUrl = firstResponse.headers.location as string
      if (!redirectUrl) {
        this.log("❌ No redirect URL found")
        return null
      }

      const secondHeaders = {
        authority: new URL(redirectUrl).hostname,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        cookie: this.config.cookie,
        "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "x-client-data": "COXZygE=",
      }

      const secondResponse = await axios.get(redirectUrl, {
        headers: secondHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status === 302,
      })
      const finalUrl = secondResponse.headers.location as string
      if (!finalUrl) {
        this.log("❌ No final URL found")
        return null
      }
      return finalUrl
    } catch (error: any) {
      this.log(`❌ Error fetching image URL: ${error.message}`)
      return null
    }
  }

  async query(query: string, options: {
    file?: string | Buffer;
    conversationID?: string | null;
    responseID?: string | null;
    choiceID?: string | null;
  } = {}) {
    if (!query) throw new Error("Query required")
    this.log(`💬 Processing query: \x1b[31m${query}\x1b[0m`)
    if (!this.wizData) await this.fetchWizData()
    if (!this.wizData) {
      this.log("❌ No WIZ data available")
      return { aiResponse: "Error: No WIZ data", conversationID: null, responseID: null, choiceID: null }
    }

    const { file, conversationID, responseID, choiceID } = options
    const params = {
      bl: this.wizData.cfb2h,
      "f.sid": this.wizData.FdrFJe,
      hl: "id",
      _reqid: Math.floor(Math.random() * 9000000 + 1000000).toString(),
      rt: "c",
    }

    const messageStruct: any[] = [
      [query, 0, null, null, null, null, 0],
      ["id"],
      [conversationID || "", responseID || "", choiceID || "", null, null, null, null, null, null, ""],
      null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 1, null, null, null, null, null,
      ["", "", this.config.systemPrompt || "", null, null, null, null, null, 0, null, 1, null, null, null, []],
      null, null, 1, null, null, null, null, null, null, null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 1, null, null, null, null, [1],
    ]

    if (file) {
      let fileBuffer: Buffer;
      let fileName: string;

      if (Buffer.isBuffer(file)) {
        fileBuffer = file;
        const signature = this.detectFileSignature(fileBuffer);
        fileName = signature ? `file_${Date.now()}${signature.ext}` : `file_${Date.now()}.bin`;
      } else if (this.isUrl(file)) {
        const downloaded = await this.downloadFile(file);
        fileBuffer = downloaded.buffer;
        fileName = downloaded.fileName;
      } else {
        return { aiResponse: "Error: File not found", conversationID: null, responseID: null, choiceID: null }
      }

      const { mimeType, fileType } = this.detectFileTypeAndMime(fileName, fileBuffer);
      
      this.log(`📁 Processing ${fileType} file: ${fileName} (${mimeType})`)
      const fileLocation = await this.uploadImage(fileName, fileBuffer)
      if (fileLocation.includes("Error")) {
        this.log("❌ File upload failed")
        return { aiResponse: fileLocation, conversationID: null, responseID: null, choiceID: null }
      }
      
      const filePayload = [[[fileLocation, 0, null, mimeType], fileName, null, null, null, null, null, null, [0]]];
      messageStruct[0][3] = filePayload;
      
      this.log("✅ File location added to message structure")
    }

    this.log("🌐 Sending query to Gemini API...")
    const data = {
      "f.req": JSON.stringify([null, JSON.stringify(messageStruct)]),
      at: this.wizData.SNlM0e,
    }

    let response: any
    try {
      response = await axios.post(this.streamUrl, new URLSearchParams(data).toString(), { headers: this.headers, params, responseType: 'stream'})
    } catch (error: any) {
      this.log(`❌ Error sending query to Gemini: ${error.message}`)
      throw new Error(`Error sending query to Gemini: ${error.message}`)
    }
    
    const stream = response.data; 
    
    let fullText = "";
    stream.on('data', chunk => {
      fullText += chunk.toString();
    });
    
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    const lines = fullText.split("\n");
    let messageText = "", newConversationID: string | null = null, newResponseID: string | null = null, newChoiceID: string | null = null, rawImageUrl: string | null = null, youtubeUrl: string | null = null, ImageSearch: string | null = null

    this.log("📑 Parsing API response...")
    for (const line of lines) {
      if (!line.startsWith("[[\"wrb.fr\"")) continue
      try {
        const parsedLineMatch = line.match(/\[\["wrb\.fr".*\]\]/)
        if (!parsedLineMatch) continue

        const parsedLine = JSON.parse(parsedLineMatch[0])

        if (parsedLine[0]?.[2]) {
          const parsedChat = JSON.parse(parsedLine[0][2])

          if (parsedChat[4]?.[0]?.[1]?.[0] && parsedChat[4][0][1][0].length > messageText.length) {
            messageText = parsedChat[4][0][1][0]
          }
          if (parsedChat[1]?.length >= 2) {
            newConversationID = parsedChat[1][0]
            newResponseID = parsedChat[1][1]
          }
          if (parsedChat[4]?.[0]?.[0]) {
            newChoiceID = parsedChat[4][0][0]
          }
          if (parsedChat[4]?.[0]?.[12]?.[7]?.[0]?.[0]?.[0]?.[3]?.[3]) {
            rawImageUrl = parsedChat[4][0][12][7][0][0][0][3][3]
          }
          if (parsedChat[4]?.[0]?.[12]?.[1]?.[0]?.[0]?.[0]?.[0]) {
            ImageSearch = parsedChat[4][0][12][1][0][0][0][0]
          }
          if (parsedChat[4]?.[0]?.[12]?.[34]?.[0]?.[1]?.[105]?.[1]?.[0]?.[4]) {
            const url = parsedChat[4][0][12][34][0][1][105][1][0][4]
            if (url.includes("youtube.com") || url.includes("music.youtube.com")) {
              youtubeUrl = url
            }
          }
        }
      } catch (e: any) {
        this.log(`❌ Error parsing line: ${e.message}`)
        continue
      }
    }

    if (messageText) {
      messageText = messageText
        .replace(/http:\/\/googleusercontent\.com\/actioncardcontent\/0/g, "")
        .replace(/http:\/\/googleusercontent\.com\/actioncardcontent\/0/g, "")
        .replace(/http:\/\/googleusercontent\.com\/imagecollection\/imageretrieval\/\d+/g, "")
        .trim()
    }

    this.log(messageText ? "✅ Query processing completed" : "❌ No response data received")
    const result: {
      aiResponse: string;
      conversationID: string | null;
      responseID: string | null;
      choiceID: string | null;
      addition?: {
        generateImage?: string;
        play?: string;
        img?: string;
      };
    } = {
      aiResponse: messageText || "Error: No response data",
      conversationID: newConversationID,
      responseID: newResponseID,
      choiceID: newChoiceID,
    }

    const addition: {
      generateImage?: string;
      play?: string;
      img?: string;
    } = {}

    if (rawImageUrl) {
      const finalImageUrl = await this.fetchImageUrl(rawImageUrl)
      if (finalImageUrl) {
        addition.generateImage = finalImageUrl
      } else {
        this.log("❌ Failed to fetch final image URL")
      }
    }

    if (youtubeUrl) {
      addition.play = youtubeUrl
    }

    if (ImageSearch) {
      addition.img = ImageSearch
    }

    if (Object.keys(addition).length > 0) {
      result.addition = addition
    }

    return result
  }
}

async function scrape(text: string, cookie: string, options: {
  promptSystem?: string;
  imageUrl?: string | null;
  conversationID?: string | null;
  responseID?: string | null;
  choiceID?: string | null;
} = {}) {
  const {
    promptSystem = "",
    imageUrl = null,
    conversationID = null,
    responseID = null,
    choiceID = null,
  } = options

  const gemini = new GeminiAPI({
    cookie,
    systemPrompt: promptSystem,
    debug: false,
  })

  let file: string | Buffer | undefined

  if (imageUrl) {
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
      file = Buffer.from(imageResponse.data)
    } catch (error: any) {
      console.error("Error fetching image:", error.message)
      throw new Error("Failed to fetch image from URL")
    }
  }

  const queryOptions = {
    file,
    conversationID,
    responseID,
    choiceID,
  }

  const result = await gemini.query(text, queryOptions)

  if (!result.aiResponse || result.aiResponse.includes("Error")) {
    throw new Error(result.aiResponse || "No response from API")
  }

  return {
    response: result.aiResponse,
    addition: result.addition || {},
    conversationID: result.conversationID,
    responseID: result.responseID,
    choiceID: result.choiceID,
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/gemini",
    name: "gemini [ BETA ]",
    category: "AI",
    description: "This API endpoint provides a BETA version interface to interact with the Gemini AI model using GET requests. Users can send text prompts, along with optional system prompts, image URLs, and conversation context (conversationID, responseID, choiceID) to maintain continuity in dialogue. A valid Google Gemini authentication cookie is required for access. This endpoint is designed for experimental use and can be utilized for advanced AI interactions, including multimodal inputs (text and image) and stateful conversations. The response includes the AI's answer and additional metadata for conversation tracking and potential multimedia outputs.",
    tags: ["AI", "Gemini", "BETA", "Multimodal AI", "Conversational AI"],
    example: "?text=What is the capital of France?&cookie=g.a000xgjZzrQfaZEtfrx6RTCW0Q2eNdm21jCoqu6_6gbIG_5BW1UqEWHMHU14F9OS04MFWXsY7gACgYKAYQSARESFQHGX2MidwdmCRTP1XVih97lZJXIcBoVAUF8yKrcN4up_gHiXrkm5wXkr5eG0076&promptSystem=You are a helpful assistant.",
    parameters: [
      {
        name: "text",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "The text content to process with Gemini",
        example: "Explain quantum physics simply.",
      },
      {
        name: "cookie",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 10,
          maxLength: 1000,
        },
        description: "Authentication cookie for Gemini API",
        example: "",
      },
      {
        name: "promptSystem",
        in: "query",
        required: false,
        schema: {
          type: "string",
          maxLength: 1000,
        },
        description: "Optional system prompt for the AI to guide its behavior",
        example: "Act as a professional physicist.",
      },
      {
        name: "imageUrl",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "url",
          maxLength: 500,
        },
        description: "Optional URL of an image to process with the text prompt",
        example: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Quantum_mechanics_model.svg/1200px-Quantum_mechanics_model.svg.png",
      },
      {
        name: "conversationID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional conversation ID to continue a previous dialogue",
        example: "",
      },
      {
        name: "responseID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional response ID from a previous Gemini response",
        example: "",
      },
      {
        name: "choiceID",
        in: "header",
        required: false,
        schema: {
          type: "string",
        },
        description: "Optional choice ID from a previous Gemini response",
        example: "",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { text, cookie, promptSystem, imageUrl } = req.query || {}
      const { conversationID, responseID, choiceID } = req.headers || {}

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return {
          status: false,
          error: "Text parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      if (!cookie || typeof cookie !== "string" || cookie.trim().length === 0) {
        return {
          status: false,
          error: "Cookie parameter is required and must be a non-empty string",
          code: 400,
        }
      }

      const options: {
        promptSystem?: string;
        imageUrl?: string;
        conversationID?: string;
        responseID?: string;
        choiceID?: string;
      } = {}

      if (promptSystem && typeof promptSystem === "string") {
        options.promptSystem = promptSystem.trim()
      }
      if (imageUrl && typeof imageUrl === "string") {
        options.imageUrl = imageUrl.trim()
      }
      if (conversationID && typeof conversationID === "string") {
        options.conversationID = conversationID.trim()
      }
      if (responseID && typeof responseID === "string") {
        options.responseID = responseID.trim()
      }
      if (choiceID && typeof choiceID === "string") {
        options.choiceID = choiceID.trim()
      }

      try {
        const result = await scrape(text.trim(), cookie.trim(), options)

        const headersToSend: { [key: string]: string } = {}
        if (result.conversationID) headersToSend["conversationID"] = result.conversationID
        if (result.responseID) headersToSend["responseID"] = result.responseID
        if (result.choiceID) headersToSend["choiceID"] = result.choiceID

        return {
          status: true,
          data: {
            response: result.response,
            addition: result.addition || {},
          },
          headers: headersToSend,
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
    endpoint: "/api/ai/gemini",
    name: "gemini [ BETA ]",
    category: "AI",
    description: "This API endpoint offers a BETA version interface to interact with the Gemini AI model using POST requests with file upload support. Users can send text prompts along with optional file uploads (images, videos, audio, documents), system prompts, and conversation context (conversationID, responseID, choiceID) via multipart/form-data. A valid Google Gemini authentication cookie is required. This endpoint supports multimodal AI interactions with direct file uploads and stateful conversations, making it ideal for complex applications requiring rich AI capabilities with media processing.",
    tags: ["AI", "Gemini", "BETA", "Multimodal AI", "Conversational AI", "File Upload"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["content", "cookie"],
            properties: {
              content: {
                type: "string",
                description: "The text content to process with Gemini",
                example: "Describe what you see in this image.",
                minLength: 1,
                maxLength: 2000,
              },
              cookie: {
                type: "string",
                description: "Authentication cookie for Gemini API",
                example: "",
                minLength: 10,
                maxLength: 1000,
              },
              promptSystem: {
                type: "string",
                description: "Optional system prompt for the AI to guide its behavior",
                example: "You are a helpful image analyst.",
                maxLength: 1000,
              },
              file: {
                type: "string",
                format: "binary",
                description: "Optional file to process with the text prompt (images, videos, audio, documents)",
              },
              conversationID: {
                type: "string",
                description: "Optional conversation ID to continue a previous dialogue",
                example: "",
              },
              responseID: {
                type: "string",
                description: "Optional response ID from a previous Gemini response",
                example: "",
              },
              choiceID: {
                type: "string",
                description: "Optional choice ID from a previous Gemini response",
                example: "",
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
    async run({ req, guf }) {
      try {
        // Parse form data untuk text fields
        const formData = req.body || {};
        const { content: text, cookie, promptSystem, conversationID, responseID, choiceID } = formData;

        if (!text || typeof text !== "string" || text.trim().length === 0) {
          return {
            status: false,
            error: "Content parameter is required and must be a non-empty string",
            code: 400,
          }
        }

        if (!cookie || typeof cookie !== "string" || cookie.trim().length === 0) {
          return {
            status: false,
            error: "Cookie parameter is required and must be a non-empty string",
            code: 400,
          }
        }

        // Handle file upload dengan guf
        let fileBuffer: Buffer | undefined;
        if (guf) {
          const { file, type, isValid, size, name } = await guf(req, "file");
          
          if (file && !isValid) {
            return {
              status: false,
              error: `Invalid file: ${name}. Size must be between 1 byte and 50MB`,
              code: 400,
            };
          }

          if (file) {
            fileBuffer = file;
          }
        }

        const gemini = new GeminiAPI({
          cookie,
          systemPrompt: promptSystem || "",
          debug: false,
        });

        const queryOptions = {
          file: fileBuffer,
          conversationID: conversationID || null,
          responseID: responseID || null,
          choiceID: choiceID || null,
        };

        const result = await gemini.query(text.trim(), queryOptions);

        if (!result.aiResponse || result.aiResponse.includes("Error")) {
          throw new Error(result.aiResponse || "No response from API");
        }

        const headersToSend: { [key: string]: string } = {};
        if (result.conversationID) headersToSend["conversationID"] = result.conversationID;
        if (result.responseID) headersToSend["responseID"] = result.responseID;
        if (result.choiceID) headersToSend["choiceID"] = result.choiceID;

        return {
          status: true,
          data: {
            response: result.aiResponse,
            addition: result.addition || {},
          },
          headers: headersToSend,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        };
      }
    },
  },
]
