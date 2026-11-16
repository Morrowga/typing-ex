"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { TypingSession } from "@/lib/engine";
import { levelLabel, type Level } from "@/lib/levels";
import type { Lesson, Stats } from "@/lib/types";
import SectorCard from "./SectorCard";
import Report from "./Report";
import ThemeToggle from "./ThemeToggle";
import SectorInfo from "./SectorInfo";

export interface SectorResult {
  lesson: Lesson;
  stats: Stats;
  /** Stopped in the middle of this sector. */
  partial: boolean;
}

interface Sector {
  lesson: Lesson;
  session: TypingSession;
  finished: boolean;
  stats: Stats | null;
}

interface Props {
  queue: Lesson[];
  onSectorStart: (lesson: Lesson) => void;
  onExit: () => void;
  /** Everything the report dialog needs to offer "what next". */
  stacks: string[];
  level: Level;
  random: boolean;
  allStacks: string[];
  lessons: Lesson[];
  onStart: (stacks: string[], level: Level, random: boolean) => void;
}

const fresh = (lesson: Lesson): Sector => ({
  lesson,
  session: new TypingSession(lesson),
  finished: false,
  stats: null,
});

/**
 * One scrolling page of sectors. Type a sector, press Enter to confirm it, read its stats under the
 * card, press Enter again for the next sector. Earlier sectors stay in the card. "Stop & report"
 * opens a dialog over the session; closing it returns to exactly where you were.
 */
