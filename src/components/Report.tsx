"use client";

import type { Level } from "@/lib/levels";
import { levelLabel } from "@/lib/levels";
import { aggregate } from "@/lib/report";
import type { Lesson } from "@/lib/types";
import type { SectorResult } from "./SessionView";

interface Props {
  results: SectorResult[];
  /** Every sector in the run was finished (not stopped early). */
  complete: boolean;
  stacks: string[];
  level: Level;
  random: boolean;
  allStacks: string[];
  lessons: Lesson[];
  onStart: (stacks: string[], level: Level, random: boolean) => void;
  onMenu: () => void;
  /** Close the dialog and go back to typing. */
  onClose: () => void;
}

/** Report for the session so far, shown in a dialog: totals, a row per sector, and where to go next. */
export default function Report(p: Props) {
  const total = aggregate(p.results.map((r) => r.stats));
  const done = p.results.filter((r) => !r.partial).length;
  const cards: [string, string][] = [
    ["WPM", String(total.wpm)],
    ["Accuracy", `${total.accuracy}%`],
    ["Errors", String(total.errors)],
    ["Left wrong", String(total.uncorrected)],
    ["Time", `${total.seconds.toFixed(1)}s`],
  ];

  const has = (s: string, level: Level) => p.lessons.some((l) => l.category === s && l.level === level);
  const others = p.allStacks.filter((s) => !p.stacks.includes(s) && has(s, p.level));
  const proStacks = p.level === 1 ? p.stacks.filter((s) => has(s, 2)) : [];
  const allWithLevel = p.allStacks.filter((s) => has(s, p.level));

  return (
    <div className="report">
      <div className="report-head">
        <p className="eyebrow">
          {p.stacks.join(" · ")} · {levelLabel(p.level)} · {done} {done === 1 ? "sector" : "sectors"} done
        </p>
        <button className="modal-close" onClick={p.onClose} aria-label="Close report">×</button>
      </div>
      <h1 className="h-md" id="report-title">{p.complete ? "Run complete." : "Report so far."}</h1>

      <div className="stats">
        {cards.map(([label, value]) => (
          <div className="stat" key={label}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="h-sm">Sectors</h2>
      <ol className="rows">
        {p.results.map((r, i) => (
          <li className="row" key={`${r.lesson.id}-${i}`}>
            <span className="row-name">
              {r.lesson.category} <span className="muted">· {r.lesson.id}</span>
              {r.partial && <span className="row-flag">stopped here</span>}
            </span>
            <span className="row-nums">{r.stats.wpm} WPM · {r.stats.accuracy}%</span>
          </li>
        ))}
      </ol>

      <h2 className="h-sm">Most missed keys</h2>
      {total.missed.length === 0 ? (
        <p className="muted">None.</p>
      ) : (
        <div className="chips">
          {total.missed.slice(0, 8).map((m) => (
            <span className="chip" key={m.char}>
              <kbd>{m.char === "\n" ? "Enter" : m.char === " " ? "Space" : m.char}</kbd> ×{m.count}
            </span>
          ))}
        </div>
      )}

      <div className="next-box">
        <div className="cta-row wrap">
          {!p.complete && <button className="btn solid" onClick={p.onClose}>Back to typing</button>}
          <button className={`btn${p.complete ? " solid" : ""}`} onClick={() => p.onStart(p.stacks, p.level, p.random)}>New set</button>
          {proStacks.length > 0 && (
            <button className="btn" onClick={() => p.onStart(proStacks, 2, p.random)}>Level up to Pro →</button>
          )}
          {others.map((s) => (
            <button key={s} className="btn" onClick={() => p.onStart([s], p.level, false)}>{s} →</button>
          ))}
          <button className="btn" onClick={() => p.onStart(allWithLevel, p.level, true)}>Random mix</button>
          <button className="btn ghost" onClick={p.onMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}
