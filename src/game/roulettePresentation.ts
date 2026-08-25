export const ROULETTE_STAGE_MS = {
  load: 1050,
  cock: 620,
  spin: 2150,
  aim: 620,
  impact: 760,
  result: 1100,
} as const;

export const ROULETTE_PRESENTATION_MS = Object.values(ROULETTE_STAGE_MS).reduce(
  (total, duration) => total + duration,
  0,
);

export type RouletteStage = keyof typeof ROULETTE_STAGE_MS;
