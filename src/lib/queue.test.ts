import { describe, expect, it } from "vitest";
import { buildQueue, PER_STACK, RANDOM_TOTAL, stackNames } from "./queue";
import type { Lesson } from "./types";

const mk = (id: string, category: string, level = 1): Lesson => ({
  id, category, topic: "t", level, tags: [], chunks: [{ code: "x", explain: "y" }],
});
const many = (prefix: string, category: string, n: number, level = 1) =>
  Array.from({ length: n }, (_, i) => mk(`${prefix}${i}`, category, level));

describe("queue", () => {
  it("lists stack names sorted", () => {
    expect(stackNames([mk("a", "Python"), mk("b", "Git"), mk("c", "Git")])).toEqual(["Git", "Python"]);
  });

  it("takes PER_STACK lessons per stack, stack by stack, in the order picked", () => {
    const lessons = [...many("p", "Python", 12), ...many("g", "Git", 12)];
    const q = buildQueue(lessons, ["Python", "Git"], 1, false);
    expect(q).toHaveLength(PER_STACK * 2);
    expect(q.slice(0, PER_STACK).every((l) => l.category === "Python")).toBe(true);
    expect(q.slice(PER_STACK).every((l) => l.category === "Git")).toBe(true);
  });

  it("random mode returns RANDOM_TOTAL mixed lessons from the picked stacks only", () => {
    const lessons = [...many("p", "Python", 12), ...many("g", "Git", 12), ...many("l", "Linux", 12)];
    const q = buildQueue(lessons, ["Python", "Git"], 1, true);
    expect(q).toHaveLength(RANDOM_TOTAL);
    expect(q.every((l) => l.category !== "Linux")).toBe(true);
  });

  it("prefers lessons not seen yet", () => {
    const lessons = many("p", "Python", 12);
    const seen = new Set(lessons.slice(0, 7).map((l) => l.id)); // only 5 unseen left
    const q = buildQueue(lessons, ["Python"], 1, false, seen);
    expect(q.map((l) => l.id).sort()).toEqual(lessons.slice(7).map((l) => l.id).sort());
  });

  it("falls back to seen lessons once everything has been seen", () => {
    const lessons = many("p", "Python", 6);
    const seen = new Set(lessons.map((l) => l.id));
    expect(buildQueue(lessons, ["Python"], 1, false, seen)).toHaveLength(5);
  });

  it("never repeats a lesson inside one run and is random between runs", () => {
    const lessons = many("p", "Python", 40);
    const a = buildQueue(lessons, ["Python"], 1, false);
    expect(new Set(a.map((l) => l.id)).size).toBe(a.length);
    const runs = new Set(Array.from({ length: 10 }, () => buildQueue(lessons, ["Python"], 1, false).map((l) => l.id).join()));
    expect(runs.size).toBeGreaterThan(1);
  });

  it("only includes lessons of the chosen level", () => {
    const lessons = [...many("b", "Python", 6, 1), ...many("x", "Python", 6, 2)];
    expect(buildQueue(lessons, ["Python"], 2, false).every((l) => l.level === 2)).toBe(true);
  });

  it("returns nothing when no stack is picked", () => {
    expect(buildQueue(many("p", "Python", 6), [], 1, false)).toEqual([]);
  });
});