export default function SessionView({ queue, onSectorStart, onExit, stacks, level, random, allStacks, lessons, onStart }: Props) {
  const [sectors, setSectors] = useState<Sector[]>(() => [fresh(queue[0])]);
  const [tick, bump] = useReducer((n: number) => n + 1, 0);

  const live = useRef(sectors);
  live.current = sectors;
  const cb = useRef({ onSectorStart, onExit });
  cb.current = { onSectorStart, onExit };

  const [report, setReport] = useState<{ results: SectorResult[]; complete: boolean } | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  // While any dialog is open the session ignores typing.
  const modalOpen = useRef(false);
  modalOpen.current = report !== null || confirmRestart;
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const collect = (): SectorResult[] =>
    live.current
      .filter((s) => s.finished || s.session.stats().keystrokes > 0)
      .map((s) => ({ lesson: s.lesson, stats: s.stats ?? s.session.stats(), partial: !s.finished }));

  const stop = () => {
    const all = live.current;
    const complete = all.length === queue.length && all[all.length - 1].finished;
    setReport({ results: collect(), complete });
  };
  // Restart = a brand new random set (same stacks, level and mode). Asks first if work would be lost.
  const restart = () => {
    if (collect().length === 0) return onStart(stacks, level, random);
    setConfirmRestart(true);
  };
  const closeReport = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    setReport(null);
  };

  const finishSector = () =>
    setSectors((prev) =>
      prev.map((s, i) => (i === prev.length - 1 ? { ...s, finished: true, stats: s.session.stats() } : s)),
    );

  const nextSector = () => {
    const n = live.current.length;
    if (n >= queue.length) return stop();
    const lesson = queue[n];
    cb.current.onSectorStart(lesson);
    // Only add if no other press already did (key repeat / double click).
    setSectors((prev) => (prev.length === n ? [...prev, fresh(lesson)] : prev));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const all = live.current;
      const cur = all[all.length - 1];
      const s = cur.session;

      // While a dialog is open the session ignores typing; Esc closes the dialog.
      if (modalOpen.current) {
        if (e.key === "Escape") {
          setReport(null);
          setConfirmRestart(false);
        }
        return;
      }
      if (e.key === "Escape") {
        // Esc opens the report when something was typed, otherwise goes back to the menu.
        return collect().length > 0 ? stop() : cb.current.onExit();
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (cur.finished) {
        if (e.key === "Enter" && !e.repeat) {
          e.preventDefault();
          nextSector();
        }
        return;
      }
      if (e.key === "Enter" && s.done) {
        e.preventDefault();
        if (!e.repeat) finishSector();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        if (s.backspace()) bump();
        return;
      }
      const key = e.key === "Enter" ? "\n" : e.key;
      if (key.length !== 1) return;
      e.preventDefault();
      s.type(key);
      bump();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // collect/stop/finishSector/nextSector read live refs, so the listener can stay bound once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (report) dialogRef.current?.focus();
  }, [report]);
  useEffect(() => {
    if (confirmRestart) confirmRef.current?.focus();
  }, [confirmRestart]);

  // The page never scrolls; everything scrolls inside this one card.
  const cardRef = useRef<HTMLDivElement>(null);

  // Every sector is exactly one frame tall (the card's visible height), so a sector and its result fit
  // on screen. A sector with many lines on a short screen switches to tighter spacing to still fit.
  const applyLayout = () => {
    const el = cardRef.current;
    if (!el) return;
    const frame = el.clientHeight;
    el.style.setProperty("--frame-h", `${frame}px`);
    el.querySelectorAll<HTMLElement>(".sector").forEach((sec) => {
      const n = sec.querySelectorAll(".line").length;
      const fits = (lineHeight: number) => n * lineHeight + 140 <= frame; // 140 = label, padding, result slot
      sec.dataset.density = fits(52) ? "normal" : fits(46) ? "compact" : "tight";
    });
  };
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    applyLayout();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(applyLayout);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A sector added later needs its density too.
  useEffect(applyLayout, [sectors.length]);

  // A newly opened sector scrolls smoothly to the top of the card. Earlier sectors stay above it.
  useEffect(() => {
    if (sectors.length < 2) return;
    document.getElementById(`sector-${sectors.length - 1}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [sectors.length]);

  // Keep the line being typed in view while typing.
  useEffect(() => {
    cardRef.current?.querySelector(".line.active")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [tick]);

  // When a sector is confirmed, make sure its stats (and the Next button) are in view.
  const finishedCount = sectors.filter((x) => x.finished).length;
  useEffect(() => {
    if (finishedCount === 0) return;
    cardRef.current?.querySelector(`#sector-${finishedCount - 1} .info`)?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [finishedCount]);

  const current = sectors[sectors.length - 1];
  const st = current.finished && current.stats ? current.stats : current.session.stats();
  const started = collect().length > 0;

  return (
    <div className="session-root">
      <main className="session">
        <header className="bar">
          <button
            className="link"
            onClick={(e) => {
              e.currentTarget.blur();
              onExit();
            }}
          >
            ← Menu
          </button>
          <span className="bar-title">
            {current.lesson.category}{" "}
            <span className="muted">· {levelLabel(current.lesson.level)} · sector {sectors.length}/{queue.length}</span>
          </span>
          <span className="bar-live">{st.wpm} WPM · {st.accuracy}%</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Restart with a new set"
            title="Restart with a new set"
            onClick={(e) => {
              e.currentTarget.blur(); // so the Space key keeps typing
              restart();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.6-5.9" />
              <path d="M20 4v5h-5" />
            </svg>
          </button>
          <ThemeToggle />
          {started && (
            <button
              className="btn small-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                stop();
              }}
            >
              Stop &amp; report
            </button>
          )}
        </header>

        <div className="progress" aria-label={`Sector ${sectors.length} of ${queue.length}`}>
          {queue.map((_, i) => (
            <span key={i} className={`seg${i < sectors.length - 1 || (i === sectors.length - 1 && current.finished) ? " full" : i === sectors.length - 1 ? " now" : ""}`} />
          ))}
        </div>

        <div className="session-card" ref={cardRef}>
          {sectors.map((s, i) => {
            const isCurrent = i === sectors.length - 1;
            return (
              <section className="sector" id={`sector-${i}`} key={`${s.lesson.id}-${i}`}>
                <p className="eyebrow sector-label">Sector {i + 1} · {s.lesson.id}</p>
                <SectorCard
                  lesson={s.lesson}
                  session={s.session}
                  active={isCurrent && !s.finished}
                  finished={s.finished}
                  tick={isCurrent && !s.finished ? tick : 0}
                />
                <div className="info-slot">
                  {s.finished && s.stats && (
                    <SectorInfo
                      lesson={s.lesson}
                      stats={s.stats}
                      isLast={i === queue.length - 1}
                      onNext={nextSector}
                      onStop={stop}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <p className="hint">
          {current.finished ? (
            <>Press <kbd>Enter</kbd> for the next sector. Scroll up inside the card to review earlier ones.</>
          ) : current.session.done ? (
            <>All typed — press <kbd>Enter</kbd> to finish this sector, or <kbd>Backspace</kbd> to fix mistakes.</>
          ) : (
            <>Wrong keys turn red and you move on. <kbd>Backspace</kbd> to fix · <kbd>Esc</kbd> to stop</>
          )}
        </p>
      </main>

      {confirmRestart && (
        <div className="modal-backdrop" onClick={() => setConfirmRestart(false)}>
          <div
            className="modal confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restart-title"
            tabIndex={-1}
            ref={confirmRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title" id="restart-title">Restart with a new set?</h2>
            <p className="muted confirm-text">
              You'll get fresh random lessons. What you've typed in this set won't be saved.
            </p>
            <div className="cta-row">
              <button className="btn solid" onClick={() => onStart(stacks, level, random)}>Restart</button>
              <button className="btn ghost" onClick={() => setConfirmRestart(false)}>Keep typing</button>
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="modal-backdrop" onClick={closeReport}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            tabIndex={-1}
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <Report
              results={report.results}
              complete={report.complete}
              stacks={stacks}
              level={level}
              random={random}
              allStacks={allStacks}
              lessons={lessons}
              onStart={onStart}
              onMenu={onExit}
              onClose={closeReport}
            />
          </div>
        </div>
      )}
    </div>
  );
}
