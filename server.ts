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

// Grounded AI Bingo Board Generator using Gemini Search Grounding
app.post("/api/generate-grounded-board", async (req, res) => {
  try {
    const { city = "Portland, OR" } = req.body || {};

    const ai = getGenAIClient();

    const prompt = `You are an expert local guide and cultural curator. Search the live web using Google Search to discover real, up-to-date, highly rated independent bookstores, craft coffee roasters, local bakeries, tea shops, food carts, and bookish activities in ${city}.

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
      "category": "bookstore" | "drink" | "food" | "prompt" | "activity" | "free",
      "locationName": "Real place name or venue name if applicable",
      "notes": "1-2 sentence tip featuring real review details or menu items found on web search"
    }
  ]
}`;

    let response: any = null;
    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              // Note: Do NOT set responseMimeType: "application/json" when using googleSearch tool
              // to prevent "The string did not match the expected pattern" API validation errors.
            },
          });
          if (response?.text) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini API] Attempt ${attempt} on model ${modelName} failed:`, err?.message || err);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      if (response?.text) break;
    }

    // Fallback: If search tool service is unavailable or rate-limited, try standard generation
    if (!response?.text) {
      console.warn("[Gemini API] Falling back to standard generation without googleSearch tool...");
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
      } catch (err: any) {
        throw lastError || err;
      }
    }

    const responseText = response?.text || "";

    // Extract real web search sources from grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources: Array<{ title: string; uri: string }> = [];

    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        searchSources.push({
          title: chunk.web.title,
          uri: chunk.web.uri,
        });
      }
    });

    let parsedData: any = {};
    const cleanedText = responseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn("Parsing JSON directly failed, attempting regex extraction...", parseErr);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Unable to parse structured JSON from Gemini response.");
      }
    }

    // Strict deduplication of returned tile texts
    const rawTiles = Array.isArray(parsedData.tiles) ? parsedData.tiles : [];
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
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate web-grounded bingo board.",
    });
  }
});

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
