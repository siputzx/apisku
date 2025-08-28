import axios from "axios"
import * as cheerio from "cheerio"
import * as https from "node:https"
import FormData from "form-data"
import * as crypto from "node:crypto"
import {  fileTypeFromBuffer  } from "file-type"
import UserAgent from "user-agents"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: Record<string, string> = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

const SECRET_KEY = "HBmQJoIurA0HVLyUaCiFlxF+JJc14eHmZNttilecFGQ="

const BASE = "https://dewatermark.ai/id/upload"
const ERASE = "https://api.dewatermark.ai/api/object_removal/v5/erase_watermark"
const INSTALL = "https://firebaseinstallations.googleapis.com/v1/projects/dewatermark-be991/installations"

const data = [
  {
    agent: `fire-core/0.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 13)} fire-core-esm2017/0.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 13)} fire-js/ fire-auth/0.${Math.floor(Math.random() * 23)}.${Math.floor(Math.random() * 2)} fire-auth-esm2017/0.${Math.floor(Math.random() * 23)}.${Math.floor(Math.random() * 2)} fire-js-all-app/${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 23)}.0 fire-iid/0.${Math.floor(Math.random() * 6)}.${Math.floor(Math.random() * 4)} fire-iid-esm2017/0.${Math.floor(Math.random() * 6)}.${Math.floor(Math.random() * 4)} fire-rc/0.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 4)} fire-rc-esm2017/0.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 4)}`,
    date: new Date().toISOString().substring(0, 10),
  },
]

const agent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false,
})

const userAgent = new UserAgent()
const ua = userAgent.random().toString()

let headersListFirebase = {
  authority: "firebaseinstallations.googleapis.com",
  accept: "application/json",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "id-ID,id;q=0.9",
  "cache-control": "no-cache",
  "content-type": "application/json",
  origin: "https://dewatermark.ai",
  pragma: "no-cache",
  priority: "u=1, i",
  referer: "https://dewatermark.ai/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "cross-site",
  "user-agent": ua,
}

let headersListEErase = {
  authority: "api.dewatermark.ai",
  accept: "application/json",
  "accept-language": "id-ID,id;q=0.9",
  "cache-control": "no-cache",
  origin: "https://dewatermark.ai",
  pragma: "no-cache",
  priority: "u=1, i",
  referer: "https://dewatermark.ai/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "x-api-mode": "AUTO",
  "x-service": "REMOVE_WATERMARK",
  "Content-Type": "application/json",
  "user-agent": ua,
}

const REG_KEY = /apiKey:\s?['"](\w+)['"],?/i
const REG_PATH = /<script\s?src\=['"](\/_next\/static\/chunks\/pages\/_\w+-\w+\.js)['"]\s?defer\=['"]+\s?crossorigin\=['"]+><\/script>/i

let v2793 = {
  byteToCharMap_: null as Record<number, string> | null,
  charToByteMap_: null as Record<string, number> | null,
  byteToCharMapWebSafe_: null as Record<number, string> | null,
  charToByteMapWebSafe_: null as Record<string, number> | null,
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/="
  },
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_."
  },
  HAS_NATIVE_SUPPORT: typeof atob == "function",
  encodeByteArray(p3157: number[], p3158: boolean) {
    if (!Array.isArray(p3157)) {
      throw Error("encodeByteArray takes an array as a parameter")
    }
    this.init_()
    let v2794 = p3158 ? (this.byteToCharMapWebSafe_ as Record<number, string>) : (this.byteToCharMap_ as Record<number, string>)
    let v2795: string[] = []
    for (let v2796 = 0; v2796 < p3157.length; v2796 += 3) {
      let v2797 = p3157[v2796]
      let v2798 = v2796 + 1 < p3157.length
      let v2799 = v2798 ? p3157[v2796 + 1] : 0
      let v2800 = v2796 + 2 < p3157.length
      let v2801 = v2800 ? p3157[v2796 + 2] : 0
      let v2802 = v2797 >> 2
      let v2803 = ((v2797 & 3) << 4) | (v2799 >> 4)
      let v2804 = ((v2799 & 15) << 2) | (v2801 >> 6)
      let v2805 = v2801 & 63
      if (!v2800) {
        v2805 = 64
        if (!v2798) {
          v2804 = 64
        }
      }
      v2795.push(v2794[v2802], v2794[v2803], v2794[v2804], v2794[v2805])
    }
    return v2795.join("")
  },
  encodeString(p3159: string, p3160: boolean) {
    if (this.HAS_NATIVE_SUPPORT && !p3160) {
      return btoa(p3159)
    } else {
      return this.encodeByteArray(vF200(p3159), p3160)
    }
  },
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {}
      this.charToByteMap_ = {}
      this.byteToCharMapWebSafe_ = {}
      this.charToByteMapWebSafe_ = {}
      for (let v2819 = 0; v2819 < this.ENCODED_VALS.length; v2819++) {
        this.byteToCharMap_[v2819] = this.ENCODED_VALS.charAt(v2819)
        this.charToByteMap_[this.byteToCharMap_[v2819]] = v2819
        this.byteToCharMapWebSafe_[v2819] = this.ENCODED_VALS_WEBSAFE.charAt(v2819)
        this.charToByteMapWebSafe_[this.charToByteMapWebSafe_[v2819]] = v2819
        if (v2819 >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(v2819)] = v2819
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(v2819)] = v2819
        }
      }
    }
  },
}

