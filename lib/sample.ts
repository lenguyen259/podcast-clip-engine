import type { Episode, SpeakerId, Turn, Word } from "./types";

const LINES: Array<{ speaker: SpeakerId; text: string; gap: number }> = [
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

export function buildEpisode(): Episode {
  const turns: Turn[] = [];
  let cursor = 0.4;
  LINES.forEach((line, index) => {
    const tokens = line.text.split(/\s+/);
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
    turns.push({ id: `t${index}`, speaker: line.speaker, text: line.text, start, end, words });
    cursor += line.gap;
  });
  return { title: "Desk to vertical", turns, duration: cursor + 0.3 };
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
