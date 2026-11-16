"use client";

import { useEffect, useRef, useState } from "react";
import type { Level } from "@/lib/levels";
import { buildQueue, stackNames } from "@/lib/queue";
import { loadSeen, saveSeen } from "@/lib/seen";
import type { Lesson } from "@/lib/types";
import Picker from "./Picker";
import SessionView from "./SessionView";

interface Run {
  stacks: string[];
  level: Level;
  random: boolean;
}
type View = { kind: "pick" } | ({ kind: "session"; queue: Lesson[]; id: number } & Run);

export default function App({ lessons }: { lessons: Lesson[] }) {
  const [view, setView] = useState<View>({ kind: "pick" });
  const all = stackNames(lessons);

  // Lessons this browser has already shown, so every new run draws fresh ones first.
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    seen.current = loadSeen();
  }, []);
  const markSeen = (lesson: Lesson) => {
    seen.current.add(lesson.id);
    saveSeen(seen.current);
  };

  const start = (stacks: string[], level: Level, random: boolean) => {
    const queue = buildQueue(lessons, stacks, level, random, seen.current);
    if (queue.length === 0) return;
    markSeen(queue[0]);
    setView({ kind: "session", queue, stacks, level, random, id: Date.now() });
  };

  if (view.kind === "pick") {
    return <Picker lessons={lessons} stacks={all} onStart={start} />;
  }

  return (
    <SessionView
      key={view.id}
      queue={view.queue}
      stacks={view.stacks}
      level={view.level}
      random={view.random}
      allStacks={all}
      lessons={lessons}
      onSectorStart={markSeen}
      onStart={start}
      onExit={() => setView({ kind: "pick" })}
    />
  );
}
