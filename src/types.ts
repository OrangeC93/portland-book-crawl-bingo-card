/**
 * Types for the Portland Book Crawl Bingo Application
 */

export type Category = 'bookstore' | 'drink' | 'food' | 'prompt' | 'activity' | 'free';

export type FreeSpaceTheme = 'terracotta' | 'sage' | 'coffee' | 'rose' | 'amber';

export interface Tile {
  id: string;
  row: number;
  col: number;
  text: string;
  category: Category;
  completed: boolean;
  completedAt: number | null; // Epoch timestamp of completion
  locationName?: string;       // Custom bookstore/cafe name entered by the user
  notes?: string;              // Custom memories, books found, or thoughts
  rating?: number;             // Experience rating (1-5 stars)
  photoUrl?: string;           // Custom base64 image or cozy sticker image selection
}

export interface SavedCrawl {
  id: string;
  name: string;
  savedAt: number;
  tiles: Tile[];
  startTime: number | null;
  totalBingos: number;
  completedCount: number;
}

export interface BingoState {
  tiles: Tile[];
  startTime: number | null;     // Epoch timestamp of when the 24-hour challenge started
  challengeActive: boolean;    // If the 24-hour timer is running
  completedBingoTimes: Record<string, number>; // Maps line ID (e.g. 'row-0', 'col-3', 'diag-0') to completion timestamp
}

export interface BingoLine {
  id: string; // 'row-0', 'col-1', 'diag-0' (top-left to bottom-right), 'diag-1'
  type: 'row' | 'col' | 'diag';
  indices: number[]; // Index into tiles array [0..24]
  label: string; // e.g., "Row 1", "Diagonal ↘", etc.
}