let vF200 = function (p3155: string) {
  let v2778: number[] = []
  let v2779 = 0
  for (let v2780 = 0; v2780 < p3155.length; v2780++) {
    let v2781 = p3155.charCodeAt(v2780)
    if (v2781 < 128) {
      v2778[v2779++] = v2781
    } else {
      if (v2781 < 2048) {
        v2778[v2779++] = (v2781 >> 6) | 192
      } else {
        if ((v2781 & 64512) == 55296 && v2780 + 1 < p3155.length && (p3155.charCodeAt(v2780 + 1) & 64512) == 56320) {
          v2781 = 65536 + ((v2781 & 1023) << 10) + (p3155.charCodeAt(++v2780) & 1023)
          v2778[v2779++] = (v2781 >> 18) | 240
          v2778[v2779++] = ((v2781 >> 12) & 63) | 128
        } else {
          v2778[v2779++] = (v2781 >> 12) | 224
        }
        v2778[v2779++] = ((v2781 >> 6) & 63) | 128
      }
      v2778[v2779++] = (v2781 & 63) | 128
    }
  }
  return v2778
}

let vF202 = function (p3165: string) {
  let vVF200 = vF200(p3165)
  return v2793.encodeByteArray(vVF200, true)
}
let vF203 = function (p3166: string) {
  return vF202(p3166).replace(/\./g, "")
}

function f505(p3321: { agent: string; dates: string[] }[]) {
  return vF203(
    JSON.stringify({
      version: 2,
      heartbeats: p3321,
    }),
  ).length
}

function _randomChar(length: number) {
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length })
    .map((_) => char.charAt(Math.floor(Math.random() * char.length)))
    .join("")
}

async function _req({ url, method = "GET", data = null, params = null, head = null, response = "json" }: { url: string; method?: string; data?: any; params?: any; head?: any; response?: string }) {
  try {
    var headers: Record<string, string> = {}
    var param
    var datas

    if ((head && head == "original") || head == "ori") {
      const uri = new URL(url)
      headers = {
        authority: uri.hostname,
        origin: "https://" + uri.hostname,
        "Cache-Control": "no-cache",
        "user-agent": ua,
      }
    } else if (head && typeof head == "object") {
      headers = head
    }
    if (params && typeof params == "object") {
      param = params
    } else {
      param = ""
    }
    if (data) {
      datas = data
    } else {
      datas = ""
    }

    const options = {
      url: url,
      method: method,
      headers,
      timeout: 30_000,
      responseType: response as "json" | "arraybuffer" | "text",
      httpsAgent: agent,
      withCredentials: true,
      validateStatus: (status: number) => {
        return status <= 500
      },
      ...(!datas ? {} : { data: datas }),
      ...(!params ? {} : { params: param }),
    }
    const res = await axios.request(options)

    if (res.headers["set-cookie"]) {
      ;(res.headers["set-cookie"] as string[]).forEach((v) => {
        ;(head as Record<string, string>)["cookie"] = v.split(";")[0]
      })
    }

    return res
  } catch (error: any) {
    console.log(error)
    throw new Error(error.message || "Request failed")
  }
}

