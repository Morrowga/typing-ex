import type { Lesson, Stats } from "./types";

export type KeyResult = "correct" | "wrong" | "ignored" | "done";

/**
 * Typing session for one lesson. The target text is every chunk's code joined
 * by "\n". A wrong key is recorded and the cursor moves on; Backspace steps
 * back so it can be fixed. Leading indentation on a line is filled in
 * automatically. The cursor reaching the end only means everything has been typed
 * (`done`); the UI decides when to finish, so the user can still fix mistakes.
 */
export class TypingSession {
  readonly text: string;
  /** Start offset of each chunk in `text`. */
  private readonly starts: number[] = [];
  /** What the user typed at each position (null = not typed yet). */
  readonly typed: (string | null)[];
  private readonly auto: boolean[];
  pos = 0;
  private keystrokes = 0;
  private wrongKeystrokes = 0;
  private missed = new Map<string, number>();
  private startTime: number | null = null;
  private endTime: number | null = null;

  constructor(
    readonly lesson: Lesson,
    private now: () => number = () => performance.now(),
  ) {
    let offset = 0;
    for (const c of lesson.chunks) {
      this.starts.push(offset);
      offset += c.code.length + 1; // +1 for the newline
    }
    this.text = lesson.chunks.map((c) => c.code).join("\n");
    this.typed = new Array(this.text.length).fill(null);
    this.auto = new Array(this.text.length).fill(false);
    this.skipIndent();
  }

  get done(): boolean {
    return this.pos >= this.text.length;
  }

  /** True if the character at index i has been typed and does not match. */
  isWrong(i: number): boolean {
    return this.typed[i] !== null && this.typed[i] !== this.text[i];
  }

  /** Index of the chunk the cursor is currently in. */
  get chunkIndex(): number {
    const p = Math.min(this.pos, this.text.length - 1);
    let idx = 0;
    for (let i = 0; i < this.starts.length; i++) {
      if (this.starts[i] <= p) idx = i;
    }
    return idx;
  }

  /** Feed one character key. Use "\n" for Enter. */
  type(key: string): KeyResult {
    if (this.done) return "done";
    if (key.length !== 1) return "ignored";
    if (this.startTime === null) this.startTime = this.now();

    const expected = this.text[this.pos];
    const ok = key === expected;
    this.keystrokes++;
    this.typed[this.pos] = key;
    if (!ok) {
      this.wrongKeystrokes++;
      this.missed.set(expected, (this.missed.get(expected) ?? 0) + 1);
    }
    this.pos++;
    if (expected === "\n") this.skipIndent();
    if (this.done) this.endTime = this.now();
    return ok ? "correct" : "wrong";
  }

  /** Step back one typed character (and over auto-filled indentation). */
  backspace(): boolean {
    if (this.pos === 0) return false;
    this.endTime = null; // typing resumes, clock keeps running
    this.pos--;
    while (this.pos > 0 && this.auto[this.pos]) {
      this.auto[this.pos] = false;
      this.typed[this.pos] = null;
      this.pos--;
    }
    this.typed[this.pos] = null;
    return true;
  }

  private skipIndent(): void {
    while (this.pos < this.text.length && this.text[this.pos] === " " && this.atLineStart()) {
      this.typed[this.pos] = " ";
      this.auto[this.pos] = true;
      this.pos++;
    }
  }

  private atLineStart(): boolean {
    let i = this.pos - 1;
    while (i >= 0 && this.text[i] === " ") i--;
    return i < 0 || this.text[i] === "\n";
  }

  stats(): Stats {
    const end = this.endTime ?? this.now();
    const seconds = this.startTime === null ? 0 : (end - this.startTime) / 1000;
    let correctChars = 0;
    let uncorrected = 0;
    for (let i = 0; i < this.text.length; i++) {
      if (this.typed[i] === null || this.auto[i]) continue;
      if (this.typed[i] === this.text[i]) correctChars++;
      else uncorrected++;
    }
    const wpm = seconds > 0 ? correctChars / 5 / (seconds / 60) : 0;
    return {
      wpm: Math.round(wpm),
      accuracy:
        this.keystrokes === 0
          ? 100
          : Math.round(((this.keystrokes - this.wrongKeystrokes) / this.keystrokes) * 100),
      errors: this.wrongKeystrokes,
      correctChars,
      keystrokes: this.keystrokes,
      uncorrected,
      seconds,
      missed: [...this.missed.entries()]
        .map(([char, count]) => ({ char, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
