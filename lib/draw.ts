import { speakerName, speakerRole } from "./sample";
import type { BackgroundId, CameraId, Episode, Highlight, SpeakerId } from "./types";

const SIZE = { w: 720, h: 1280 };
const MOUTH_BRIDGE = 0.09;

export const CLOSED_MOUTH: Record<SpeakerId, number> = {
  mai: 3.52,
  ken: 3.55,
};

export function paint(canvas: HTMLCanvasElement, episode: Episode, highlight: Highlight, time: number): void {
  if (canvas.width !== SIZE.w || canvas.height !== SIZE.h) {
    canvas.width = SIZE.w;
    canvas.height = SIZE.h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, SIZE.w, SIZE.h);
  const camera = speakerAt(episode, time);
  const sans = fontStack("--font-sans", "Arial, Helvetica, sans-serif");
  const display = fontStack("--font-display", "Georgia, serif");
  grade(ctx, highlight.background);
  drawBug(ctx, episode, sans);
  drawIdent(ctx, episode, camera, sans, display);
  drawCaption(ctx, episode, time, sans);
  burn(ctx, highlight, time, sans);
}

export function speakerAt(episode: Episode, time: number): CameraId {
  const talking = new Set<SpeakerId>();
  const covered = new Set<SpeakerId>();
  for (const turn of episode.turns) {
    if (turn.words.some((word) => time >= word.start && time < word.end)) talking.add(turn.speaker);
    if (time >= turn.start && time <= turn.end) covered.add(turn.speaker);
  }
  if (talking.size >= 2 || covered.size >= 2) return "both";
  const talkingOnly = oneOf(talking);
  if (talkingOnly) return talkingOnly;
  const coveredOnly = oneOf(covered);
  if (coveredOnly) return coveredOnly;
  let held: SpeakerId = "mai";
  for (const turn of episode.turns) {
    if (turn.end <= time) held = turn.speaker;
  }
  return held;
}

export function mouthOpen(episode: Episode, time: number, speaker: SpeakerId): boolean {
  return episode.turns.some(
    (turn) =>
      turn.speaker === speaker &&
      turn.words.some((word) => time >= word.start - MOUTH_BRIDGE && time <= word.end + MOUTH_BRIDGE),
  );
}

function oneOf(ids: Set<SpeakerId>): SpeakerId | null {
  if (ids.size !== 1) return null;
  const only = [...ids][0];
  return only ?? null;
}

function fontStack(variable: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function grade(ctx: CanvasRenderingContext2D, id: BackgroundId): void {
  let wash: string;
  switch (id) {
    case "mesh":
      wash = "rgba(255, 186, 120, 0.05)";
      break;
    case "particles":
      wash = "rgba(120, 160, 255, 0.05)";
      break;
    case "bars":
      wash = "rgba(255, 80, 60, 0.04)";
      break;
    case "rings":
      wash = "rgba(255, 236, 214, 0.04)";
      break;
    default: {
      const unexpected: never = id;
      wash = unexpected;
    }
  }
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  const scrim = ctx.createLinearGradient(0, SIZE.h * 0.58, 0, SIZE.h);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, SIZE.h * 0.58, SIZE.w, SIZE.h * 0.42);
}

function drawBug(ctx: CanvasRenderingContext2D, episode: Episode, sans: string): void {
  ctx.fillStyle = "#e10600";
  ctx.fillRect(36, 40, 12, 12);
  ctx.fillStyle = "#f7f4ee";
  ctx.textAlign = "left";
  ctx.font = `700 18px ${sans}`;
  ctx.fillText(episode.title.toUpperCase(), 56, 52);
}

function drawIdent(ctx: CanvasRenderingContext2D, episode: Episode, camera: CameraId, sans: string, display: string): void {
  const y = 980;
  switch (camera) {
    case "both": {
      const width = (SIZE.w - 88) / 2;
      drawStrap(ctx, speakerName("mai"), `${speakerRole("mai")}  ·  ${episode.title}`, 36, y, width, sans, display);
      drawStrap(ctx, speakerName("ken"), `${speakerRole("ken")}  ·  ${episode.title}`, 52 + width, y, width, sans, display);
      return;
    }
    case "mai":
    case "ken":
      drawStrap(ctx, speakerName(camera), `${speakerRole(camera)}  ·  ${episode.title}`, 36, y, 440, sans, display);
      return;
    default: {
      const unexpected: never = camera;
      return unexpected;
    }
  }
}

function drawStrap(
  ctx: CanvasRenderingContext2D,
  name: string,
  role: string,
  x: number,
  y: number,
  width: number,
  sans: string,
  display: string,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(x, y, width, 92);
  ctx.fillStyle = "#e10600";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.font = `600 32px ${display}`;
  ctx.fillText(name, x + 16, y + 42);
  ctx.font = `600 16px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(role, x + 16, y + 70);
}

function drawCaption(ctx: CanvasRenderingContext2D, episode: Episode, time: number, sans: string): void {
  const lines = captionLines(episode, time);
  if (lines.length === 0) return;
  const size = lines.length > 1 ? 30 : 36;
  const gap = 12;
  const lineH = size + 18;
  ctx.font = `700 ${size}px ${sans}`;
  ctx.textBaseline = "middle";
  const measured = lines.map((line) => {
    const widths = line.words.map((word) => ctx.measureText(word.text).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, line.words.length - 1);
    return { widths, total };
  });
  const widest = measured.reduce((max, line) => Math.max(max, line.total), 0);
  const boxW = Math.min(SIZE.w - 72, widest + 48);
  const boxH = lineH * lines.length + 16;
  const boxX = (SIZE.w - boxW) / 2;
  const boxY = 1248 - boxH;
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  lines.forEach((line, lineIndex) => {
    const metrics = measured[lineIndex];
    if (!metrics) return;
    let cursor = boxX + (boxW - metrics.total) / 2;
    const mid = boxY + 8 + lineH * lineIndex + lineH / 2;
    line.words.forEach((word, index) => {
      ctx.fillStyle = word.on ? "#ffffff" : "rgba(255,255,255,0.42)";
      ctx.textAlign = "left";
      ctx.fillText(word.text, cursor, mid);
      cursor += (metrics.widths[index] ?? 0) + gap;
    });
  });
  ctx.textBaseline = "alphabetic";
}

function captionLines(episode: Episode, time: number): { words: { text: string; on: boolean }[] }[] {
  const lines: { words: { text: string; on: boolean }[] }[] = [];
  for (const turn of episode.turns) {
    if (time < turn.start || time > turn.end) continue;
    const index = turn.words.findIndex((word) => time >= word.start && time < word.end);
    const anchor = index === -1 ? Math.max(0, turn.words.length - 2) : index;
    const from = Math.max(0, anchor - 1);
    const words = turn.words.slice(from, from + 3).map((word, offset) => ({
      text: word.text,
      on: from + offset === index,
    }));
    if (words.length > 0) lines.push({ words });
  }
  return lines.slice(0, 2);
}

function burn(ctx: CanvasRenderingContext2D, highlight: Highlight, time: number, sans: string): void {
  ctx.font = `600 16px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(247,244,238,0.78)";
  ctx.fillText(clock(time - highlight.start), SIZE.w - 36, 52);
}

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe - mins * 60;
  return `${mins}:${secs.toFixed(2).padStart(5, "0")}`;
}