async function _initHeaders() {
  let { heartbeatsToSend: en } = (function (p3313: { agent: string; date: string }[], p3314 = 1024) {
    let v2942: { agent: string; dates: string[] }[] = []
    let v2943 = p3313.slice()
    for (let v2944 of p3313) {
      let v2945 = v2942.find((p3315) => p3315.agent === v2944.agent)
      if (v2945) {
        v2945.dates.push(v2944.date)
        if (f505(v2942) > p3314) {
          v2945.dates.pop()
          break
        }
      } else {
        v2942.push({
          agent: v2944.agent,
          dates: [v2944.date],
        })
        if (f505(v2942) > p3314) {
          v2942.pop()
          break
        }
      }
      v2943 = v2943.slice(1)
    }
    return {
      heartbeatsToSend: v2942,
      unsentEntries: v2943,
    }
  })(data)
  let vVF203 = vF203(
    JSON.stringify({
      version: 2,
      heartbeats: en,
    }),
  )

  const res = await _req({
    url: BASE,
    method: "GET",
    head: "ori",
    response: "text",
  })

  const match = (res.data as string).match(REG_PATH)
  if (match) {
    const res2 = await _req({
      url: "https://dewatermark.ai" + match[1],
      method: "GET",
      head: "ori",
      response: "text",
    })
    const match2 = (res2.data as string).match(REG_KEY)
    if (match2) {
      headersListFirebase["x-goog-api-key"] = match2[1]
    } else {
      console.error("[ ERROR ] Waduh api key nya gak ada bang")
    }
  } else {
    console.error("[ ERROR ] Waduh api key nya gak ada bang")
  }

  headersListFirebase["X-Firebase-Client"] = vVF203
}

function f663(p4624: any, p4625: Map<string, boolean>, p4626: any, p4627: any, p4628: any) {
  if (p4628.crit !== undefined && p4627.crit === undefined) {
    console.log("\"crit\" (Critical) Header Parameter MUST be integrity protected")
  }
  if (!p4627 || p4627.crit === undefined) {
    return new Set()
  }
  if (!Array.isArray(p4627.crit) || p4627.crit.length === 0 || p4627.crit.some((p4629: any) => typeof p4629 != "string" || p4629.length === 0)) {
    console.log("\"crit\" (Critical) Header Parameter MUST be an array of non-empty strings when present")
  }
  return new Set(p4627.crit)
}

var vF349 = (...er: any[]) => {
  let v3968: Set<string> | undefined
  let v3969 = er.filter(Boolean)
  if (v3969.length === 0 || v3969.length === 1) {
    return true
  }
  for (let v3970 of v3969) {
    let v3971 = Object.keys(v3970)
    if (!v3968 || v3968.size === 0) {
      v3968 = new Set(v3971)
      continue
    }
    for (let v3972 of v3971) {
      if (v3968.has(v3972)) {
        return false
      }
      v3968.add(v3972)
    }
  }
  return true
}

let v3948 = new TextEncoder()
let v3949 = new TextDecoder()
let vF338 = (p4620: string | Uint8Array) => {
  let vP4620 = p4620
  if (typeof vP4620 == "string") {
    vP4620 = v3948.encode(vP4620)
  }
  let v3950: string[] = []
  for (let v3951 = 0; v3951 < vP4620.length; v3951 += 32768) {
    v3950.push(String.fromCharCode.apply(null, Array.from(vP4620.subarray(v3951, v3951 + 32768))))
  }
  return Buffer.from(v3950.join(""), "utf-8").toString("base64")
}

let vF339 = (p4621: string | Uint8Array) => vF338(p4621).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

let vProduce_ProduceJWT = class C77 {
  _payload: any
  constructor(p4678: any) {
    if (
      !(function (p4679: any): boolean {
        if (typeof p4679 != "object" || p4679 === null || Object.prototype.toString.call(p4679) !== "[object Object]") {
          return false
        }
        if (Object.getPrototypeOf(p4679) === null) {
          return true
        }
        let vP4679 = p4679
        while (Object.getPrototypeOf(vP4679) !== null) {
          vP4679 = Object.getPrototypeOf(vP4679)
        }
        return Object.getPrototypeOf(p4679) === vP4679
      })(p4678)
    ) {
      console.error("[ ERROR ] JWT Claims Set MUST be an object")
    }
    this._payload = p4678
  }
}

