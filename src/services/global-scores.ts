import { getSupabase } from './supabase';

export interface GlobalHighScoreEntry {
  name: string;
  score: number;
  level: number;
  created_at: string;
}

let cache: GlobalHighScoreEntry[] = [];
let lastFetchTime = 0;
let offline = false;

const CACHE_TTL = 60_000; // 60 seconds

export function getGlobalScores(): GlobalHighScoreEntry[] {
  return cache;
}

export function isGlobalOffline(): boolean {
  return offline;
}

export async function fetchGlobalScores(): Promise<GlobalHighScoreEntry[]> {
  const sb = getSupabase();
  if (!sb) {
    offline = true;
    return cache;
  }

  try {
    const { data, error } = await sb
      .from('high_scores')
      .select('name, score, level, created_at')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      offline = true;
      return cache;
    }

    offline = false;
    cache = data as GlobalHighScoreEntry[];
    lastFetchTime = Date.now();
    return cache;
  } catch {
    offline = true;
    return cache;
  }
}

export function refreshGlobalScoresIfStale(): void {
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    fetchGlobalScores();
  }
}

export async function submitGlobalScore(
  name: string,
  score: number,
  level: number,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  // Optimistic cache update
  const entry: GlobalHighScoreEntry = {
    name,
    score,
    level,
    created_at: new Date().toISOString(),
  };
  cache.push(entry);
  cache.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
  if (cache.length > 10) cache.length = 10;

  try {
    await sb.from('high_scores').insert({ name, score, level });
    // Refresh from server to get authoritative list
    await fetchGlobalScores();
  } catch {
    // fire-and-forget — cache already updated optimistically
  }
}
