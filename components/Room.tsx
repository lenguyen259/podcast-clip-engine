"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findHighlights } from "../lib/clips";
import { paint } from "../lib/draw";
import { buildEpisode, speakerName } from "../lib/sample";
import type { Highlight } from "../lib/types";
import { DialogueVoice, type SpokenWord, type VoiceKind } from "../lib/voice";

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
  const voice = useRef(new DialogueVoice());
  clipRef.current = selected;
  playRef.current = playing;

  useEffect(() => {
    voice.current.onEnded = (time) => {
      timeRef.current = time;
      playRef.current = false;
      setPlaying(false);
    };
    return () => voice.current.stop();
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      const clip = clipRef.current;
      const canvas = canvasRef.current;
      if (clip && playRef.current) {
        if (voice.current.isRunning()) {
          const sample = voice.current.sample();
          if (sample !== null) timeRef.current = Math.min(clip.end, Math.max(clip.start, sample));
        } else {
          timeRef.current += delta;
          if (timeRef.current >= clip.end) {
            timeRef.current = clip.end;
            playRef.current = false;
            setPlaying(false);
          }
        }
      }
      if (clip && canvas) paint(canvas, episode, clip, timeRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [episode]);

  function cuesFrom(clip: Highlight, from: number): { words: SpokenWord[]; voice: VoiceKind }[] {
    return episode.turns.flatMap((turn) => {
      const words = turn.words
        .filter((word) => word.end > clip.start && word.start < clip.end && word.end > from + 0.02)
        .map((word) => ({
          text: word.text,
          start: Math.max(word.start, clip.start),
          end: Math.min(word.end, clip.end),
        }));
      if (words.length === 0) return [];
      const kind: VoiceKind = turn.speaker === "mai" ? "female" : "male";
      return [{ words, voice: kind }];
    });
  }

  function choose(clip: Highlight) {
    voice.current.stop();
    setSelectedId(clip.id);
    timeRef.current = clip.start;
    playRef.current = false;
    setPlaying(false);
  }

  function toggle() {
    if (!selected) return;
    if (playing) {
      voice.current.stop();
      playRef.current = false;
      setPlaying(false);
      return;
    }
    if (timeRef.current >= selected.end - 0.05) timeRef.current = selected.start;
    const cues = cuesFrom(selected, timeRef.current);
    if (cues.length === 0 || !("speechSynthesis" in window)) return;
    voice.current.start(cues);
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
          <li><span>Runway / Midjourney</span><b>Drawn set</b></li>
        </ul>
      </header>
      <section className="body">
        <aside className="clips">
          {highlights.map((clip, index) => (
            <button key={clip.id} type="button" className={clip.id === selected?.id ? "clip on" : "clip"} onClick={() => choose(clip)}>
              <span>0{index + 1}</span>
              <strong>{clip.text}</strong>
              <em>{speakerName(clip.speaker)} · {clip.reasons.join(" · ")} · {clip.background}</em>
            </button>
          ))}
          <p className="hint">The voice owns the clock. The camera and the caption stay on the word being said.</p>
        </aside>
        <section className="stage">
          <div className="device">
            <div className="frame">
              <canvas ref={canvasRef} className="preview" aria-label="Vertical clip preview" />
            </div>
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