var vCrypto = crypto
let vF340 = (p4623: any): p4623 is CryptoKey => p4623 instanceof CryptoKey
vCrypto.getRandomValues.bind(vCrypto)

let vF350 = (p4658: string, p4659: any) => {}

var vF352 = (p4663: string, p4664: any, p4665: string) => {
  let v3973 = p4663.startsWith("HS") || p4663 === "dir" || p4663.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(p4663)
  if (v3973) {
    vF350(p4663, p4664)
  }
}

let vF347 = async (p4644: string, p4645: any, p4646: Uint8Array) => {
  let v3962 = await (async function (p4647: string, p4648: any, p4649: string) {
    if (vF340(p4648)) {
      ;(function (p4650: any, p4651: string, ...ei: string[]) {
        switch (p4651) {
          case "HS256":
          case "HS384":
          case "HS512":
            {
              if (!f666(p4650.algorithm, "HMAC")) {
                throw f665("HMAC")
              }
              let vParseInt3 = parseInt(p4651.slice(2), 10)
              let vF667 = f667(p4650.algorithm.hash)
              if (vF667 !== vParseInt3) {
                throw f665(`SHA-${vParseInt3}`, "algorithm.hash")
              }
              break
            }
          case "RS256":
          case "RS384":
          case "RS512":
            {
              if (!f666(p4650.algorithm, "RSASSA-PKCS1-v1_5")) {
                throw f665("RSASSA-PKCS1-v1_5")
              }
              let vParseInt4 = parseInt(p4651.slice(2), 10)
              let vF6672 = f667(p4650.algorithm.hash)
              if (vF6672 !== vParseInt4) {
                throw f665(`SHA-${vParseInt4}`, "algorithm.hash")
              }
              break
            }
          case "PS256":
          case "PS384":
          case "PS512":
            {
              if (!f666(p4650.algorithm, "RSA-PSS")) {
                throw f665("RSA-PSS")
              }
              let vParseInt5 = parseInt(p4651.slice(2), 10)
              let vF6673 = f667(p4650.algorithm.hash)
              if (vF6673 !== vParseInt5) {
                throw f665(`SHA-${vParseInt5}`, "algorithm.hash")
              }
              break
            }
          case "EdDSA":
            if (p4650.algorithm.name !== "Ed25519" && p4650.algorithm.name !== "Ed448") {
              if (typeof window === "undefined") {
                if (f666(p4650.algorithm, "NODE-ED25519")) {
                  break
                }
                throw f665("Ed25519, Ed448, or NODE-ED25519")
              }
              throw f665("Ed25519 or Ed448")
            }
            break
          case "ES256":
          case "ES384":
          case "ES512":
            {
              if (!f666(p4650.algorithm, "ECDSA")) {
                throw f665("ECDSA")
              }
              let vF348 = function (p4652: string) {
                switch (p4652) {
                  case "ES256":
                    return "P-256"
                  case "ES384":
                    return "P-384"
                  case "ES512":
                    return "P-521"
                  default:
                    throw Error("unreachable")
                }
              }(p4651)
              let v3963 = p4650.algorithm.namedCurve
              if (v3963 !== vF348) {
                throw f665(vF348, "algorithm.namedCurve")
              }
              break
            }
          default:
            console.error("[ ERROR ] CryptoKey does not support this operation")
        }
        ;(function (p4653: any, p4654: string[]) {
          if (p4654.length && !p4654.some((p4655) => p4653.usages.includes(p4655))) {
            let v3964 = "CryptoKey does not support this operation, its usages must include "
            if (p4654.length > 2) {
              let v3965 = p4654.pop()
              v3964 += `one of ${p4654.join(", ")}, or ${v3965}.`
            } else if (p4654.length === 2) {
              v3964 += `one of ${p4654[0]} or ${p4654[1]}.`
            } else {
              v3964 += `${p4654[0]}.`
            }
            console.error(v3964)
          }
        })(p4650, ei)
      })(p4648, p4647, p4649)
      return p4648
    }
    if (p4648 instanceof Uint8Array) {
      return vCrypto.subtle.importKey(
        "raw",
        p4648,
        {
          hash: `SHA-${p4647.slice(-3)}`,
          name: "HMAC",
        },
        false,
        [p4649 as KeyUsage],
      )
    }
  })(p4644, p4645, "sign")
  vF342(p4644, v3962 as CryptoKey)
  let v3966 = await vCrypto.subtle.sign(
    (function (p4656: string, p4657: any) {
      let v3967 = `SHA-${p4656.slice(-3)}`
      switch (p4656) {
        case "HS256":
        case "HS384":
        case "HS512":
          return {
            hash: v3967,
            name: "HMAC",
          }
        case "PS256":
        case "PS384":
        case "PS512":
          return {
            hash: v3967,
            name: "RSA-PSS",
            saltLength: parseInt(p4656.slice(-3)) >> 3,
          }
        case "RS256":
        case "RS384":
        case "RS512":
          return {
            hash: v3967,
            name: "RSASSA-PKCS1-v1_5",
          }
        case "ES256":
        case "ES384":
        case "ES512":
          return {
            hash: v3967,
            name: "ECDSA",
            namedCurve: p4657.namedCurve,
          }
        case "EdDSA":
          if (typeof window === "undefined" && p4657.name === "NODE-ED25519") {
            return {
              name: "NODE-ED25519",
              namedCurve: "NODE-ED25519",
            }
          }
          return {
            name: p4657.name,
          }
        default:
          throw new Error(`alg ${p4656} is not supported either by JOSE or your javascript runtime`)
      }
    })(p4644, (v3962 as CryptoKey).algorithm),
    v3962 as CryptoKey,
    p4646,
  )
  return new Uint8Array(v3966)
}

