# Podcast Clip Engine

Turns a two-person conversation into three vertical hooks. The active speaker takes the large camera. Backgrounds are drawn per clip, so nothing calls a generative video or image API.

## Free replacements

| Paid or hosted tool | Replacement |
| --- | --- |
| WebRTC VAD service | Speaker turns timed in the episode itself. An upload is not required for the demo |
| Face tracking | The large frame follows whoever is speaking |
| Runway Gen-3 / Midjourney | Four procedural backgrounds: mesh, particles, bars, rings |
| Docker watch folder | The page is the ingest. Drop the decisions in the browser and host them as a static app |

## Run

```bash
npm install
npm run verify
npm run dev
```
