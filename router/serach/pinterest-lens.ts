import axios from "axios"
import FormData from "form-data"
import { fileTypeFromBuffer } from "file-type"

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
]

async function validateImageBuffer(buffer: Buffer) {
  try {
    const fileType = await fileTypeFromBuffer(buffer)

    if (!fileType) {
      throw new Error("Could not detect file type")
    }

    if (!ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
      throw new Error(
        `Unsupported file type: ${fileType.mime}. Only image files are allowed.`,
      )
    }

    return {
      isValid: true,
      mime: fileType.mime,
      ext: fileType.ext,
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    }
  }
}

class PinterestLensScraper {
  private defaultHeaders: Record<string, string>
  private headers: Record<string, string>

  constructor(customHeaders: Record<string, string> = {}) {
    this.defaultHeaders = {
      "authority": "api.pinterest.com",
      "accept-language": "id-ID",
      "user-agent": "Pinterest for Android/13.25.2 (itel S665L; 12)",
      "x-pinterest-advertising-id": "cbb23c37-6256-4f72-b691-fb18166d5ce4",
      "x-pinterest-app-type-detailed": "3",
      "x-pinterest-device": "itel S665L",
      "x-pinterest-device-hardwareid": "b58f872527417271",
      "x-pinterest-installid": "19dcdf8854774600ad72b0ceb78bb4b",
      "x-pinterest-appstate": "background",
      "x-node-id": "true",
      "authorization":
        "Bearer pina_AEATFWAVABS42AAAGBAHIDFCT2BMXFYBABHO2KYRDEFCPLLAULSIJKJDET3E6GDUVZBUBQVWIJJWBIPBF2SAKFLPBZAPIMQA",
      "accept-encoding": "gzip",
      "cookie":
        "_b=AYpAJDns33xO/5rOGXjAa4mNU8xhVulLP/DeNHkz56MvQm+hDkzd3Zyn3yGqcvObBxk=; _pinterest_ct=TWc9PSY0VllQd1ZaK01RLzVOamhVWjFoa3RFOHZnMDBLdW9vNjhYejhOQmtUK1AzOFhuMDlUbDhhY0JhMmhFSnQrbXRkbmNtdVFLU2FPblBkMXh1UGlYa0RLbEJGMDNDekRBcHJaR3RFMnpISElubz0mYXNIWktPb093K3JLTy85bWF4YURGbmhnbjBjPQ==; _ir=0",
    }
    this.headers = { ...this.defaultHeaders, ...customHeaders }
  }

  setHeaders(customHeaders: Record<string, string>) {
    this.headers = { ...this.defaultHeaders, ...customHeaders }
  }

  getVideoUrl(videoList: any) {
    return (
      videoList?.V_HLSV3_MOBILE?.url ||
      videoList?.V_DASH_HEVC?.url ||
      videoList?.V_HEVC_MP4_T1_V2?.url ||
      videoList?.V_HEVC_MP4_T2_V2?.url ||
      videoList?.V_HEVC_MP4_T3_V2?.url ||
      videoList?.V_HEVC_MP4_T4_V2?.url ||
      videoList?.V_HEVC_MP4_T5_V2?.url ||
      videoList?.V_720P?.url ||
      null
    )
  }