var vF342 = (p4631: string, p4632: CryptoKey) => {
  if (p4631.startsWith("RS") || p4631.startsWith("PS")) {
    let { modulusLength: ei } = p4632.algorithm as RsaHashedKeyGenParams
    if (typeof ei != "number" || ei < 2048) {
      console.error(`[ ERROR ] ${p4631} requires key modulusLength to be 2048 bits or larger`)
    }
  }
}

function f665(p4633: string, p4634 = "algorithm.name") {
  console.error(`[ ERROR ] CryptoKey does not support this operation, its ${p4634} must be ${p4633}`)
  throw new Error(`CryptoKey does not support this operation, its ${p4634} must be ${p4633}`)
}
function f666(p4635: Algorithm, p4636: string) {
  return p4635.name === p4636
}
function f667(p4637: Algorithm) {
  return parseInt(p4637.name.slice(4), 10)
}

let vSign_FlattenedSign = class C75 {
  _payload: Uint8Array
  _protectedHeader: Record<string, any> | undefined
  _unprotectedHeader: Record<string, any> | undefined
  constructor(p4666: Uint8Array) {
    if (!(p4666 instanceof Uint8Array)) {
      console.error("[ ERROR ] payload must be an instance of Uint8Array")
      throw new Error("payload must be an instance of Uint8Array")
    }
    this._payload = p4666
  }
  setProtectedHeader(p4667: Record<string, any>) {
    if (this._protectedHeader) {
      console.error("[ ERROR ] setProtectedHeader can only be called once")
      throw new Error("setProtectedHeader can only be called once")
    }
    this._protectedHeader = p4667
    return this
  }
  setUnprotectedHeader(p4668: Record<string, any>) {
    if (this._unprotectedHeader) {
      console.error("[ ERROR ] setUnprotectedHeader can only be called once")
      throw new Error("setUnprotectedHeader can only be called once")
    }
    this._unprotectedHeader = p4668
    return this
  }
  async sign(p4669: CryptoKey, p4670: any) {
    let v3974: Uint8Array
    if (!this._protectedHeader && !this._unprotectedHeader) {
      console.log("either setProtectedHeader or setUnprotectedHeader must be called before #sign()")
      throw new Error("either setProtectedHeader or setUnprotectedHeader must be called before #sign()")
    }
    if (!vF349(this._protectedHeader, this._unprotectedHeader)) {
      console.log("JWS Protected and JWS Unprotected Header Parameter names must be disjoint")
      throw new Error("JWS Protected and JWS Unprotected Header Parameter names must be disjoint")
    }
    let v3975 = {
      ...this._protectedHeader,
      ...this._unprotectedHeader,
    }
    let vF663 = f663(console.log, new Map([["b64", true]]), p4670 == null ? undefined : p4670.crit, this._protectedHeader, v3975)
    let v3976 = true
    if (vF663.has("b64") && typeof (v3976 = this._protectedHeader.b64) != "boolean") {
      console.log("The \"b64\" (base64url-encode payload) Header Parameter must be a boolean")
      throw new Error("The \"b64\" (base64url-encode payload) Header Parameter must be a boolean")
    }
    let { alg: ed } = v3975
    if (typeof ed != "string" || !ed) {
      console.log("JWS \"alg\" (Algorithm) Header Parameter missing or invalid")
      throw new Error("JWS \"alg\" (Algorithm) Header Parameter missing or invalid")
    }
    vF352(ed, p4669, "sign")
    let v3977 = this._payload
    if (v3976) {
      v3977 = v3948.encode(vF339(v3977))
    }
    v3974 = this._protectedHeader ? v3948.encode(vF339(JSON.stringify(this._protectedHeader))) : v3948.encode("")
    let vF354 = function (...er: Uint8Array[]) {
      let v3978 = er.reduce((p4671, { length: en }) => p4671 + en, 0)
      let v3979 = new Uint8Array(v3978)
      let v3980 = 0
      er.forEach((p4672) => {
        v3979.set(p4672, v3980)
        v3980 += p4672.length
      })
      return v3979
    }(v3974, v3948.encode("."), v3977)
    let v3981 = await vF347(ed, p4669, vF354)
    let v3982: { signature: string; payload: string; header?: Record<string, any>; protected?: string } = {
      signature: vF339(v3981),
      payload: "",
    }
    if (v3976) {
      v3982.payload = v3949.decode(v3977)
    }
    if (this._unprotectedHeader) {
      v3982.header = this._unprotectedHeader
    }
    if (this._protectedHeader) {
      v3982.protected = v3949.decode(v3974)
    }
    return v3982
  }
}

