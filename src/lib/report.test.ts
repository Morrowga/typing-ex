import { describe, expect, it } from "vitest";
import { aggregate } from "./report";
import type { Stats } from "./types";

const mk = (o: Partial<Stats>): Stats => ({
  wpm: 0, accuracy: 100, errors: 0, uncorrected: 0, seconds: 60, correctChars: 0, keystrokes: 0, missed: [], ...o,
});

describe("aggregate", () => {
  it("sums time and characters, so WPM is weighted by time, not averaged", () => {
    const a = mk({ seconds: 60, correctChars: 300, keystrokes: 300 }); // 60 wpm
    const b = mk({ seconds: 180, correctChars: 180, keystrokes: 180 }); // 12 wpm
    expect(aggregate([a, b]).wpm).toBe(Math.round(480 / 5 / 4)); // 24
  });

  it("computes accuracy from all keystrokes and merges missed keys", () => {
    const a = mk({ keystrokes: 90, errors: 10, missed: [{ char: ";", count: 6 }, { char: "(", count: 4 }] });
    const b = mk({ keystrokes: 10, errors: 0 });
    const c = mk({ keystrokes: 100, errors: 5, missed: [{ char: ";", count: 5 }] });
    const all = aggregate([a, b, c]);
    expect(all.accuracy).toBe(Math.round((200 - 15) / 200 * 100));
    expect(all.errors).toBe(15);
    expect(all.missed[0]).toEqual({ char: ";", count: 11 });
  });

  it("handles an empty list", () => {
    expect(aggregate([])).toMatchObject({ wpm: 0, accuracy: 100, seconds: 0 });
  });
});
