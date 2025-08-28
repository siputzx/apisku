import axios from "axios"
declare const proxy: () => string | null

class UniversalConverter {
  private exchangeRates: { [key: string]: number }
  private cryptoPrices: { [key: string]: number }
  private indodaxData: { [key: string]: any }

  constructor() {
    this.exchangeRates = {}
    this.cryptoPrices = {}
    this.indodaxData = {}
  }

  private async httpRequest(url: string, timeout = 8000) {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`)
    }
  }

  private async fetchExchangeRates(): Promise<boolean> {
    const apis = [
      "https://api.exchangerate-api.com/v4/latest/USD",
      "https://open.er-api.com/v6/latest/USD",
      "https://api.fxratesapi.com/latest?base=USD",
      "https://api.exchangerate.host/latest?base=USD",
      "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json",
      "https://api.currencybeacon.com/v1/latest?api_key=free&base=USD",
      "https://api.currencylayer.com/live?access_key=free&source=USD",
      "https://v6.exchangerate-api.com/v6/latest/USD",
    ]

    for (const api of apis) {
      try {
        const data = await this.httpRequest(proxy() + api, 5000)

        if (data.rates && Object.keys(data.rates).length > 100) {
          this.exchangeRates = data.rates
          return true
        }

        if (data.usd && Object.keys(data.usd).length > 100) {
          this.exchangeRates = {}
          for (const [currency, rate] of Object.entries(data.usd)) {
            this.exchangeRates[currency.toUpperCase()] = rate as number
          }
          return true
        }

        if (data.data && Object.keys(data.data).length > 100) {
          this.exchangeRates = data.data
          return true
        }

        if (data.quotes && Object.keys(data.quotes).length > 100) {
          this.exchangeRates = {}
          for (const [key, value] of Object.entries(data.quotes)) {
            const currency = (key as string).replace("USD", "")
            if (currency) this.exchangeRates[currency] = value as number
          }
          return true
        }
      } catch (error) {
        continue
      }
    }

    throw new Error("All fiat currency APIs failed")
  }

  private async fetchCryptoPrices() {
    const endpoints = [
      async () => {
        const batchUrl = "https://api.binance.com/api/v3/ticker/price"
        const data = await this.httpRequest(proxy() + batchUrl, 6000)
        if (Array.isArray(data)) {
          return data.filter((item: any) => item.symbol.endsWith("USDT"))
        }
        return []
      },

      async () => {
        const url =
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1"
        return await this.httpRequest(proxy() + url, 8000)
      },

      async () => {
        const data = await this.httpRequest(
          proxy() + "https://api.coincap.io/v2/assets?limit=200",
          6000,
        )
        return data
      },

      async () => {
        const data = await this.httpRequest(
          proxy() + "https://api.coinbase.com/v2/exchange-rates?currency=USD",
          6000,
        )
        return data
      },

      async () => {
        const data = await this.httpRequest(
          proxy() + "https://api.kraken.com/0/public/Ticker",
          8000,
        )
        return data
      },

      async () => {
        const data = await this.httpRequest(
          proxy() + "https://api.kucoin.com/api/v1/market/allTickers",
          6000,
        )
        return data
      },

      async () => {
        const data = await this.httpRequest(
          proxy() + "https://api.huobi.pro/market/tickers",
          6000,
        )
        return data
      },
    ]

    this.cryptoPrices = {}

    for (let i = 0; i < endpoints.length; i++) {
      try {
        const data = await endpoints[i]()

        if (Array.isArray(data)) {
          if (data[0] && data[0].symbol && data[0].symbol.includes("USDT")) {
            data.forEach((item) => {
              if (item.symbol && item.price) {
                const symbol = item.symbol
                  .replace("USDT", "")
                  .replace("BUSD", "")
                  .replace("USDC", "")
                const price = parseFloat(item.price)
                if (price > 0) {
                  this.cryptoPrices[symbol] = price
                }
              }
            })
          } else if (data[0] && data[0].current_price) {
            data.forEach((item) => {
              if (item.symbol && item.current_price) {
                this.cryptoPrices[item.symbol.toUpperCase()] = parseFloat(
                  item.current_price,
                )
              }
            })
          }
        }

        if (data && data.data) {
          if (Array.isArray(data.data)) {
            data.data.forEach((item: any) => {
              if (item.symbol && (item.priceUsd || item.price)) {
                const price = parseFloat(item.priceUsd || item.price)
                if (price > 0) {
                  this.cryptoPrices[item.symbol] = price
                }
              }
            })
          } else if (data.data.rates) {
            for (const [symbol, rate] of Object.entries(data.data.rates)) {
              const price = parseFloat(rate as string)
              if (price > 0) {
                this.cryptoPrices[symbol] = 1 / price
              }
            }
          } else if (data.data.ticker) {
            data.data.ticker.forEach((item: any) => {
              if (item.symbol && item.last && item.symbol.includes("USDT")) {
                const symbol = item.symbol.replace("USDT", "")
                this.cryptoPrices[symbol] = parseFloat(item.last)
              }
            })
          }
        }

        if (data && data.result) {
          for (const [pair, info] of Object.entries(data.result)) {
            if ((pair as string).includes("USD") && (info as any).c) {
              const symbol = (pair as string)
                .replace("XUSD", "")
                .replace("USD", "")
                .replace("X", "")
              if (symbol && symbol !== pair) {
                this.cryptoPrices[symbol] = parseFloat((info as any).c[0])
              }
            }
          }
        }

        if (Object.keys(this.cryptoPrices).length > 50) {
          break
        }
      } catch (error) {
        continue
      }
    }

    if (Object.keys(this.cryptoPrices).length === 0) {
      throw new Error("All cryptocurrency APIs failed")
    }
  }

  private async fetchIndodaxData() {
    try {
      const data = await this.httpRequest(
        proxy() + "https://indodax.com/api/ticker_all",
        5000,
      )
      this.indodaxData = {}

      if (data && data.tickers) {
        for (const [pair, info] of Object.entries(data.tickers)) {
          const [crypto, fiat] = (pair as string).split("_")
          if (fiat === "idr" && (info as any).last) {
            this.indodaxData[crypto.toUpperCase()] = {
              price_idr: parseFloat((info as any).last),
              high: parseFloat((info as any).high),
              low: parseFloat((info as any).low),
              volume: parseFloat((info as any)[`vol_${crypto}`]),
              buy: parseFloat((info as any).buy),
              sell: parseFloat((info as any).sell),
              server_time: (info as any).server_time,
            }
          }
        }
      }
    } catch (error) {
      this.indodaxData = {}
    }
  }

  private async getAllData() {
    await Promise.all([
      this.fetchExchangeRates(),
      this.fetchCryptoPrices(),
      this.fetchIndodaxData(),
    ])
  }

  private isCrypto(currency: string): boolean {
    currency = currency.toUpperCase()
    return (
      this.cryptoPrices.hasOwnProperty(currency) ||
      this.indodaxData.hasOwnProperty(currency)
    )
  }

  private isFiat(currency: string): boolean {
    currency = currency.toUpperCase()
    return currency === "USD" || this.exchangeRates.hasOwnProperty(currency)
  }

  private getCryptoPrice(currency: string): number | null {
    currency = currency.toUpperCase()
    if (this.cryptoPrices[currency]) {
      return this.cryptoPrices[currency]
    }
    if (this.indodaxData[currency] && this.exchangeRates.IDR) {
      return this.indodaxData[currency].price_idr / this.exchangeRates.IDR
    }
    return null
  }

  public async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) {
    await this.getAllData()

    fromCurrency = fromCurrency.toUpperCase()
    toCurrency = toCurrency.toUpperCase()

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Invalid amount")
    }

    const amountNum = parseFloat(amount.toString())
    let convertedAmount = 0

    if (!this.isFiat(fromCurrency) && !this.isCrypto(fromCurrency)) {
      throw new Error(`Currency ${fromCurrency} not found`)
    }

    if (!this.isFiat(toCurrency) && !this.isCrypto(toCurrency)) {
      throw new Error(`Currency ${toCurrency} not found`)
    }

    if (this.isFiat(fromCurrency) && this.isFiat(toCurrency)) {
      const fromRate = fromCurrency === "USD" ? 1 : this.exchangeRates[fromCurrency]
      const toRate = toCurrency === "USD" ? 1 : this.exchangeRates[toCurrency]
      convertedAmount = (amountNum / fromRate) * toRate
    } else if (this.isFiat(fromCurrency) && this.isCrypto(toCurrency)) {
      const fromRate = fromCurrency === "USD" ? 1 : this.exchangeRates[fromCurrency]
      const cryptoPrice = this.getCryptoPrice(toCurrency)
      if (!cryptoPrice) {
        throw new Error(`Could not get price for crypto ${toCurrency}`)
      }
      const usdAmount = amountNum / fromRate
      convertedAmount = usdAmount / cryptoPrice
    } else if (this.isCrypto(fromCurrency) && this.isFiat(toCurrency)) {
      const cryptoPrice = this.getCryptoPrice(fromCurrency)
      if (!cryptoPrice) {
        throw new Error(`Could not get price for crypto ${fromCurrency}`)
      }
      const toRate = toCurrency === "USD" ? 1 : this.exchangeRates[toCurrency]
      const usdAmount = amountNum * cryptoPrice
      convertedAmount = usdAmount * toRate
    } else if (this.isCrypto(fromCurrency) && this.isCrypto(toCurrency)) {
      const fromPrice = this.getCryptoPrice(fromCurrency)
      const toPrice = this.getCryptoPrice(toCurrency)
      if (!fromPrice || !toPrice) {
        throw new Error(
          `Could not get prices for crypto ${fromCurrency} or ${toCurrency}`,
        )
      }
      convertedAmount = (amountNum * fromPrice) / toPrice
    }

    return {
      amount: amountNum,
      from: fromCurrency,
      to: toCurrency,
      result: convertedAmount,
      rate: convertedAmount / amountNum,
      timestamp: new Date().toISOString(),
    }
  }

  public async getSupportedCurrencies() {
    await this.getAllData()

    const fiat = ["USD", ...Object.keys(this.exchangeRates)].sort()
    const crypto = [
      ...Object.keys(this.cryptoPrices),
      ...Object.keys(this.indodaxData),
    ].sort()
    const uniqueCrypto = [...new Set(crypto)]

    return {
      fiat: fiat,
      crypto: uniqueCrypto,
      total: fiat.length + uniqueCrypto.length,
      fiat_count: fiat.length,
      crypto_count: uniqueCrypto.length,
    }
  }

  public async getMarketData() {
    await this.getAllData()

    return {
      fiat_rates: { USD: 1, ...this.exchangeRates },
      crypto_prices: this.cryptoPrices,
      indodax_data: this.indodaxData,
      timestamp: new Date().toISOString(),
    }
  }
}

const converter = new UniversalConverter()

export default [
  {
    metode: "GET",
    endpoint: "/api/currency/convert",
    name: "currency-convert",
    category: "Currency",
    description:
      "This API endpoint allows you to convert between various fiat currencies and cryptocurrencies. Users can specify an amount, the source currency, and the target currency to get the converted value. It fetches real-time exchange rates and cryptocurrency prices from multiple reliable sources to ensure accuracy. This is useful for financial applications, personal finance tools, and any service requiring up-to-date currency conversions.",
    tags: ["CURRENCY", "FINANCE", "EXCHANGE"],
    example: "?amount=100&from=USD&to=IDR",
    parameters: [
      {
        name: "amount",
        in: "query",
        required: true,
        schema: {
          type: "number",
        },
        description: "Amount to convert",
        example: "100",
      },
      {
        name: "from",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Source currency",
        example: "USD",
      },
      {
        name: "to",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Target currency",
        example: "IDR",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { amount, from, to } = req.query || {}

      if (!amount) {
        return {
          status: false,
          error: "Amount parameter is required",
          code: 400,
        }
      }

      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return {
          status: false,
          error: "Amount must be a positive number",
          code: 400,
        }
      }

      if (!from) {
        return {
          status: false,
          error: "From currency parameter is required",
          code: 400,
        }
      }

      if (typeof from !== "string" || from.trim().length === 0) {
        return {
          status: false,
          error: "From currency must be a non-empty string",
          code: 400,
        }
      }

      if (!to) {
        return {
          status: false,
          error: "To currency parameter is required",
          code: 400,
        }
      }

      if (typeof to !== "string" || to.trim().length === 0) {
        return {
          status: false,
          error: "To currency must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await converter.convert(
          Number(amount),
          from.trim(),
          to.trim(),
        )
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
    endpoint: "/api/currency/convert",
    name: "currency-convert",
    category: "Currency",
    description:
      "This API endpoint allows you to convert between various fiat currencies and cryptocurrencies using a POST request with a JSON body. Users can specify an amount, the source currency, and the target currency to get the converted value. It fetches real-time exchange rates and cryptocurrency prices from multiple reliable sources to ensure accuracy. This is useful for financial applications, personal finance tools, and any service requiring up-to-date currency conversions.",
    tags: ["CURRENCY", "FINANCE", "EXCHANGE"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["amount", "from", "to"],
            properties: {
              amount: {
                type: "number",
                description: "Amount to convert",
                example: 100,
              },
              from: {
                type: "string",
                description: "Source currency (e.g., USD, BTC, ETH)",
                example: "USD",
                minLength: 1,
                maxLength: 10,
              },
              to: {
                type: "string",
                description: "Target currency (e.g., IDR, BTC, ETH)",
                example: "IDR",
                minLength: 1,
                maxLength: 10,
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
      const { amount, from, to } = req.body || {}

      if (!amount) {
        return {
          status: false,
          error: "Amount parameter is required",
          code: 400,
        }
      }

      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return {
          status: false,
          error: "Amount must be a positive number",
          code: 400,
        }
      }

      if (!from) {
        return {
          status: false,
          error: "From currency parameter is required",
          code: 400,
        }
      }

      if (typeof from !== "string" || from.trim().length === 0) {
        return {
          status: false,
          error: "From currency must be a non-empty string",
          code: 400,
        }
      }

      if (!to) {
        return {
          status: false,
          error: "To currency parameter is required",
          code: 400,
        }
      }

      if (typeof to !== "string" || to.trim().length === 0) {
        return {
          status: false,
          error: "To currency must be a non-empty string",
          code: 400,
        }
      }

      try {
        const result = await converter.convert(
          Number(amount),
          from.trim(),
          to.trim(),
        )
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
    metode: "GET",
    endpoint: "/api/currency/list",
    name: "currency-list",
    category: "Currency",
    description:
      "This API endpoint provides a comprehensive list of all supported fiat and cryptocurrencies. It gathers data from various sources to ensure the list is up-to-date, making it easy for users to discover which currencies are available for conversion. This endpoint is useful for populating currency selection fields in applications or for users looking to understand the breadth of supported currencies.",
    tags: ["CURRENCY", "LIST", "SUPPORTED"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run() {
      try {
        const currencies = await converter.getSupportedCurrencies()
        return {
          status: true,
          data: currencies,
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
    endpoint: "/api/currency/list",
    name: "currency-list",
    category: "Currency",
    description:
      "This API endpoint provides a comprehensive list of all supported fiat and cryptocurrencies using a POST request. It gathers data from various sources to ensure the list is up-to-date, making it easy for users to discover which currencies are available for conversion. This endpoint is useful for populating currency selection fields in applications or for users looking to understand the breadth of supported currencies.",
    tags: ["CURRENCY", "LIST", "SUPPORTED"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run() {
      try {
        const currencies = await converter.getSupportedCurrencies()
        return {
          status: true,
          data: currencies,
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
    metode: "GET",
    endpoint: "/api/currency/rates",
    name: "currency-rates",
    category: "Currency",
    description:
      "This API endpoint provides current exchange rates for fiat currencies and real-time prices for cryptocurrencies. It aggregates data from various financial APIs to deliver comprehensive and accurate market information. This is ideal for applications that need to display current market trends, perform real-time calculations, or analyze currency fluctuations.",
    tags: ["CURRENCY", "RATES", "MARKET"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run() {
      try {
        const data = await converter.getMarketData()
        return {
          status: true,
          data: data,
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
    endpoint: "/api/currency/rates",
    name: "currency-rates",
    category: "Currency",
    description:
      "This API endpoint provides current exchange rates for fiat currencies and real-time prices for cryptocurrencies using a POST request. It aggregates data from various financial APIs to deliver comprehensive and accurate market information. This is ideal for applications that need to display current market trends, perform real-time calculations, or analyze currency fluctuations.",
    tags: ["CURRENCY", "RATES", "MARKET"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run() {
      try {
        const data = await converter.getMarketData()
        return {
          status: true,
          data: data,
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
    metode: "GET",
    endpoint: "/api/currency/crypto/:symbol",
    name: "crypto-detail",
    category: "Currency",
    description:
      "This API endpoint provides detailed information for a specific cryptocurrency, including its USD price and any available Indodax exchange data (for Indonesian Rupiah conversions). Users can query by cryptocurrency symbol to get current market values and related data points. This is beneficial for cryptocurrency tracking applications, portfolio management tools, or for users interested in specific crypto asset details.",
    tags: ["CURRENCY", "CRYPTO", "DETAIL"],
    example: "?symbol=BTC",
    parameters: [
      {
        name: "symbol",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 10,
        },
        description: "Cryptocurrency symbol",
        example: "BTC",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { symbol } = req.query || {}

      if (!symbol) {
        return {
          status: false,
          error: "Symbol parameter is required",
          code: 400,
        }
      }

      if (typeof symbol !== "string" || symbol.trim().length === 0) {
        return {
          status: false,
          error: "Symbol must be a non-empty string",
          code: 400,
        }
      }

      try {
        await converter.getAllData()
        const upperSymbol = symbol.toUpperCase().trim()

        const result = {
          symbol: upperSymbol,
          usd_price: converter.getCryptoPrice(upperSymbol) || null,
          indodax_data: converter.indodaxData[upperSymbol] || null,
        }

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
    endpoint: "/api/currency/crypto/:symbol",
    name: "crypto-detail",
    category: "Currency",
    description:
      "This API endpoint provides detailed information for a specific cryptocurrency using a POST request, including its USD price and any available Indodax exchange data (for Indonesian Rupiah conversions). Users can query by cryptocurrency symbol to get current market values and related data points. This is beneficial for cryptocurrency tracking applications, portfolio management tools, or for users interested in specific crypto asset details.",
    tags: ["CURRENCY", "CRYPTO", "DETAIL"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            required: ["symbol"],
            properties: {
              symbol: {
                type: "string",
                description: "Cryptocurrency symbol (e.g., BTC, ETH)",
                example: "BTC",
                minLength: 1,
                maxLength: 10,
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
      const { symbol } = req.body || {}

      if (!symbol) {
        return {
          status: false,
          error: "Symbol parameter is required",
          code: 400,
        }
      }

      if (typeof symbol !== "string" || symbol.trim().length === 0) {
        return {
          status: false,
          error: "Symbol must be a non-empty string",
          code: 400,
        }
      }

      try {
        await converter.getAllData()
        const upperSymbol = symbol.toUpperCase().trim()

        const result = {
          symbol: upperSymbol,
          usd_price: converter.getCryptoPrice(upperSymbol) || null,
          indodax_data: converter.indodaxData[upperSymbol] || null,
        }

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