let vCompactSign = class C76 {
  _flattened: typeof vSign_FlattenedSign.prototype
  constructor(p4673: Uint8Array) {
    this._flattened = new vSign_FlattenedSign(p4673)
  }
  setProtectedHeader(p4674: Record<string, any>) {
    this._flattened.setProtectedHeader(p4674)
    return this
  }
  async sign(p4675: CryptoKey, p4676: any) {
    let v3983 = await this._flattened.sign(p4675, p4676)
    if (v3983.payload === undefined) {
      console.error("[ ERROR ] use the flattened module for creating JWS with b64: false")
      throw new Error("use the flattened module for creating JWS with b64: false")
    }
    return `${v3983.protected}.${v3983.payload}.${v3983.signature}`
  }
}

class vErrors_JWTInvalid extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JWTInvalid"
  }
}

let vSignJWT = class C78 extends vProduce_ProduceJWT {
  _protectedHeader: Record<string, any> | undefined
  setProtectedHeader(p4687: Record<string, any>) {
    this._protectedHeader = p4687
    return this
  }
  async sign(p4688: CryptoKey, p4689: any) {
    let v3984 = new vCompactSign(v3948.encode(JSON.stringify(this._payload)))
    v3984.setProtectedHeader(this._protectedHeader as Record<string, any>)
    if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
      throw new vErrors_JWTInvalid("JWTs MUST NOT use unencoded payload")
    }
    return v3984.sign(p4688, p4689)
  }
}

