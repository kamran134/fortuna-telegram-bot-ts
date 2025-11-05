/**
 * Joke types enumeration
 */

export const JokeTypes = {
  TAG_REGISTERED: 0,
  DEACTIVE_GAME: 1,
  LEFT_GAME: 2,
} as const;

export type JokeTypeValue = typeof JokeTypes[keyof typeof JokeTypes];
