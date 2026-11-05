import assert from "node:assert/strict";
import { findHighlights, scoreTurn } from "../lib/clips.ts";
import { buildEpisode } from "../lib/sample.ts";

const episode = buildEpisode();
const highlights = findHighlights(episode);
assert.equal(highlights.length, 3);
assert.ok(highlights.every((clip) => clip.end - clip.start >= 3));
assert.ok(highlights[0].start < highlights[1].start);

const question = episode.turns.find((turn) => turn.text.includes("?"));
const closer = episode.turns.find((turn) => turn.text === "That is the whole show.");
assert.ok(question && closer);
assert.ok(scoreTurn(question).score > scoreTurn(closer).score);
assert.ok(highlights.some((clip) => clip.seedId === question.id));
assert.ok(new Set(highlights.map((clip) => clip.background)).size === 3);

for (let index = 0; index < highlights.length; index += 1) {
  for (let other = index + 1; other < highlights.length; other += 1) {
    const left = highlights[index];
    const right = highlights[other];
    assert.ok(left.end <= right.start || right.end <= left.start);
  }
}

console.log(
  highlights.map((clip) => `${clip.score} ${clip.reasons.join(",")} ${clip.text}`).join("\n"),
);
console.log("verify-clips: ok");