async function f670(er = false) {
  let v3986 = Buffer.from(SECRET_KEY, "base64")
  let v3987 = await crypto.subtle.importKey(
    "raw",
    v3986,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  )
  let v3988 = await new vSignJWT({
    sub: "ignore",
    platform: "web",
    is_pro: er,
    exp: Math.round(Date.now() / 1000) + 300,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .sign(v3987)

  return v3988
}

async function _install() {
  await _initHeaders()
  const payload = {
    fid: `${_randomChar(6)}-${_randomChar(15)}`,
    authVersion: "FIS_v2",
    appId: "1:530051075963:web:5921e50b1e4ea7cb9ab7de",
    sdkVersion: "w:0.6.4",
  }

  const res = await _req({
    url: INSTALL,
    method: "POST",
    data: payload,
    head: headersListFirebase,
  })

  let v3990 = await f670(true)
  headersListEErase["authorization"] = `Bearer ${v3990}`

  return res.data
}

async function _erase(buffer: Buffer) {
  const form = new FormData()
  form.append("original_preview_image", buffer, {
    filename: crypto.randomUUID().toString() + ".jpg",
    contentType: "image/jpeg",
  })
  form.append("zoom_factor", 2)

  const res = await _req({
    url: ERASE,
    method: "POST",
    data: form,
    head: {
      ...headersListEErase,
      ...form.getHeaders(),
    },
  })

  return res.data
}

function _transform(result: any) {
  let dev = result
  dev.edited_image.image = Buffer.from(result.edited_image.image, "base64")
  dev.edited_image.mask = Buffer.from(result.edited_image.mask, "base64")
  dev.edited_image.watermark_mask = Buffer.from(result.edited_image.watermark_mask, "base64")

  return dev
}

async function DeWatermarkFromUrl(imageUrl: string) {
  console.log("[ IMAGE ] Mengubah foto ke binary...")
  const kb = await _req({
    url: imageUrl,
    method: "GET",
    response: "arraybuffer",
    head: "ori",
  })
  const buffer = Buffer.from(kb.data)

  const fileType = await fileTypeFromBuffer(buffer)
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Input URL is not a valid image file.")
  }
  const filename = `image.${fileType.ext}`

  console.log("[ INIT ] Menyiapkan token...")
  await _install()
  console.log("[ IMAGE ] Menghapus watermark...")
  const erase = await _erase(buffer)
  const trans = _transform(erase)

  return trans
}

async function DeWatermarkFromFile(imageBuffer: Buffer, filename: string) {
  const fileType = await fileTypeFromBuffer(imageBuffer)
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Input file is not a valid image.")
  }
  const finalFilename = filename || `image.${fileType.ext}`

  console.log("[ INIT ] Menyiapkan token...")
  await _install()
  console.log("[ IMAGE ] Menghapus watermark...")
  const erase = await _erase(imageBuffer)
  const trans = _transform(erase)

  return trans
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/dewatermark",
    name: "dewatermark",
    category: "Tools",
    description: "This API endpoint allows users to remove watermarks from images by providing a direct URL to the image. It supports various image formats that can be processed to detect and eliminate watermarks, returning a clean version of the image. This tool is useful for photographers, designers, and anyone needing to restore original image quality without watermarks. The process involves fetching the image from the provided URL, performing watermark detection and removal using an advanced algorithm, and then returning the processed image. Error handling is robust, providing clear messages for invalid URLs or unsupported file types.",
    tags: ["TOOLS", "IMAGE", "WATERMARK", "REMOVE"],
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
        description: "Image URL with watermark",
        example: "https://files.catbox.moe/258vhm.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req, res }) {
      const { url } = req.query || {}

      if (!url) {
        return {
          status: false,
          error: "Parameter 'url' is required.",
          code: 400,
        }
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'url' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        new URL(url)
      } catch (error: any) {
        return {
          status: false,
          error: "Invalid URL format provided.",
          code: 400,
        }
      }

      try {
        const result = await DeWatermarkFromUrl(url.trim())

        return createImageResponse(result.edited_image.image)
      } catch (error: any) {
        console.error("Error in DeWatermark (GET):", error.stack || error.message)
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
    endpoint: "/api/tools/dewatermark",
    name: "dewatermark",
    category: "Tools",
    description: "This API endpoint enables users to remove watermarks from images by uploading a file via multipart/form-data. It supports various image formats, automatically detects and removes watermarks, and returns the cleaned image. This feature is ideal for applications requiring direct image uploads for watermark removal, such as photo editing tools or content management systems. The process involves receiving the uploaded image, validating its type, applying advanced watermark removal algorithms, and then sending back the processed image. Detailed error messages are provided for missing files, invalid file types, or processing failures.",
    tags: ["TOOLS", "IMAGE", "WATERMARK", "REMOVE"],
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
                description: "The image file with a watermark to remove.",
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
      const { file: imageBuffer, type, isValid, isImage, name } = await guf(req, "image")

      if (!imageBuffer) {
        return {
          status: false,
          error: "Missing image file in form data.",
          code: 400,
        }
      }

      if (!isValid) {
        return {
          status: false,
          error: `Invalid file: ${name}. Size must be between 1 byte and 10MB`,
          code: 400,
        }
      }

      if (!isImage) {
        return {
          status: false,
          error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP`,
          code: 400,
        }
      }

      try {
        const result = await DeWatermarkFromFile(imageBuffer, name || "image.jpg")

        return createImageResponse(result.edited_image.image)
      } catch (error: any) {
        console.error("Error in DeWatermark (POST):", error.stack || error.message)
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]