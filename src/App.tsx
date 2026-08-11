import { useState, useEffect, useRef, useMemo, MouseEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  BookOpen,
  Coffee,
  Utensils,
  Sparkles,
  Compass,
  MapPin,
  Check,
  Clock,
  RotateCcw,
  Volume2,
  VolumeX,
  Star,
  Award,
  X,
  BookCheck,
  AlertCircle,
  Share2,
  Camera,
  Save,
  Trash2,
  History,
  FolderHeart,
  Download,
  FileText,
  Printer,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Building2,
  Vote,
  Send,
  Globe,
  CheckCircle2,
  Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Tile, Category, BingoLine, SavedCrawl } from './types';
import { DEFAULT_BOARD_TILES, BINGO_LINES, generateRandomBoard, detectCityFromBoard } from './constants';

const PRESET_STICKERS = [
  { char: "📚", name: "Crawl Reads" },
  { char: "☕", name: "Warm Mug" },
  { char: "🌹", name: "Rose City" },
  { char: "🌲", name: "PNW Cedar" },
  { char: "🐱", name: "Shop Cat" },
  { char: "🍦", name: "Sweet Scoop" },
  { char: "🌧️", name: "Rainy Streets" },
  { char: "🍁", name: "Oregon Fall" },
];

// Helper to compress uploaded images to save localStorage space (limit ~12KB per image)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Map long descriptive sentences of bookstore grid to highly stylized, ultra-readable 2-4 word titles
export function getShortTileText(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes("powell's city of books visit")) return "Powell's Pearl";
  if (lower.includes("powell's on burnside") || lower.includes("powell's city of books on burnside") || lower.includes("city of books")) return "Powell's Burnside";
  
  if (lower.includes("oat milk latte") || lower.includes("lavender latte")) return "Oat Lavender Latte";
  if (lower.includes("marionberry scone") || lower.includes("marionberry pie")) return "Marionberry Scone";
  if (lower.includes("ursula k. le guin") || lower.includes("pnw author")) return "PNW Author Read";
  if (lower.includes("little free library")) return "Little Free Library";
  
  if (lower.includes("mcmenamins")) return "McMenamins Read";
  if (lower.includes("alberta arts district") || lower.includes("alberta arts scene")) return "Alberta Arts District";
  if (lower.includes("iconic portland donut") || lower.includes("portland-style donut")) return "Portland Donut";
  if (lower.includes("mist, rain, or dense forest") || lower.includes("rainy city, a foggy forest")) return "Misty Weather Read";
  if (lower.includes("bookmark") || lower.includes("sticker, or bookish pin")) return "Bookmark or Pin";
  
  if (lower.includes("staff recommendation") || lower.includes("staff-written")) return "Staff Pick Read";
  if (lower.includes("glass-walled cafe")) return "Glass-Walled Cafe";
  if (lower.includes("food cart pod")) return "Food Cart Pod Bite";
  if (lower.includes("se hawthorne")) return "SE Hawthorne Crawl";
  
  if (lower.includes("public transit") || lower.includes("max light rail")) return "Transit Reading";
  if (lower.includes("gorgeous cover artwork") || lower.includes("solely by its cover")) return "Select by Cover Art";
  if (lower.includes("salt & straw") || lower.includes("scoop of")) return "Salt & Straw Scoop";
  if (lower.includes("vintage treasure") || lower.includes("secondhand bookstore")) return "Secondhand Bookstore";
  if (lower.includes("spiced chai")) return "Spiced Chai Tea";
  
  if (lower.includes("giant cedar") || lower.includes("under a majestic giant")) return "Giant Cedar Read";
  if (lower.includes("diverse voices") || lower.includes("feminist, queer")) return "Diverse / Zine Shop";
  if (lower.includes("local bakery pastry") || lower.includes("warm pastry")) return "Bakery Pastry Stop";
  if (lower.includes("recommended mystery") || lower.includes("poetry collection")) return "Mystery or Poetry";
  if (lower.includes("5,000 step")) return "5,000 Step Walk";

  if (lower.includes("zine at a specialized shop")) return "Indie Zine Shop";
  if (lower.includes("green bean books") || lower.includes("kid/ya")) return "Green Bean / YA";
  if (lower.includes("mascot")) return "View Cozy Mascot";
  if (lower.includes("herbal tea")) return "Cozy Herbal Tea";
  if (lower.includes("pinot noir")) return "Oregon Wine Glass";
  if (lower.includes("kombucha on tap")) return "Kombucha on Tap";
  if (lower.includes("sweet pastry") || lower.includes("bakery")) return "Cozy Bakery Treat";
  if (lower.includes("chocolate chip cookie")) return "Fresh Baked Cookie";
  if (lower.includes("translated work")) return "Translated Read";
  if (lower.includes("map in the front")) return "Book with a Map";
  if (lower.includes("recipes, food, coffee")) return "Botanical Read";
  if (lower.includes("tote bag")) return "Bookstore Tote Bag";
  if (lower.includes("selfie with a beautiful portland bridge")) return "Bridge Read Selfie";
  if (lower.includes("typewriter")) return "Typewriter Spot";

  // General fallback: if too long, truncate gracefully
  if (text.length > 25) {
    const words = text.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
  }
  return text;
}

// Deep default board mapper helper
function getDefaultBoard(): Tile[] {
  return DEFAULT_BOARD_TILES.map((item, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;

    return {
      id: `tile-${index}`,
      row,
      col,
      text: item.text,
      category: item.category as Category,
      completed: false,
      completedAt: null,
      locationName: "",
      notes: "",
      rating: undefined
    };
  });
}

// category colors & icons mapping in Natural Tones theme
const CATEGORY_COLORS: Record<Category, { text: string; bg: string; border: string; accent: string; label: string; icon: any }> = {
  bookstore: {
    text: "text-[#5A5A40]",
    bg: "bg-[#F1F3E1]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#5A5A40]",
    label: "Bookstore",
    icon: BookOpen
  },
  drink: {
    text: "text-[#8B4513]",
    bg: "bg-[#F5EFEB]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#8B4513]",
    label: "Drink Hub",
    icon: Coffee
  },
  food: {
    text: "text-[#BC6C25]",
    bg: "bg-[#FAF0E6]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#BC6C25]",
    label: "Local Food",
    icon: Utensils
  },
  prompt: {
    text: "text-[#4C5B3E]",
    bg: "bg-[#EFF2E6]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#4C5B3E]",
    label: "Reading Prompt",
    icon: Sparkles
  },
  activity: {
    text: "text-[#6F4E37]",
    bg: "bg-[#FDFBF7]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#6F4E37]",
    label: "Crawl Activity",
    icon: Compass
  },
  free: {
    text: "text-[#5A5A40]",
    bg: "bg-[#F1F3E1]",
    border: "border-[#D9D1C7]",
    accent: "bg-[#5A5A40]",
    label: "Free Space",
    icon: MapPin
  }
};

