import axios from "axios";

interface CountryCoord {
  name: string;
  country: string;
  icon: string;
  latitude: number;
  longitude: number;
}

interface CountryInfo {
  country: string;
  capital: string;
  flag: string;
  phone_code: string;
  continent: string;
  area: {
    km2: number;
    mi2: number;
  };
  is_landlocked: boolean;
  native_language: string;
  language_codes: string[];
  famous_for: string[];
  constitutional_form: string;
  neighbors: string[];
  currency: string;
  drive_direction: string;
  alcohol_prohibition: boolean;
  tld: string;
  iso: {
    numeric: string;
    alpha_2: string;
    alpha_3: string;
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  str1 = str1.toLowerCase().replace(/\s+/g, "");
  str2 = str2.toLowerCase().replace(/\s+/g, "");

  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (str2.includes(str1)) return 0.9;
  if (str1.includes(str2)) return 0.9;

  let matches = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] === str2[i]) matches++;
  }

  const prefixMatch =
    str1.startsWith(str2.slice(0, 3)) || str2.startsWith(str1.slice(0, 3))
      ? 0.2
      : 0;

  return matches / maxLen + prefixMatch;
}

async function scrapeCountryInfo(name: string) {
  try {
    const [coordsResponse, countriesResponse] = await Promise.all([
      axios.get<CountryCoord[]>(
        "https://raw.githubusercontent.com/CoderPopCat/Country-Searcher/refs/heads/master/src/constants/country-coords.json",
        { timeout: 30000 },
      ),
      axios.get<CountryInfo[]>(
        "https://raw.githubusercontent.com/CoderPopCat/Country-Searcher/refs/heads/master/src/constants/countries.json",
        { timeout: 30000 },
      ),
    ]);

    const countriesCoords = coordsResponse.data;
    const countriesInfo = countriesResponse.data;

    const searchName = name.toLowerCase().trim();

    const similarityResults = countriesInfo
      .map((country) => ({
        country,
        similarity: calculateSimilarity(searchName, country.country),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const bestMatch = similarityResults[0];

    if (bestMatch.similarity < 0.4) {
      const suggestions = similarityResults.slice(0, 5).map((r) => ({
        country: r.country.country,
        similarity: r.similarity,
      }));
      throw { status: 404, error: "Country not found", suggestions };
    }

    const countryInfo = bestMatch.country;
    const countryCoord = countriesCoords.find(
      (c) => c.name.toLowerCase() === countryInfo.country.toLowerCase(),
    );

    const continents: { [key: string]: { name: string; emoji: string } } = {
      as: { name: "Asia", emoji: "🌏" },
      eu: { name: "Europe", emoji: "🌍" },
      af: { name: "Africa", emoji: "🌍" },
      na: { name: "North America", emoji: "🌎" },
      sa: { name: "South America", emoji: "🌎" },
      oc: { name: "Oceania", emoji: "🌏" },
      an: { name: "Antarctica", emoji: "🌎" },
    };

    const neighbors = countryInfo.neighbors
      .map((neighborCode) => {
        const neighborCountry = countriesCoords.find(
          (c) => c.country.toLowerCase() === neighborCode.toLowerCase(),
        );
        return neighborCountry
          ? {
            name: neighborCountry.name,
            flag: neighborCountry.icon,
            coordinates: {
              latitude: neighborCountry.latitude,
              longitude: neighborCountry.longitude,
            },
          }
          : null;
      })
      .filter((n) => n !== null);

    return {
      status: true,
      searchMetadata: {
        originalQuery: name,
        matchedCountry: countryInfo.country,
        similarity: bestMatch.similarity,
      },
      data: {
        name: countryInfo.country,
        capital: countryInfo.capital,
        flag: countryInfo.flag,
        phoneCode: countryInfo.phone_code,
        googleMapsLink:
          `https://www.google.com/maps/place/$$${countryInfo.country}/@${countryCoord?.latitude || 0},${countryCoord?.longitude || 0},6z`,
        continent: {
          code: countryInfo.continent,
          name: continents[countryInfo.continent]?.name || "Unknown",
          emoji: continents[countryInfo.continent]?.emoji || "🌐",
        },
        coordinates: {
          latitude: countryCoord?.latitude || null,
          longitude: countryCoord?.longitude || null,
        },
        area: {
          squareKilometers: countryInfo.area.km2,
          squareMiles: countryInfo.area.mi2,
        },
        landlocked: countryInfo.is_landlocked,
        languages: {
          native: countryInfo.native_language,
          codes: countryInfo.language_codes,
        },
        famousFor: countryInfo.famous_for,
        constitutionalForm: countryInfo.constitutional_form,
        neighbors: neighbors,
        currency: countryInfo.currency,
        drivingSide: countryInfo.drive_direction,
        alcoholProhibition: countryInfo.alcohol_prohibition,
        internetTLD: countryInfo.tld,
        isoCode: {
          numeric: countryInfo.iso.numeric,
          alpha2: countryInfo.iso.alpha_2,
          alpha3: countryInfo.iso.alpha_3,
        },
      },
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message,
      };
    }
    throw error;
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/countryInfo",
    name: "country Info",
    category: "Tools",
    description: "This API endpoint provides detailed information about a country based on its name. Users can search for a country using a query parameter, and the API will return comprehensive data including its capital, flag, phone code, continent, geographical coordinates, area, languages, famous features, constitutional form, neighboring countries, currency, driving side, alcohol prohibition status, internet TLD, and ISO codes. The endpoint also includes a similarity matching feature to suggest countries if the input name is not an exact match.",
    tags: ["TOOLS", "COUNTRY", "GEOGRAPHY", "INFORMATION"],
    example: "?name=Indonesia",
    parameters: [
      {
        name: "name",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        description: "The name of the country to search for",
        example: "Indonesia",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { name } = req.query || {};

      if (!name) {
        return {
          status: false,
          error: "Name parameter is required",
          code: 400,
        };
      }

      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await scrapeCountryInfo(name.trim());
        return {
          status: true,
          data: result.data,
          searchMetadata: result.searchMetadata,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        const statusCode = error.status || 500;
        return {
          status: false,
          error: error.error || "Internal Server Error",
          code: statusCode,
          ...(error.suggestions && { suggestions: error.suggestions }),
        };
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/tools/countryInfo",
    name: "country Info",
    category: "Tools",
    description: "This API endpoint provides detailed information about a country based on its name, sent in a JSON request body. Users can submit the country name, and the API will return comprehensive data including its capital, flag, phone code, continent, geographical coordinates, area, languages, famous features, constitutional form, neighboring countries, currency, driving side, alcohol prohibition status, internet TLD, and ISO codes. The endpoint also includes a similarity matching feature to suggest countries if the input name is not an exact match. This method is suitable for programmatic interactions where country data is sent as part of a structured request.",
    tags: ["TOOLS", "COUNTRY", "GEOGRAPHY", "INFORMATION"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                description: "The name of the country to search for",
                example: "Indonesia",
                minLength: 1,
                maxLength: 100,
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
      const { name } = req.body || {};

      if (!name) {
        return {
          status: false,
          error: "Name parameter is required",
          code: 400,
        };
      }

      if (typeof name !== "string" || name.trim().length === 0) {
        return {
          status: false,
          error: "Name parameter must be a non-empty string",
          code: 400,
        };
      }

      try {
        const result = await scrapeCountryInfo(name.trim());
        return {
          status: true,
          data: result.data,
          searchMetadata: result.searchMetadata,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        const statusCode = error.status || 500;
        return {
          status: false,
          error: error.error || "Internal Server Error",
          code: statusCode,
          ...(error.suggestions && { suggestions: error.suggestions }),
        };
      }
    },
  },
];