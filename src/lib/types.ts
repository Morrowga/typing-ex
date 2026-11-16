export interface Chunk {
  code: string;
  explain: string;
}

export interface Lesson {
  id: string;
  category: string;
  /** Only for mixed stacks (JS / TS): which language the code is in. */
  lang?: "js" | "ts";
  topic: string;
  level: number;
  tags: string[];
  chunks: Chunk[];
}

export interface Stats {
  wpm: number;
  /** Keystroke accuracy 0-100: correct keystrokes / all keystrokes (fixed mistakes still count). */
  accuracy: number;
  /** Total wrong keystrokes, including ones fixed later with Backspace. */
  errors: number;
  /** Wrong characters still left in the text at the end. */
  uncorrected: number;
  seconds: number;
  /** Characters that are correct at the end (auto-filled indentation not counted). */
  correctChars: number;
  /** All keystrokes typed, right or wrong. */
  keystrokes: number;
  missed: { char: string; count: number }[];
}
