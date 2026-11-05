"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findHighlights } from "../lib/clips";
import { paint } from "../lib/draw";
import { buildEpisode, speakerName } from "../lib/sample";
import type { Highlight } from "../lib/types";

export function Room() {
  const episode = useMemo(() => buildEpisode(), []);
  const highlights = useMemo(() => findHighlights(episode), [episode]);
  const [selectedId, setSelectedId] = useState(highlights[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const selected = highlights.find((clip) => clip.id === selectedId) ?? highlights[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(selected?.start ?? 0);
  const playRef = useRef(false);
  const clipRef = useRef(selected);
  clipRef.current = selected;
  playRef.current = playing;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      const clip = clipRef.current;
      const canvas = canvasRef.current;
      if (clip && playRef.current) {
        timeRef.current += delta;
        if (timeRef.current >= clip.end) {
          timeRef.current = clip.end;
          playRef.current = false;
          setPlaying(false);
        }
      }
      if (clip && canvas) paint(canvas, episode, clip, timeRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [episode]);

  function choose(clip: Highlight) {
    setSelectedId(clip.id);
    timeRef.current = clip.start;
    playRef.current = false;
    setPlaying(false);
  }

  function toggle() {
    if (!selected) return;
    if (playing) {
      playRef.current = false;
      setPlaying(false);
      return;
    }
    if (timeRef.current >= selected.end - 0.05) timeRef.current = selected.start;
    playRef.current = true;
    setPlaying(true);
  }

  return (
    <main className="room">
      <header className="top">
        <div>
          <p className="eyebrow">Agent 03</p>
          <h1>Clip room</h1>
        </div>
        <ul className="chips">
          <li><span>WebRTC VAD</span><b>Turn timing</b></li>
          <li><span>Face track</span><b>Speaker cut</b></li>
          <li><span>Runway / Midjourney</span><b>Drawn backgrounds</b></li>
        </ul>
      </header>
      <section className="body">
        <aside className="clips">
          {highlights.map((clip, index) => (
            <button key={clip.id} type="button" className={clip.id === selected?.id ? "clip on" : "clip"} onClick={() => choose(clip)}>
              <span>Hook {index + 1} · {clip.score}</span>
              <strong>{clip.text}</strong>
              <em>{clip.reasons.join(" · ")} · {speakerName(clip.speaker)} · {clip.background}</em>
            </button>
          ))}
          <p className="hint">Scores prefer questions, numbers, and contrast words. Windows stay under 11 seconds and do not overlap.</p>
        </aside>
        <section className="stage">
          <div className="frame">
            <canvas ref={canvasRef} className="preview" aria-label="Vertical clip preview" />
          </div>
          <button type="button" className="primary" onClick={toggle}>
            {playing ? "Pause" : "Play clip"}
          </button>
        </section>
        <aside className="script">
          <h2>{episode.title}</h2>
          {episode.turns.map((turn) => (
            <p key={turn.id} className={turn.speaker}>
              <b>{speakerName(turn.speaker)}</b> {turn.text}
            </p>
          ))}
        </aside>
      </section>
    </main>
  );
}
