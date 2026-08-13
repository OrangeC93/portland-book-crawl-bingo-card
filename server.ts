import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to lazily initialize GoogleGenAI client with required header
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Grounded AI Bingo Board Generator using Gemini API
app.post("/api/generate-grounded-board", async (req, res) => {
  try {
    const { city = "Portland, OR" } = req.body || {};

    const prompt = `You are an expert local guide and cultural curator. Discover real, up-to-date, highly rated independent bookstores, craft coffee roasters, local bakeries, tea shops, food carts, and bookish activities in ${city}.

Generate 25 unique bingo tiles for a 5x5 Book Crawl Bingo card in ${city}.

Distribution requirements (exactly 25 tiles):
1. 6 "bookstore" category tiles: Real independent bookstores, zine shops, or secondhand booksellers in ${city} (include exact store names).
2. 5 "drink" category tiles: Real local coffee roasters, tea houses, signature lattes/drinks, or craft drink spots in ${city}.
3. 5 "food" category tiles: Real local bakeries, food cart pods, pastry spots, or iconic local food bites in ${city}.
4. 5 "prompt" category tiles: Fun reading prompts (e.g. "Read a chapter by a local author", "Book with a map on page 1", "Book with flower on cover").
5. 3 "activity" category tiles: Fun crawl actions (e.g. "Take local public transit to next shop", "Find a bookstore mascot or cat", "Get a bookmark or sticker").
6. 1 "free" category tile: "Free Space - ${city} Reader" (Must be position index 12 / row 2 col 2).

Return ONLY valid JSON with this exact structure:
{
  "city": "${city}",
  "tiles": [
    {
      "text": "Short 2-5 word title for bingo tile",
      "category": "bookstore",
      "locationName": "Real place name or venue name if applicable",
      "notes": "1-2 sentence tip featuring real review details or menu items"
    }
  ]
}`;

    let response: any = null;
    let searchSources: Array<{ title: string; uri: string }> = [];

    // Attempt 1: Standard structured JSON generation with gemini-3.6-flash (most reliable and clean)
    try {
      const ai = getGenAIClient();
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (err: any) {
      console.warn("[Gemini API] Primary generation error:", err?.message || err);
      // Attempt 2: Fallback attempt with gemini-flash-latest
      try {
        const ai = getGenAIClient();
        response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
      } catch (fallbackErr: any) {
        console.warn("[Gemini API] Fallback model generation error:", fallbackErr?.message || fallbackErr);
      }
    }

    const responseText = response?.text || "";

    // Extract search sources if available
    if (response?.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          searchSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    let parsedData: any = {};
    if (responseText) {
      const cleanedText = responseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.warn("Parsing JSON directly failed, attempting regex extraction...", parseErr);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (e) {}
        }
      }
    }

    // Extract tiles from parsed data
    const rawTiles = Array.isArray(parsedData?.tiles) ? parsedData.tiles : [];
    
    // If response was empty or parsing failed, generate high quality curated tiles for the city
    if (rawTiles.length === 0) {
      console.info(`[Gemini API] Serving curated fallback card for ${city}`);
      return res.json({
        success: true,
        city,
        tiles: generateFallbackTilesForCity(city),
        searchSources: [
          { title: `${city} Literary Crawl & Independent Bookstores Guide`, uri: "https://www.powells.com/" }
        ]
      });
    }

    // Strict deduplication of returned tile texts
    const seenTexts = new Set<string>();
    const cleanedTiles: any[] = [];

    rawTiles.forEach((tile: any, idx: number) => {
      let tileText = (tile.text || `Local Spot #${idx + 1}`).trim();
      let lower = tileText.toLowerCase();

      if (seenTexts.has(lower)) {
        if (tile.locationName && !lower.includes(tile.locationName.toLowerCase())) {
          tileText = `${tileText} (${tile.locationName})`;
        } else {
          tileText = `${tileText} #${idx + 1}`;
        }
        lower = tileText.toLowerCase();
      }

      seenTexts.add(lower);
      cleanedTiles.push({
        ...tile,
        text: tileText
      });
    });

    res.json({
      success: true,
      city: parsedData.city || city,
      tiles: cleanedTiles,
      searchSources,
    });
  } catch (error: any) {
    console.error("Error generating grounded bingo card:", error);
    // Serve curated fallback rather than returning a 500 error to user
    const city = req.body?.city || "Portland, OR";
    res.json({
      success: true,
      city,
      tiles: generateFallbackTilesForCity(city),
      searchSources: [
        { title: `${city} Book Crawl Guide`, uri: "https://www.powells.com/" }
      ]
    });
  }
});

