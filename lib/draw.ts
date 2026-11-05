import { speakerName } from "./sample";
import type { BackgroundId, Episode, Highlight, SpeakerId } from "./types";

const SIZE = { w: 720, h: 1280 };

export function paint(canvas: HTMLCanvasElement, episode: Episode, highlight: Highlight, time: number): void {
  if (canvas.width !== SIZE.w || canvas.height !== SIZE.h) {
    canvas.width = SIZE.w;
    canvas.height = SIZE.h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, SIZE.w, SIZE.h);
  const speaker = speakerAt(episode, time);
  grade(ctx, highlight.background);
  drawPlate(ctx, speaker);
  drawCaption(ctx, episode, time);
  burn(ctx, highlight, time);
}

export function speakerAt(episode: Episode, time: number): SpeakerId {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  return turn?.speaker ?? "mai";
}

function grade(ctx: CanvasRenderingContext2D, id: BackgroundId): void {
  let wash: string;
  switch (id) {
    case "mesh":
      wash = "rgba(255, 186, 120, 0.1)";
      break;
    case "particles":
      wash = "rgba(120, 160, 255, 0.1)";
      break;
    case "bars":
      wash = "rgba(255, 80, 60, 0.08)";
      break;
    case "rings":
      wash = "rgba(255, 236, 214, 0.06)";
      break;
    default: {
      const unexpected: never = id;
      wash = unexpected;
    }
  }
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  const scrim = ctx.createLinearGradient(0, SIZE.h * 0.62, 0, SIZE.h);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, SIZE.h * 0.62, SIZE.w, SIZE.h * 0.38);
}

function drawPlate(ctx: CanvasRenderingContext2D, active: SpeakerId): void {
  const plateW = 280;
  round(ctx, 28, 36, plateW, 72, 8, "rgba(8,10,14,0.72)");
  ctx.fillStyle = "#ffb15a";
  ctx.fillRect(28, 36, 6, 72);
  ctx.fillStyle = "#f6f1e8";
  ctx.textAlign = "left";
  ctx.font = "700 28px Georgia, serif";
  ctx.fillText(speakerName(active).toUpperCase(), 48, 68);
  ctx.font = "600 16px Segoe UI, sans-serif";
  ctx.fillStyle = "#d9d0c3";
  ctx.fillText("CAM  ·  ON AIR", 48, 92);
}

function drawCaption(ctx: CanvasRenderingContext2D, episode: Episode, time: number): void {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  if (!turn) return;
  const index = turn.words.findIndex((word) => time >= word.start && time <= word.end);
  const anchor = index === -1 ? 0 : index;
  const from = Math.max(0, anchor - 1);
  const slice = turn.words.slice(from, Math.min(turn.words.length, from + 4));
  ctx.font = "800 46px Segoe UI, sans-serif";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const widths = slice.map((word) => ctx.measureText(`${word.text} `).width);
  const total = widths.reduce((sum, width) => sum + width, 0);
  let cursor = (SIZE.w - total) / 2;
  slice.forEach((word, offset) => {
    const current = from + offset === index;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#111";
    ctx.strokeText(word.text, cursor, 1120);
    ctx.fillStyle = current ? "#ffe14a" : "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(word.text, cursor, 1120);
    cursor += widths[offset] ?? 0;
  });
  ctx.textBaseline = "alphabetic";
}

function burn(ctx: CanvasRenderingContext2D, highlight: Highlight, time: number): void {
  ctx.fillStyle = "rgba(244,239,230,0.8)";
  ctx.font = "600 24px Consolas, monospace";
  ctx.textAlign = "left";
  ctx.fillText(clock(time - highlight.start), 36, SIZE.h - 40);
  ctx.textAlign = "right";
  ctx.fillText(highlight.background.toUpperCase(), SIZE.w - 36, SIZE.h - 40);
}

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe - mins * 60;
  return `${mins}:${secs.toFixed(2).padStart(5, "0")}`;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
