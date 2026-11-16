import type { Level } from "./levels";
import type { Lesson } from "./types";

/** Lessons played per stack in one run (stack-by-stack mode). */
export const PER_STACK = 5;
/** Lessons played in one run in random mode. */
export const RANDOM_TOTAL = 10;

/** All stack (category) names, in a stable order. */
export function stackNames(lessons: Lesson[]): string[] {
  return [...new Set(lessons.map((l) => l.category))].sort((a, b) => a.localeCompare(b));
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffled lessons the user has not typed yet, followed by shuffled ones they have. */
function unseenFirst(pool: Lesson[], seen: ReadonlySet<string>, rng: () => number): Lesson[] {
  return [
    ...shuffle(pool.filter((l) => !seen.has(l.id)), rng),
    ...shuffle(pool.filter((l) => seen.has(l.id)), rng),
  ];
}

/**
 * Build the lessons for one run. Every run is a fresh random draw that prefers
 * lessons the user has not seen yet.
 * - stack by stack: PER_STACK lessons from each picked stack, in the order picked.
 * - random: RANDOM_TOTAL lessons from all picked stacks, mixed.
 */
export function buildQueue(
  lessons: Lesson[],
  stacks: string[],
  level: Level,
  random: boolean,
  seen: ReadonlySet<string> = new Set(),
  rng: () => number = Math.random,
): Lesson[] {
  const pool = (name: string) => lessons.filter((l) => l.category === name && l.level === level);
  if (random) {
    return shuffle(unseenFirst(stacks.flatMap(pool), seen, rng).slice(0, RANDOM_TOTAL), rng);
  }
  return stacks.flatMap((s) => unseenFirst(pool(s), seen, rng).slice(0, PER_STACK));
}
