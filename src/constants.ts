import { Tile, Category, FreeSpaceTheme } from './types';

export const FREE_SPACE_THEMES: Record<FreeSpaceTheme, { name: string; swatchBg: string; swatchText: string; bgClass: string; textClass: string }> = {
  terracotta: { name: "Terracotta", swatchBg: "#BC6C25", swatchText: "#FFFFFF", bgClass: "bg-[#BC6C25]", textClass: "text-white" },
  sage: { name: "Forest Sage", swatchBg: "#5A5A40", swatchText: "#FFFFFF", bgClass: "bg-[#5A5A40]", textClass: "text-white" },
  coffee: { name: "Espresso", swatchBg: "#6F4E37", swatchText: "#FFFFFF", bgClass: "bg-[#6F4E37]", textClass: "text-white" },
  rose: { name: "Rose Wood", swatchBg: "#9C4146", swatchText: "#FFFFFF", bgClass: "bg-[#9C4146]", textClass: "text-white" },
  amber: { name: "Warm Amber", swatchBg: "#D4A373", swatchText: "#1A1A1A", bgClass: "bg-[#D4A373]", textClass: "text-[#1A1A1A]" },
};

// Curated library of items to generate random, colorful, and fun Portland book crawl boards.
export const BOOK_CRAWL_ITEMS_MAP: Record<Exclude<Category, 'free'>, string[]> = {
  bookstore: [
    "Visit Powell's City of Books on Burnside (Pick any room block color)",
    "Find a graphic novel or indie zine at a specialized shop like Books with Pictures",
    "Browse the shelves of a cozy neighborhood store in Hawthorne (e.g., Belmont Books)",
    "Discover a vintage treasure or rare edition at a secondhand bookstore in SE Portland",
    "Browse the shelves of an independent bookstore in the Alberta Arts District",
    "Visit Green Bean Books or check out a kid/YA specialized section in NE Portland",
    "Find a book with a hand-written 'Staff Recommendation' label and read it",
    "Pick up a book published by a Pacific Northwest indie publisher (e.g., Tin House)",
    "Browse a book collection focused on feminist, queer, or political literature",
    "Ask a bookstore employee for their absolute favorite mystery or fantasy novel",
    "Visit a sci-fi/fantasy specialized bookshelf and read its back blurb",
    "Spot a bookstore cat, bookstore dog, or some cool store mascots resting in the store"
  ],
  drink: [
    "Sip an aromatic espresso or cold brew at Coava Coffee, Stumptown, or Heart Roasters",
    "Enjoy a cozy cup of local Oregon herbal tea or matcha inside a glass-walled cafe",
    "Read a chapter in a historic McMenamins pub with a local craft beer or cider in hand",
    "Pair your reading with a glass of Oregon Pinot Noir or local Rose in a bookstore cafe",
    "Find a window-side seat in a cafe during a typical misty, rainy Portland afternoon",
    "Read a book while sipping a specialized spiced chai at a SE Portland tea house",
    "Try a locally-crafted kombucha on tap or a botanical soda in NE Portland",
    "Order a drink that matches the cover theme or color of the book you are carrying",
    "Drink an oat milk lavender latte—a quintessential Portland reading companion",
    "Take a cozy beverage-and-book shelfie (take photo or describe your mug setup)"
  ],
  food: [
    "Grab a classic Portland-style donut (Pip's Original, Voodoo, or Blue Star) to snack on",
    "Eat a warm pastry (like a marionberry scone) from a neighborhood bakery",
    "Read a chapter while waiting for a fresh, warm lunch at a local Portland Food Cart Pod",
    "Enjoy a scoop of Salt & Straw or Fifty Licks local ice cream alongside your book",
    "Snack on fresh berries or local nuts bought at a Portland Farmers Market",
    "Devour a warm, gooey vegan chocolate chip cookie while reading a cozy chapter",
    "Enjoy a wood-fired pretzel or warm bread while diving into a dark mystery thriller",
    "Savor a classic grilled cheese sandwich at a local bakery during a rainy spell",
    "Treat yourself to a slice of home-baked marionberry pie at a cozy diner or cafe"
  ],
  prompt: [
    "Read a page or chapter of a book written by Ursula K. Le Guin or another legendary PNW author",
    "Find a book with a dark green, plant-filled, or mossy forest-colored cover art",
    "Read a scene set in a rainy city, a foggy forest, or along a rugged mountain river hook",
    "Read a chapter from a book with a title that has exactly one word",
    "Start reading a book where the main character goes on an epic physical or spiritual journey",
    "Browse a poetry collection and read three poems aloud (or whisper them to yourself!)",
    "Read a translated work by an author who lives on a different continent",
    "Select a book solely by its cover artwork—no looking at reviews or back summaries!",
    "Read a book that contains a map in the front or back pages (bonus points if it's fantasy)",
    "Start a book containing recipes, food, coffee, or botanical plants in the story arc"
  ],
  activity: [
    "Place a pre-loved book in or retrieve a book from a neighborhood Little Free Library",
    "Buy a canvas bookstore tote bag or a custom bookish enamel pin to wear on page crawls",
    "Read a total of three chapters while riding the MAX Light Rail, streetcar, or a local bus",
    "Snap a reading selfie with a beautiful Portland bridge or Mt. Hood in the background",
    "Find a bench under a majestic giant cedar or fir tree in Laurelhurst or Forest Park to read",
    "Collect a cool independent bookstore bookmark from physical checkout counters",
    "Walk at least 5,000 steps through a historic neighborhood (e.g., Mount Tabor or Alberta St)",
    "Recommend a book you've read to a fellow book crawler or a friend online",
    "Attend a bookstore event, register for a future reading, or find an author flyer list",
    "Spot a vintage typewriter or a piece of local artwork inside a bookstore"
  ]
};

