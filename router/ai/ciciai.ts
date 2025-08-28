import axios from "axios"
import { randomUUID } from "crypto"

async function scrape(content: string) {
  try {
    const random = Math.floor(Math.random() * 100000000000000000) + 1;
    const cdid = '2' + Math.floor(Math.random() * 100000000000000000).toString(16).padStart(23, '0');
    const uid = Math.floor(Math.random() * 100000000000000000) + 1;
    const iid = Math.floor(Math.random() * 100000000000000000) + 1;
    const device_id = Math.floor(Math.random() * 100000000000000000) + 1;
    
    const url = `https://api-normal-i18n.ciciai.com/im/sse/send/message?flow_im_arch=v2&device_platform=android&os=android&ssmix=a&_rticket=${random}&cdid=${cdid}&channel=googleplay&aid=489823&app_name=wolf_ai&version_code=${Math.floor(Math.random() * 1000000) + 1}&version_name=${Math.random().toString(36).substring(7)}&manifest_version_code=${Math.floor(Math.random() * 1000000) + 1}&update_version_code=${Math.floor(Math.random() * 1000000) + 1}&resolution=${Math.floor(Math.random() * 1000) + 1}x${Math.floor(Math.random() * 1000) + 1}&dpi=${Math.floor(Math.random() * 1000) + 1}&device_type=${Math.random().toString(36).substring(7)}&device_brand=${Math.random().toString(36).substring(7)}&language=en&os_api=${Math.floor(Math.random() * 100) + 1}&os_version=${Math.random().toString(36).substring(7)}&ac=wifi&uid=${uid}&carrier_region=ID&sys_region=US&tz_name=Asia%2FShanghai&is_new_user=0&region=US&lang=en&pkg_type=release_version&iid=${iid}&device_id=${device_id}&region=US&flow_sdk_version=${Math.floor(Math.random() * 1000000) + 1}&use-olympus-account=1`;

    const headers = {
      "Accept-Encoding": "gzip",
      "Connection": "Keep-Alive",
      "Content-Type": "application/json; encoding=utf-8",
      "Host": "api-normal-i18n.ciciai.com",
      "passport-sdk-version": "505174",
      "req_biz_id": "Message",
      "sdk-version": "2",
      "User-Agent": "com.larus.wolf/8090004 (Linux; U; Android 12; en_US; SM-S9180; Build/PQ3B.190801.10101846;tt-ok/3.12.13.18)",
      "x-tt-store-region": "id",
      "x-tt-store-region-src": "uid",
      "X-Tt-Token": "035229bf3d162eb6048724df0041e722e8002e9c924874b4b4a3d9edcbd6931ccf9b52b92e2d6142c48772d994101225325ecc9d07e4260ae1a9e0dd324ee1ab8643879d6ea586655382c1aed7df1e4d3b6ef-1.0.0"
    };

    const body = {
      "channel": 3,
      "cmd": 100,
      "sequence_id": randomUUID(),
      "uplink_body": {
        "send_message_body": {
          "ack_only": false,
          "applet_payload": {},
          "bot_id": "7241547611541340167",
          "bot_type": 1,
          "client_controller_param": {
            "answer_with_suggest": true,
            "local_language_code": "en",
            "local_nickname": "AnaBot",
            "local_voice_id": "93"
          },
          "content": "{\"im_cmd\":-1,\"text\":\"" + encodeURIComponent(content) + "\"}",
          "content_type": 1,
          "conversation_id": "2819963878916",
          "conversation_type": 3,
          "create_time": Math.floor(Date.now() / 1000),
          "ext": {
            "create_time_ms": Date.now().toString(),
            "record_status": "1",
            "wiki": "1",
            "search_engine_type": "1",
            "media_search_type": "0",
            "answer_with_suggest": "1",
            "system_language": "en",
            "enter_method_trace": "",
            "previous_page_trace": "",
            "is_audio": "false",
            "voice_mix_input": "0",
            "tts": "1",
            "ugc_plugin_auth_infos": "[]",
            "is_app_background": "0",
            "is_douyin_installed": "0",
            "is_luna_installed": "0",
            "media_player_business_scene": "",
            "need_deep_think": "0",
            "need_net_search": "0",
            "send_message_scene": "keyboard"
          },
          "client_fallback_param": {
            "last_section_id": "83179644493060",
            "last_message_index": 0
          },
          "local_message_id": (Math.random() * 100000000000000000).toString(16),
          "sender_id": "7339383617468646408",
          "status": 0,
          "unique_key": (Math.random() * 100000000000000000).toString(16)
        }
      },
      "version": "1"
    }

    const response = await axios.post(url, body, { 
      headers,
      timeout: 30000
    });
    
    const result = extractOriginAndSources(response.data);
    return result;
  } catch (error: any) {
    console.error('CICI API Error:', error.message);
    throw new Error("Failed to get response from CICI API");
  }
}

