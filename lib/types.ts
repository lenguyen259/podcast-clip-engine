export type SpeakerId = "mai" | "ken";

export type Word = {
  text: string;
  start: number;
  end: number;
};

export type Turn = {
  id: string;
  speaker: SpeakerId;
  text: string;
  start: number;
  end: number;
  words: Word[];
};

export type BackgroundId = "mesh" | "particles" | "bars" | "rings";

export type Highlight = {
  id: string;
  seedId: string;
  start: number;
  end: number;
  score: number;
  reasons: string[];
  text: string;
  speaker: SpeakerId;
  background: BackgroundId;
};

export type Episode = {
  title: string;
  turns: Turn[];
  duration: number;
};