  async search(buffer: Buffer) {
    try {
      if (!buffer || !Buffer.isBuffer(buffer))
        throw new Error("Image buffer is required")

      const validation = await validateImageBuffer(buffer)
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.error}`)
      }

      const form = new FormData()
      form.append("camera_type", "0")
      form.append("source_type", "1")
      form.append("video_autoplay_disabled", "0")
      form.append("page_size", "12")
      form.append(
        "fields",
        "storypinvideoblock.{block_type,video_signature,block_style,video[V_HLSV3_MOBILE, V_DASH_HEVC, V_HEVC_MP4_T1_V2, V_HEVC_MP4_T2_V2, V_HEVC_MP4_T3_V2, V_HEVC_MP4_T4_V2, V_HEVC_MP4_T5_V2],type},storypinimageblock.{image_signature,block_type,block_style,type},linkblock.{image_signature,src_url,normalized_url,block_type,image[345x],text,type,canonical_url},domain.{official_user()},collectionpinitem.{image_signature,images,dominant_color,link,pin_id,title},collectionpin.{root_pin_id,item_data},userwebsite.{official_user()},storypindata.{has_affiliate_products,static_page_count,pages_preview,metadata(),page_count,has_product_pins,total_video_duration},storypinpage.{layout,image_signature,video_signature,blocks,image_signature_adjusted,video[V_HLSV3_MOBILE, V_DASH_HEVC, V_HEVC_MP4_T1_V2, V_HEVC_MP4_T2_V2, V_HEVC_MP4_T3_V2, V_HEVC_MP4_T4_V2, V_HEVC_MP4_T5_V2],style,id,type,music_attributions,should_mute},pincarouseldata.{index,id,rich_summary(),rich_metadata(),carousel_slots},pincarouselslot.{rich_summary,item_id,domain,android_deep_link,link,details,images[345x,750x],id,ad_destination_url,title,rich_metadata},pin.{comment_count,is_eligible_for_related_products,shopping_flags,pinner(),promoted_is_lead_ad,ad_match_reason,destination_url_type,promoted_quiz_pin_data,promoted_is_showcase,type,carousel_data(),image_crop,story_pin_data_id,call_to_create_responses_count,promoted_is_removable,is_owned_by_viewer,digital_media_source_type,auto_alt_text,id,ad_destination_url,embed,ad_group_id,rich_summary(),grid_title,native_creator(),cacheable_id,source_interest(),is_native,has_variants,promoted_is_auto_assembled,is_premiere,is_eligible_for_web_closeup,promoted_is_quiz,done_by_me,closeup_description,creative_enhancement_slideshow_aspect_ratio,promoted_android_deep_link,is_oos_product,is_video,reaction_by_me,promoted_is_catalog_carousel_ad,dominant_color,virtual_try_on_type,promoted_is_sideswipe_disabled,domain,call_to_action_text,is_stale_product,link_domain(),music_attributions,collection_pin(),shopping_mdl_browser_type,is_promoted,ad_data(),recommendation_reason,ad_targeting_attribution(),link,sponsorship,is_unsafe,is_hidden,description,created_at,link_user_website(),title,is_cpc_ad,is_scene,image_signature,total_reaction_count,promoted_is_max_video,is_eligible_for_pre_loved_goods_label,tracking_params,alt_text,dpa_creative_type,promoted_lead_form(),is_eligible_for_pdp,is_visualization_enabled,is_unsafe_for_comments,is_call_to_create,ip_eligible_for_stela,dark_profile_link,via_pinner,is_downstream_promotion,promoter(),reaction_counts,should_open_in_stream,shuffle(),aggregated_pin_data(),is_repin,videos(),top_interest,category,story_pin_data(),should_mute,board(),is_collaborative,collaborating_users(),created_at,privacy,should_show_shop_feed,type,is_ads_only,url,image_cover_url,layout,collaborated_by_me,followed_by_me,should_show_board_collaborators,owner(),name,collaborator_invites_enabled,action,section_count,id,category},video.{duration,id,video_list[V_HLSV3_MOBILE, V_DASH_HEVC]},richpinproductmetadata.{label_info,offers,additional_images,has_multi_images,shipping_info,offer_summary,item_set_id,item_id,name,id,type,brand},aggregatedpindata.{is_shop_the_look,comment_count,collections_header_text,is_stela,has_xy_tags,pin_tags,did_it_data,catalog_collection_type,slideshow_collections_aspect_ratio,aggregated_stats,id,is_dynamic_collections,pin_tags_chips},shuffle.{source_app_type_detailed,id},pin.images[200x,236x,736x,290x],storypinimageblock.image[200x,236x,736x,290x],storypinpage.image[200x,236x,736x,290x,1200x],storypinpage.image_adjusted[200x,236x,736x,290x,1200x]",
      )
      form.append("image", buffer, `rynn_${Date.now()}.jpg`)

      const { data: responseData } = await axios.post(
        "https://api.pinterest.com/v3/visual_search/lens/search/",
        form,
        {
          headers: {
            ...form.getHeaders(),
            ...this.headers,
          },
        },
      )

      return responseData.data.map((pin: any) => {
        const isVideo = !!(pin.videos || pin.story_pin_data?.pages_preview?.[0]?.video)
        let media = {}

        if (isVideo) {
          const videoList =
            pin.videos?.video_list ||
            pin.story_pin_data?.pages_preview?.[0]?.video?.video_list
          const videoUrl = this.getVideoUrl(videoList)
          const thumbnailUrl =
            videoList?.V_HEVC_MP4_T5_V2?.thumbnail ||
            videoList?.V_720P?.thumbnail ||
            videoList?.V_HLSV3_MOBILE?.thumbnail ||
            pin.images?.["736x"]?.url ||
            ""

          media = {
            type: "video",
            url: videoUrl,
            thumbnailUrl: thumbnailUrl,
          }
        } else {
          media = {
            type: "image",
            url:
              pin.story_pin_data?.pages_preview?.[0]?.image?.images?.originals
                ?.url ||
              pin.images?.originals?.url ||
              pin.images?.["736x"]?.url ||
              "",
          }
        }

        return {
          id: pin.id,
          title: pin.title || pin.grid_title || "",
          description: pin.description || "",
          media: media,
          creator: pin.native_creator
            ? {
                name: pin.native_creator.full_name,
                username: pin.native_creator.username,
                followers: pin.native_creator.follower_count || 0,
                avatar: pin.native_creator.image_medium_url || null,
                url: `https://pinterest.com/${pin.native_creator.username}/`,
              }
            : null,
          stats: {
            saves: pin.aggregated_pin_data?.aggregated_stats?.saves || 0,
            comments: pin.comment_count || 0,
            reactions: pin.total_reaction_count || 0,
          },
          metadata: {
            is_video: isVideo,
            is_repin: pin.is_repin || false,
            is_native: pin.is_native || false,
            is_promoted: pin.is_promoted || false,
            is_unsafe: pin.is_unsafe || false,
          },
          created_at: pin.created_at
            ? new Date(pin.created_at).toLocaleString("en-US")
            : null,
          url: `https://pinterest.com/pin/${pin.id}/`,
        }
      })
    } catch (error: any) {
      throw new Error(error.message)
    }
  }
}

