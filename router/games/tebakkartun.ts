import axios from "axios"

async function scrape() {
  try {
    let src = [
      {
        name: "Tom and Jerry",
        img: "https://i.pinimg.com/736x/c2/f0/97/c2f0975cc0cb2985e359abce2461e986.jpg",
      },
      {
        name: "Mickey Mouse",
        img: "https://i.pinimg.com/736x/9e/bc/77/9ebc77ae4c7dca6ec3f342958d7b2cae.jpg",
      },
      {
        name: "Donald Duck",
        img: "https://i.pinimg.com/736x/6e/a7/d4/6ea7d415f9b6abe951fb1b43dc1e094f.jpg",
      },
      {
        name: "Scooby Doo",
        img: "https://i.pinimg.com/736x/68/76/fb/6876fb80983d8a780977c351fe65c54c.jpg",
      },
      {
        name: "The Flintstones",
        img: "https://i.pinimg.com/736x/3d/24/16/3d2416dbde61723402736548b72bd99b.jpg",
      },
      {
        name: "Popeye",
        img: "https://i.pinimg.com/736x/dc/48/a3/dc48a378fb3a86b744a0229d9ba36127.jpg",
      },
      {
        name: "SpongeBob SquarePants",
        img: "https://i.pinimg.com/736x/d2/b2/49/d2b2493f88da017b20b2f5ae1ad6be86.jpg",
      },
      {
        name: "Dora the Explorer",
        img: "https://i.pinimg.com/736x/35/a0/02/35a0020ad541c8d1d6428e119b523560.jpg",
      },
      {
        name: "Ben 10",
        img: "https://i.pinimg.com/736x/8a/f4/52/8af45205d34223f47b51f14edffce4e5.jpg",
      },
      {
        name: "Teenage Mutant Ninja Turtles",
        img: "https://i.pinimg.com/736x/59/72/c4/5972c4fd49d8343cb0d27201d5d861c0.jpg",
      },
      {
        name: "The Pink Panther",
        img: "https://i.pinimg.com/736x/4c/35/a1/4c35a178ac9b02dd3f5c64142ec8cb54.jpg",
      },
      {
        name: "Bugs Bunny",
        img: "https://i.pinimg.com/736x/8e/4c/16/8e4c16d699ca1b53ef3b8e935a9e1034.jpg",
      },
      {
        name: "Tweety",
        img: "https://i.pinimg.com/736x/e6/10/dc/e610dcb4430927c1d4f3b4a1e8476f14.jpg",
      },
      {
        name: "Sylvester",
        img: "https://i.pinimg.com/736x/0b/c0/7a/0bc07a3334a40578adecaadb829dcee2.jpg",
      },
      {
        name: "Daffy Duck",
        img: "https://i.pinimg.com/736x/21/71/b8/2171b82513f2ef7001ab9b83123c933e.jpg",
      },
      {
        name: "Porky Pig",
        img: "https://i.pinimg.com/736x/88/69/b4/8869b464d10c872572beeca9d33e4bea.jpg",
      },
      {
        name: "Woody Woodpecker",
        img: "https://i.pinimg.com/736x/ce/32/7c/ce327cb85461b3a3db2a6d8e9a95f442.jpg",
      },
      {
        name: "Road Runner",
        img: "https://i.pinimg.com/736x/d3/c1/d0/d3c1d05709d6cf2e3529271a3cbdeb23.jpg",
      },
      {
        name: "Wile E. Coyote",
        img: "https://i.pinimg.com/736x/56/4e/58/564e58e5d13c2664cf7c6ae3cb808ffa.jpg",
      },
      {
        name: "Garfield",
        img: "https://i.pinimg.com/736x/85/9f/09/859f09faf16470f5b10dc4480190fbbf.jpg",
      },
      {
        name: "The Smurfs",
        img: "https://i.pinimg.com/736x/49/df/d3/49dfd33c1d0c02a56dc89a4f23495f4a.jpg",
      },
      {
        name: "Inspector Gadget",
        img: "https://i.pinimg.com/736x/0a/3d/60/0a3d605f6265fbe9f229af368a5b56fb.jpg",
      },
      {
        name: "DuckTales",
        img: "https://i.pinimg.com/736x/f8/4e/80/f84e80b9d44ed7661be004cba7c88098.jpg",
      },
      {
        name: "Chip and Dale",
        img: "https://i.pinimg.com/736x/fe/11/af/fe11af8a6cba02993fef301a6369691b.jpg",
      },
      {
        name: "Goofy",
        img: "https://i.pinimg.com/736x/bf/e8/ce/bfe8ce9021e299f84a101862f181faac.jpg",
      },
      {
        name: "Pluto",
        img: "https://i.pinimg.com/736x/24/d4/62/24d4621de1aa4807644dff091207b3c9.jpg",
      },
      {
        name: "The Jetsons",
        img: "https://i.pinimg.com/736x/e2/e0/03/e2e00313ad19c89a94dcd779813ab95d.jpg",
      },
      {
        name: "Yogi Bear",
        img: "https://i.pinimg.com/736x/01/55/38/015538ed293a7739f2b49a3314a765ce.jpg",
      },
      {
        name: "Boo Boo Bear",
        img: "https://i.pinimg.com/736x/76/c8/2f/76c82fe2724f3e799a6820e38d7a79a4.jpg",
      },
      {
        name: "Fred Flintstone",
        img: "https://i.pinimg.com/736x/07/11/d0/0711d0ba95a7d8eba56add44cd145af6.jpg",
      },
      {
        name: "Barney Rubble",
        img: "https://i.pinimg.com/736x/b7/24/b8/b724b8d6f8855b8383ae99aaaa9a55af.jpg",
      },
      {
        name: "Betty Boop",
        img: "https://i.pinimg.com/736x/ce/53/d2/ce53d21013675ccafee2088234d3ad34.jpg",
      },
      {
        name: "Felix the Cat",
        img: "https://i.pinimg.com/736x/3f/f3/97/3ff39709b21abf120eaf9538f734aaf9.jpg",
      },
      {
        name: "Tayo the Little Bus",
        img: "https://i.pinimg.com/736x/d4/89/d3/d489d385be83e9eee8d3e6aea15e32eb.jpg",
      },
      {
        name: "Mr. Bean",
        img: "https://i.pinimg.com/736x/5d/c3/19/5dc3193d206fa1ec0cfcb4ced4aa8437.jpg",
      },
      {
        name: "Masha and the Bear",
        img: "https://i.pinimg.com/736x/3b/2d/e5/3b2de5ef8907b65a6200786d0b84c04d.jpg",
      },
      {
        name: "Rabbids Invasion",
        img: "https://i.pinimg.com/736x/2c/96/d7/2c96d7097e49f09579b559c7ed76619c.jpg",
      },
      {
        name: "Bernard",
        img: "https://i.pinimg.com/736x/fe/0a/4c/fe0a4cf3d98d9a03d60017d8ea8eded9.jpg",
      },
      {
        name: "Shaun the Sheep",
        img: "https://i.pinimg.com/736x/31/1e/bf/311ebf78d5818c444e880aaa1b4495f9.jpg",
      },
      {
        name: "Toy Story",
        img: "https://i.pinimg.com/736x/80/34/08/803408c280ebb74217e40f93b1892195.jpg",
      },
      {
        name: "The Powerpuff Girls",
        img: "https://i.pinimg.com/736x/93/4e/40/934e40553bfe002df5267b0f08bd6bd1.jpg",
      },
      {
        name: "Oddbods",
        img: "https://i.pinimg.com/736x/0f/bb/5a/0fbb5ab3997d26e60cd078ac7cd57a91.jpg",
      },
      {
        name: "PAW Patrol",
        img: "https://i.pinimg.com/736x/87/bb/77/87bb779bd3700b1d469316e851a2c50f.jpg",
      },
      {
        name: "Adit Sopo Jarwo",
        img: "https://i.pinimg.com/736x/0b/d7/40/0bd74092c0a2a19e4ce6cff8c79cd032.jpg",
      },
      {
        name: "Tayo the Little Bus",
        img: "https://i.pinimg.com/736x/d4/89/d3/d489d385be83e9eee8d3e6aea15e32eb.jpg",
      },
      {
        name: "Kung Fu Panda",
        img: "https://i.pinimg.com/736x/f7/9f/28/f79f28d0c5e5d73daa13b332b580e817.jpg",
      },
      {
        name: "Shinbi's House",
        img: "https://i.pinimg.com/736x/62/b9/5d/62b95dfa2311fa2b3858ce7a250e9eb9.jpg",
      },
      {
        name: "Hello Jadoo",
        img: "https://i.pinimg.com/736x/0a/d1/f0/0ad1f048850760a15ccd2ec458fbb6bb.jpg",
      },
      {
        name: "We Bare Bears",
        img: "https://i.pinimg.com/736x/41/6f/15/416f15639984ca015fc351700538f687.jpg",
      },
      {
        name: "Ejen Ali",
        img: "https://i.pinimg.com/736x/ca/7f/e4/ca7fe4c72b74e026d542a66a10d27168.jpg",
      },
      {
        name: "Upin & Ipin",
        img: "https://i.pinimg.com/736x/79/d9/40/79d940ca8beb88b553a8cd1e044d4c3e.jpg",
      },
    ]
    return src[Math.floor(Math.random() * src.length)]
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Error fetching data: " + error.message)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/tebakkartun",
    name: "tebak kartun",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Kartun' (guess the cartoon) question. Each request delivers an image of a cartoon character or scene, challenging users to identify the correct cartoon title. This endpoint is ideal for entertainment applications, cartoon fan quizzes, or any platform focused on testing knowledge of popular animated series. The response will be a JSON object containing the cartoon's image URL and its correct name.",
    tags: ["Games", "Cartoon", "Quiz", "Guessing Game", "Entertainment"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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
    endpoint: "/api/games/tebakkartun",
    name: "tebak kartun",
    category: "Games",
    description: "This API endpoint provides a random 'Tebak Kartun' (guess the cartoon) question. Each request delivers an image of a cartoon character or scene, challenging users to identify the correct cartoon title. This endpoint is ideal for entertainment applications, cartoon fan quizzes, or any platform focused on testing knowledge of popular animated series. The response will be a JSON object containing the cartoon's image URL and its correct name.",
    tags: ["Games", "Cartoon", "Quiz", "Guessing Game", "Entertainment"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

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
]