export const SEATTLE_BOOK_CRAWL_ITEMS_MAP: Record<Exclude<Category, 'free'>, string[]> = {
  bookstore: [
    "Visit Elliott Bay Book Company in Capitol Hill",
    "Browse Queen Anne Book Company neighborhood shelves",
    "Discover children's & YA reads at Secret Garden Books in Ballard",
    "Browse tech, sci-fi & pop-science at Ada's Technical Books",
    "Find a vintage treasure at Twice Sold Tales or Mercer Street Books",
    "Check out Left Bank Books collective near Pike Place Market",
    "Browse the stacks at Madison Books in Park Madison",
    "Find a hand-written 'Staff Pick' recommendation at an indie store",
    "Pick up a book published by a Pacific Northwest publisher",
    "Spot a cozy bookstore cat resting in a neighborhood shop"
  ],
  drink: [
    "Sip an espresso at Espresso Vivace or Monorail Espresso",
    "Enjoy a craft coffee at Anchorhead or Storyville Coffee",
    "Order a signature lavender latte or dark mocha in Capitol Hill",
    "Sip warm matcha or loose-leaf tea near Green Lake",
    "Read a chapter with a local Washington craft brew or cider in Ballard",
    "Pair a book with a glass of local Washington wine in a cozy lounge",
    "Find a window seat watching rain fall over Puget Sound"
  ],
  food: [
    "Grab fresh hot doughnuts at Top Pot Doughnuts",
    "Enjoy a warm pastry or croque-monsieur from Macrina Bakery",
    "Snack on fresh baked goods from Bakery Nouveau in West Seattle",
    "Eat a hot piroshky from Piroshky Piroshky near Pike Place",
    "Enjoy a scoop of Molly Moon's homemade ice cream with your book",
    "Snack on fresh berries or pastries from a Seattle Farmers Market"
  ],
  prompt: [
    "Read a chapter by Octavia Butler, Ted Chiang, or a Seattle author",
    "Read a scene set near Puget Sound, the Cascade Mountains, or rainy streets",
    "Read a book with a dark green, navy blue, or rain-swept cover",
    "Read a chapter from a book with a map on page 1 or front pages",
    "Select a book solely by its cover artwork in a local shop"
  ],
  activity: [
    "Take the King County Water Taxi or Washington State Ferry while reading",
    "Read a chapter while riding the Seattle Monorail or Link Light Rail",
    "Drop or retrieve a book from a neighborhood Little Free Library",
    "Snap a reading photo with Mt. Rainier or Elliott Bay in the distance",
    "Walk 5,000 steps exploring Ballard, Capitol Hill, or Fremont",
    "Collect an indie bookstore bookmark or sticker at checkout"
  ]
};

