import type { Stats } from "./types";

/** Combine the stats of several sectors into one overall result. */
export function aggregate(list: Stats[]): Stats {
  let seconds = 0, correctChars = 0, keystrokes = 0, errors = 0, uncorrected = 0;
  const missed = new Map<string, number>();
  for (const s of list) {
    seconds += s.seconds;
    correctChars += s.correctChars;
    keystrokes += s.keystrokes;
    errors += s.errors;
    uncorrected += s.uncorrected;
    for (const m of s.missed) missed.set(m.char, (missed.get(m.char) ?? 0) + m.count);
  }
  return {
    wpm: seconds > 0 ? Math.round(correctChars / 5 / (seconds / 60)) : 0,
    accuracy: keystrokes === 0 ? 100 : Math.round(((keystrokes - errors) / keystrokes) * 100),
    errors,
    uncorrected,
    seconds,
    correctChars,
    keystrokes,
    missed: [...missed.entries()].map(([char, count]) => ({ char, count })).sort((a, b) => b.count - a.count),
  };
}
