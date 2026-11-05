import type { Episode, SpeakerId, Turn, Word } from "./types";

type Line = { speaker: SpeakerId; text: string; gap: number };

const POD_A: Line[] = [
  { speaker: "mai", text: "We recorded ninety minutes and posted none of it.", gap: 0.35 },
  { speaker: "ken", text: "Because the good part is always eight seconds.", gap: 0.28 },
  { speaker: "mai", text: "What if the cut found the hook before you scrubbed?", gap: 0.4 },
  { speaker: "ken", text: "It should jump to the line where you say the number.", gap: 0.22 },
  { speaker: "mai", text: "Ninety minutes down to one vertical.", gap: 0.3 },
  { speaker: "ken", text: "And the camera should already be on whoever is talking.", gap: 0.26 },
  { speaker: "mai", text: "That is the whole show.", gap: 0.24 },
  { speaker: "ken", text: "Stop burying the number in the middle.", gap: 0.28 },
  { speaker: "mai", text: "Put ninety on screen the second it is said.", gap: 0.3 },
  { speaker: "ken", text: "Wrong cut if the quiet guest is still full frame.", gap: 0.26 },
  { speaker: "mai", text: "Then the vertical already knows the speaker.", gap: 0.2 },
];

const POD_B: Line[] = [
  { speaker: "ken", text: "The Tuesday table ran long and the good joke landed late.", gap: 0.26 },
  { speaker: "mai", text: "Listeners will stay if the story starts with the suitcase.", gap: 0.24 },
];

const POD_C: Line[] = [
  { speaker: "mai", text: "The harbor story is the one people write us about.", gap: 0.24 },
  { speaker: "ken", text: "Keep the laugh, keep the letter, leave the rest on the reel.", gap: 0.22 },
];

const FILLER: Line[] = [
  { speaker: "mai", text: "She talked about the notebook, the station, and the first winter by the harbor.", gap: 0.22 },
  { speaker: "ken", text: "The letter arrived on a wet morning and she read it twice on the platform.", gap: 0.2 },
  { speaker: "mai", text: "We stayed with that scene because the room went quiet in a useful way.", gap: 0.24 },
  { speaker: "ken", text: "Then she laughed, closed the notebook, and described the long walk home.", gap: 0.22 },
  { speaker: "mai", text: "That stretch is the piece worth keeping from this part of the table.", gap: 0.2 },
];

export const EPISODE_RUNTIME = 92 * 60;

export function buildEpisode(): Episode {
  const first = buildPod(POD_A, FILLER, 6 * 60, "a");
  const second = buildPod(POD_B, FILLER, 40 * 60, "b");
  const third = buildPod(POD_C, FILLER, 74 * 60, "c");
  const turns = [...first, ...second, ...third];
  const kenIndex = turns.findIndex((turn) => turn.text.startsWith("Because the good part"));
  overlapWithNext(turns, kenIndex, 2);
  return { title: "Episode 18", turns, duration: EPISODE_RUNTIME };
}

function buildPod(seed: Line[], filler: Line[], start: number, prefix: string): Turn[] {
  const turns: Turn[] = [];
  let cursor = start;
  let serial = 0;
  const push = (line: Line) => {
    const laid = layLine(line, cursor, `${prefix}${serial}`);
    serial += 1;
    turns.push(laid.turn);
    cursor = laid.cursor;
  };
  for (const line of seed) push(line);
  let guard = 0;
  while (span(turns) < 38 && guard < 24) {
    const line = filler[guard % filler.length];
    if (!line) break;
    push(line);
    guard += 1;
  }
  return turns;
}

function span(turns: Turn[]): number {
  const first = turns[0];
  const last = turns[turns.length - 1];
  if (!first || !last) return 0;
  return last.end - first.start;
}

function layLine(line: Line, cursor: number, id: string): { turn: Turn; cursor: number } {
  const tokens = line.text.split(/\s+/).filter(Boolean);
  const words: Word[] = [];
  tokens.forEach((token) => {
    const duration = Math.min(0.52, 0.16 + token.replace(/[^\p{L}\p{N}]/gu, "").length * 0.03);
    const start = cursor;
    const end = cursor + duration;
    words.push({ text: token, start, end });
    cursor = end + 0.06;
  });
  const start = words[0]?.start ?? cursor;
  const end = words[words.length - 1]?.end ?? cursor;
  return {
    turn: { id, speaker: line.speaker, text: line.text, start, end, words },
    cursor: cursor + line.gap,
  };
}

function overlapWithNext(turns: Turn[], index: number, seconds: number): void {
  const current = turns[index];
  const next = turns[index + 1];
  if (!current || !next) return;
  const delta = next.start - (current.end - seconds);
  if (delta <= 0) return;
  for (let cursor = index + 1; cursor < turns.length; cursor += 1) {
    const turn = turns[cursor];
    turn.start -= delta;
    turn.end -= delta;
    for (const word of turn.words) {
      word.start -= delta;
      word.end -= delta;
    }
  }
}

export function speakerName(id: SpeakerId): string {
  switch (id) {
    case "mai":
      return "Mai";
    case "ken":
      return "Ken";
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function speakerRole(id: SpeakerId): string {
  switch (id) {
    case "mai":
      return "Host";
    case "ken":
      return "Guest";
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function formatRuntime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