export const FREE_SPACE_PROMPTS = [
  "Portland Crawl Free Space 🌲",
  "Powell's City of Books Visit (The Pearl District)",
  "Rose City Reading Haven 📖",
  "PNW Indie Crawl Free Space ☕",
  "Seattle Emerald Crawl Free Space ☕"
];

// Default static 5x5 board layout so players get a perfectly balanced, immediately playable default board.
export const DEFAULT_BOARD_TILES: Omit<Tile, 'row' | 'col' | 'id' | 'completed' | 'completedAt'>[] = [
  // Row 1
  { text: "Visit Powell's on Burnside (Pick any room color)", category: 'bookstore' },
  { text: "Oat milk latte or warm matcha from a local cafe", category: 'drink' },
  { text: "Snack on a local marionberry scone or sweet pastry", category: 'food' },
  { text: "Read a chapter by a legendary PNW author (e.g. Ursula K. Le Guin)", category: 'prompt' },
  { text: "Find a book in a neighborhood Little Free Library", category: 'activity' },

  // Row 2
  { text: "Read in a cozy McMenamins corner with a craft beer or cider", category: 'drink' },
  { text: "Browse the Alberta Arts District book scene", category: 'bookstore' },
  { text: "Grab an iconic Portland donut (Pip's, Voodoo, or Blue Star)", category: 'food' },
  { text: "Read a page where mist, rain, or dense forest is described", category: 'prompt' },
  { text: "Collect a bookmark, sticker, or bookish pin on your crawl", category: 'activity' },

  // Row 3
  { text: "Find a book with a hand-written 'Staff Recommendation'", category: 'prompt' },
  { text: "Read inside a glass-walled cafe while listening to the rain", category: 'drink' },
  // The center is the FREE SPACE
  { text: "Portland Crawl Free Space 🌲", category: 'free' },
  { text: "Grab a bookish bite from a local Portland Food Cart Pod", category: 'food' },
  { text: "Browse specialized shelves of independent bookstores (SE Hawthorne)", category: 'bookstore' },

  // Row 4
  { text: "Read a chapter on public transit (MAX, streetcar, or cozy bus)", category: 'activity' },
  { text: "Pick a book based solely on its gorgeous cover artwork", category: 'prompt' },
  { text: "Enjoy a scoop of Salt & Straw or local ice cream", category: 'food' },
  { text: "Discover a vintage treasure at a secondhand bookstore", category: 'bookstore' },
  { text: "Treat yourself to an aromatic warm spiced chai tea", category: 'drink' },

  // Row 5
  { text: "Read on a park bench under a giant NE/SE neighborhood cedar tree", category: 'activity' },
  { text: "Browse books focused on diverse voices or local zines", category: 'bookstore' },
  { text: "Support a local bakery pastry or vegan snack stop", category: 'food' },
  { text: "Read a highly recommended mystery or poetry book", category: 'prompt' },
  { text: "Fulfill a 5,000 step walk checking out neighborhood murals", category: 'activity' }
];

/**
 * Define the standard winning configurations for a 5x5 grid (rows, cols, diagonals)
 */
export const BINGO_LINES: BingoLine[] = [
  // Rows
  { id: 'row-0', type: 'row', indices: [0, 1, 2, 3, 4], label: 'Row 1 (Top)' },
  { id: 'row-1', type: 'row', indices: [5, 6, 7, 8, 9], label: 'Row 2' },
  { id: 'row-2', type: 'row', indices: [10, 11, 12, 13, 14], label: 'Row 3 (Middle)' },
  { id: 'row-3', type: 'row', indices: [15, 16, 17, 18, 19], label: 'Row 4' },
  { id: 'row-4', type: 'row', indices: [20, 21, 22, 23, 24], label: 'Row 5 (Bottom)' },

  // Columns
  { id: 'col-0', type: 'col', indices: [0, 5, 10, 15, 20], label: 'Column B' },
  { id: 'col-1', type: 'col', indices: [1, 6, 11, 16, 21], label: 'Column I' },
  { id: 'col-2', type: 'col', indices: [2, 7, 12, 17, 22], label: 'Column N' },
  { id: 'col-3', type: 'col', indices: [3, 8, 13, 18, 23], label: 'Column G' },
  { id: 'col-4', type: 'col', indices: [4, 9, 14, 19, 24], label: 'Column O' },

  // Diagonals
  { id: 'diag-0', type: 'diag', indices: [0, 6, 12, 18, 24], label: 'Diagonal ↘' },
  { id: 'diag-1', type: 'diag', indices: [4, 8, 12, 16, 20], label: 'Diagonal ↙' }
];

