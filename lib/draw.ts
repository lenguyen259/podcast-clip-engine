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
  const speaker = speakerAt(episode, time);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : time;
  drawBackground(ctx, highlight.background, motion);
  drawCameras(ctx, speaker, motion, episode);
  drawCaption(ctx, episode, time);
  burn(ctx, highlight, time);
}

function speakerAt(episode: Episode, time: number): SpeakerId {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  return turn?.speaker ?? "mai";
}

function drawBackground(ctx: CanvasRenderingContext2D, id: BackgroundId, time: number): void {
  const wall = ctx.createLinearGradient(0, 0, 0, SIZE.h);
  wall.addColorStop(0, "#1a2430");
  wall.addColorStop(0.55, "#0c1218");
  wall.addColorStop(1, "#07090c");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  switch (id) {
    case "mesh":
      windowLight(ctx, time);
      return;
    case "particles":
      bokeh(ctx, time);
      return;
    case "bars":
      ledWall(ctx, time);
      return;
    case "rings":
      ringLight(ctx, time);
      return;
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

function windowLight(ctx: CanvasRenderingContext2D, time: number): void {
  const glow = ctx.createRadialGradient(140, 220, 20, 180, 280, 340);
  glow.addColorStop(0, "rgba(255, 214, 170, 0.45)");
  glow.addColorStop(1, "rgba(255, 214, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE.w, SIZE.h);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 6; row += 1) {
    ctx.beginPath();
    ctx.moveTo(48, 160 + row * 70 + Math.sin(time * 0.4 + row) * 4);
    ctx.lineTo(SIZE.w - 48, 180 + row * 70);
    ctx.stroke();
  }
}

function bokeh(ctx: CanvasRenderingContext2D, time: number): void {
  for (let index = 0; index < 18; index += 1) {
    const x = (index * 137) % SIZE.w;
    const y = (index * 89 + time * 18) % (SIZE.h * 0.7);
    ctx.fillStyle = index % 2 ? "rgba(255, 176, 120, 0.18)" : "rgba(150, 190, 255, 0.16)";
    ctx.beginPath();
    ctx.arc(x, y, 18 + (index % 5) * 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function ledWall(ctx: CanvasRenderingContext2D, time: number): void {
  for (let index = 0; index < 8; index += 1) {
    const height = 280 + Math.abs(Math.sin(time * 1.4 + index)) * 360;
    const paint = ctx.createLinearGradient(0, SIZE.h - height, 0, SIZE.h);
    paint.addColorStop(0, index % 2 ? "rgba(255,92,70,0.0)" : "rgba(90,140,255,0.0)");
    paint.addColorStop(1, index % 2 ? "rgba(255,92,70,0.45)" : "rgba(90,140,255,0.4)");
    ctx.fillStyle = paint;
    ctx.fillRect(36 + index * 84, SIZE.h - height - 40, 48, height);
  }
}

function ringLight(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.strokeStyle = "rgba(255, 236, 214, 0.35)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(SIZE.w / 2, 460, 210 + Math.sin(time) * 4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCameras(ctx: CanvasRenderingContext2D, active: SpeakerId, time: number, episode: Episode): void {
  const talking = Boolean(activeToken(episode, time));
  ctx.fillStyle = "#14110e";
  ctx.beginPath();
  ctx.ellipse(SIZE.w / 2, 1180, 300, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  if (active === "mai") {
    person(ctx, 48, 250, 624, 820, "mai", talking, time);
    person(ctx, 470, 980, 200, 210, "ken", false, time);
  } else {
    person(ctx, 48, 250, 624, 820, "ken", talking, time);
    person(ctx, 48, 980, 200, 210, "mai", false, time);
  }
}

function person(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  speaker: SpeakerId,
  talking: boolean,
  time: number,
): void {
  const mai = speaker === "mai";
  ctx.save();
  round(ctx, x, y, w, h, 28, mai ? "#243044" : "#2a211c");
  const cx = x + w / 2;
  const head = Math.min(w, h) * 0.16;
  const cy = y + h * 0.4;
  ctx.fillStyle = mai ? "#3c4e68" : "#1d2740";
  ctx.beginPath();
  ctx.moveTo(x + 18, y + h - 18);
  ctx.quadraticCurveTo(cx, cy + head * 0.9, x + w - 18, y + h - 18);
  ctx.lineTo(x + w - 28, y + h - 8);
  ctx.lineTo(x + 28, y + h - 8);
  ctx.fill();
  ctx.fillStyle = mai ? "#f7f1e8" : "#d5dbe6";
  ctx.beginPath();
  ctx.moveTo(cx - head * 0.2, cy + head * 0.7);
  ctx.lineTo(cx, cy + head * 1.5);
  ctx.lineTo(cx + head * 0.2, cy + head * 0.7);
  ctx.fill();
  ctx.fillStyle = mai ? "#f0c2a4" : "#e4c3a2";
  round(ctx, cx - head * 0.18, cy + head * 0.62, head * 0.36, head * 0.4, 10, mai ? "#f0c2a4" : "#e4c3a2");
  ctx.fillStyle = mai ? "#2a1c16" : "#1a1c22";
  ctx.beginPath();
  ctx.ellipse(cx, cy - head * 0.35, head * 0.86, head * 0.72, 0, Math.PI, 0);
  ctx.fill();
  const skin = ctx.createRadialGradient(cx - head * 0.2, cy - head * 0.2, 8, cx, cy, head);
  skin.addColorStop(0, mai ? "#ffe0cc" : "#f3d2b4");
  skin.addColorStop(1, mai ? "#e7a888" : "#c9956e");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, head * 0.72, head * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  const blink = time % 4.8 > 4.64;
  eye(ctx, cx - head * 0.26, cy - head * 0.06, head, blink);
  eye(ctx, cx + head * 0.26, cy - head * 0.06, head, blink);
  const open = talking ? head * (0.045 + Math.abs(Math.sin(time * 14)) * 0.05) : head * 0.028;
  ctx.fillStyle = "#7a3040";
  ctx.beginPath();
  ctx.ellipse(cx, cy + head * 0.36, head * 0.16, open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4efe6";
  ctx.font = `700 ${Math.max(16, Math.round(w * 0.06))}px Segoe UI, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(speakerName(speaker).toUpperCase(), x + 22, y + 40);
  ctx.restore();
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, head: number, blink: boolean): void {
  ctx.fillStyle = "#fffaf6";
  ctx.beginPath();
  ctx.ellipse(x, y, head * 0.11, blink ? head * 0.015 : head * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blink) return;
  ctx.fillStyle = "#2a211c";
  ctx.beginPath();
  ctx.arc(x, y, head * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawCaption(ctx: CanvasRenderingContext2D, episode: Episode, time: number): void {
  const turn = episode.turns.find((item) => time >= item.start && time <= item.end);
  if (!turn) return;
  const index = turn.words.findIndex((word) => time >= word.start && time <= word.end);
  const anchor = index === -1 ? 0 : index;
  const from = Math.max(0, anchor - 1);
  const slice = turn.words.slice(from, Math.min(turn.words.length, from + 4));
  ctx.font = "700 40px Segoe UI, sans-serif";
  const label = slice.map((word) => word.text).join(" ");
  const width = Math.min(640, ctx.measureText(label).width + 56);
  const boxX = (SIZE.w - width) / 2;
  round(ctx, boxX, 1040, width, 92, 18, "rgba(8,10,14,0.82)");
  let cursor = boxX + 28;
  ctx.textBaseline = "middle";
  slice.forEach((word, offset) => {
    const current = from + offset === index;
    ctx.fillStyle = current ? "#ffb15a" : "#f4efe6";
    ctx.textAlign = "left";
    ctx.fillText(word.text, cursor, 1086);
    cursor += ctx.measureText(`${word.text} `).width;
  });
  ctx.textBaseline = "alphabetic";
}

function activeToken(episode: Episode, time: number): string {
  for (const turn of episode.turns) {
    const word = turn.words.find((item) => time >= item.start && time <= item.end);
    if (word) return word.text;
  }
  return "";
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
