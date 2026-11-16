// Server-side only: runs at build time (static export), reads lesson JSON files.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Lesson } from "./types";

const ROOT = join(process.cwd(), "src", "lessons");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") ? [p] : [];
  });
}

export function getLessons(): Lesson[] {
  return walk(ROOT)
    .map((f) => JSON.parse(readFileSync(f, "utf8")) as Lesson)
    .sort((a, b) => a.category.localeCompare(b.category) || a.level - b.level || a.id.localeCompare(b.id));
}

export function getLesson(id: string): Lesson | undefined {
  return getLessons().find((l) => l.id === id);
}

/** Category -> Topic -> Lessons */
export function lessonTree(): { category: string; topics: { topic: string; lessons: Lesson[] }[] }[] {
  const tree = new Map<string, Map<string, Lesson[]>>();
  for (const l of getLessons()) {
    if (!tree.has(l.category)) tree.set(l.category, new Map());
    const t = tree.get(l.category)!;
    if (!t.has(l.topic)) t.set(l.topic, []);
    t.get(l.topic)!.push(l);
  }
  return [...tree].map(([category, t]) => ({
    category,
    topics: [...t].map(([topic, lessons]) => ({ topic, lessons })),
  }));
}
