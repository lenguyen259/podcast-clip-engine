# Podcast Clip Engine

Autonomous repurposing for one long 16:9 podcast. Drop the episode in the watch folder, or select the bundled inbox file, and the pipeline lists a batch of 9:16 highlights. Each clip is 30–60 seconds. The active speaker takes the full frame. When both people talk, the cut is a wide two-shot.

The episode clock reads 1–2 hours. The page does not ship a two-hour media file. Mouths play only while that person has a word and playback is running.

## Free replacements

| Paid or hosted tool | Replacement |
| --- | --- |
| Python / OpenCV speaker logic | Speaker turns timed in the episode itself |
| FFmpeg watch pipeline | The browser ingests the inbox and lists the batch |
| Docker watch folder | The page is the inbox. Selecting the bundled episode runs the pipeline |
| Runway Gen-3 / Midjourney | Procedural grades over the recorded plates |

## Run

```bash
npm install
npm run verify
npm run dev
```
