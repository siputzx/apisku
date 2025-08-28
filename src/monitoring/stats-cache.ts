import moment from "moment-timezone"

export class StatsCache {
  private data = {
    total: 0,
    daily: {} as Record<string, number>,
    requestsInCurrentSecond: 0,
    lastSecondRequests: 0,
    lastUpdateTime: Date.now(),
    apiRequests: { total: 0, daily: {} as Record<string, number> },
    errorRequests: { total: 0, daily: {} as Record<string, number> },
    lastDbSave: 0,
    dbSaveInterval: 30000,
  }

  init(stats: any): void {
    this.data = {
      ...this.data,
      total: stats.total || 0,
      daily: stats.daily || {},
      apiRequests: {
        total: stats.apiRequests?.total || 0,
        daily: stats.apiRequests?.daily || {},
      },
      errorRequests: {
        total: stats.errorRequests?.total || 0,
        daily: stats.errorRequests?.daily || {},
      },
    }
  }

  updateRequest(): void {
    this.data.total++
    this.data.requestsInCurrentSecond++

    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    this.data.daily[today] = (this.data.daily[today] || 0) + 1
  }

  updateApi(isError: boolean): void {
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD")
    
    this.data.apiRequests.total++
    this.data.apiRequests.daily[today] = (this.data.apiRequests.daily[today] || 0) + 1

    if (isError) {
      this.data.errorRequests.total++
      this.data.errorRequests.daily[today] = (this.data.errorRequests.daily[today] || 0) + 1
    }
  }

  updatePerSecond(): void {
    const now = Date.now()
    if (now - this.data.lastUpdateTime >= 1000) {
      this.data.lastSecondRequests = this.data.requestsInCurrentSecond
      this.data.requestsInCurrentSecond = 0
      this.data.lastUpdateTime = now
    }
  }

  shouldSave(): boolean {
    const now = Date.now()
    return now - this.data.lastDbSave > this.data.dbSaveInterval
  }

  markSaved(): void {
    this.data.lastDbSave = Date.now()
  }

  getTotal(): number {
    return this.data.total
  }

  getStats(): any {
    return {
      total: this.data.total,
      perSecond: this.data.lastSecondRequests,
      daily: this.data.daily,
      api: {
        total: this.data.apiRequests.total,
        daily: this.data.apiRequests.daily,
      },
      error: {
        total: this.data.errorRequests.total,
        daily: this.data.errorRequests.daily,
      },
    }
  }

  getForSave(): any {
    return {
      total: this.data.total,
      daily: this.data.daily,
      apiRequests: {
        total: this.data.apiRequests.total,
        daily: this.data.apiRequests.daily,
      },
      errorRequests: {
        total: this.data.errorRequests.total,
        daily: this.data.errorRequests.daily,
      },
    }
  }

  resetDaily(today: string): void {
    this.data.daily = { [today]: 0 }
    this.data.apiRequests.daily = { [today]: 0 }
    this.data.errorRequests.daily = { [today]: 0 }
  }
}