interface BingoLine {
  id: string;
  type: 'row' | 'col' | 'diag';
  indices: number[];
  label: string;
}

/**
 * Generate a random 5x5 board
 */
export function generateRandomBoard(city: string = "Portland, OR"): Tile[] {
  const result: Tile[] = [];
  const usedTexts = new Set<string>();

  const itemMap = city.includes("Seattle") ? SEATTLE_BOOK_CRAWL_ITEMS_MAP : BOOK_CRAWL_ITEMS_MAP;

  // Create shuffled copies of items
  const shufflers: Record<Exclude<Category, 'free'>, string[]> = {
    bookstore: shuffleArray([...itemMap.bookstore]),
    drink: shuffleArray([...itemMap.drink]),
    food: shuffleArray([...itemMap.food]),
    prompt: shuffleArray([...itemMap.prompt]),
    activity: shuffleArray([...itemMap.activity])
  };

  const categoriesOrder: Exclude<Category, 'free'>[] = ['bookstore', 'drink', 'food', 'prompt', 'activity'];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const index = r * 5 + c;

      // Center is Free Space
      if (r === 2 && c === 2) {
        const freePromptText = city.includes("Seattle")
          ? "Seattle Emerald Crawl Free Space ☕"
          : "Portland Crawl Free Space 🌲";
        usedTexts.add(freePromptText.toLowerCase().trim());
        result.push({
          id: `tile-${index}`,
          row: r,
          col: c,
          text: freePromptText,
          category: 'free',
          completed: false,
          completedAt: null,
          locationName: "",
          notes: "",
          rating: undefined
        });
        continue;
      }

      // Draw an item based on the column category distribution
      const category = categoriesOrder[c];
      let text = "";

      // Try up to 20 times to pick an item not yet used on this board
      let attempts = 0;
      while (attempts < 20) {
        if (shufflers[category].length === 0) {
          shufflers[category] = shuffleArray([...itemMap[category]]);
        }
        const candidate = shufflers[category].pop();
        if (candidate && !usedTexts.has(candidate.toLowerCase().trim())) {
          text = candidate;
          break;
        }
        attempts++;
      }

      if (!text) {
        const cityName = city.includes("Seattle") ? "Seattle" : "Portland";
        text = `Discover a unique ${cityName} ${category} spot (#${index + 1})`;
      }

      usedTexts.add(text.toLowerCase().trim());

      result.push({
        id: `tile-${index}`,
        row: r,
        col: c,
        text,
        category,
        completed: false,
        completedAt: null
      });
    }
  }

  return result;
}

export function detectCityFromBoard(tiles: Tile[]): string {
  if (!tiles || tiles.length === 0) return "Portland, OR";
  
  // Center free space check
  const centerTile = tiles.find(t => t.category === 'free') || tiles[12];
  if (centerTile && centerTile.text) {
    const textLower = centerTile.text.toLowerCase();
    if (textLower.includes("seattle") || textLower.includes("emerald")) {
      return "Seattle, WA";
    }
    if (textLower.includes("portland") || textLower.includes("rose city") || textLower.includes("powell")) {
      return "Portland, OR";
    }
  }

  // Scan all tile texts
  const fullText = tiles.map(t => t.text).join(" ").toLowerCase();
  if (
    fullText.includes("seattle") ||
    fullText.includes("elliott bay") ||
    fullText.includes("pike place") ||
    fullText.includes("monorail") ||
    fullText.includes("ballard") ||
    fullText.includes("queen anne") ||
    fullText.includes("puget sound") ||
    fullText.includes("emerald crawl")
  ) {
    return "Seattle, WA";
  }

  if (
    fullText.includes("portland") ||
    fullText.includes("powell's") ||
    fullText.includes("burnside") ||
    fullText.includes("stumptown") ||
    fullText.includes("hawthorne") ||
    fullText.includes("alberta") ||
    fullText.includes("voodoo") ||
    fullText.includes("pip's") ||
    fullText.includes("mcmenamins") ||
    fullText.includes("rose city")
  ) {
    return "Portland, OR";
  }

  return "Portland, OR";
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
