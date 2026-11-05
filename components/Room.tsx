"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findHighlights } from "../lib/clips";
import { mouthOpen, paint, speakerAt } from "../lib/draw";
import { buildEpisode, formatRuntime, speakerName } from "../lib/sample";
import type { Episode, Highlight, SpeakerId } from "../lib/types";
import { DialogueVoice, type SpokenWord, type VoiceKind } from "../lib/voice";

function holdClosed(video: HTMLVideoElement): void {
  const closed = Number(video.dataset.closed ?? "0");
  if (video.readyState >= 1 && Number.isFinite(closed) && Math.abs(video.currentTime - closed) > 0.07) {
    video.currentTime = closed;
  }
  if (!video.paused) video.pause();
}

function syncCast(root: HTMLElement, episode: Episode, time: number, playing: boolean): void {
  root.setAttribute("data-cam", speakerAt(episode, time));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll("video").forEach((video) => {
    const speaker: SpeakerId = video.classList.contains("ken") ? "ken" : "mai";
    if (playing && !reduced && mouthOpen(episode, time, speaker)) {
      if (video.paused) void video.play().catch(() => undefined);
      return;
    }
    holdClosed(video);
  });
}

function clipSeconds(clip: Highlight): number {
  return clip.end - clip.start;
}

export function Room() {
  const episode = useMemo(() => buildEpisode(), []);
  const [inbox, setInbox] = useState<"idle" | "running" | "ready">("idle");
  const [fileLabel, setFileLabel] = useState("episode-18.mp4");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [playing, setPlaying] = useState(false);
  const selected = highlights.find((clip) => clip.id === selectedId) ?? highlights[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef(selected?.start ?? 0);
  const playRef = useRef(false);
  const clipRef = useRef(selected);
  const voice = useRef(new DialogueVoice());
  const alive = useRef(true);
  clipRef.current = selected;
  playRef.current = playing;

  useEffect(() => {
    alive.current = true;
    const root = frameRef.current;
    root?.querySelectorAll("video").forEach((video) => {
      const park = () => holdClosed(video);
      if (video.readyState >= 1) park();
      else video.addEventListener("loadeddata", park, { once: true });
    });
    return () => {
      alive.current = false;
    };
  }, [inbox]);

  useEffect(() => {
    voice.current.onEnded = (time) => {
      timeRef.current = time;
      playRef.current = false;
      setPlaying(false);
    };
    return () => {
      voice.current.stop();
      frameRef.current?.querySelectorAll("video").forEach((video) => video.pause());
    };
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
      const root = frameRef.current;
      if (root) syncCast(root, episode, timeRef.current, playRef.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [episode]);

  function cuesFrom(clip: Highlight, from: number): { words: SpokenWord[]; voice: VoiceKind }[] {
    const cues: { words: SpokenWord[]; voice: VoiceKind }[] = [];
    let coveredUntil = from;
    for (const turn of episode.turns) {
      const words = turn.words
        .filter((word) => word.end > clip.start && word.start < clip.end && word.end > from + 0.02 && word.start >= coveredUntil - 0.04)
        .map((word) => ({
          text: word.text,
          start: Math.max(word.start, clip.start),
          end: Math.min(word.end, clip.end),
        }));
      if (words.length === 0) continue;
      coveredUntil = Math.max(coveredUntil, words[words.length - 1]?.end ?? coveredUntil);
      const kind: VoiceKind = turn.speaker === "mai" ? "female" : "male";
      cues.push({ words, voice: kind });
    }
    return cues;
  }

  function ingest(name: string) {
    voice.current.stop();
    playRef.current = false;
    setPlaying(false);
    setFileLabel(name);
    setInbox("running");
    window.setTimeout(() => {
      if (!alive.current) return;
      const batch = findHighlights(episode);
      setHighlights(batch);
      setSelectedId(batch[0]?.id ?? "");
      timeRef.current = batch[0]?.start ?? 0;
      setInbox("ready");
    }, 450);
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
          <p className="eyebrow">Autonomous pipeline</p>
          <h1>Clipper</h1>
          <p className="role">Watch folder in. Vertical batch out.</p>
        </div>
        <ul className="chips">
          <li><span>Python / OpenCV</span><b>Speaker cut</b></li>
          <li><span>FFmpeg</span><b>9:16 batch</b></li>
          <li><span>Docker</span><b>Watch folder</b></li>
        </ul>
      </header>
      <section className="body">
        <aside className="clips">
          <div
            className="inbox"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) ingest(file.name);
            }}
          >
            <p>inbox/</p>
            <strong>{fileLabel}</strong>
            <em>16:9 · {formatRuntime(episode.duration)} · long episode</em>
            <button type="button" className="primary" onClick={() => ingest("episode-18.mp4")}>
              {inbox === "running" ? "Pipeline running…" : "Ingest inbox file"}
            </button>
            <button type="button" className="quiet" onClick={() => dropRef.current?.click()}>
              Select a recording
            </button>
            <input
              ref={dropRef}
              type="file"
              accept="video/*,audio/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) ingest(file.name);
                event.target.value = "";
              }}
            />
          </div>
          {inbox === "running" ? <p className="hint">Watch folder triggered the pipeline. Finding 30–60s highlights.</p> : null}
          {inbox === "ready"
            ? highlights.map((clip, index) => (
                <button key={clip.id} type="button" className={clip.id === selected?.id ? "clip on" : "clip"} onClick={() => choose(clip)}>
                  <span>0{index + 1}</span>
                  <strong>{Math.round(clipSeconds(clip))}s · {clip.text}</strong>
                  <em>{speakerName(clip.speaker)} · {clip.reasons.join(" · ") || "ranked"} · {clip.background}</em>
                </button>
              ))
            : <p className="hint">Drop the long 16:9 episode, or select the bundled inbox file. The batch lists itself.</p>}
        </aside>
        <section className="stage">
          {inbox === "ready" && selected ? (
            <>
              <div className="device">
                <div className="frame" data-cam="mai" ref={frameRef}>
                  <video className="cast mai" src="/mai.mp4" muted playsInline loop preload="auto" data-closed="3.52" aria-hidden="true" />
                  <video className="cast ken" src="/ken.mp4" muted playsInline loop preload="auto" data-closed="3.55" aria-hidden="true" />
                  <canvas ref={canvasRef} className="preview" aria-label="Vertical highlight preview" />
                </div>
              </div>
              <button type="button" className="primary" onClick={toggle}>
                {playing ? "Pause" : "Play highlight"}
              </button>
            </>
          ) : (
            <div className="wide-wait">
              <p>16:9 source</p>
              <strong>{formatRuntime(episode.duration)}</strong>
              <em>The output batch is 9:16, 30–60 seconds each, after the watch folder fires.</em>
            </div>
          )}
        </section>
        <aside className="script">
          <h2>{episode.title}</h2>
          <p className="clock">One podcast · 16:9 · {formatRuntime(episode.duration)}</p>
          {inbox === "ready"
            ? highlights.map((clip) => (
                <p key={clip.id}>
                  <b>{Math.round(clipSeconds(clip))}s highlight</b> {clip.text}
                </p>
              ))
            : <p>The episode stays in the inbox until the pipeline runs. No timeline to finish.</p>}
        </aside>
      </section>
    </main>
  );
}