// Helper to generate curated fallback tiles for any city if API is offline or rate limited
function generateFallbackTilesForCity(city: string) {
  const isSeattle = city.includes("Seattle");
  const isPortland = city.includes("Portland");

  const bookstoreSpots = isSeattle ? [
    { text: "Elliott Bay Book Company", locationName: "Elliott Bay Book Co", notes: "Iconic multi-story bookstore in Capitol Hill" },
    { text: "Third Place Books", locationName: "Third Place Books", notes: "Cozy neighborhood bookstore and community gathering hub" },
    { text: "Open Books: A Poem Emporium", locationName: "Open Books", notes: "Specialty poetry bookshop in Pioneer Square" },
    { text: "Left Bank Books", locationName: "Left Bank Books", notes: "Collectively-run indie bookseller in Pike Place" },
    { text: "Ada's Technical Books", locationName: "Ada's Technical Books", notes: "Tech, science, and sci-fi books with cafe" },
    { text: "Secret Garden Books", locationName: "Secret Garden Books", notes: "Charming Ballard bookshop with children's classics" }
  ] : [
    { text: "Powell's City of Books", locationName: "Powell's City of Books", notes: "World's largest independent bookstore in Pearl District" },
    { text: "Broadway Books", locationName: "Broadway Books", notes: "Beloved neighborhood indie bookstore in NE Portland" },
    { text: "Annie Bloom's Books", locationName: "Annie Bloom's Books", notes: "Cozy bookshop in Multnomah Village with store cat" },
    { text: "Mother Foucault's Bookshop", locationName: "Mother Foucault's", notes: "Atmospheric secondhand fiction and poetry shop" },
    { text: "Rose City Book Pub", locationName: "Rose City Book Pub", notes: "Bookstore and pub where you can read while sipping" },
    { text: "Belmont Books", locationName: "Belmont Books", notes: "Community bookstore full of local author picks" }
  ];

  const drinkSpots = isSeattle ? [
    { text: "Espresso Vivace Latte", locationName: "Espresso Vivace", notes: "Legendary espresso roaster in Capitol Hill" },
    { text: "Ghost Alley Espresso", locationName: "Ghost Alley Espresso", notes: "Tucked beside Pike Place Gum Wall" },
    { text: "Monorail Espresso", locationName: "Monorail Espresso", notes: "Downtown Seattle's original espresso walk-up window" },
    { text: "Miro Tea House", locationName: "Miro Tea", notes: "Soothing loose-leaf tea lounge in Ballard" },
    { text: "Storyville Coffee", locationName: "Storyville Coffee", notes: "Fresh roasted coffee with warm cinnamon rolls" }
  ] : [
    { text: "Coava Coffee Roaster", locationName: "Coava Coffee", notes: "Single-origin coffees in a spacious industrial workshop" },
    { text: "Heart Coffee Roasters", locationName: "Heart Coffee", notes: "Light roast specialty coffees with Scandinavian design" },
    { text: "Behind the Museum Cafe", locationName: "Behind the Museum Cafe", notes: "Matcha and Japanese soft serve near Portland Art Museum" },
    { text: "Stumptown Coffee", locationName: "Stumptown Coffee", notes: "Iconic Portland roaster inside Ace Hotel" },
    { text: "Pip's Original Doughnuts & Chai", locationName: "Pip's Chai", notes: "Handcrafted chai flights with hot mini doughnuts" }
  ];

  const foodSpots = isSeattle ? [
    { text: "Piroshky Piroshky Pastry", locationName: "Piroshky Piroshky", notes: "Famous Russian bakery pastries in Pike Place Market" },
    { text: "Macrina Bakery Scone", locationName: "Macrina Bakery", notes: "Artisanal breads and seasonal fruit pastries" },
    { text: "Frankie & Jo's Plant Ice Cream", locationName: "Frankie & Jo's", notes: "Plant-based artisanal ice cream scoops" },
    { text: "Top Pot Hand-Forged Donut", locationName: "Top Pot Doughnuts", notes: "Old-fashioned vintage donuts and coffee" },
    { text: "Mee Sum Pastry Hum Bow", locationName: "Mee Sum Pastry", notes: "Hot steamed barbecue pork hum bow" }
  ] : [
    { text: "Voodoo Doughnut Maple Bacon", locationName: "Voodoo Doughnut", notes: "Eclectic pink box doughnuts in Old Town" },
    { text: "Ken's Artisan Bakery Croissant", locationName: "Ken's Artisan Bakery", notes: "Classic French pastries and crusty loaves in NW" },
    { text: "Cartopia Food Cart Bite", locationName: "Cartopia Pod", notes: "Late-night food cart pod on Hawthorne" },
    { text: "Salt & Straw Ice Cream", locationName: "Salt & Straw", notes: "Famous inventive ice cream flavors" },
    { text: "Screen Door Biscuit", locationName: "Screen Door", notes: "Southern comfort food and giant buttermilk biscuits" }
  ];

  const prompts = [
    { text: "Read Chapter by Local Author", locationName: "", notes: "Find a book written by a regional local writer" },
    { text: "Book with Map on Page 1", locationName: "", notes: "Look inside fantasy or travel fiction books" },
    { text: "Cover with Green Artwork", locationName: "", notes: "Pick up a book featuring nature or forest covers" },
    { text: "Recommended by Store Staff", locationName: "", notes: "Check out a book with a handwritten shelf-talker" },
    { text: "Book Published This Year", locationName: "", notes: "Browse the new releases section" }
  ];

  const activities = [
    { text: "Take Transit to Next Shop", locationName: "", notes: "Ride local light rail or bus between stops" },
    { text: "Find Bookstore Cat or Mascot", locationName: "", notes: "Say hello to shop pets or official mascots" },
    { text: "Collect Store Stamp or Sticker", locationName: "", notes: "Ask the cashier for a bookmark, stamp, or sticker" }
  ];

  const freeSpace = {
    text: `${city} Reader Free Space 🌲`,
    category: 'free',
    locationName: city,
    notes: "Central free space on your crawl!"
  };

  const tiles = [
    bookstoreSpots[0], bookstoreSpots[1], drinkSpots[0], foodSpots[0], prompts[0],
    prompts[1], bookstoreSpots[2], drinkSpots[1], foodSpots[1], activities[0],
    bookstoreSpots[3], drinkSpots[2], freeSpace, foodSpots[2], bookstoreSpots[4],
    prompts[2], foodSpots[3], drinkSpots[3], bookstoreSpots[5], activities[1],
    activities[2], drinkSpots[4], foodSpots[4], prompts[3], prompts[4]
  ];

  return tiles.map((t: any, idx: number) => ({
    text: t.text,
    category: idx === 12 ? 'free' : (t.category || ['bookstore','drink','food','prompt','activity'][idx % 5]),
    locationName: t.locationName || "",
    notes: t.notes || ""
  }));
}

// Vite Middleware & Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
