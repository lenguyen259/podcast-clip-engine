import { speakerName } from "./sample";
import type { BackgroundId, Episode, Highlight, SpeakerId, Turn } from "./types";

const SIZE = { w: 720, h: 1280 };

export function paint(canvas: HTMLCanvasElement, episode: Episode, highlight: Highlight, time: number): void {
  if (canvas.width !== SIZE.w || canvas.height !== SIZE.h) {
    canvas.width = SIZE.w;
    canvas.height = SIZE.h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const speaker = speakerAt(episode, time);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : time;
  drawBackground(ctx, highlight.background, motion);
  drawCameras(ctx, speaker, motion);
  drawCaption(ctx, episode, time);
  burn(ctx, highlight, time);
}

function speakerAt(episode: Episode, time: number): SpeakerId {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  return turn?.speaker ?? "mai";
}

function drawBackground(ctx: CanvasRenderingContext2D, id: BackgroundId, time: number): void {
  switch (id) {
    case "mesh":
      mesh(ctx, time);
      return;
    case "particles":
      particles(ctx, time);
      return;
    case "bars":
      bars(ctx, time);
      return;
    case "rings":
      rings(ctx, time);
      return;
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

function mesh(ctx: CanvasRenderingContext2D, time: number): void {
  const paint = ctx.createLinearGradient(0, 0, SIZE.w, SIZE.h);
  paint.addColorStop(0, "#07343a");
  paint.addColorStop(1, "#101018");
  ctx.fillStyle = paint;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  ctx.strokeStyle = "rgba(125, 255, 214, 0.35)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row += 1) {
    ctx.beginPath();
    for (let step = 0; step <= 12; step += 1) {
      const x = (step / 12) * SIZE.w;
      const y = 120 + row * 140 + Math.sin(time + step * 0.4 + row) * 18;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function particles(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = "#071018";
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  for (let index = 0; index < 40; index += 1) {
    const x = (index * 97) % SIZE.w;
    const y = (index * 53 + time * 40) % SIZE.h;
    ctx.fillStyle = index % 2 ? "#7dffd6" : "#f4efe6";
    ctx.beginPath();
    ctx.arc(x, y, 4 + (index % 4), 0, Math.PI * 2);
    ctx.fill();
  }
}

function bars(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = "#0c1210";
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  for (let index = 0; index < 14; index += 1) {
    const height = 180 + Math.abs(Math.sin(time * 2 + index)) * 520;
    ctx.fillStyle = index % 2 ? "#14b8a6" : "#134e4a";
    ctx.fillRect(30 + index * 48, SIZE.h - height - 80, 28, height);
  }
}

function rings(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.fillStyle = "#10141c";
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  ctx.strokeStyle = "#7dffd6";
  ctx.lineWidth = 3;
  for (let index = 1; index <= 6; index += 1) {
    ctx.beginPath();
    ctx.arc(SIZE.w / 2, 430, 40 + index * 48 + Math.sin(time + index) * 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCameras(ctx: CanvasRenderingContext2D, active: SpeakerId, time: number): void {
  const talking = 1 + Math.abs(Math.sin(time * 8)) * 0.04;
  if (active === "mai") {
    camera(ctx, 48, 180, 624, 760, "mai", talking);
    camera(ctx, 430, 980, 230, 180, "ken", 1);
  } else {
    camera(ctx, 48, 180, 624, 760, "ken", talking);
    camera(ctx, 60, 980, 230, 180, "mai", 1);
  }
}

function camera(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, speaker: SpeakerId, scale: number): void {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  round(ctx, x, y, w, h, 28, speaker === "mai" ? "#1f3a34" : "#1c2740");
  ctx.fillStyle = speaker === "mai" ? "#f0c2a0" : "#d7c4a8";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.42, Math.min(w, h) * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "700 28px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(speakerName(speaker).toUpperCase(), x + 24, y + 48);
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, episode: Episode, time: number): void {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  if (!turn) return;
  const words = wordsAround(turn, time);
  ctx.font = "700 42px Segoe UI, sans-serif";
  const width = Math.min(620, ctx.measureText(words).width + 48);
  round(ctx, (SIZE.w - width) / 2, 860, width, 84, 16, "rgba(6, 10, 12, 0.78)");
  ctx.fillStyle = "#f4efe6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(words, SIZE.w / 2, 902);
  ctx.textBaseline = "alphabetic";
}

function wordsAround(turn: Turn, time: number): string {
  const index = turn.words.findIndex((word) => time >= word.start && time <= word.end);
  const anchor = index === -1 ? 0 : index;
  const from = Math.max(0, anchor - 1);
  const to = Math.min(turn.words.length, from + 4);
  return turn.words.slice(from, to).map((word) => word.text).join(" ");
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
