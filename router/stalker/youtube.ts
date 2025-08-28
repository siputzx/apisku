import needle from "needle"
import * as cheerio from "cheerio"

declare const proxy: () => string | null

async function youtubeStalk(username: string) {
  try {
    const options = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, public, max-age=31536000, immutable, private, max-age=3600, must-revalidate, stale-while-revalidate=86400, stale-if-error=86400, s-maxage=31536000, post-check=0, pre-check=0, no-transform, vary=Accept-Encoding,User-Agent,Accept-Language, s-maxage=259200, max-age=300, max-age=600, max-age=60, max-age=7200, max-age=604800, stale-while-revalidate=43200, stale-if-error=7200, max-age=31536000, s-maxage=31536000, max-age=86400, s-maxage=259200, public, s-maxage=86400, max-age=3600, private, must-revalidate, max-age=0, no-cache, no-store, private, no-cache, no-store, must-revalidate, public, max-age=86400, stale-while-revalidate=43200, private, max-age=3600, stale-if-error=7200, no-store, no-cache, must-revalidate, proxy-revalidate',
        pragma:
          'akamai-x-cache-on, akamai-x-cache-remote-on, akamai-x-check-cacheable, akamai-x-get-cache-key, akamai-x-get-extracted-values, akamai-x-get-ssl-client-session-id, akamai-x-get-true-cache-key, akamai-x-serial-no, akamai-x-get-request-id, akamai-x-get-nonces, akamai-x-get-client-ip, akamai-x-feo-trace, akamai-x-debug-info, akamai-x-cache-debug, akamai-x-real-client-ip, akamai-x-network-status, akamai-x-client-behavior-tracking, akamai-x-error-debug, akamai-x-geo-data, akamai-x-ip-version, akamai-x-session-attributes, akamai-x-protocol-trace, akamai-x-request-priority, akamai-x-response-timings, akamai-x-backend-info, akamai-x-edge-node-info, akamai-x-region-latency, akamai-x-cache-persistence, akamai-x-url-query-debug, akamai-x-time-sync, akamai-x-cookie-debug, akamai-x-auth-token-debug, akamai-x-content-length-debug, akamai-x-origin-server-timing, akamai-x-dns-debug, akamai-x-throughput-analysis, akamai-x-bypass-cache-control, akamai-x-akamai-integrity-trace, akamai-x-custom-header-debug, akamai-x-data-integrity-check, akamai-x-edge-node-response, akamai-x-ssl-handshake-timing, akamai-x-redirect-history, akamai-x-ab-test-debug, akamai-x-session-debug, akamai-x-user-segment-analysis, akamai-x-anomaly-detection, akamai-x-cache-flush-history, akamai-x-preflight-options, akamai-x-client-cert-info, akamai-x-forwarded-proto-debug, akamai-x-response-verification, akamai-x-routing-details, akamai-x-ab-testing-params, akamai-x-cache-expiry-info, akamai-x-geo-location-override, akamai-x-access-control-debug, akamai-x-data-compression-debug, akamai-x-image-optimization-debug, akamai-x-video-optimization-debug, akamai-x-cdn-rules-engine-debug, akamai-x-dynamic-content-debug, akamai-x-object-expiry-time, akamai-x-streaming-debug, akamai-x-performance-monitoring, akamai-x-client-usage-metrics, akamai-x-client-location-trace, akamai-x-cookie-injection-trace, akamai-x-token-auth-debug, akamai-x-ssl-policy-trace, akamai-x-origin-timing-breakdown, akamai-x-edge-node-performance, akamai-x-network-optimization-debug, akamai-x-policy-override-debug, akamai-x-cache-query-timings, akamai-x-cache-hit-rate-trace, akamai-x-backend-request-details, akamai-x-error-analysis-debug, akamai-x-cache-policy-debug, akamai-x-server-side-debugging, akamai-x-custom-metrics-analysis, akamai-x-user-behavior-analysis, akamai-x-url-routing-debug, akamai-x-forwarded-ip-debug, akamai-x-content-filtering-debug, akamai-x-policy-evaluation-debug, akamai-x-header-manipulation-trace, akamai-x-response-validation-debug, akamai-x-cache-persistence-trace, akamai-x-edge-routing-trace, akamai-x-cdn-performance-trace, akamai-x-query-string-analysis-debug, akamai-x-policy-injection-debug, akamai-x-client-throttling-trace, akamai-x-debug-level-max, akamai-x-request-routing-trace, akamai-x-cache-strategy-debug, akamai-x-origin-health-check, akamai-x-bot-detection-trace, akamai-x-request-correlation-id, akamai-x-edge-optimization-trace, akamai-x-traffic-management-debug, akamai-x-security-policy-trace, akamai-x-rate-limiting-debug, akamai-x-request-tracking-id, akamai-x-edge-authentication-trace, akamai-x-cache-invalidation-trace, akamai-x-origin-selection-trace, akamai-x-content-negotiation-debug, akamai-x-dynamic-optimization-trace, akamai-x-edge-compression-debug, akamai-x-traffic-shaping-trace, akamai-x-security-events-trace, akamai-x-bot-management-debug, akamai-x-edge-caching-trace, akamai-x-request-prioritization-debug, akamai-x-load-balancing-debug, akamai-x-edge-server-info, akamai-x-request-validation-trace, akamai-x-client-connection-debug, akamai-x-ssl-certificate-trace, akamai-x-origin-connection-debug, akamai-x-edge-response-trace, akamai-x-cache-key-generation, akamai-x-request-transformation-debug, akamai-x-response-transformation-debug, akamai-x-edge-optimization-status, akamai-x-service-monitoring-trace, akamai-x-request-rate-analysis, akamai-x-cache-partition-debug, akamai-x-edge-security-trace, akamai-x-content-delivery-trace, akamai-x-client-protocol-debug, akamai-x-origin-protocol-debug, akamai-x-edge-protocol-debug, akamai-x-cache-hierarchy-trace, akamai-x-request-replay-debug, akamai-x-origin-failover-trace, akamai-x-edge-failover-trace, akamai-x-request-coalescing-debug, akamai-x-cache-freshness-debug, akamai-x-origin-health-status, akamai-x-edge-health-status, akamai-x-request-processing-trace, akamai-x-response-processing-trace, akamai-x-edge-request-debug, akamai-x-edge-response-debug, akamai-x-origin-request-debug, akamai-x-origin-response-debug, akamai-x-cache-status-trace, akamai-x-request-timing-trace, akamai-x-response-timing-trace, akamai-x-edge-timing-trace, akamai-x-origin-timing-trace, akamai-x-cache-timing-trace, akamai-x-request-flow-trace, akamai-x-response-flow-trace, akamai-x-edge-flow-trace, akamai-x-origin-flow-trace, akamai-x-cache-flow-trace, akamai-x-request-path-debug, akamai-x-response-path-debug, akamai-x-edge-path-debug, akamai-x-origin-path-debug, akamai-x-cache-path-debug, akamai-x-request-state-trace, akamai-x-response-state-trace, akamai-x-edge-state-trace, akamai-x-origin-state-trace, akamai-x-cache-state-trace, akamai-x-request-lifecycle-debug, akamai-x-response-lifecycle-debug, akamai-x-edge-lifecycle-debug, akamai-x-origin-lifecycle-debug, akamai-x-cache-lifecycle-debug, akamai-x-request-metadata-trace, akamai-x-response-metadata-trace, akamai-x-edge-metadata-trace, akamai-x-origin-metadata-trace, akamai-x-cache-metadata-trace, akamai-x-request-analytics-debug, akamai-x-response-analytics-debug, akamai-x-edge-analytics-debug, akamai-x-origin-analytics-debug, akamai-x-cache-analytics-debug, akamai-x-request-metrics-trace, akamai-x-response-metrics-trace, akamai-x-edge-metrics-trace, akamai-x-origin-metrics-trace, akamai-x-cache-metrics-trace, akamai-x-request-telemetry-debug, akamai-x-response-telemetry-debug, akamai-x-edge-telemetry-debug, akamai-x-origin-telemetry-debug, akamai-x-cache-telemetry-debug, akamai-x-request-diagnostics-trace, akamai-x-response-diagnostics-trace, akamai-x-edge-diagnostics-trace, akamai-x-origin-diagnostics-trace, akamai-x-cache-diagnostics-trace, akamai-x-request-optimization-debug, akamai-x-response-optimization-debug, akamai-x-edge-optimization-debug, akamai-x-origin-optimization-debug, akamai-x-cache-optimization-debug, akamai-x-request-acceleration-trace, akamai-x-response-acceleration-trace, akamai-x-edge-acceleration-trace, akamai-x-origin-acceleration-trace, akamai-x-cache-acceleration-trace, akamai-x-request-efficiency-debug, akamai-x-response-efficiency-debug, akamai-x-edge-efficiency-debug, akamai-x-origin-efficiency-debug, akamai-x-cache-efficiency-debug, akamai-x-request-performance-trace, akamai-x-response-performance-trace, akamai-x-edge-performance-trace, akamai-x-origin-performance-trace, akamai-x-cache-performance-trace',
        'sec-ch-ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120", "Microsoft Edge";v="120", "Opera";v="106", "Opera GX";v="106", "Brave";v="120", "Vivaldi";v="6.5", "Firefox";v="121", "Safari";v="17.2", "Samsung Internet";v="23.0", "UC Browser";v="15.5", "Yandex Browser";v="24.1", "QQ Browser";v="13.1", "Maxthon";v="7.1", "Seamonkey";v="2.53", "Pale Moon";v="33.0", "Waterfox";v="5.1", "Basilisk";v="2023.11", "K-Meleon";v="76.4", "Otter";v="1.0", "Midori";v="9.0", "Konqueror";v="21.12", "Falkon";v="3.2", "Qutebrowser";v="2.5", "Min";v="1.28", "Iridium";v="2023.07", "Epic Browser";v="103", "Comodo Dragon";v="114", "Comodo IceDragon";v="115", "Slimjet";v="37.0", "Avant Browser";v="2021", "Torch Browser";v="70", "Cent Browser";v="5.0", "Coc Coc";v="103", "360 Browser";v="13.2", "Sleipnir";v="6.4", "GreenBrowser";v="6.9", "Lunascape";v="6.15", "SlimBrowser";v="16.0", "BlackHawk";v="77", "Orbitum";v="56", "CyberFox";v="52.9", "IceCat";v="102", "Pale Moon Mobile";v="33.0", "Dooble";v="2023.11", "Aloha Browser";v="3.5", "CM Browser";v="5.22", "Phoenix Browser";v="5.5", "Puffin";v="9.7", "Dolphin";v="12.1", "Mercury Browser";v="9.4", "Atomic";v="7.5", "Cheetah Browser";v="7.2", "SalamWeb";v="5.1", "Kiwi Browser";v="120", "DuckDuckGo";v="7.65", "Bromite";v="112", "Ungoogled Chromium";v="120", "Beaker Browser";v="1.3", "Naver Whale";v="3.23"',
      },
      follow_max: 5,
    }

    const response = await needle(
      'get',
      `https://youtube.com/@${username}`,
      options
    )
    const $ = cheerio.load(response.body)

    const ytInitialDataScript = $('script')
      .filter((i, el) => {
        return $(el).html().includes('var ytInitialData =')
      })
      .html()

    const jsonData = ytInitialDataScript.match(/var ytInitialData = (.*?);/)
    if (jsonData && jsonData[1]) {
      const parsedData = JSON.parse(jsonData[1])
      
      const channelMetadata = {
        username: null,
        name: null,
        subscriberCount: null,
        videoCount: null,
        avatarUrl: null,
        channelUrl: null,
        description: null,
      }

      if (parsedData.header?.pageHeaderRenderer) {
        const header = parsedData.header.pageHeaderRenderer
        channelMetadata.name =
          header.content?.pageHeaderViewModel?.title?.content
        channelMetadata.username =
          header.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows[0]?.metadataParts[0]?.text?.content

        if (
          header.content?.pageHeaderViewModel?.image?.decoratedAvatarViewModel
            ?.avatar?.avatarViewModel?.image?.sources?.length > 0
        ) {
          channelMetadata.avatarUrl =
            header.content.pageHeaderViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url
        }
      }

      if (parsedData.metadata?.channelMetadataRenderer) {
        const channelMeta = parsedData.metadata.channelMetadataRenderer
        channelMetadata.description = channelMeta.description
        channelMetadata.channelUrl = channelMeta.channelUrl

        const metadataRows =
          parsedData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel
            ?.metadata?.contentMetadataViewModel?.metadataRows
        if (metadataRows?.length > 1) {
          const subscriberRow = metadataRows[1]
          subscriberRow.metadataParts.forEach((part) => {
            if (part.text?.content) {
              if (part.text.content.includes('subscribers')) {
                channelMetadata.subscriberCount = part.text.content
              } else if (part.text.content.includes('videos')) {
                channelMetadata.videoCount = part.text.content
              }
            }
          })
        }
      }

      // Process latest 5 videos
      const videoDataList = []
      const tabs = parsedData.contents.twoColumnBrowseResultsRenderer.tabs
      if (tabs && tabs.length > 0) {
        const videosTab =
          tabs[0].tabRenderer.content.sectionListRenderer.contents
        let videoCount = 0

        for (const item of videosTab) {
          if (videoCount >= 5) break // Stop after getting 5 videos

          if (item.itemSectionRenderer) {
            for (const content of item.itemSectionRenderer.contents) {
              if (content.shelfRenderer?.content?.horizontalListRenderer) {
                const items =
                  content.shelfRenderer.content.horizontalListRenderer.items
                for (const video of items) {
                  if (videoCount >= 5) break // Check again inside loop

                  if (video.gridVideoRenderer) {
                    const videoId = video.gridVideoRenderer.videoId
                    const videoData = {
                      videoId: videoId,
                      title: video.gridVideoRenderer.title.simpleText,
                      thumbnail:
                        video.gridVideoRenderer.thumbnail.thumbnails[0].url,
                      publishedTime:
                        video.gridVideoRenderer.publishedTimeText?.simpleText,
                      viewCount:
                        video.gridVideoRenderer.viewCountText?.simpleText,
                      duration:
                        video.gridVideoRenderer.thumbnailOverlays?.find(
                          (overlay) =>
                            overlay.thumbnailOverlayTimeStatusRenderer
                        )?.thumbnailOverlayTimeStatusRenderer?.text
                          ?.simpleText || null,
                      videoUrl: `https://m.youtube.com/watch?v=${videoId}`,
                    }

                    videoDataList.push(videoData)
                    videoCount++
                  }
                }
              }
            }
          }
        }
      }

      return {
        channel: channelMetadata,
        latest_videos: videoDataList,
      }
    } else {
      throw new Error("Could not parse YouTube initial data.")
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch YouTube data: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/youtube",
    name: "youtube",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public information about a YouTube channel and its latest five videos by providing a YouTube username as a query parameter. It fetches channel details such as username, display name, subscriber count, video count, avatar URL, channel URL, and description. For each of the latest videos, it provides the video ID, title, thumbnail, published time, view count, duration, and direct video URL. This is useful for applications or users wanting to get quick insights into a YouTube channel's content and statistics.",
    tags: ["Stalker", "YouTube", "Channel", "Videos"],
    example: "?username=siputzx",
    parameters: [
      {
        name: "username",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "The YouTube channel username",
        example: "siputzx",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username } = req.query || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
          code: 400,
        }
      }

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await youtubeStalk(username.trim())
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
    endpoint: "/api/stalk/youtube",
    name: "youtube",
    category: "Stalker",
    description:
      "This API endpoint allows you to retrieve public information about a YouTube channel and its latest five videos by providing a YouTube username in a JSON request body. It fetches channel details such as username, display name, subscriber count, video count, avatar URL, channel URL, and description. For each of the latest videos, it provides the video ID, title, thumbnail, published time, view count, duration, and direct video URL. This is useful for applications or users wanting to get quick insights into a YouTube channel's content and statistics.",
    tags: ["Stalker", "YouTube", "Channel", "Videos"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["username"],
            properties: {
              username: {
                type: "string",
                description: "The YouTube channel username",
                example: "siputzx",
                minLength: 1,
                maxLength: 255,
              },
            },
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { username } = req.body || {}

      if (!username) {
        return {
          status: false,
          error: "Username parameter is required",
          code: 400,
        }
      }

      if (typeof username !== "string" || username.trim().length === 0) {
        return {
          status: false,
          error: "Username must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await youtubeStalk(username.trim())
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