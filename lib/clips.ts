import type { BackgroundId, Episode, Highlight, Turn } from "./types";

const CONTRAST = new Set(["never", "stop", "wrong", "actually", "but", "only", "before", "none", "always"]);
const NUMBER_WORDS = new Set(["one", "eight", "ninety", "zero", "two", "three"]);
const BACKGROUNDS: BackgroundId[] = ["mesh", "particles", "bars", "rings"];

export function findHighlights(episode: Episode): Highlight[] {
  const ranked = episode.turns
    .map((turn, index) => ({ turn, index, ...scoreTurn(turn) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const chosen: Highlight[] = [];
  for (const item of ranked) {
    const window = expand(episode.turns, item.index);
    const overlaps = chosen.some((clip) => window.start < clip.end && window.end > clip.start);
    if (overlaps) continue;
    chosen.push({
      id: `clip-${item.turn.id}`,
      seedId: item.turn.id,
      start: window.start,
      end: window.end,
      score: item.score,
      reasons: item.reasons,
      text: window.text,
      speaker: item.turn.speaker,
      background: BACKGROUNDS[chosen.length % BACKGROUNDS.length],
    });
    if (chosen.length === 3) break;
  }
  return chosen.sort((left, right) => left.start - right.start);
}

export function scoreTurn(turn: Turn): { score: number; reasons: string[] } {
  const tokens = turn.text.toLowerCase().split(/\s+/).map((token) => token.replace(/[^a-z0-9]/g, ""));
  let score = 0;
  const reasons: string[] = [];
  if (turn.text.trim().endsWith("?")) {
    score += 3;
    reasons.push("question");
  }
  if (/\d/.test(turn.text) || tokens.some((token) => NUMBER_WORDS.has(token))) {
    score += 2;
    reasons.push("number");
  }
  const contrast = tokens.find((token) => CONTRAST.has(token));
  if (contrast) {
    score += 2;
    reasons.push(`contrast:${contrast}`);
  }
  if (tokens.length >= 6 && tokens.length <= 16) {
    score += 1;
    reasons.push("spoken length");
  }
  return { score, reasons };
}

const MIN_CLIP_SECONDS = 30;
const MAX_CLIP_SECONDS = 60;

function expand(turns: Turn[], index: number): { start: number; end: number; text: string } {
  let from = index;
  let to = index;
  const duration = () => turns[to].end - turns[from].start;
  while (duration() < MIN_CLIP_SECONDS) {
    const canNext = to + 1 < turns.length;
    const canPrev = from > 0;
    const nextSpan = canNext ? turns[to + 1].end - turns[from].start : Number.POSITIVE_INFINITY;
    const prevSpan = canPrev ? turns[to].end - turns[from - 1].start : Number.POSITIVE_INFINITY;
    if (canNext && nextSpan <= prevSpan && nextSpan <= MAX_CLIP_SECONDS) to += 1;
    else if (canPrev && prevSpan <= MAX_CLIP_SECONDS) from -= 1;
    else break;
  }
  return {
    start: turns[from].start,
    end: turns[to].end,
    text: turns.slice(from, to + 1).map((turn) => turn.text).join(" "),
  };
}
