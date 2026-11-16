"use client";

import { memo, useLayoutEffect, useRef } from "react";
import type { TypingSession } from "@/lib/engine";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  session: TypingSession;
  /** The sector being typed right now. */
  active: boolean;
  /** Typed and confirmed with Enter: every line keeps its explanation. */
  finished: boolean;
  /** Changes on every keystroke so the card re-renders while it is active. */
  tick: number;
}

/** One lesson ("sector") as a card of code lines, each with an explanation bubble above the cursor. */
function SectorCard({ lesson, session, active, finished }: Props) {
  const codeRef = useRef<HTMLDivElement>(null);
  const furthest = useRef(0);
  const current = session.chunkIndex;
  // Furthest line reached: lines already typed keep their explanation even after Backspace.
  furthest.current = finished ? lesson.chunks.length - 1 : Math.max(furthest.current, current);

  // Float the active line's bubble above the character being typed. The position is stored on the
  // line as CSS variables, so a finished line's bubble stays where its typing ended.
  useLayoutEffect(() => {
    if (!active || finished) return;
    const line = codeRef.current?.querySelector<HTMLElement>(".line.active");
    const cursor = line?.querySelector<HTMLElement>(".ch.current");
    const tip = line?.querySelector<HTMLElement>(".tip");
    if (!line || !cursor || !tip) return;
    const x = cursor.offsetLeft + cursor.offsetWidth / 2;
    const left = Math.min(Math.max(x - 24, 0), Math.max(line.clientWidth - tip.offsetWidth, 0));
    const arrow = Math.min(Math.max(x - left, 14), Math.max(tip.offsetWidth - 14, 14));
    line.style.setProperty("--tip-left", `${left}px`);
    line.style.setProperty("--arrow-x", `${arrow}px`);
  });

  let offset = 0;
  return (
    <div className="lines" aria-label="Code to type" ref={codeRef}>
      {lesson.chunks.map((chunk, i) => {
        const chars = [...chunk.code, ...(i < lesson.chunks.length - 1 ? ["\n"] : [])];
        const line = (
          <div
            className={`line${active && i === current ? " active" : ""}${i <= furthest.current ? " reached" : ""}`}
            key={i}
          >
            <span className="line-code">
              {chars.map((ch, j) => {
                const idx = offset + j;
                const cls = ["ch"];
                if (ch === "\n") cls.push("nl");
                if (idx < session.pos) cls.push(session.isWrong(idx) ? "wrong" : "done");
                if (active && !finished && idx === session.pos) cls.push("current");
                return (
                  <span className={cls.join(" ")} key={j}>
                    {ch === "\n" ? "↵" : ch === " " ? " " : ch}
                  </span>
                );
              })}
            </span>
            <span className="tip" role="tooltip">{chunk.explain}</span>
          </div>
        );
        offset += chars.length;
        return line;
      })}
    </div>
  );
}

export default memo(SectorCard);
