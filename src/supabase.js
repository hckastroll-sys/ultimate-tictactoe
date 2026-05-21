import { createClient } from "@supabase/supabase-js";

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getPlayerId() {
  let id = localStorage.getItem("uttt-player-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("uttt-player-id", id);
  }
  return id;
}

export function generateGameId() {
  return Math.random().toString(36).slice(2, 8);
}

const GAME_TTL_MS = 24 * 60 * 60 * 1000;

export function isExpired(createdAt) {
  return Date.now() - new Date(createdAt).getTime() > GAME_TTL_MS;
}
