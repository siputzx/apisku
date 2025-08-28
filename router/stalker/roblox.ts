import axios from "axios"
import fs from "fs"

declare const proxy: () => string | null

class RobloxAPI {
  constructor() {
    this.baseUrl = "https://api.roblox.com"
  }

  async request(url: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data: any = null, timeout = 10000) {
    try {
      const config: any = { method, url, timeout }
      if (data) config.data = data
      const response = await axios(config)
      return response.data
    } catch (error) {
      return null
    }
  }

  async getUserIdFromUsername(username: string) {
    const data = await this.request(proxy()+"https://users.roblox.com/v1/usernames/users", "POST", {
      usernames: [username],
      excludeBannedUsers: false,
    })
    return data?.data?.[0]?.id || null
  }

  async getUsersByUsernames(usernames: string[]) {
    return await this.request(proxy()+"https://users.roblox.com/v1/usernames/users", "POST", {
      usernames,
      excludeBannedUsers: false,
    })
  }

  async getUsersByIds(userIds: number[]) {
    return await this.request(proxy()+"https://users.roblox.com/v1/users", "POST", {
      userIds,
      excludeBannedUsers: false,
    })
  }

  async getUserInfo(userId: number) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}`)
  }

  async getUserStatus(userId: number) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}/status`)
  }

  async getUserUsernameHistory(userId: number, limit = 10, cursor = "") {
    return await this.request(`https://users.roblox.com/v1/users/${userId}/username-history?limit=${limit}&cursor=${cursor}`)
  }

  async searchUsers(keyword: string, limit = 10, cursor = "") {
    return await this.request(`https://users.roblox.com/v1/users/search?keyword=${keyword}&limit=${limit}&cursor=${cursor}`)
  }

  async getUserPresence(userIds: number | number[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds]
    return await this.request(proxy()+"https://presence.roblox.com/v1/presence/users", "POST", { userIds: ids })
  }

  async getUserLastOnline(userIds: number | number[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds]
    return await this.request(proxy()+"https://presence.roblox.com/v1/presence/last-online", "POST", { userIds: ids })
  }

  async getUserFriends(userId: number, limit = 200) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/friends?limit=${limit}`)
  }

  async getUserFriendsCount(userId: number) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/friends/count`)
  }

  async getUserFollowers(userId: number, limit = 100, cursor = "") {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followers?limit=${limit}&cursor=${cursor}`)
  }

  async getUserFollowersCount(userId: number) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followers/count`)
  }

  async getUserFollowing(userId: number, limit = 100, cursor = "") {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followings?limit=${limit}&cursor=${cursor}`)
  }

  async getUserFollowingCount(userId: number) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/followings/count`)
  }

  async getUserFriendsStatuses(userId: number) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/friends/statuses`)
  }

  async getUserOnlineFriends(userId: number) {
    return await this.request(`https://friends.roblox.com/v1/users/${userId}/friends/online`)
  }

  async getUserAvatarHeadshot(userIds: number | number[], size = "420x420", format = "Png", circular = false) {
    const ids = Array.isArray(userIds) ? userIds.join(",") : userIds
    return await this.request(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids}&size=${size}&format=${format}&isCircular=${circular}`)
  }

  async getUserAvatarFullBody(userIds: number | number[], size = "720x720", format = "Png", circular = false) {
    const ids = Array.isArray(userIds) ? userIds.join(",") : userIds
    return await this.request(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${ids}&size=${size}&format=${format}&isCircular=${circular}`)
  }

  async getUserAvatarBust(userIds: number | number[], size = "420x420", format = "Png", circular = false) {
    const ids = Array.isArray(userIds) ? userIds.join(",") : userIds
    return await this.request(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${ids}&size=${size}&format=${format}&isCircular=${circular}`)
  }

  async getUserAvatar3D(userId: number) {
    return await this.request(`https://thumbnails.roblox.com/v1/users/avatar-3d?userId=${userId}`)
  }

  async getUserAvatar(userId: number) {
    return await this.request(`https://avatar.roblox.com/v1/users/${userId}/avatar`)
  }

  async getUserCurrentlyWearing(userId: number) {
    return await this.request(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing`)
  }

  async getUserOutfits(userId: number, page = 1, itemsPerPage = 25) {
    return await this.request(`https://avatar.roblox.com/v1/users/${userId}/outfits?page=${page}&itemsPerPage=${itemsPerPage}`)
  }

  async getUserOutfitsV2(userId: number, limit = 25, cursor = "") {
    return await this.request(`https://avatar.roblox.com/v2/users/${userId}/outfits?limit=${limit}&cursor=${cursor}`)
  }

  async getAvatarMetadata() {
    return await this.request(proxy()+"https://avatar.roblox.com/v1/avatar/metadata")
  }

  async getUserAvatarMetadata(userId: number) {
    return await this.request(`https://avatar.roblox.com/v1/users/${userId}/avatar/metadata`)
  }

  async getUserGroups(userId: number) {
    return await this.request(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
  }

  async getUserGroupsV2(userId: number) {
    return await this.request(`https://groups.roblox.com/v2/users/${userId}/groups/roles`)
  }

  async getUserPrimaryGroup(userId: number) {
    return await this.request(`https://groups.roblox.com/v1/users/${userId}/groups/primary/role`)
  }

  async getUserFavoriteGames(userId: number, limit = 50) {
    return await this.request(`https://games.roblox.com/v2/users/${userId}/favorite/games?limit=${limit}`)
  }

  async getUserRecentGames(userId: number, limit = 50) {
    return await this.request(`https://games.roblox.com/v2/users/${userId}/games?limit=${limit}`)
  }

  async getGameFavoritesCount(placeId: number) {
    return await this.request(`https://games.roblox.com/v1/games/${placeId}/favorites/count`)
  }

  async getUserInventory(userId: number, limit = 100, cursor = "") {
    return await this.request(`https://inventory.roblox.com/v2/users/${userId}/inventory?limit=${limit}&cursor=${cursor}`)
  }

  async getUserInventoryByType(userId: number, assetType: string, limit = 100, cursor = "") {
    return await this.request(`https://inventory.roblox.com/v2/users/${userId}/inventory/${assetType}?limit=${limit}&cursor=${cursor}`)
  }

  async getUserCollectibles(userId: number, assetType = "", limit = 100, cursor = "") {
    return await this.request(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?assetType=${assetType}&limit=${limit}&cursor=${cursor}`)
  }

  async getUserItem(userId: number, itemType: string, itemTargetId: number) {
    return await this.request(`https://inventory.roblox.com/v1/users/${userId}/items/${itemType}/${itemTargetId}`)
  }

  async getUserBadges(userId: number, limit = 100, cursor = "") {
    return await this.request(`https://badges.roblox.com/v1/users/${userId}/badges?limit=${limit}&cursor=${cursor}`)
  }

  async getUserBadgeAwardedDates(userId: number, badgeIds: number | number[]) {
    const ids = Array.isArray(badgeIds) ? badgeIds.join(",") : badgeIds
    return await this.request(`https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${ids}`)
  }

  async getUserBundles(userId: number, limit = 100, cursor = "") {
    return await this.request(`https://catalog.roblox.com/v1/users/${userId}/bundles?limit=${limit}&cursor=${cursor}`)
  }

  async getUserBundlesByType(userId: number, bundleType: string, limit = 100, cursor = "") {
    return await this.request(`https://catalog.roblox.com/v1/users/${userId}/bundles/${bundleType}?limit=${limit}&cursor=${cursor}`)
  }

  async getUserRobloxBadges(userId: number) {
    return await this.request(`https://accountinformation.roblox.com/v1/users/${userId}/roblox-badges`)
  }

  async getPromotionChannels() {
    return await this.request(proxy()+"https://accountinformation.roblox.com/v1/promotion-channels")
  }

  async validateUserMembership(userId: number) {
    return await this.request(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`)
  }

  async getUsersByUsernamesBatch(usernames: string[]) {
    return await this.request(proxy()+"https://users.roblox.com/v1/users/get-by-usernames", "POST", { usernames })
  }

  async validateDisplayName(displayName: string, userId: number) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}/display-names/validate?displayName=${displayName}`)
  }

  async validateDisplayNameV2(displayName: string, userId: number) {
    return await this.request(`https://users.roblox.com/v2/users/${userId}/display-names/validate?displayName=${displayName}`)
  }

  async getAuthenticatedUser() {
    return await this.request(proxy()+"https://users.roblox.com/v1/users/authenticated")
  }

  async getUserCanManage(userId: number) {
    return await this.request(`https://users.roblox.com/v1/users/${userId}/canmanage`)
  }

  formatPresence(type: number) {
    const presenceMap: { [key: number]: string } = {
      0: "Offline",
      1: "Online",
      2: "In Game",
      3: "In Studio",
    }
    return presenceMap[type] || "Unknown"
  }

  formatUserType(type: number) {
    const userTypeMap: { [key: number]: string } = {
      0: "User",
      1: "Reserved",
      2: "Terminated",
    }
    return userTypeMap[type] || "Unknown"
  }

  async getCompleteUserInfo(username: string) {
    const userId = await this.getUserIdFromUsername(username)
    if (!userId) return null

    const [
      basic,
      status,
      presence,
      friends,
      followers,
      following,
      groups,
      primaryGroup,
      favoriteGames,
      recentGames,
      headshot,
      fullBody,
      bust,
      avatar,
      wearing,
      outfits,
      badges,
      collectibles,
      robloxBadges,
      bundles,
    ] = await Promise.all([
      this.getUserInfo(userId),
      this.getUserStatus(userId),
      this.getUserPresence([userId]),
      this.getUserFriendsCount(userId),
      this.getUserFollowersCount(userId),
      this.getUserFollowingCount(userId),
      this.getUserGroups(userId),
      this.getUserPrimaryGroup(userId),
      this.getUserFavoriteGames(userId, 5),
      this.getUserRecentGames(userId, 5),
      this.getUserAvatarHeadshot(userId),
      this.getUserAvatarFullBody(userId),
      this.getUserAvatarBust(userId),
      this.getUserAvatar(userId),
      this.getUserCurrentlyWearing(userId),
      this.getUserOutfits(userId, 1, 10),
      this.getUserBadges(userId, 5),
      this.getUserCollectibles(userId, "", 5),
      this.getUserRobloxBadges(userId),
      this.getUserBundles(userId, 5),
    ])

    return {
      userId,
      basic,
      status,
      presence,
      social: { friends, followers, following },
      groups: { list: groups, primary: primaryGroup },
      games: { favorites: favoriteGames, recent: recentGames },
      avatar: { headshot, fullBody, bust, details: avatar, wearing, outfits },
      achievements: { badges, collectibles, robloxBadges },
      catalog: { bundles },
    }
  }
}

const Roblox = new RobloxAPI()

async function stalkRoblox(username: string) {
  try {
    const result = await Roblox.getCompleteUserInfo(username)
    return result
  } catch (error) {
    throw new Error("Failed to get Roblox user info")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/stalk/roblox",
    name: "roblox",
    category: "Stalker",
    description: "This API endpoint provides comprehensive information about a Roblox user. It takes a Roblox username as input and returns a detailed profile including basic user info, status, presence, social statistics (friends, followers, following counts), group affiliations, recently played and favorite games, avatar details (headshot, full body, bust, and currently wearing items), and a list of badges, collectibles, and bundles. The endpoint is designed to give a complete overview of a user's activity and profile on the Roblox platform. It's useful for a variety of applications, such as user analytics, profile visualization, and social tracking.",
    tags: ["Stalker", "roblox", "user", "profile", "games"],
    example: "?user=builderman",
    parameters: [
      {
        name: "user",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 20,
        },
        description: "Roblox username",
        example: "builderman",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { user } = req.query || {}

      if (!user) {
        return {
          status: false,
          error: "User parameter is required",
          code: 400,
        }
      }

      if (typeof user !== "string" || user.trim().length === 0) {
        return {
          status: false,
          error: "User parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await stalkRoblox(user.trim())

        if (!result) {
          return {
            status: false,
            error: "User not found or failed to retrieve info",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
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
    endpoint: "/api/stalk/roblox",
    name: "roblox",
    category: "Stalker",
    description: "This API endpoint provides comprehensive information about a Roblox user. It takes a Roblox username as input and returns a detailed profile including basic user info, status, presence, social statistics (friends, followers, following counts), group affiliations, recently played and favorite games, avatar details (headshot, full body, bust, and currently wearing items), and a list of badges, collectibles, and bundles. The endpoint is designed to give a complete overview of a user's activity and profile on the Roblox platform. It's useful for a variety of applications, such as user analytics, profile visualization, and social tracking.",
    tags: ["Stalker", "roblox", "user", "profile", "games"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["user"],
            properties: {
              user: {
                type: "string",
                description: "Roblox username",
                example: "builderman",
                minLength: 1,
                maxLength: 20,
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
      const { user } = req.body || {}

      if (!user) {
        return {
          status: false,
          error: "User parameter is required",
          code: 400,
        }
      }

      if (typeof user !== "string" || user.trim().length === 0) {
        return {
          status: false,
          error: "User parameter must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await stalkRoblox(user.trim())

        if (!result) {
          return {
            status: false,
            error: "User not found or failed to retrieve info",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
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