async function searchPinterestFromUrl(imageUrl: string) {
  if (!imageUrl) throw "Image URL cannot be empty"

  try {
    const imageBuffer = (
      await axios.get(imageUrl, {
        responseType: "arraybuffer",
      })
    ).data

    const validation = await validateImageBuffer(Buffer.from(imageBuffer))
    if (!validation.isValid) {
      return {
        status: false,
        message: "File is not a valid image",
        error: validation.error,
      }
    }

    return await processPinterestSearch(imageBuffer)
  } catch (err: any) {
    return {
      status: false,
      message: "Failed to perform Pinterest search from image URL",
      error: err.response?.data || err.message,
    }
  }
}

async function searchPinterestFromFile(imageBuffer: Buffer) {
  if (!imageBuffer) throw "Image file cannot be empty"

  try {
    const validation = await validateImageBuffer(imageBuffer)
    if (!validation.isValid) {
      return {
        status: false,
        message: "File is not a valid image",
        error: validation.error,
      }
    }

    return await processPinterestSearch(imageBuffer)
  } catch (err: any) {
    return {
      status: false,
      message: "Failed to perform Pinterest search from image file",
      error: err.response?.data || err.message,
    }
  }
}

async function processPinterestSearch(imageBuffer: Buffer) {
  const scraper = new PinterestLensScraper()
  const buffer = Buffer.from(imageBuffer)
  const results = await scraper.search(buffer)

  return {
    status: true,
    total_results: results.length,
    results: results,
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/pinterest-lens",
    name: "pinterest lens search",
    category: "Search",
    description:
      "This API endpoint allows you to search Pinterest using an image URL. It leverages the Pinterest visual lens technology to find similar pins based on the provided image. The endpoint expects a valid image URL as a query parameter. It will then fetch the image, validate it, and use it to perform a visual search on Pinterest. The response will include a list of relevant pins with details such as ID, title, description, media (image or video), creator information, and engagement statistics. This can be used for reverse image search, finding product inspirations, or discovering visually similar content on Pinterest.",
    tags: ["PINTEREST", "SEARCH", "VISUAL", "LENS"],
    example: "?imageUrl=https://example.com/image.jpg",
    parameters: [
      {
        name: "imageUrl",
        in: "query",
        required: true,
        schema: {
          type: "string",
          format: "url",
          minLength: 1,
          maxLength: 2048,
        },
        description: "URL of the image to search on Pinterest",
        example: "https://example.com/image.jpg",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { imageUrl } = req.query || {}

      if (!imageUrl) {
        return {
          status: false,
          error: "Parameter 'imageUrl' is required.",
          code: 400,
        }
      }

      if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'imageUrl' must be a non-empty string.",
          code: 400,
        }
      }

      try {
        const result = await searchPinterestFromUrl(imageUrl.trim())
        if (!result.status) {
          return {
            status: result.status,
            error: result.error,
            code: 400,
          }
        }
        return {
          status: true,
          data: {
            ...result,
            search_image: imageUrl.trim(),
          },
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error:
            error.message ||
            "An error occurred while performing Pinterest search.",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/s/pinterest-lens",
    name: "pinterest lens search",
    category: "Search",
    description:
      "This API endpoint allows you to search Pinterest using an uploaded image file. It utilizes the Pinterest visual lens technology to find similar pins based on the provided image. The endpoint expects an image file in 'multipart/form-data' format. It will validate the uploaded file to ensure it's a supported image type before performing a visual search on Pinterest. The response will include a list of relevant pins with details such as ID, title, description, media (image or video), creator information, and engagement statistics. This is ideal for users who want to upload an image directly from their device to find visually similar content on Pinterest.",
    tags: ["PINTEREST", "SEARCH", "VISUAL", "LENS"],
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
                description:
                  "Image file to search on Pinterest (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG)",
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
        )

        if (!file) {
          return {
            status: false,
            error: "Missing file in form data",
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
            error: `Invalid file type: ${type}. Supported: JPG, JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG`,
            code: 400,
          }
        }

        const result = await searchPinterestFromFile(file)
        if (!result.status) {
          return {
            status: result.status,
            error: result.error,
            code: 400,
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
          error:
            error.message ||
            "An error occurred while performing Pinterest search.",
          code: 500,
        }
      }
    },
  },
]