function extractOriginAndSources(rawData: string) {
  const dataRegex = /data:\s*(\{.*?\})(?=\n\s*id:|\n*$)/gs;
  let match;
  const sources: Array<{url: string, title: string}> = [];

  while ((match = dataRegex.exec(rawData)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const body = json?.downlink_body?.fetch_chunk_message_downlink_body;

      if (!body) continue;

      // content.text_tags
      const contentRaw = body.content;
      const contentObj = JSON.parse(contentRaw);
      const tags = contentObj?.text_tags || [];

      tags.forEach((tag: any) => {
        const tagInfo = JSON.parse(tag.tag_info);
        if (tagInfo.url && tagInfo.title) {
          sources.push({
            url: tagInfo.url,
            title: tagInfo.title
          });
        }
      });

    } catch (e) {
      continue;
    }
  }

  return {
    chat: extractOriginContent(rawData),
    sources
  };
}

function extractOriginContent(data: string): string {
  const originRegex = /"origin_content"\s*:\s*"([^"]*)"/g;
  let match;
  let result: string[] = [];

  while ((match = originRegex.exec(data)) !== null) {
    result.push(match[1]);
  }

  return result.join('');
}

export default [
  {
    metode: "GET",
    endpoint: "/api/ai/cici",
    name: "cici",
    category: "AI",
    description: "This API endpoint provides access to CICI AI, an intelligent chatbot service that can answer questions, provide information, and engage in conversations. The API accepts text content as a query parameter and returns AI-generated responses along with relevant sources when available. It's ideal for applications requiring conversational AI capabilities, question-answering systems, or content generation with source attribution.",
    tags: ["AI", "Chatbot", "Conversation", "Question Answering", "CICI"],
    example: "?content=What%20is%20artificial%20intelligence?",
    parameters: [
      {
        name: "content",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
        },
        description: "Text content or question for CICI AI to process",
        example: "Explain quantum computing in simple terms.",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { content } = req.query || {}

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 2000) {
        return {
          status: false,
          error: "Content parameter is too long (maximum 2000 characters)",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim())

        if (!result || !result.chat) {
          return {
            status: false,
            error: "No response returned from CICI AI",
            code: 500,
          }
        }

        return {
          status: true,
          data: {
            response: result.chat,
            sources: result.sources || []
          },
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
    endpoint: "/api/ai/cici",
    name: "cici",
    category: "AI",
    description: "This API endpoint offers POST method access to CICI AI for more complex interactions. It accepts JSON payloads with text content and returns comprehensive AI responses including source references when available. This method is suitable for applications that need to send structured data or longer content to the AI, such as document analysis, complex queries, or integration with backend systems requiring detailed AI responses.",
    tags: ["AI", "Chatbot", "Conversation", "Question Answering", "CICI"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["content"],
            properties: {
              content: {
                type: "string",
                description: "Text content or question for CICI AI to process",
                example: "Can you explain the differences between machine learning and deep learning?",
                minLength: 1,
                maxLength: 2000,
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
      const { content } = req.body || {}

      if (!content) {
        return {
          status: false,
          error: "Content parameter is required",
          code: 400,
        }
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return {
          status: false,
          error: "Content parameter must be a non-empty string",
          code: 400,
        }
      }

      if (content.length > 2000) {
        return {
          status: false,
          error: "Content parameter is too long (maximum 2000 characters)",
          code: 400,
        }
      }

      try {
        const result = await scrape(content.trim())

        if (!result || !result.chat) {
          return {
            status: false,
            error: "No response returned from CICI AI",
            code: 500,
          }
        }

        return {
          status: true,
          data: {
            response: result.chat,
            sources: result.sources || []
          },
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