export default function App() {
  // --- STATE ---
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const saved = localStorage.getItem('portland_book_crawl_tiles_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Error loading tiles:", e); }
    }
    return getDefaultBoard();
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('portland_book_crawl_start_time_v1');
    return saved ? Number(saved) : null;
  });

  const [challengeActive, setChallengeActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('portland_book_crawl_challenge_active_v1');
    return saved === 'true';
  });

  const [completedBingoTimes, setCompletedBingoTimes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('portland_book_crawl_completed_bingos_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Error loading bingos:", e); }
    }
    return {};
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('portland_book_crawl_sound_v1');
    return saved !== 'false'; // defaults to true
  });

  // UI state
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [showResetWarning, setShowResetWarning] = useState<boolean>(false);
  const [showShuffleWarning, setShowShuffleWarning] = useState<boolean>(false);
  const [recentCelebratedLine, setRecentCelebratedLine] = useState<BingoLine | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("24:00:00");
  const [timeLeftPerc, setTimeLeftPerc] = useState<number>(100);
  const [showEndCrawlModal, setShowEndCrawlModal] = useState<boolean>(false);
  const [endCrawlProposedName, setEndCrawlProposedName] = useState<string>("");

  // Export & Share Card states & ref
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Modal Editing Draft States
  const [draftTileText, setDraftTileText] = useState<string>("");
  const [draftLocation, setDraftLocation] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [draftRating, setDraftRating] = useState<number>(5);
  const [draftCompleted, setDraftCompleted] = useState<boolean>(false);
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string>("");

  // Crawls Collection Saved state
  const [savedCrawls, setSavedCrawls] = useState<SavedCrawl[]>(() => {
    const saved = localStorage.getItem('portland_book_crawl_saved_crawls_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Error loading saved crawls:", e); }
    }
    return [];
  });
  const [newCrawlName, setNewCrawlName] = useState<string>("");
  const [viewingSavedId, setViewingSavedId] = useState<string | null>(null);

  // Expanding Cities nomination modal state
  const [showCityNominationModal, setShowCityNominationModal] = useState<boolean>(false);
  const [selectedCityOption, setSelectedCityOption] = useState<string>("Seattle, WA");
  const [customCityText, setCustomCityText] = useState<string>("");
  const [nominationEmail, setNominationEmail] = useState<string>("");
  const [submittedCityVote, setSubmittedCityVote] = useState<string | null>(() => {
    return localStorage.getItem('portland_book_crawl_voted_city_v1') || null;
  });
  const [nominationSubmitted, setNominationSubmitted] = useState<boolean>(false);

  const handleVoteForCity = (e: FormEvent) => {
    e.preventDefault();
    const finalCity = selectedCityOption === "Other" ? (customCityText.trim() || "Custom City") : selectedCityOption;
    if (!finalCity) return;

    playSound('win');
    localStorage.setItem('portland_book_crawl_voted_city_v1', finalCity);
    setSubmittedCityVote(finalCity);
    setNominationSubmitted(true);

    // Send submission email notification directly via FormSubmit AJAX service
    try {
      fetch("https://formsubmit.co/ajax/cr.awangg@gmail.com", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New City Nomination: ${finalCity} (Book Crawl Bingo)`,
          NominatedCity: finalCity,
          UserEmail: nominationEmail || "Anonymous Reader",
          SubmittedAt: new Date().toLocaleString(),
          Source: "book-crawl-bingo-card.com"
        })
      }).catch(err => console.log("City submission logged locally:", err));
    } catch (err) {
      console.log("Submission error:", err);
    }

    confetti({
      particleCount: 30,
      spread: 60,
      colors: ['#5A5A40', '#BC6C25', '#FAF6F0']
    });

    setTimeout(() => {
      setShowCityNominationModal(false);
      setNominationSubmitted(false);
    }, 2200);
  };

  // --- AI SEARCH GROUNDING STATE & HANDLER ---
  const [currentCity, setCurrentCity] = useState<string>(() => {
    return localStorage.getItem('portland_book_crawl_city_v1') || "Portland, OR";
  });
  useEffect(() => {
    localStorage.setItem('portland_book_crawl_city_v1', currentCity);
  }, [currentCity]);

  const [shuffleTargetCity, setShuffleTargetCity] = useState<string>("Portland, OR");
  const [isGeneratingGrounded, setIsGeneratingGrounded] = useState<boolean>(false);
  const [groundedSources, setGroundedSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [selectedCityForAI, setSelectedCityForAI] = useState<string>("Portland, OR");
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState<boolean>(false);
  const [groundedError, setGroundedError] = useState<string | null>(null);

  const handleGenerateGroundedBoard = async (cityToSearch: string) => {
    setIsGeneratingGrounded(true);
    setGroundedError(null);
    playSound('click');

    try {
      const res = await fetch("/api/generate-grounded-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityToSearch })
      });

      const data = await res.json();
      if (!data.success || !Array.isArray(data.tiles) || data.tiles.length === 0) {
        throw new Error(data.error || "Failed to fetch web-grounded local spots.");
      }

      const newTiles: Tile[] = data.tiles.map((item: any, index: number) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        const validCategories: Category[] = ['bookstore', 'drink', 'food', 'prompt', 'activity', 'free'];
        const category: Category = validCategories.includes(item.category)
          ? item.category
          : (index === 12 ? 'free' : 'activity');

        return {
          id: `tile-ai-${Date.now()}-${index}`,
          row,
          col,
          text: item.text || "Explore Local Spot",
          category,
          completed: index === 12,
          completedAt: index === 12 ? Date.now() : null,
          locationName: item.locationName || "",
          notes: item.notes || "",
          rating: undefined
        };
      });

      setTiles(newTiles);
      setCurrentCity(cityToSearch);
      setGroundedSources(data.searchSources || []);
      setStartTime(null);
      setChallengeActive(false);
      setCompletedBingoTimes({});
      setShowAIGeneratorModal(false);
      playSound('win');

      confetti({
        particleCount: 50,
        spread: 75,
        colors: ['#5A5A40', '#BC6C25', '#ECC52C']
      });
    } catch (err: any) {
      console.error("Error generating grounded board:", err);
      setGroundedError(err.message || "Failed to connect to Gemini Search Grounding service.");
    } finally {
      setIsGeneratingGrounded(false);
    }
  };

  // --- AUDIO SYNTHESIS ---
  const playSound = (type: 'click' | 'toggle' | 'completed' | 'win' | 'badge') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'click' || type === 'toggle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'click' ? 400 : 500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(type === 'click' ? 520 : 650, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'completed') {
        // High sparkling bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'win') {
        // Grand fanfar chord (C major: C4 -> E4 -> G4 -> C5 -> E5 cascades)
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.07);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + index * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.07 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.07);
          osc.stop(ctx.currentTime + index * 0.07 + 0.45);
        });
      }
    } catch (e) {
      console.warn("AudioContext blocked or un-instantiated:", e);
    }
  };

  // --- SAVE STATE PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('portland_book_crawl_tiles_v1', JSON.stringify(tiles));
  }, [tiles]);

  useEffect(() => {
    if (startTime) {
      localStorage.setItem('portland_book_crawl_start_time_v1', startTime.toString());
    } else {
      localStorage.removeItem('portland_book_crawl_start_time_v1');
    }
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem('portland_book_crawl_challenge_active_v1', challengeActive.toString());
  }, [challengeActive]);

  useEffect(() => {
    localStorage.setItem('portland_book_crawl_sound_v1', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('portland_book_crawl_saved_crawls_v2', JSON.stringify(savedCrawls));
  }, [savedCrawls]);

  // --- 24-HOUR COUNTDOWN TIMER LOGIC ---
  useEffect(() => {
    if (!challengeActive || !startTime) {
      setTimeLeftStr("24:00:00");
      setTimeLeftPerc(100);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = startTime + 24 * 60 * 60 * 1000;
      const diff = endTime - now;

      if (diff <= 0) {
        // Countdown completed, 24-hr challenge finished!
        setTimeLeftStr("00:00:00");
        setTimeLeftPerc(0);
        setChallengeActive(false);
        clearInterval(interval);
        
        playSound('win');
        setEndCrawlProposedName(`24-Hour Crawl Finished - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 🌲📚`);
        setShowEndCrawlModal(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const hStr = hours.toString().padStart(2, '0');
        const mStr = minutes.toString().padStart(2, '0');
        const sStr = seconds.toString().padStart(2, '0');

        setTimeLeftStr(`${hStr}:${mStr}:${sStr}`);
        setTimeLeftPerc((diff / (24 * 60 * 60 * 1000)) * 100000000 / 1000000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challengeActive, startTime]);

  // --- RECAP EXPORT & DOWNLOAD HANDLERS ---
  const waitForCardElement = async (): Promise<HTMLElement | null> => {
    for (let i = 0; i < 20; i++) {
      const el = exportCardRef.current || document.getElementById('exportable-recap-card');
      if (el) return el;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  };

  const parseAndConvertOklch = (str: string): string => {
    if (!str) return str;
    if (!str.includes('oklch') && !str.includes('oklab')) return str;

    const gamma = (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      return clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    let converted = str;

    // 1. Convert oklch(...)
    converted = converted.replace(/oklch\(\s*([\d.%]+)\s+([\d.%-]+)\s+([\d.%-]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi, (_match, rawL, rawC, rawH, rawA) => {
      try {
        let L = parseFloat(rawL);
        if (rawL.includes('%')) L /= 100;

        let C = parseFloat(rawC);
        if (rawC.includes('%')) C /= 100;

        let H = parseFloat(rawH);

        let A = 1;
        if (rawA !== undefined) {
          A = parseFloat(rawA);
          if (rawA.includes('%')) A /= 100;
        }

        const rad = (H * Math.PI) / 180;
        const a = C * Math.cos(rad);
        const b = C * Math.sin(rad);

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const r = Math.round(gamma(rLin) * 255);
        const g = Math.round(gamma(gLin) * 255);
        const bComp = Math.round(gamma(bLin) * 255);

        if (A < 1) {
          return `rgba(${r}, ${g}, ${bComp}, ${A.toFixed(3)})`;
        }
        return `rgb(${r}, ${g}, ${bComp})`;
      } catch {
        return 'rgb(120, 110, 100)';
      }
    });

    // 2. Convert oklab(...)
    converted = converted.replace(/oklab\(\s*([\d.%]+)\s+([\d.%-]+)\s+([\d.%-]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi, (_match, rawL, rawAVal, rawBVal, rawAlpha) => {
      try {
        let L = parseFloat(rawL);
        if (rawL.includes('%')) L /= 100;

        let a = parseFloat(rawAVal);
        if (rawAVal.includes('%')) a /= 100;

        let b = parseFloat(rawBVal);
        if (rawBVal.includes('%')) b /= 100;

        let A = 1;
        if (rawAlpha !== undefined) {
          A = parseFloat(rawAlpha);
          if (rawAlpha.includes('%')) A /= 100;
        }

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const r = Math.round(gamma(rLin) * 255);
        const g = Math.round(gamma(gLin) * 255);
        const bComp = Math.round(gamma(bLin) * 255);

        if (A < 1) {
          return `rgba(${r}, ${g}, ${bComp}, ${A.toFixed(3)})`;
        }
        return `rgb(${r}, ${g}, ${bComp})`;
      } catch {
        return 'rgb(120, 110, 100)';
      }
    });

    // 3. Fallback scrub any leftover oklch or oklab expressions so html2canvas never crashes
    if (converted.includes('oklch')) {
      converted = converted.replace(/oklch\([^)]+\)/gi, 'rgb(120, 110, 100)');
    }
    if (converted.includes('oklab')) {
      converted = converted.replace(/oklab\([^)]+\)/gi, 'rgb(120, 110, 100)');
    }
    return converted;
  };

  const fixOklchInClonedDoc = (clonedDoc: Document) => {
    const hasModernColor = (s?: string | null) => s && (s.includes('oklch') || s.includes('oklab'));

    // 1. Process all <style> elements
    const styleEls = clonedDoc.querySelectorAll('style');
    styleEls.forEach((styleEl) => {
      if (hasModernColor(styleEl.textContent)) {
        styleEl.textContent = parseAndConvertOklch(styleEl.textContent!);
      }
    });

    // 2. Process stylesheet rules directly if accessible
    try {
      Array.from(clonedDoc.styleSheets).forEach((sheet) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach((rule) => {
              if (hasModernColor(rule.cssText)) {
                if ((rule as CSSStyleRule).style && (rule as CSSStyleRule).style.cssText) {
                  (rule as CSSStyleRule).style.cssText = parseAndConvertOklch((rule as CSSStyleRule).style.cssText);
                }
              }
            });
          }
        } catch {
          // ignore cross-origin sheet errors
        }
      });
    } catch {
      // ignore
    }

    // 3. Process inline style attributes and computed properties on all elements
    const allEls = clonedDoc.querySelectorAll('*');
    const view = clonedDoc.defaultView || window;

    allEls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl) return;

      const styleAttr = htmlEl.getAttribute && htmlEl.getAttribute('style');
      if (hasModernColor(styleAttr)) {
        htmlEl.setAttribute('style', parseAndConvertOklch(styleAttr!));
      }

      if (htmlEl.style && hasModernColor(htmlEl.style.cssText)) {
        htmlEl.style.cssText = parseAndConvertOklch(htmlEl.style.cssText);
      }

      try {
        const computed = view.getComputedStyle(htmlEl);
        const propsToFix = ['color', 'background-color', 'border-color', 'outline-color', 'fill', 'stroke', 'box-shadow'];
        propsToFix.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && typeof val === 'string' && hasModernColor(val)) {
            const fixedVal = parseAndConvertOklch(val);
            htmlEl.style.setProperty(prop, fixedVal);
          }
        });
      } catch {
        // Ignore unattached element errors
      }
    });

    // 4. Clean layout un-clipping and vertical-alignment fixing for cloned card
    const clonedCard = clonedDoc.getElementById('exportable-recap-card');
    if (clonedCard) {
      let current: HTMLElement | null = clonedCard;
      while (current && current !== clonedDoc.body) {
        current.style.maxHeight = 'none';
        current.style.height = 'auto';
        current.style.overflow = 'visible';
        current = current.parentElement;
      }
      clonedDoc.body.style.maxHeight = 'none';
      clonedDoc.body.style.height = 'auto';
      clonedDoc.body.style.overflow = 'visible';

      // Ensure crisp desktop container width for canvas rendering
      clonedCard.style.width = '780px';
      clonedCard.style.maxWidth = '780px';
      clonedCard.style.boxSizing = 'border-box';
      clonedCard.style.margin = '0 auto';

      // 1) Fix Bingo tiles & text vertical centering for html2canvas
      const tiles = clonedCard.querySelectorAll('.bingo-tile');
      tiles.forEach((t) => {
        const ht = t as HTMLElement;
        ht.style.display = 'flex';
        ht.style.flexDirection = 'column';
        ht.style.alignItems = 'center';
        ht.style.justifyContent = 'center';
        ht.style.textAlign = 'center';
        ht.style.position = 'relative';
        ht.style.minHeight = '82px';
        ht.style.height = '82px';
        ht.style.padding = '6px';
        ht.style.boxSizing = 'border-box';
        ht.style.overflow = 'hidden';

        const textContainer = ht.querySelector('.tile-text-container') as HTMLElement;
        if (textContainer) {
          textContainer.style.display = 'flex';
          textContainer.style.flexDirection = 'column';
          textContainer.style.alignItems = 'center';
          textContainer.style.justifyContent = 'center';
          textContainer.style.textAlign = 'center';
          textContainer.style.width = '100%';
          textContainer.style.margin = 'auto';
          textContainer.style.boxSizing = 'border-box';

          const textSpans = textContainer.querySelectorAll('span');
          textSpans.forEach((sp) => {
            const hsp = sp as HTMLElement;
            hsp.style.display = 'block';
            hsp.style.textAlign = 'center';
            hsp.style.lineHeight = '1.25';
            hsp.style.margin = '0 auto';
          });
        }

        const doneBadge = ht.querySelector('.export-done-badge') as HTMLElement;
        if (doneBadge) {
          doneBadge.style.position = 'absolute';
          doneBadge.style.bottom = '4px';
          doneBadge.style.right = '4px';
          doneBadge.style.display = 'inline-block';
          doneBadge.style.textAlign = 'center';
          doneBadge.style.lineHeight = '1';
          doneBadge.style.padding = '2px 5px';
          doneBadge.style.fontSize = '7.5px';
          doneBadge.style.boxSizing = 'border-box';

          const childSpans = doneBadge.querySelectorAll('span');
          childSpans.forEach((sp) => {
            const hsp = sp as HTMLElement;
            hsp.style.display = 'inline-block';
            hsp.style.lineHeight = '1';
            hsp.style.verticalAlign = 'middle';
          });
        }
      });

      // 2) Header counter boxes (Bingos & Checked)
      const counterBoxes = clonedCard.querySelectorAll('.header-counter-box');
      counterBoxes.forEach((cb) => {
        const hcb = cb as HTMLElement;
        hcb.style.display = 'flex';
        hcb.style.flexDirection = 'column';
        hcb.style.alignItems = 'center';
        hcb.style.justifyContent = 'center';
        hcb.style.textAlign = 'center';
        hcb.style.padding = '8px 12px';
        hcb.style.minHeight = '52px';
        hcb.style.height = '52px';
        hcb.style.boxSizing = 'border-box';

        const spans = hcb.querySelectorAll('span');
        spans.forEach((sp, idx) => {
          const hsp = sp as HTMLElement;
          hsp.style.display = 'block';
          hsp.style.textAlign = 'center';
          hsp.style.lineHeight = idx === 0 ? '1.1' : '1.2';
          hsp.style.margin = '0 auto';
        });
      });

      // 3) Rank container & Rank Badge ("Novice 📖") - fix bottom offset in html2canvas
      const rankContainer = clonedCard.querySelector('.rank-container') as HTMLElement;
      if (rankContainer) {
        rankContainer.style.display = 'flex';
        rankContainer.style.flexDirection = 'column';
        rankContainer.style.alignItems = 'flex-end';
        rankContainer.style.justifyContent = 'center';
        rankContainer.style.textAlign = 'right';
      }

      const rankBadge = clonedCard.querySelector('.rank-badge') as HTMLElement;
      if (rankBadge) {
        rankBadge.style.display = 'block';
        rankBadge.style.textAlign = 'right';
        rankBadge.style.lineHeight = '1.2';
        rankBadge.style.padding = '0';
        rankBadge.style.background = 'transparent';
        rankBadge.style.border = 'none';
        rankBadge.style.height = 'auto';
        rankBadge.style.boxSizing = 'border-box';

        const innerSpans = rankBadge.querySelectorAll('span');
        innerSpans.forEach((sp) => {
          const hsp = sp as HTMLElement;
          hsp.style.display = 'inline-block';
          hsp.style.lineHeight = '1.2';
          hsp.style.textAlign = 'right';
        });
      }

      // 4) Stat boxes (Fastest Hop, Pace Velocity, Photo Proof, Scrapbook Notes)
      const statBoxes = clonedCard.querySelectorAll('.stat-box-card');
      statBoxes.forEach((sb) => {
        const hsb = sb as HTMLElement;
        hsb.style.display = 'flex';
        hsb.style.flexDirection = 'column';
        hsb.style.alignItems = 'center';
        hsb.style.justifyContent = 'center';
        hsb.style.textAlign = 'center';
        hsb.style.padding = '8px 6px';
        hsb.style.minHeight = '64px';
        hsb.style.height = '64px';
        hsb.style.boxSizing = 'border-box';

        const spans = hsb.querySelectorAll('span');
        spans.forEach((sp) => {
          const hsp = sp as HTMLElement;
          hsp.style.display = 'block';
          hsp.style.textAlign = 'center';
          hsp.style.lineHeight = '1.25';
          hsp.style.margin = '1px auto';
        });
      });

      // 5) Unlocked Badges & Proof Badge pills
      const pillBadges = clonedCard.querySelectorAll('.unlocked-badge, .proof-badge');
      pillBadges.forEach((pb) => {
        const hpb = pb as HTMLElement;
        hpb.style.display = 'inline-block';
        hpb.style.textAlign = 'center';
        hpb.style.lineHeight = '1.3';
        hpb.style.padding = '3px 10px 4px 10px';
        hpb.style.height = 'auto';
        hpb.style.boxSizing = 'border-box';
        hpb.style.verticalAlign = 'middle';

        const childSpans = hpb.querySelectorAll('span');
        childSpans.forEach((sp) => {
          const hsp = sp as HTMLElement;
          hsp.style.display = 'inline-block';
          hsp.style.lineHeight = '1.3';
          hsp.style.verticalAlign = 'middle';
          hsp.style.textAlign = 'center';
        });
      });
    }
  };

  const getCardCanvas = async (cardEl: HTMLElement): Promise<HTMLCanvasElement> => {
    // Ensure all images inside cardEl have crossOrigin set or are handled safely
    const imgs = cardEl.querySelectorAll('img');
    imgs.forEach((img) => {
      if (!img.src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
    });

    try {
      return await html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FAF6F0',
        logging: false,
        windowWidth: 1024,
        onclone: fixOklchInClonedDoc,
      });
    } catch (err) {
      console.warn("High DPI html2canvas render failed, falling back to scale 1.5...", err);
      return await html2canvas(cardEl, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FAF6F0',
        logging: false,
        windowWidth: 1024,
        onclone: fixOklchInClonedDoc,
      });
    }
  };

  const handleDownloadCardImage = async (format: 'png' | 'jpeg' = 'png') => {
    playSound('click');
    setIsExporting(true);

    if (!showExportModal) {
      setShowExportModal(true);
    }

    try {
      const cardEl = await waitForCardElement();
      if (!cardEl) return;

      const defaultBaseName = activeCity.includes("Seattle") ? 'Seattle_Book_Crawl' : 'Portland_Book_Crawl';
      const baseName = endCrawlProposedName || currentSavedCrawl?.name || defaultBaseName;
      const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const canvas = await getCardCanvas(cardEl);
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            // Fallback to dataURL
            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            const link = document.createElement('a');
            link.download = `${safeName}_Card.${format}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${safeName}_Card.${format}`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 1000);
        }, mimeType, 0.95);
      } else {
        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const link = document.createElement('a');
        link.download = `${safeName}_Card.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to generate crawl image:", err);
      alert("Note: If direct download is blocked in this view, please try the Save PDF button!");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = async () => {
    playSound('click');
    setIsExporting(true);

    if (!showExportModal) {
      setShowExportModal(true);
    }

    try {
      const cardEl = await waitForCardElement();
      if (!cardEl) return;

      const defaultBaseName = activeCity.includes("Seattle") ? 'Seattle_Book_Crawl' : 'Portland_Book_Crawl';
      const baseName = endCrawlProposedName || currentSavedCrawl?.name || defaultBaseName;
      const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const canvas = await getCardCanvas(cardEl);
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);

      let renderWidth = maxWidth;
      let renderHeight = (canvas.height * maxWidth) / canvas.width;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (canvas.width * maxHeight) / canvas.height;
      }

      const x = (pdfWidth - renderWidth) / 2;
      const y = Math.max(6, (pdfHeight - renderHeight) / 2);

      pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight);
      pdf.save(`${safeName}_Card.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Unable to generate PDF document automatically. Please try downloading as PNG.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyShareText = () => {
    playSound('toggle');
    const isSeattle = activeCity.includes("Seattle");
    const isPortland = activeCity.includes("Portland");
    const defaultTitle = isSeattle ? "Emerald City Book Crawl" : isPortland ? "Rose City Book Crawl" : `${activeCity} Book Crawl`;
    const title = endCrawlProposedName || currentSavedCrawl?.name || defaultTitle;
    const checkedTiles = displayTiles.filter(t => t.completed);
    
    const icon = isSeattle ? "☕" : "🌲";
    let summaryText = `${icon} ${title} 📚\n`;
    summaryText += `🏆 Progress: ${completedCount}/25 Tiles Checked | ${totalBingos} Bingos Completed!\n\n`;
    
    if (checkedTiles.length > 0) {
      summaryText += `Visited & Checked Off:\n`;
      checkedTiles.slice(0, 15).forEach(t => {
        const fullPrompt = t.text;
        const location = t.locationName ? ` (@ ${t.locationName})` : '';
        summaryText += `• ${fullPrompt}${location}\n`;
      });
      if (checkedTiles.length > 15) {
        summaryText += `...and ${checkedTiles.length - 15} more cozy spots!\n`;
      }
    }
    
    const cityName = isSeattle ? "Seattle" : isPortland ? "Portland" : activeCity;
    summaryText += `\nExplore ${cityName}'s indie bookstores & coffee shops! ☕📖`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // --- INTERACTIVE BINGO VALIDATOR ---
  // Fires instantly when tiles change. Evaluates if any new Bingo lines have been completed.
  useEffect(() => {
    const newBingoTimes = { ...completedBingoTimes };
    let updated = false;
    let lineToCelebrated: BingoLine | null = null;

    // Check all rows, columns, and diagonals
    for (const line of BINGO_LINES) {
      const lineTiles = line.indices.map(idx => tiles[idx]);
      const isLineComplete = lineTiles.every(t => t.completed);

      if (isLineComplete) {
        if (!completedBingoTimes[line.id]) {
          // Bingo is achieved! Let's check the core 24-hr constraint:
          // Was this entire row completed within any 24-hour window, or is the active general challenge running?
          const timestamps = lineTiles
            .map(t => t.completedAt)
            .filter((t): t is number => t !== null);

          if (timestamps.length === 5) {
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const timeDiff = maxTime - minTime;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            // True if completed within 24 hours of each other,
            // or if the challenge mode is active and we completed it within the clock period!
            const isCompletedWithinLimits = timeDiff <= 24 * 60 * 60 * 1000;

            if (isCompletedWithinLimits) {
              newBingoTimes[line.id] = Date.now();
              updated = true;
              lineToCelebrated = line;
            }
          }
        }
      } else {
        // If they unchecked a block making a completed line incomplete, clear it so they can win it again
        if (completedBingoTimes[line.id]) {
          delete newBingoTimes[line.id];
          updated = true;
        }
      }
    }

    if (updated) {
      setCompletedBingoTimes(newBingoTimes);
      localStorage.setItem('portland_book_crawl_completed_bingos_v1', JSON.stringify(newBingoTimes));

      if (lineToCelebrated) {
        // High fidelity celebration launch!
        setRecentCelebratedLine(lineToCelebrated);
        setShowCelebrationModal(true);
        triggerBingoConfetti();
        playSound('win');
      }
    }
  }, [tiles, completedBingoTimes]);

  // Triggering visual confetti celebration explosions!
  const triggerBingoConfetti = () => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#2d4a3e', '#bc6c25', '#a66c1e', '#ecc52c', '#6d597a']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#2d4a3e', '#bc6c25', '#a66c1e', '#ecc52c', '#6d597a']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2d4a3e', '#bc6c25', '#ecc52c', '#ffff']
    });
  };

  // --- ACTIONS ---
  
  // Select a tile to see/edit its details
  const handleTileClick = (tile: Tile) => {
    playSound('click');
    setSelectedTileId(tile.id);
    
    // Seed draft states
    setDraftTileText(tile.text || "");
    setDraftLocation(tile.locationName || "");
    setDraftNotes(tile.notes || "");
    setDraftRating(tile.rating || 5);
    setDraftCompleted(tile.completed);
    setDraftPhotoUrl(tile.photoUrl || "");
  };

  // Save changes from details modal back to core board tiles state
  const handleSaveTileInfo = () => {
    if (!selectedTileId) return;
    playSound('toggle');

    setTiles(prevTiles => 
      prevTiles.map(tile => {
        if (tile.id === selectedTileId) {
          // If state transitioned from uncompleted to completed, stamp the time!
          const justCompleted = !tile.completed && draftCompleted;
          let stampedTime = tile.completedAt;
          
          if (justCompleted) {
            stampedTime = Date.now();
            playSound('completed');
          } else if (!draftCompleted) {
            // If they unchecked it
            stampedTime = null;
          }

          return {
            ...tile,
            text: draftTileText.trim() || tile.text,
            completed: draftCompleted,
            completedAt: stampedTime,
            locationName: draftLocation,
            notes: draftNotes,
            rating: draftRating,
            photoUrl: draftPhotoUrl
          };
        }
        return tile;
      })
    );

    setSelectedTileId(null);
  };

  // Restart/Reset ALL crawl status without shifting/randomizing the board
  const handleConfirmReset = () => {
    playSound('toggle');
    const defaultTiles = tiles.map(tile => {
      return {
        ...tile,
        completed: false,
        completedAt: null,
        locationName: "",
        notes: "",
        rating: undefined,
        photoUrl: undefined
      };
    });

    setTiles(defaultTiles);
    setStartTime(null);
    setChallengeActive(false);
    setCompletedBingoTimes({});
    setShowResetWarning(false);
  };

  // Generate a brand new, randomized 5x5 crawler card for active city
  // Switch city and regenerate board atomically
  const handleSwitchCity = (newCity: string) => {
    playSound('toggle');
    setCurrentCity(newCity);
    const newBoard = generateRandomBoard(newCity);
    setTiles(newBoard);
    setStartTime(null);
    setChallengeActive(false);
    setCompletedBingoTimes({});
    setViewingSavedId(null);
  };

  // Generate a brand new, randomized 5x5 crawler card for selected shuffle city
  const handleConfirmShuffle = () => {
    playSound('toggle');
    handleSwitchCity(shuffleTargetCity);
    setShowShuffleWarning(false);
  };

  // Force-start or restart the 24-hr stopwatch challenge
  const handleTriggerChallenge = () => {
    playSound('completed');
    setStartTime(Date.now());
    setChallengeActive(true);
    // Note: this stays true for the current board, allowing them to try the speedy run on their current grid!
  };

  // Trigger stopping the crawl, opening the cozy save-and-archive prompt
  const handleEndChallenge = () => {
    playSound('toggle');
    const isSeattle = activeCity.includes("Seattle");
    const cityName = isSeattle ? "Emerald City" : "Rose City";
    const emoji = isSeattle ? "☕" : "🌲";
    const defaultName = `Cozy ${cityName} Crawl - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 📖${emoji}`;
    setEndCrawlProposedName(defaultName);
    setShowEndCrawlModal(true);
  };

  const handleConfirmEndAndArchive = (customName: string) => {
    playSound('badge');
    const isSeattle = activeCity.includes("Seattle");
    const cityName = isSeattle ? "Emerald City" : "Rose City";
    const emoji = isSeattle ? "☕" : "🌲";
    const defaultName = `Cozy ${cityName} Crawl - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 📖${emoji}`;
    const finalName = customName.trim() || defaultName;
    
    const newSaved: SavedCrawl = {
      id: `crawl-${Date.now()}`,
      name: finalName,
      savedAt: Date.now(),
      tiles: [...tiles],
      startTime: startTime,
      totalBingos: totalBingos,
      completedCount: completedCount
    };

    setSavedCrawls(prev => [newSaved, ...prev]);

    // Fancy celebration confetti for archiving a done run
    confetti({
      particleCount: 35,
      spread: 60,
      colors: ['#5A5A40', '#BC6C25']
    });

    // Successfully end stopwatch challenge
    setStartTime(null);
    setChallengeActive(false);
    setShowEndCrawlModal(false);
  };

  const handleConfirmEndWithoutArchive = () => {
    playSound('toggle');
    // Just end the stopwatch without creating any archive item
    setStartTime(null);
    setChallengeActive(false);
    setShowEndCrawlModal(false);
  };

  // --- SAVED CRAWLS COLLECTION HANDLING ---
  const handleSaveCurrentCrawl = () => {
    if (!newCrawlName.trim()) return;
    playSound('badge');

    const newSaved: SavedCrawl = {
      id: `crawl-${Date.now()}`,
      name: newCrawlName.trim(),
      savedAt: Date.now(),
      tiles: [...tiles],
      startTime: startTime,
      totalBingos: totalBingos,
      completedCount: completedCount
    };

    setSavedCrawls(prev => [newSaved, ...prev]);
    setNewCrawlName("");

    // Fancy celebration confetti
    confetti({
      particleCount: 30,
      spread: 60,
      colors: ['#5A5A40', '#BC6C25']
    });
  };

  const handleDeleteSavedCrawl = (id: string, e: MouseEvent) => {
    e.stopPropagation(); // prevent opening
    playSound('toggle');
    setSavedCrawls(prev => prev.filter(c => c.id !== id));
    if (viewingSavedId === id) {
      setViewingSavedId(null);
    }
  };

  const handleRestoreAndResume = (saved: SavedCrawl, e: MouseEvent) => {
    e.stopPropagation(); // prevent opening
    playSound('win');
    setTiles(saved.tiles);
    setStartTime(saved.startTime);
    setChallengeActive(!!saved.startTime);
    
    const restoredBingoTimes: Record<string, number> = {};
    for (const line of BINGO_LINES) {
      const isComplete = line.indices.every(idx => saved.tiles[idx]?.completed);
      if (isComplete) {
        restoredBingoTimes[line.id] = saved.savedAt;
      }
    }
    setCompletedBingoTimes(restoredBingoTimes);
    setViewingSavedId(null); // Return to active editing automatically

    confetti({
      particleCount: 25,
      spread: 50,
      colors: ['#5A5A40', '#BC6C25', '#FCF5ED']
    });
  };

  // --- DERIVED METRICS WITH VIEWING ARCHIVE SENSITIVITY ---
  const currentSavedCrawl = useMemo(() => {
    if (!viewingSavedId) return null;
    return savedCrawls.find(c => c.id === viewingSavedId) || null;
  }, [viewingSavedId, savedCrawls]);

  const displayTiles = useMemo(() => {
    if (currentSavedCrawl) {
      return currentSavedCrawl.tiles;
    }
    return tiles;
  }, [currentSavedCrawl, tiles]);

  const activeCity = useMemo(() => {
    return detectCityFromBoard(displayTiles) || currentCity;
  }, [displayTiles, currentCity]);

  const headerTitle = useMemo(() => {
    if (activeCity.includes("Seattle")) return "Emerald City Book Crawl Bingo";
    if (activeCity.includes("Portland")) return "Rose City Book Crawl Bingo";
    return `${activeCity} Book Crawl Bingo`;
  }, [activeCity]);

  const headerBadge = useMemo(() => {
    if (activeCity.includes("Seattle")) return "Seattle, Washington — Emerald City Crawl";
    if (activeCity.includes("Portland")) return "Portland, Oregon — Craft Indie Crawl";
    return `${activeCity} — Local Book Crawl`;
  }, [activeCity]);

  const completedCount = useMemo(() => displayTiles.filter(t => t.completed).length, [displayTiles]);
  const progressPercent = Math.round((completedCount / 25) * 100);

  const displayBingoTimes = useMemo(() => {
    if (currentSavedCrawl) {
      const archiveBingos: Record<string, number> = {};
      for (const line of BINGO_LINES) {
        const isComplete = line.indices.every(idx => currentSavedCrawl.tiles[idx]?.completed);
        if (isComplete) {
          archiveBingos[line.id] = currentSavedCrawl.savedAt;
        }
      }
      return archiveBingos;
    }
    return completedBingoTimes;
  }, [currentSavedCrawl, completedBingoTimes]);

  const totalBingos = Object.keys(displayBingoTimes).length;

  // Track progress per lines for helpful visual checklists
  const linesProgress = useMemo(() => {
    return BINGO_LINES.map(line => {
      const lineTiles = line.indices.map(idx => displayTiles[idx]);
      const currentDone = lineTiles.filter(t => t.completed).length;
      return {
        ...line,
        currentDone,
        isComplete: currentDone === 5
      };
    });
  }, [displayTiles]);

  const selectedTile = useMemo(() => {
    return displayTiles.find(t => t.id === selectedTileId);
  }, [displayTiles, selectedTileId]);

  // Fun Crawl Analytics & Superlatives Engine
  const crawlAnalytics = useMemo(() => {
    const completedList = displayTiles.filter(t => t.completed);
    const photoList = completedList.filter(t => t.photoUrl && t.photoUrl.trim().length > 0);
    const notesList = completedList.filter(t => t.notes && t.notes.trim().length > 0);
    const customLocationsList = completedList.filter(t => t.locationName && t.locationName.trim().length > 0);
    const withTimestamps = completedList
      .filter(t => t.completedAt && t.completedAt > 0)
      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

    // Pace & Speed calculations
    let fastestGapMinutes: number | null = null;
    let averagePaceMinutes: number | null = null;
    let totalActiveMinutes: number | null = null;

    if (withTimestamps.length >= 2) {
      let minGap = Infinity;
      for (let i = 1; i < withTimestamps.length; i++) {
        const gapMs = (withTimestamps[i].completedAt! - withTimestamps[i - 1].completedAt!);
        const gapMins = Math.max(1, Math.round(gapMs / (1000 * 60)));
        if (gapMins < minGap) {
          minGap = gapMins;
        }
      }
      if (minGap !== Infinity) {
        fastestGapMinutes = minGap;
      }

      const totalSpanMs = withTimestamps[withTimestamps.length - 1].completedAt! - withTimestamps[0].completedAt!;
      totalActiveMinutes = Math.max(1, Math.round(totalSpanMs / (1000 * 60)));
      averagePaceMinutes = Math.round(totalActiveMinutes / (withTimestamps.length - 1));
    }

    // Persona Title & Character Generator
    const isSeattle = activeCity.includes("Seattle");
    const isPortland = activeCity.includes("Portland");
    const cityName = isSeattle ? "Seattle" : isPortland ? "Portland" : activeCity;

    let personaTitle = isSeattle ? "☕ Emerald City Book Explorer" : "🌲 PNW Book Explorer";
    let personaSubtitle = `Exploring ${cityName}'s literary corners one page at a time.`;
    let personaBadgeIcon = "📚";

    if (totalBingos >= 4 || completedList.length >= 20) {
      personaTitle = isSeattle ? "👑 Emerald City Literary Monarch" : "👑 Portland Literary Monarch";
      personaSubtitle = `Conquered virtually the entire ${isSeattle ? "Seattle" : "Rose City"} bookstore bingo grid!`;
      personaBadgeIcon = "🏆";
    } else if (fastestGapMinutes !== null && fastestGapMinutes <= 15) {
      personaTitle = isSeattle ? "⚡ SEA Speed Demon Crawler" : "⚡ PDX Speed Demon Crawler";
      personaSubtitle = `Lightning-fast book hunter with a record ${fastestGapMinutes}-minute hop!`;
      personaBadgeIcon = "⚡";
    } else if (photoList.length >= 2) {
      personaTitle = "📸 Scrapbook Storyteller";
      personaSubtitle = "Captured cozy photo memories at every stop along the crawl.";
      personaBadgeIcon = "🖼️";
    } else if (completedList.some(t => t.category === 'drink' || t.category === 'food')) {
      personaTitle = "☕ Caffeine & Chapter Aficionado";
      personaSubtitle = "Powered by local roast lattes and freshly printed pages.";
      personaBadgeIcon = "☕";
    } else if (completedList.length >= 8) {
      personaTitle = "🗺️ Neighborhood Hop Master";
      personaSubtitle = `Navigating across ${cityName}'s vibrant bookstore districts.`;
      personaBadgeIcon = "📍";
    } else if (completedList.length >= 1) {
      personaTitle = "📖 Cozy Nook Wanderer";
      personaSubtitle = `Stepping into ${cityName}'s finest independent bookshops.`;
      personaBadgeIcon = "🌿";
    }

    // Unlocked Badges
    const badges: { icon: string; label: string }[] = [];
    if (totalBingos > 0) badges.push({ icon: "🎯", label: `${totalBingos}x Bingo Winner` });
    if (fastestGapMinutes !== null && fastestGapMinutes <= 20) badges.push({ icon: "⚡", label: `Rapid Hop (${fastestGapMinutes}m)` });
    if (photoList.length > 0) badges.push({ icon: "📸", label: `${photoList.length} Photo ${photoList.length === 1 ? 'Memory' : 'Memories'}` });
    if (notesList.length > 0) badges.push({ icon: "✍️", label: `${notesList.length} Scrapbook Notes` });
    if (customLocationsList.length > 0) badges.push({ icon: "📍", label: `${customLocationsList.length} Spots Pinned` });
    if (completedList.some(t => t.category === 'drink')) badges.push({ icon: "☕", label: "Caffeine Refueled" });

    return {
      completedList,
      photoList,
      notesList,
      customLocationsList,
      withTimestamps,
      fastestGapMinutes,
      averagePaceMinutes,
      totalActiveMinutes,
      personaTitle,
      personaSubtitle,
      personaBadgeIcon,
      badges
    };
  }, [displayTiles, totalBingos]);

  return (
    <div className="min-h-screen pb-16 relative paper-texture selection:bg-[#5A5A40]/10 selection:text-[#5A5A40]">
      
      {/* Decorative Forest Canopy Header Accent in Natural Sage */}
      <div className="w-full h-2 bg-[#5A5A40]" id="forest-trim" />

      {/* TOP STATUS BAR: Quick Export & Sound toggle */}
      <div className="max-w-6xl mx-auto px-4 pt-4 flex items-center justify-between gap-3" id="quick-actions-bar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playSound('click'); setShowExportModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#BC6C25] hover:bg-[#A35D1B] text-white rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-export-recap-top"
            title="Download or share your crawl bingo card image / PDF"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export & Share Card</span>
          </button>
        </div>

        <button
          onClick={() => { setSoundEnabled(!soundEnabled); playSound('click'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9D1C7] rounded-full text-xs font-medium text-[#2D2926] hover:border-[#5A5A40] transition-all cursor-pointer shadow-xs"
          id="btn-sound-toggle"
          title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Chimes: On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-gray-400" />
              <span>Chimes: Muted</span>
            </>
          )}
        </button>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="max-w-6xl mx-auto px-4 mt-2">
        
        {/* APP TITLE & DESCRIPTION */}
        <div className="text-center mb-8" id="app-description-header">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {/* Quick City Switcher Pills */}
            <div className="inline-flex items-center p-1 bg-[#FAF6F0] border border-[#D9D1C7] rounded-full shadow-2xs">
              <button
                type="button"
                onClick={() => handleSwitchCity("Portland, OR")}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeCity.includes("Portland")
                    ? "bg-[#5A5A40] text-white shadow-xs"
                    : "text-[#5A5A40] hover:text-[#2D2926]"
                }`}
              >
                <span>🌲 Rose City (Portland)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchCity("Seattle, WA")}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeCity.includes("Seattle")
                    ? "bg-[#5A5A40] text-white shadow-xs"
                    : "text-[#5A5A40] hover:text-[#2D2926]"
                }`}
              >
                <span>☕ Emerald City (Seattle)</span>
              </button>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif italic text-[#5A5A40] leading-none mb-3">
            {headerTitle}
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#2D2926] leading-relaxed">
            Sip craft brews, discover cozy independent bookstores on rainy streets, find local PNW indie authors, and track check-ins. Complete a row within <span className="font-semibold text-[#8B4513]">24 Hours</span> of its first check to trigger the victory celebration!
          </p>
        </div>

        {/* SINGLE-VIEW GRID & DASHBOARD SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="main-dashboard-grid">
          
          {/* LEFT/MAIN PANE: THE 5x5 BINGO CARD (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-4" id="bingo-card-stage">
            <div className="bg-[#FAF6F0] border-2 border-[#D9D1C7] rounded-2xl shadow-md p-3 sm:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#5A5A40]/5 rounded-bl-full pointer-events-none" />
              
              {/* Card B-I-N-G-O Columns Headers */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center mb-2 sm:mb-3">
                {['B', 'I', 'N', 'G', 'O'].map((letter, idx) => (
                  <div
                    key={letter}
                    className="py-1.5 sm:py-2 bg-[#5A5A40] text-white text-base sm:text-xl font-bold font-serif rounded-lg shadow-xs tracking-wider"
                    id={`bingo-header-${letter}`}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {/* 5x5 Card Tiles */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3" id="bingo-tiles-grid">
                {displayTiles.map((tile, idx) => {
                  const cfg = CATEGORY_COLORS[tile.category];
                  const Icon = cfg.icon;
                  const hasCustomPhoto = tile.completed && tile.photoUrl && (tile.photoUrl.startsWith('data:image') || tile.photoUrl.startsWith('http'));
                  const isStampSticker = tile.completed && tile.photoUrl && !tile.photoUrl.startsWith('data:image') && !tile.photoUrl.startsWith('http');

                  const tileBgStyle = hasCustomPhoto
                    ? {
                        backgroundImage: `linear-gradient(rgba(250, 246, 240, 0.85), rgba(250, 246, 240, 0.85)), url(${tile.photoUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined;
                  
                  return (
                    <motion.button
                      key={tile.id}
                      onClick={() => handleTileClick(tile)}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      id={`tile-button-${idx}`}
                      style={tileBgStyle}
                      className={`
                        aspect-square flex flex-col justify-between p-1 sm:p-2.5 rounded-xl border-2 text-left relative cursor-pointer group transition-shadow hover:shadow-md overflow-hidden
                        ${tile.completed 
                          ? `${cfg.bg} ${cfg.border} ring-2 ring-[#5A5A40]/10 border-[#5A5A40]` 
                          : "bg-white hover:bg-[#FDFBF7] border-[#D9D1C7]"
                        }
                      `}
                    >
                      {/* Check badge (for completed tiles) */}
                      {tile.completed && (
                        <div 
                          className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 sm:w-6 sm:h-6 bg-[#5A5A40] text-white rounded-full flex items-center justify-center shadow-sm border border-[#F7F3EE] z-10"
                          id={`completed-badge-${tile.id}`}
                        >
                          <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3.5]" />
                        </div>
                      )}

                      {/* Emoji Stamp sticker backdrop */}
                      {isStampSticker && (
                        <span className="absolute bottom-1 right-1.5 text-2xl sm:text-4xl opacity-35 select-none pointer-events-none font-sans z-0">
                          {tile.photoUrl}
                        </span>
                      )}

                      {/* Small subtle visual identifier icon in background */}
                      <div className="flex justify-between items-center w-full z-10 relative h-3 sm:h-4 shrink-0">
                        <span className={`text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider ${tile.completed ? cfg.text : "text-neutral-400 group-hover:text-neutral-500"} hidden sm:inline truncate max-w-[80%]`}>
                          {cfg.label}
                        </span>
                        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 stroke-[1.8] ${tile.completed ? cfg.text : "text-[#5A5A40]/40 group-hover:text-[#5A5A40]/60"} ml-auto sm:ml-0`} />
                      </div>

                      {/* Main Tile Text Block - Adjusted font sizes and line heights so text is fully visible */}
                      <div className="my-auto py-0.5 sm:py-1 line-clamp-3 sm:line-clamp-4 leading-[1.1] sm:leading-tight z-10 relative flex-1 flex items-center w-full overflow-hidden">
                        <p className={`
                          text-[7.5px] xs:text-[8.5px] sm:text-[10.5px] md:text-xs font-serif font-medium leading-[1.05] sm:leading-tight select-none w-full
                          ${tile.completed ? "text-[#2D2926] font-semibold" : "text-neutral-600"}
                        `}>
                          {getShortTileText(tile.text)}
                        </p>
                      </div>

                      {/* Star rating or check completion timestamp at bottom of cell if edited */}
                      <div className="min-h-[8px] sm:min-h-[10px] flex items-center justify-between w-full text-[7px] sm:text-[9px] font-mono text-neutral-400 z-10 relative shrink-0 mt-0.5">
                        {tile.completedAt && tile.category !== 'free' ? (
                          <span className="truncate max-w-[80%] hidden sm:inline" id={`time-${tile.id}`}>
                            {new Date(tile.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span />
                        )}
                        
                        {tile.rating && tile.completed ? (
                          <div className="flex gap-0.5 text-[#BC6C25] overflow-hidden shrink-0 ml-auto sm:ml-0">
                            {Array.from({ length: tile.rating }).map((_, i) => (
                              <Star key={i} className="w-1.5 h-1.5 fill-current shrink-0" />
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {/* Dotted border indicator if incomplete */}
                      {!tile.completed && (
                        <div className="absolute inset-1.5 border border-dashed border-[#FAF6F0] rounded-lg pointer-events-none group-hover:border-[#E8E2D9] hidden sm:block" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper Tip on Card Action */}
            <div className="text-center text-xs text-[#6F4E37] italic flex items-center justify-center gap-1.5 select-none py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BC6C25]" />
              Pro Tip: Click any square to check it off, add your bookstore location name, or leave reviews!
            </div>

            {/* Live Search Grounding Sources citation block */}
            {groundedSources.length > 0 && (
              <div className="bg-[#FAF6F0] border border-[#D9D1C7] rounded-xl p-3 text-xs text-[#2D2926] space-y-1.5 shadow-2xs mt-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#BC6C25]" />
                    <span>Live Web Search Grounding Sources ({groundedSources.length})</span>
                  </span>
                  <button 
                    onClick={() => setGroundedSources([])}
                    className="text-[10px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {groundedSources.slice(0, 6).map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-white border border-[#D9D1C7] text-[#5A5A40] hover:text-[#BC6C25] hover:border-[#BC6C25] px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors truncate max-w-[210px]"
                    >
                      <span className="truncate">{src.title || src.uri}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: CONTROL TIMERS & STATS DASHBOARD (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6" id="dashboard-sidebar">
            
            {/* CARD 1: THE 24-HOUR CRAWL CHALLENGE TIMERS */}
            <div className="bg-white border-2 border-[#D9D1C7] rounded-2xl p-5 shadow-xs relative overflow-hidden" id="challenge-timer-card">
              <div className="absolute top-0 left-0 h-1 bg-[#D9D1C7] w-full" />
              
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#BC6C25]" />
                <h3 className="font-serif text-lg font-bold text-[#2D2926]">
                  24-Hour Speed Crawl
                </h3>
              </div>

              {!challengeActive ? (
                // Setup screen if challenge is inactive
                <div className="space-y-4" id="inactive-timer-view">
                  <div className="bg-[#FAF6F0] border border-[#D9D1C7] p-3 rounded-xl text-xs text-[#2D2926] leading-relaxed">
                    <p className="font-medium text-[#BC6C25] mb-1">⏰ Ready to explore Portland under pressure?</p>
                    Start the stopwatch! Attempt to complete at least one straight line of check-ins within a 24-hour window from starting. 
                  </div>
                  
                  {startTime ? (
                    // Challenge expired previously
                    <div className="text-xs text-[#8B4513] bg-[#FAF6F0] border border-[#D9D1C7] p-2.5 rounded-lg flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#BC6C25] mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#8B4513]">Crawl timed out!</span> Re-trigger the speed challenge below to reset and try a fresh run.
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 italic">
                      Click the button below whenever you're ready to start your 24-hour speed crawl!
                    </div>
                  )}

                  <button
                    onClick={handleTriggerChallenge}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#BC6C25] text-white font-semibold rounded-xl hover:bg-[#A35D1B] active:scale-[0.98] transition-all cursor-pointer shadow-sm text-sm"
                    id="btn-start-challenge"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Start 24H Speed Crawl!</span>
                  </button>
                </div>
              ) : (
                // Live ticking challenge clock
                <div className="space-y-4" id="active-timer-view">
                  <div className="text-center py-4 bg-[#FAF6F0] border border-[#D9D1C7] rounded-xl">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8B4513] block mb-1">
                      Time Remaining on Active Crawl
                    </span>
                    <span className="text-3xl font-mono font-bold text-[#8B4513] bg-[#E8E2D9] px-4 py-2 border border-[#D9D1C7] rounded-lg tracking-wider inline-block shadow-2xs tabular-nums">
                      {timeLeftStr}
                    </span>

                    {/* Progress Bar under core ticking watch */}
                    <div className="w-4/5 mx-auto h-1.5 bg-[#E8E2D9] rounded-full mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-[#BC6C25] transition-all duration-1000"
                        style={{ width: `${timeLeftPerc}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-[#5A5A40] bg-[#F1F3E1] border border-[#D9D1C7] p-3 rounded-xl leading-relaxed flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#5A5A40] animate-pulse shrink-0" />
                    <span>Challenge is active! Find cozy coffee & bookstores.</span>
                  </div>

                  <div className="text-[11px] text-neutral-400 text-center">
                    Crawl started on {new Date(startTime || 0).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <button
                    onClick={handleEndChallenge}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 hover:border-red-200 border border-red-100/80 font-semibold rounded-xl transition-all cursor-pointer text-xs shadow-3xs"
                    id="btn-end-challenge-early"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>Stop & End Challenge Early</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: CRAWLING PROGRESS STATS */}
            <div className="bg-white border-2 border-[#D9D1C7] rounded-2xl p-5 shadow-xs" id="progress-statistics-card">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#5A5A40]" />
                <h3 className="font-serif text-lg font-bold text-[#2D2926]">
                  Crawl Achievements
                </h3>
              </div>

              {/* Progress Bar & Badges */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#2D2926] mb-1.5">
                    <span>Tiles Checked</span>
                    <span>{completedCount} / 25</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FAF6F0] border border-[#D9D1C7]/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#FAF6F0] border border-[#D9D1C7] p-3 rounded-xl text-center">
                    <span className="text-2xl font-serif font-bold text-[#5A5A40] block">
                      {totalBingos}
                    </span>
                    <span className="text-[10px] text-[#6F4E37] uppercase font-semibold">
                      Completed Bingos
                    </span>
                  </div>
                  
                  <div className="bg-[#FAF6F0] border border-[#D9D1C7] p-3 rounded-xl text-center">
                    <span className="text-2xl font-serif font-bold text-[#BC6C25] block">
                      {completedCount}
                    </span>
                    <span className="text-[10px] text-[#6F4E37] uppercase font-semibold">
                      Items Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: BOARD CONTROLS & INFO REGENERATE */}
            <div className="bg-white border-2 border-[#D9D1C7] rounded-2xl p-5 shadow-xs space-y-3" id="board-operations-card">
              <h4 className="font-serif text-sm font-bold text-[#5A5A40] mb-1">
                Local Crawl Board Actions
              </h4>
              <p className="text-[11px] text-[#6F4E37] leading-normal pb-1">
                Use Gemini Live Web Search to discover real current roasters & local spots, or perform an instant offline shuffle!
              </p>

              {/* Primary AI Search Grounding Button */}
              <button
                type="button"
                onClick={() => { playSound('click'); setShowAIGeneratorModal(true); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#BC6C25] hover:bg-[#A35D1B] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs active:scale-98"
                id="btn-trigger-ai-grounded-generator"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>✨ Gemini Live Web Search Discovery</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { playSound('click'); setShowResetWarning(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#2D2926] border border-[#D9D1C7] rounded-xl transition-all cursor-pointer shadow-3xs"
                  id="btn-trigger-reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Uncheck Card</span>
                </button>

                <button
                  onClick={() => { playSound('click'); setShuffleTargetCity(activeCity); setShowShuffleWarning(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#5A5A40] hover:bg-[#4C4C36] text-xs font-semibold text-white border border-[#5A5A40] rounded-xl transition-all cursor-pointer shadow-3xs"
                  id="btn-trigger-shuffle"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Offline Shuffle</span>
                </button>
              </div>
            </div>

          </div>

        </div>



        {/* --- PAGE FOOTER & COPYRIGHT NOTICE --- */}
        <footer className="mt-12 pt-8 border-t border-[#D9D1C7]/60 text-center text-[#6F4E37] font-sans text-xs pb-6">
          <div className="max-w-3xl mx-auto space-y-1.5">
            <p className="font-serif text-sm font-semibold text-[#2D2926]">
              © 2026 PNW Book Crawl.
            </p>
            <p className="text-[11px] text-[#6F4E37]/80 leading-relaxed max-w-md mx-auto italic">
              A personal project created for fun, book reading, and exploring local independent bookstores across Portland, Seattle, and the Pacific Northwest.
            </p>
            <p className="text-[11px] text-[#5A5A40] font-medium">
              Questions or feedback? Contact: <a href="mailto:cr.awangg@gmail.com" className="underline hover:text-[#2D2926] font-semibold">cr.awangg@gmail.com</a>
            </p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#5A5A40] font-medium pt-1">
              <span>🌲 Handcrafted for PNW Book Lovers & Explorers ☕</span>
            </div>
          </div>
        </footer>

      </div>

      {/* --- CONFIRM DIALOG: CLEAR CHECKBOX STATE --- */}
      <AnimatePresence>
        {showResetWarning && (
          <div className="fixed inset-0 bg-[#2D2926]/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="reset-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF6F0] border-2 border-[#BC6C25] max-w-sm w-full p-6 rounded-2xl shadow-xl text-center"
              id="reset-modal-container"
            >
              <div className="w-12 h-12 bg-[#FCF5ED] text-[#BC6C25] rounded-full flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#2D2926] mb-2">Uncheck Entire Card?</h3>
              <p className="text-xs text-[#6F4E37] leading-relaxed mb-5">
                This will uncheck all boxes (except the center Powell's free space) and clear your 24-hr stopwatch records. Your custom location notes and ratings will be reset.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { playSound('click'); setShowResetWarning(false); }}
                  className="px-4 py-2 bg-[#E8E2D9] hover:bg-[#D9D1C7] text-xs font-semibold text-[#2D2926] rounded-lg cursor-pointer"
                  id="btn-reset-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-2 bg-[#BC6C25] hover:bg-[#A35D1B] text-xs font-semibold text-white rounded-lg cursor-pointer"
                  id="btn-reset-confirm"
                >
                  Uncheck Board
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DIALOG: REGENERATE / SHUFFLE BOARD --- */}
      <AnimatePresence>
        {showShuffleWarning && (
          <div className="fixed inset-0 bg-[#2D2926]/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="shuffle-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF6F0] border-2 border-[#5A5A40] max-w-sm w-full p-6 rounded-2xl shadow-xl text-center"
              id="shuffle-modal-container"
            >
              <div className="w-12 h-12 bg-[#F1F3E1] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#2D2926] mb-2">Shuffle & Re-roll Card?</h3>
              <p className="text-xs text-[#6F4E37] leading-relaxed mb-4">
                <strong>Offline Shuffle</strong> rotates through 25 local spots and reading prompts from our built-in offline library instantly without web requests.
              </p>

              {/* Offline City Selector */}
              <div className="mb-5 text-left bg-white p-2.5 rounded-xl border border-[#D9D1C7]">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider mb-1.5">
                  Select Offline City:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShuffleTargetCity("Portland, OR")}
                    className={`py-1.5 px-2 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                      shuffleTargetCity.includes("Portland")
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-2xs"
                        : "bg-[#FAF6F0] text-[#2D2926] border-[#D9D1C7] hover:bg-[#E8E2D9]"
                    }`}
                  >
                    🌲 Portland, OR
                  </button>
                  <button
                    type="button"
                    onClick={() => setShuffleTargetCity("Seattle, WA")}
                    className={`py-1.5 px-2 rounded-lg border font-medium transition-all text-center cursor-pointer ${
                      shuffleTargetCity.includes("Seattle")
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-2xs"
                        : "bg-[#FAF6F0] text-[#2D2926] border-[#D9D1C7] hover:bg-[#E8E2D9]"
                    }`}
                  >
                    ☕ Seattle, WA
                  </button>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { playSound('click'); setShowShuffleWarning(false); }}
                  className="px-4 py-2 bg-[#E8E2D9] hover:bg-[#D9D1C7] text-xs font-semibold text-[#2D2926] rounded-lg cursor-pointer"
                  id="btn-shuffle-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShuffle}
                  className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4C4C36] text-xs font-semibold text-white rounded-lg cursor-pointer animate-none"
                  id="btn-shuffle-confirm"
                >
                  Shuffle & Roll
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CITY NOMINATION / VOTING MODAL --- */}
      <AnimatePresence>
        {showCityNominationModal && (
          <div className="fixed inset-0 bg-[#2D2926]/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="city-nomination-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-[#5A5A40] max-w-md w-full p-6 rounded-2xl shadow-2xl relative overflow-hidden text-left"
              id="city-nomination-container"
            >
              <button
                onClick={() => { playSound('click'); setShowCityNominationModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
                id="btn-close-city-modal"
              >
                <X className="w-5 h-5" />
              </button>

              {!nominationSubmitted ? (
                <form onSubmit={handleVoteForCity} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-[#F1F3E1] text-[#5A5A40] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#2D2926]">Vote for Next City</h3>
                      <p className="text-xs text-[#6F4E37]">Where should Book Crawl Bingo launch next?</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#2D2926] block">Select a City Candidate:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "Seattle, WA", label: "☕ Seattle, WA", desc: "Emerald City Independent Bookstores & Roasters" },
                        { id: "Los Angeles, CA", label: "🌴 Los Angeles, CA", desc: "SoCal Indie Bookshops, Vintage Reads & Cafes" },
                        { id: "San Francisco, CA", label: "🌉 San Francisco, CA", desc: "Bay Area Bookshops, City Lights & Mission Vibe" },
                        { id: "New York City, NY", label: "🗽 New York City, NY", desc: "NYC Classic Strand, Neighborhood Bookstores" },
                        { id: "Austin, TX", label: "🎸 Austin, TX", desc: "Live Music, Book Crawls & Local Coffee" },
                        { id: "Other", label: "✍️ Other City / Nominate Yours", desc: "Type your hometown or favorite book city" }
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          onClick={() => playSound('toggle')}
                          className={`
                            flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                            ${selectedCityOption === opt.id
                              ? "bg-[#F1F3E1] border-[#5A5A40] ring-1 ring-[#5A5A40]"
                              : "bg-[#FAF6F0]/60 border-[#D9D1C7] hover:bg-[#FAF6F0]"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="city-option"
                            value={opt.id}
                            checked={selectedCityOption === opt.id}
                            onChange={(e) => setSelectedCityOption(e.target.value)}
                            className="mt-0.5 accent-[#5A5A40]"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#2D2926] block">{opt.label}</span>
                            <span className="text-[11px] text-[#6F4E37] leading-tight block">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedCityOption === "Other" && (
                    <div>
                      <label className="text-xs font-semibold text-[#2D2926] block mb-1">Custom City Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Chicago, IL or London, UK"
                        value={customCityText}
                        onChange={(e) => setCustomCityText(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#D9D1C7] rounded-lg focus:outline-none focus:border-[#5A5A40]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[#2D2926] block mb-1">Your Email (Optional - Get notified when it launches):</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={nominationEmail}
                      onChange={(e) => setNominationEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#D9D1C7] rounded-lg focus:outline-none focus:border-[#5A5A40]"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { playSound('click'); setShowCityNominationModal(false); }}
                      className="flex-1 py-2.5 bg-[#E8E2D9] hover:bg-[#D9D1C7] text-xs font-semibold text-[#2D2926] rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#5A5A40] hover:bg-[#4C4C36] text-xs font-semibold text-white rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit City Vote</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-[#F1F3E1] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#2D2926]">Vote Recorded! 🎉</h3>
                  <p className="text-xs text-[#6F4E37] max-w-xs mx-auto leading-relaxed">
                    Thank you for voting for <strong className="text-[#2D2926]">{submittedCityVote}</strong>! We're compiling book lovers' feedback to prioritize our next crawl launch.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TILE DETAILS & LOG EDITING MODAL OVERLAY --- */}
      <AnimatePresence>
        {selectedTileId && selectedTile && (() => {
          const isReadOnly = !!viewingSavedId;
          const cfg = CATEGORY_COLORS[selectedTile.category];
          
          return (
            <div className="fixed inset-0 bg-[#2D2926]/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="details-modal-overlay">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white border-2 border-[#D9D1C7] max-w-md w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                id="details-modal-container"
              >
                
                {/* Header Colored Top Strip */}
                <div className={`h-2.5 shrink-0 ${cfg.accent}`} />

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  
                  {/* Modal Title bar */}
                  <div className="flex justify-between items-start gap-4" id="modal-title-row">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${cfg.bg} ${cfg.text}`}>
                        {cfg.label} Tile {isReadOnly && "• Archived"}
                      </span>
                      
                      {/* Cozy quote box for prompt text (highly readable even if very long) */}
                      <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#D9D1C7] my-1 relative shadow-inner">
                        <span className="absolute -top-1.5 left-2 text-3xl text-[#5A5A40]/10 font-serif font-bold select-none">“</span>
                        <p className="text-[#2D2926] font-serif text-sm sm:text-base italic leading-relaxed relative z-10 pl-2 pr-1">
                          {selectedTile.text}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { playSound('click'); setSelectedTileId(null); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer shrink-0"
                      id="btn-close-details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Log Entry Form Fields */}
                  <div className="space-y-4" id="modal-form-inputs">
                    
                    {/* Mark Completed Toggle Checkbox */}
                    <div className="flex items-center justify-between p-3.5 bg-[#FAF6F0] border border-[#D9D1C7] rounded-xl font-sans gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          id="checkbox-completed"
                          disabled={isReadOnly}
                          onClick={() => { playSound('click'); setDraftCompleted(!draftCompleted); }}
                          className={`
                            w-6 h-6 rounded-lg pointer-events-auto border-2 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shrink-0
                            ${draftCompleted 
                              ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                              : "border-[#D9D1C7] bg-white text-transparent"
                            }
                            ${isReadOnly ? "opacity-60" : ""}
                          `}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <div>
                          <span className="text-xs font-bold text-[#2D2926] block">
                            {draftCompleted ? "Tile Completed (Checked)" : "Tile Not Completed (Unchecked)"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {isReadOnly
                              ? "Archived card check state"
                              : draftCompleted ? "Currently checked off" : "Currently unchecked"
                            }
                          </span>
                        </div>
                      </div>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            playSound('toggle');
                            setDraftCompleted(!draftCompleted);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            draftCompleted
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-[#5A5A40] text-white hover:bg-[#4C4C36]"
                          }`}
                        >
                          {draftCompleted ? "Uncheck Card" : "Check Card"}
                        </button>
                      )}
                    </div>

                    {/* Tile Title / Custom Prompt Text field */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        ✏️ Custom Tile Prompt / Spot Title
                      </label>
                      <input
                        type="text"
                        id="input-tile-text"
                        value={draftTileText}
                        disabled={isReadOnly}
                        onChange={(e) => setDraftTileText(e.target.value)}
                        placeholder="e.g., Visit local bakery, Read sci-fi in cozy cafe"
                        className="w-full text-xs p-2.5 border border-[#D9D1C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FAF6F0] disabled:opacity-60 font-medium text-[#2D2926]"
                      />
                    </div>

                    {/* Location field */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        Where is your check-in site?
                      </label>
                      <input
                        type="text"
                        id="input-location"
                        value={draftLocation}
                        disabled={isReadOnly}
                        onChange={(e) => setDraftLocation(e.target.value)}
                        placeholder="e.g., Powell's City of Books, Belmont Books, Stumptown"
                        className="w-full text-xs p-2.5 border border-[#D9D1C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FAF6F0] disabled:opacity-60"
                      />
                    </div>

                    {/* Notes & Memories field */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        My Crawler Notes / What did you read?
                      </label>
                      <textarea
                        id="textarea-notes"
                        rows={isReadOnly ? 2 : 3}
                        value={draftNotes}
                        disabled={isReadOnly}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="e.g., Read Ursula K. Le Guin over a cardamom latte. Stood by the moss mural on Alberta!"
                        className="w-full text-xs p-2.5 border border-[#D9D1C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-[#FAF6F0] resize-none disabled:opacity-60"
                      />
                    </div>

                    {/* Experience Rating */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                        Exp Rating
                      </label>
                      <div className="flex gap-1.5 focus:outline-none" id="rating-star-selector">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const starNum = idx + 1;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => { playSound('click'); setDraftRating(starNum); }}
                              className="cursor-pointer transition-transform duration-100 hover:scale-110 disabled:cursor-default"
                              id={`star-btn-${starNum}`}
                            >
                              <Star 
                                className={`w-5 h-5 ${starNum <= draftRating ? 'text-[#BC6C25] fill-[#BC6C25]' : 'text-[#D9D1C7]'} ${isReadOnly ? 'opacity-85' : ''}`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PHOTO & STICKER KEEPSAKE SECTION */}
                    <div className="border border-dashed border-[#D9D1C7] p-3 rounded-xl bg-[#FAF6F0]" id="keepsake-picker-section">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                        ✨ Keepsake Photo or Explorer Sticker
                      </span>
                      
                      {draftPhotoUrl ? (
                        <div className="space-y-3">
                          {/* Polaroid Frame Memory container */}
                          <div className="bg-white p-3 pb-5 border border-[#D9D1C7] rounded-xs shadow-md max-w-[140px] mx-auto transform -rotate-1 relative">
                            {!isReadOnly && (
                              <button 
                                type="button" 
                                onClick={() => { playSound('click'); setDraftPhotoUrl(""); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#BC6C25] text-white rounded-full flex items-center justify-center shadow-md cursor-pointer z-20 hover:bg-[#8B4513]"
                                title="Remove photo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="aspect-square w-full bg-[#FAF6F0] flex items-center justify-center overflow-hidden border border-[#D9D1C7]/30 rounded-2xs">
                              {draftPhotoUrl.startsWith('data:image') || draftPhotoUrl.startsWith('http') ? (
                                <img src={draftPhotoUrl} alt="Keepsake Book Journey" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-5xl select-none">{draftPhotoUrl}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-center mt-2 font-serif font-bold text-[#6F4E37] truncate max-w-full">
                              {draftLocation || "Crawl Memory"}
                            </div>
                          </div>
                          
                          {!isReadOnly && (
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => { playSound('click'); setDraftPhotoUrl(""); }}
                                className="text-[10px] text-[#BC6C25] font-bold hover:underline"
                              >
                                Clear Memory Keepsake
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {isReadOnly ? (
                            <div className="text-center py-4 text-xs text-neutral-400 font-mono italic">
                              No photos logged for this check-in card
                            </div>
                          ) : (
                            <>
                              {/* File Upload Selector */}
                              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-[#D9D1C7]/80 rounded-xl bg-white hover:bg-[#FDFBF7] transition-all relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="keepsake-file-upload"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      playSound('click');
                                      try {
                                        const compressed = await compressImage(file);
                                        setDraftPhotoUrl(compressed);
                                      } catch (err) {
                                        console.error("Failed to compress image:", err);
                                      }
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <Camera className="w-6 h-6 text-[#5A5A40] mb-1" />
                                <span className="text-xs font-semibold text-[#2D2926]">Upload custom photo</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">Camera snap or storage memory</span>
                              </div>

                              {/* Preset Stamps stickers */}
                              <div>
                                <span className="block text-[10px] font-semibold text-[#2D2926] mb-1">
                                  Or stamp with an Explorer Sticker:
                                </span>
                                <div className="grid grid-cols-4 gap-1.5 pt-1">
                                  {PRESET_STICKERS.map((stick) => (
                                    <button
                                      key={stick.char}
                                      type="button"
                                      onClick={() => { playSound('click'); setDraftPhotoUrl(stick.char); }}
                                      className="py-1 px-1 bg-white hover:bg-[#F1F3E1] border border-[#D9D1C7]/60 hover:border-[#5A5A40] rounded-lg transition-all text-xs cursor-pointer flex flex-col items-center gap-0.5"
                                    >
                                      <span className="text-lg">{stick.char}</span>
                                      <span className="text-[8px] text-[#6F4E37] truncate max-w-full">{stick.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-neutral-100 shrink-0 font-sans">
                  {isReadOnly ? (
                    <div className="flex justify-end">
                      <button
                        onClick={() => { playSound('click'); setSelectedTileId(null); }}
                        className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#4C4C36] rounded-xl cursor-pointer"
                        id="btn-close-details"
                      >
                        Close Preview
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => { playSound('click'); setSelectedTileId(null); }}
                        className="px-4 py-2 bg-[#FAF6F0] hover:bg-[#E8E2D9] text-xs font-semibold text-[#2D2926] border border-[#D9D1C7] rounded-lg cursor-pointer"
                        id="btn-save-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTileInfo}
                        className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4C4C36] text-xs font-bold text-white rounded-lg cursor-pointer"
                        id="btn-save-confirm"
                      >
                        Save Check-in
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* --- GRAND BINGO CONGRATULATIONS MODAL --- */}
      <AnimatePresence>
        {showCelebrationModal && recentCelebratedLine && (
          <div className="fixed inset-0 bg-[#2D2926]/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm" id="celebration-overlay">
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-white border-2 border-[#BC6C25] max-w-md w-full rounded-2xl overflow-hidden p-6 text-center shadow-2xl relative"
              id="celebration-modal-container"
            >
              {/* Rain tree backdrop decor */}
              <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

              {/* Triumphant Header Badge */}
              <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-lg animate-bounce">
                <Award className="w-8 h-8 text-white stroke-[2]" />
              </div>

              <span className="text-[10px] bg-[#BC6C25]/10 text-[#BC6C25] border border-[#BC6C25]/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest block w-max mx-auto mb-3">
                🏆 Speed Bingo Achieved!
              </span>

              <h2 className="text-3xl font-serif font-bold text-[#2D2926] tracking-tight mb-2">
                {activeCity.includes("Seattle") ? "Emerald City Crawl Victory!" : activeCity.includes("Portland") ? "Rose City Crawl Victory!" : `${activeCity} Crawl Victory!`}
              </h2>

              <p className="text-sm text-[#6F4E37] mb-6 max-w-xs mx-auto">
                Magnificent job! You successfully completed <span className="font-bold text-[#5A5A40]">{recentCelebratedLine.label}</span> inside a <span className="font-bold text-[#BC6C25]">24-Hour Window</span> during your {activeCity.includes("Seattle") ? "Seattle" : "Portland"} Book Crawl.
              </p>

              {/* Certificate visual mock */}
              <div className="bg-[#FAF6F0] border-2 border-dashed border-[#D9D1C7] p-5 rounded-xl text-left space-y-3 mb-6 relative">
                <BookCheck className="absolute top-3 right-3 text-[#5A5A40]/10 w-16 h-16 pointer-events-none" />
                
                <h4 className="text-[10px] uppercase tracking-wider text-[#6F4E37] font-bold">
                  {activeCity.includes("Seattle") ? "Seattle" : activeCity.includes("Portland") ? "Portland" : activeCity} Book Crawler Certificate
                </h4>
                
                <div>
                  <span className="text-[10px] text-neutral-400 block font-mono">CERTIFIED EXPLORER:</span>
                  <span className="text-sm font-semibold text-[#2D2926] font-serif">Acoustic Book Lover 📖🌲</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-mono">COMPLETED LINE:</span>
                    <span className="text-xs font-bold text-[#5A5A40]">{recentCelebratedLine.label}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-mono">DATED MARK:</span>
                    <span className="text-[11px] font-bold text-[#2D2926]">
                      {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share/Actions buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => { playSound('completed'); triggerBingoConfetti(); }}
                  className="w-full py-3 bg-[#5A5A40] hover:bg-[#4C4C36] text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
                  id="btn-re-explode"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Release More Confetti!</span>
                </button>

                <button
                  onClick={() => { playSound('click'); setShowCelebrationModal(false); }}
                  className="w-full py-2.5 text-xs text-[#2D2926] hover:bg-[#E8E2D9] bg-[#FAF6F0] border border-[#D9D1C7] font-medium rounded-xl transition-all cursor-pointer"
                  id="btn-close-celebration"
                >
                  Return to Crawl Board
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- RECAP EXPORT & DOWNLOAD MODAL --- */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-[#2D2926]/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="export-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border-2 border-[#D9D1C7] max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 relative max-h-[90vh] flex flex-col"
              id="export-modal-container"
            >
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#BC6C25]/10 text-[#BC6C25] rounded-full flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2D2926]">
                      Export Crawl Recap
                    </h3>
                    <p className="text-[10px] text-[#6F4E37]">
                      Save as image, print PDF summary, or copy share text
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable / Image Capture Card Container */}
              <div className="overflow-y-auto my-4 pr-1 flex-1 space-y-4">
                <div
                  ref={exportCardRef}
                  className="bg-[#FAF6F0] border-2 border-[#D9D1C7] p-4 sm:p-6 pb-8 sm:pb-10 rounded-2xl space-y-4 shadow-sm text-[#2D2926]"
                  id="exportable-recap-card"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start border-b border-[#D9D1C7] pb-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#5A5A40] block">
                        {headerBadge}
                      </span>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2D2926] mt-0.5">
                        {endCrawlProposedName || currentSavedCrawl?.name || (activeCity.includes("Seattle") ? "Seattle Bookstore Crawl" : "Portland Bookstore Crawl")}
                      </h2>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Date: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="header-counter-box bg-[#5A5A40] text-white px-3.5 py-2 rounded-xl flex flex-col items-center justify-center text-center shadow-3xs min-w-[62px]">
                        <span className="text-sm font-bold font-serif block leading-none">{totalBingos}</span>
                        <span className="text-[8px] uppercase tracking-wider block font-sans leading-tight mt-0.5">Bingos</span>
                      </div>
                      <div className="header-counter-box bg-[#BC6C25] text-white px-3.5 py-2 rounded-xl flex flex-col items-center justify-center text-center shadow-3xs min-w-[62px]">
                        <span className="text-sm font-bold font-serif block leading-none">{completedCount}/25</span>
                        <span className="text-[8px] uppercase tracking-wider block font-sans leading-tight mt-0.5">Checked</span>
                      </div>
                    </div>
                  </div>

                  {/* Crawler Title & Persona Banner */}
                  <div className="bg-[#5A5A40] text-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg">{crawlAnalytics.personaBadgeIcon}</span>
                        <span className="font-serif font-bold text-xs sm:text-sm tracking-tight text-amber-200">
                          {crawlAnalytics.personaTitle}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-amber-100/90 font-sans italic">
                        "{crawlAnalytics.personaSubtitle}"
                      </p>
                    </div>
                    <div className="rank-container text-right shrink-0 flex flex-col items-end justify-center">
                      <span className="text-[8.5px] font-mono uppercase text-amber-200/80 block mb-0.5">
                        {activeCity.includes("Seattle") ? "SEA Crawl Rank" : activeCity.includes("Portland") ? "PDX Crawl Rank" : `${activeCity.split(',')[0]} Rank`}
                      </span>
                      <span className="rank-badge text-xs font-bold font-mono text-amber-300 block text-right leading-tight">
                        <span className="inline-block">
                          {completedCount >= 25 ? 'Master 🌟' : completedCount >= 12 ? 'Veteran 🌲' : completedCount >= 5 ? 'Explorer 🗺️' : 'Novice 📖'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Crawl Speed & Fun Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="stat-box-card bg-white p-2.5 rounded-xl border border-[#D9D1C7]/70 shadow-3xs flex flex-col items-center justify-center text-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-gray-400 font-mono block leading-tight">Fastest Hop</span>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#BC6C25] block leading-normal py-0.5">
                        {crawlAnalytics.fastestGapMinutes !== null ? `⚡ ${crawlAnalytics.fastestGapMinutes} mins` : '—'}
                      </span>
                      <span className="text-[7.5px] text-gray-400 block leading-tight">min stamp gap</span>
                    </div>

                    <div className="stat-box-card bg-white p-2.5 rounded-xl border border-[#D9D1C7]/70 shadow-3xs flex flex-col items-center justify-center text-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-gray-400 font-mono block leading-tight">Pace Velocity</span>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#5A5A40] block leading-normal py-0.5">
                        {crawlAnalytics.averagePaceMinutes !== null ? `⏱️ ~${crawlAnalytics.averagePaceMinutes}m/spot` : '—'}
                      </span>
                      <span className="text-[7.5px] text-gray-400 block leading-tight">avg speed</span>
                    </div>

                    <div className="stat-box-card bg-white p-2.5 rounded-xl border border-[#D9D1C7]/70 shadow-3xs flex flex-col items-center justify-center text-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-gray-400 font-mono block leading-tight">Photo Proof</span>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#2D2926] block leading-normal py-0.5">
                        📸 {crawlAnalytics.photoList.length} photos
                      </span>
                      <span className="text-[7.5px] text-gray-400 block leading-tight">snapshots</span>
                    </div>

                    <div className="stat-box-card bg-white p-2.5 rounded-xl border border-[#D9D1C7]/70 shadow-3xs flex flex-col items-center justify-center text-center">
                      <span className="text-[8.5px] uppercase tracking-wider text-gray-400 font-mono block leading-tight">Scrapbook Notes</span>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#6F4E37] block leading-normal py-0.5">
                        ✍️ {crawlAnalytics.notesList.length} notes
                      </span>
                      <span className="text-[7.5px] text-gray-400 block leading-tight">memories</span>
                    </div>
                  </div>

                  {/* Unlocked Badges */}
                  {crawlAnalytics.badges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono mr-1">
                        Badges Unlocked:
                      </span>
                      {crawlAnalytics.badges.map((b, i) => (
                        <span key={i} className="unlocked-badge inline-flex items-center justify-center gap-1 bg-white border border-[#BC6C25]/40 text-[#2D2926] px-2.5 py-1 rounded-full text-[9px] font-semibold shadow-3xs leading-none">
                          <span className="inline-flex items-center leading-none">{b.icon}</span>
                          <span className="inline-flex items-center leading-none">{b.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 5x5 Visual Board Grid with Full Text */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 bg-[#E8E2D9] p-2 sm:p-2.5 rounded-xl" id="exportable-5x5-grid">
                    {displayTiles.map((t, idx) => {
                      const tCfg = CATEGORY_COLORS[t.category];
                      return (
                        <div
                          key={idx}
                          className={`bingo-tile p-1.5 sm:p-2 rounded-lg text-[8.5px] sm:text-[9.5px] flex flex-col items-center justify-center text-center border leading-snug min-h-[68px] sm:min-h-[78px] transition-all relative overflow-hidden ${
                            t.completed 
                              ? `${tCfg.bg} ${tCfg.text} ${tCfg.border} shadow-xs font-semibold` 
                              : 'bg-white text-[#2D2926] border-[#D9D1C7]'
                          }`}
                        >
                          <div className="tile-text-container my-auto flex flex-col items-center justify-center text-center w-full px-0.5">
                            <span className="font-sans font-medium block leading-tight text-center">
                              {t.text}
                            </span>
                          </div>
                          {t.completed && (
                            <div className="export-done-badge absolute bottom-1 right-1 bg-white text-[#5A5A40] px-1.5 py-0.5 rounded-full inline-flex items-center justify-center font-bold text-[7px] sm:text-[7.5px] shadow-2xs leading-none shrink-0">
                              <span className="inline-flex items-center leading-none">✓ Done</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Featured Photo Memories Polaroid Wall */}
                  {crawlAnalytics.photoList.length > 0 && (
                    <div className="pt-3 border-t border-[#D9D1C7]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif font-bold text-[#5A5A40] text-xs flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#BC6C25]" />
                          <span>Featured Crawl Memories ({crawlAnalytics.photoList.length})</span>
                        </span>
                        <span className="proof-badge text-[9px] bg-[#BC6C25]/10 text-[#BC6C25] font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none">
                          📸 Photo Proof Attached
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {crawlAnalytics.photoList.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="photo-memory-card bg-white p-2.5 rounded-lg border border-[#D9D1C7] shadow-xs relative text-center space-y-2"
                          >
                            <div className="w-full h-28 bg-neutral-100 rounded overflow-hidden border border-neutral-200 relative">
                              <img
                                src={t.photoUrl}
                                alt={t.locationName || t.text}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                              {t.rating && (
                                <div className="absolute bottom-1 right-1 bg-black/60 text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                  {'★'.repeat(t.rating)}
                                </div>
                              )}
                            </div>

                            <div className="text-left px-0.5">
                              <span className="font-serif font-bold text-[9.5px] text-[#2D2926] block truncate">
                                {t.locationName || t.text}
                              </span>
                              {t.notes && (
                                <p className="text-[8.5px] text-[#6F4E37] italic font-sans line-clamp-2 mt-0.5 leading-tight">
                                  "{t.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlighted Scrapbook Notes & Quotes */}
                  {crawlAnalytics.notesList.length > 0 && (
                    <div className="pt-2 border-t border-[#D9D1C7] text-xs space-y-1.5">
                      <span className="font-serif font-bold text-[#5A5A40] text-[11px] block">
                        ✍️ Scrapbook Log & Book Quotes:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {crawlAnalytics.notesList.slice(0, 4).map((t) => (
                          <div key={t.id} className="bg-white p-2 rounded-lg border border-[#D9D1C7]/70 text-[9.5px] flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-[#2D2926] block leading-tight">{t.locationName || t.text}</span>
                              <p className="text-[#6F4E37] italic mt-0.5 font-serif">"{t.notes}"</p>
                            </div>
                            {t.rating && (
                              <span className="text-amber-500 text-[9px] shrink-0 font-bold">
                                {'★'.repeat(t.rating)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 shrink-0 space-y-2 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadCardImage('png')}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#5A5A40] hover:bg-[#4C4C36] text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{isExporting ? "Saving..." : "Download PNG"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#BC6C25] hover:bg-[#A35D1B] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isExporting ? "Generating PDF..." : "Print / Save PDF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyShareText}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FAF6F0] hover:bg-[#E8E2D9] text-[#2D2926] font-semibold border border-[#D9D1C7] rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#5A5A40]" />
                    <span>{copiedToast ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-2 text-center text-xs text-neutral-400 hover:text-neutral-600 font-medium cursor-pointer"
                >
                  Close Window
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SPEED CRAWL STOP & ARCHIVE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showEndCrawlModal && (
          <div className="fixed inset-0 bg-[#2D2926]/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="end-crawl-archive-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border-2 border-[#D9D1C7] max-w-md w-full rounded-2xl shadow-2xl overflow-hidden p-6 relative"
              id="end-crawl-archive-modal"
            >
              <div className="absolute top-0 left-0 h-1.5 bg-[#BC6C25] w-full" />
              
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#F1F3E1] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#D9D1C7]">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2D2926]">
                  Conclude & Save This Crawl?
                </h3>
                <p className="text-xs text-[#6F4E37] max-w-sm mx-auto leading-relaxed mt-1">
                  You are ending your 24-hour bookstores speed countdown. Would you like to save and export your finished crawl card?
                </p>
              </div>

              {/* Form Input for Adventure Name */}
              <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#D9D1C7] space-y-2 mb-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Give your book path a memorable name:
                </label>
                <input
                  type="text"
                  value={endCrawlProposedName}
                  onChange={(e) => setEndCrawlProposedName(e.target.value)}
                  placeholder="e.g., Snowy Pearl District Crawl 🌲"
                  className="w-full text-xs p-2.5 border border-[#D9D1C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] bg-white text-[#2D2926]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>Completed blocks: {completedCount}/25</span>
                  <span>Bingos made: {totalBingos}</span>
                </div>
              </div>

              {/* Choice Actions Stack */}
              <div className="space-y-2 font-sans text-xs">
                {/* 1. SAVE ACC CHAMPION */}
                <button
                  type="button"
                  onClick={() => handleConfirmEndAndArchive(endCrawlProposedName)}
                  className="w-full py-3 bg-[#BC6C25] hover:bg-[#A35D1B] text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-3xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Yes, Archive Run to My Library</span>
                </button>

                {/* EXPORT OPTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowEndCrawlModal(false); setShowExportModal(true); }}
                    className="py-2 px-3 bg-[#5A5A40] hover:bg-[#4C4C36] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download / Share
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    disabled={isExporting}
                    className="py-2 px-3 bg-[#FAF6F0] hover:bg-[#E8E2D9] text-[#2D2926] font-semibold border border-[#D9D1C7] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5A5A40]" /> {isExporting ? "Generating PDF..." : "Save PDF / Print"}
                  </button>
                </div>

                {/* DISCARD / JUST RESTART */}
                <button
                  type="button"
                  onClick={handleConfirmEndWithoutArchive}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-100 transition-all cursor-pointer mt-1"
                >
                  No, Just End & Reset Stopwatch
                </button>

                {/* CANCEL / BACK */}
                <button
                  type="button"
                  onClick={() => setShowEndCrawlModal(false)}
                  className="w-full py-1.5 text-neutral-400 hover:text-neutral-600 font-medium transition-all cursor-pointer text-center text-[11px]"
                >
                  Keep Crawling (Cancel)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* --- AI GEMINI SEARCH GROUNDING GENERATOR MODAL --- */}
      <AnimatePresence>
        {showAIGeneratorModal && (
          <div className="fixed inset-0 bg-[#2D2926]/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs" id="ai-generator-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border-2 border-[#D9D1C7] max-w-md w-full rounded-2xl shadow-2xl overflow-hidden p-6 relative"
              id="ai-generator-modal-container"
            >
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#BC6C25]/10 text-[#BC6C25] rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2D2926]">
                      Gemini Live Search Grounding
                    </h3>
                    <p className="text-[10px] text-[#6F4E37]">
                      Real web search for fresh local spots, signature drinks & books
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIGeneratorModal(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-xs text-[#2D2926]/80 leading-relaxed">
                  Gemini will execute a real-time Google search for current reviews, popular drinks, local bakeries, and indie bookstores in your target city to craft a custom 5x5 bingo card.
                </p>

                {/* City selection */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider">
                    Select City for Discovery:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { city: "Portland, OR", label: "🌲 Portland, OR", active: true },
                      { city: "Seattle, WA", label: "☕ Seattle, WA", active: true },
                      { city: "More Cities", label: "📍 Other Cities (Coming Soon)", active: false }
                    ].map((item) => (
                      <button
                        key={item.city}
                        type="button"
                        disabled={!item.active}
                        onClick={() => item.active && setSelectedCityForAI(item.city)}
                        className={`py-2 px-3 rounded-xl border text-left font-medium transition-all ${
                          !item.active
                            ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed col-span-2 text-center"
                            : selectedCityForAI === item.city
                            ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs cursor-pointer"
                            : "bg-[#FAF6F0] text-[#2D2926] border-[#D9D1C7] hover:bg-[#E8E2D9] cursor-pointer"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {groundedError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                    ⚠️ {groundedError}
                  </div>
                )}

                {/* Submit button / Loading State */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isGeneratingGrounded}
                    onClick={() => {
                      handleGenerateGroundedBoard(selectedCityForAI);
                    }}
                    className="w-full py-3 bg-[#BC6C25] hover:bg-[#A35D1B] disabled:bg-neutral-300 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isGeneratingGrounded ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Searching Live Web & Grounding Spots...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Generate Live Grounded Card ({selectedCityForAI})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
