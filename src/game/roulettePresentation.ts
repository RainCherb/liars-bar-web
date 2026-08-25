export const ROULETTE_STAGE_MS = {
  load: 650,
  cock: 550,
  spin: 1750,
  aim: 500,
  impact: 650,
  result: 1000,
} as const;

export const ROULETTE_PRESENTATION_MS = Object.values(ROULETTE_STAGE_MS).reduce(
  (total, duration) => total + duration,
  0,
);

export type RouletteStage = keyof typeof ROULETTE_STAGE_MS;
