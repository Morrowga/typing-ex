import { describe, expect, it } from "vitest";
import { TypingSession } from "./engine";
import type { Lesson } from "./types";

const lesson: Lesson = {
  id: "t",
  category: "c",
  topic: "t",
  level: 1,
  tags: [],
  chunks: [
    { code: "for x in xs:", explain: "loop" },
    { code: "    print(x)", explain: "show" },
  ],
};

function typeAll(s: TypingSession, text: string) {
  for (const ch of text) s.type(ch);
}

describe("TypingSession", () => {
  it("tracks the active chunk and skips indentation", () => {
    const s = new TypingSession(lesson);
    expect(s.chunkIndex).toBe(0);
    typeAll(s, "for x in xs:\n");
    expect(s.chunkIndex).toBe(1);
    expect(s.text[s.pos]).toBe("p"); // indent skipped
    typeAll(s, "print(x)");
    expect(s.done).toBe(true);
  });

  it("a wrong key is marked and the cursor moves on", () => {
    const s = new TypingSession(lesson);
    typeAll(s, "for x in xs");
    expect(s.type(";")).toBe("wrong");
    expect(s.pos).toBe(12);
    expect(s.isWrong(11)).toBe(true);
    const st = s.stats();
    expect(st.errors).toBe(1);
    expect(st.uncorrected).toBe(1);
    expect(st.missed[0]).toEqual({ char: ":", count: 1 });
  });

  it("backspace lets you fix a mistake; the error still counts for accuracy", () => {
    const s = new TypingSession(lesson);
    typeAll(s, "for x in xs");
    s.type(";");
    expect(s.backspace()).toBe(true);
    expect(s.pos).toBe(11);
    expect(s.type(":")).toBe("correct");
    const st = s.stats();
    expect(st.errors).toBe(1);
    expect(st.uncorrected).toBe(0);
    expect(st.accuracy).toBeLessThan(100);
  });

  it("backspace over an auto-filled indent returns to the previous line end", () => {
    const s = new TypingSession(lesson);
    typeAll(s, "for x in xs:\n");
    expect(s.backspace()).toBe(true);
    expect(s.pos).toBe(12); // on the "\n"
    expect(s.type("\n")).toBe("correct");
    expect(s.text[s.pos]).toBe("p");
  });

  it("can finish with mistakes left in", () => {
    const s = new TypingSession(lesson);
    typeAll(s, "for x in xs:\nprint(y)");
    expect(s.done).toBe(true);
    expect(s.stats().uncorrected).toBe(1);
  });

  it("can backspace after the last character is typed", () => {
    const s = new TypingSession(lesson);
    typeAll(s, "for x in xs:\nprint(y)");
    expect(s.done).toBe(true);
    expect(s.backspace()).toBe(true);
    expect(s.done).toBe(false);
    expect(s.type(")")).toBe("correct");
  });

  it("computes wpm from correct characters", () => {
    let t = 0;
    const s = new TypingSession(lesson, () => t);
    s.type("f");
    t = 60_000;
    typeAll(s, "or x in xs:\nprint(x)");
    const st = s.stats();
    expect(st.accuracy).toBe(100);
    expect(st.wpm).toBe(Math.round(20 / 5)); // 20 typed chars incl. newline
  });

  it("ignores multi-char keys like Shift", () => {
    const s = new TypingSession(lesson);
    expect(s.type("Shift")).toBe("ignored");
    expect(s.stats().errors).toBe(0);
  });
});
