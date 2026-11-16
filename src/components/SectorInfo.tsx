"use client";

import type { Lesson, Stats } from "@/lib/types";

interface Props {
  lesson: Lesson;
  stats: Stats;
  isLast: boolean;
  onNext: () => void;
  onStop: () => void;
}

/** Shown under a finished sector: how it went, and the way on to the next one. */
export default function SectorInfo({ lesson, stats: st, isLast, onNext, onStop }: Props) {
  const cards: [string, string][] = [
    ["WPM", String(st.wpm)],
    ["Accuracy", `${st.accuracy}%`],
    ["Errors", String(st.errors)],
    ["Left wrong", String(st.uncorrected)],
    ["Time", `${st.seconds.toFixed(1)}s`],
  ];
  // Buttons release focus after a click so the next Space keypress types a space, not "clicks" them.
  const act = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    fn();
  };

  return (
    <div className="info" aria-live="polite">
      <div className="info-stats">
        {cards.map(([label, value]) => (
          <span className="mini" key={label}>
            <b>{value}</b>
            <i>{label}</i>
          </span>
        ))}
        <span className="muted info-tags">{lesson.tags.join(" · ")}</span>
      </div>
      <div className="info-actions">
        {st.missed.length > 0 && (
          <span className="chips info-missed">
            <span className="muted small">Missed most</span>
            {st.missed.slice(0, 4).map((m) => (
              <span className="chip" key={m.char}>
                <kbd>{m.char === "\n" ? "Enter" : m.char === " " ? "Space" : m.char}</kbd> ×{m.count}
              </span>
            ))}
          </span>
        )}
        <span className="info-buttons">
          {!isLast && (
            <button className="btn ghost small-btn" onClick={act(onStop)}>Stop &amp; report</button>
          )}
          <button className="btn solid small-btn" onClick={act(onNext)}>
            {isLast ? "Finish & see report" : "Next sector"} <kbd className="on-solid">Enter</kbd>
          </button>
        </span>
      </div>
    </div>
  );
}
