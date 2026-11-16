"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { LEVELS, type Level } from "@/lib/levels";
import type { Lesson } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import TypeHeading from "./TypeHeading";

interface Props {
  lessons: Lesson[];
  stacks: string[];
  onStart: (stacks: string[], level: Level, random: boolean) => void;
}

export default function Picker({ lessons, stacks, onStart }: Props) {
  // Selection order matters: stacks are played in the order they were picked.
  const [picked, setPicked] = useState<string[]>([]);
  const [random, setRandom] = useState(false);
  const [level, setLevel] = useState<Level>(1);

  const hasLessons = (s: string) => lessons.some((l) => l.category === s && l.level === level);
  const available = stacks.filter(hasLessons);
  const chosen = picked.filter(hasLessons);

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  // Turning random on selects every stack; the user can still deselect some.
  const onRandom = (on: boolean) => {
    setRandom(on);
    if (on) setPicked(available);
  };

  return (
    <main className="page home">
      <ThemeToggle className="home-theme" />
      <header className="hero">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Technical typing practice
        </motion.p>
        <TypeHeading lines={["Type it.", "Understand it."]} />
        <motion.p
          className="lede"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
        >
          Type real code and commands. The line you are on is explained right above the code.
        </motion.p>
      </header>

      <motion.section
        className="settings"
        aria-label="Settings"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="field">
          <h2 id="level-label">Level</h2>
          <div className="seg-control" role="radiogroup" aria-labelledby="level-label">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={level === l.value}
                className={level === l.value ? "on" : ""}
                onClick={() => setLevel(l.value)}
              >
                <span className="seg-label">{l.label}</span>
                <span className="seg-hint">{l.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <h2 id="stacks-label">Stacks</h2>
          <div className="chip-row" role="group" aria-labelledby="stacks-label">
            {stacks.map((s) => {
              const enabled = hasLessons(s);
              const on = chosen.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  className={`pick${on ? " on" : ""}`}
                  aria-pressed={on}
                  disabled={!enabled}
                  onClick={() => toggle(s)}
                >
                  {s}
                  {!enabled && <span className="pick-soon">soon</span>}
                </button>
              );
            })}
          </div>
          <p className="muted small">
            {random ? "Lessons from the selected stacks are mixed." : "Pick one or more. They play in the order you pick them."}
          </p>
        </div>

        <label className="toggle">
          <input type="checkbox" checked={random} onChange={(e) => onRandom(e.target.checked)} />
          <span className="box" aria-hidden="true" />
          <span>Random order</span>
        </label>

        <button
          type="button"
          className="btn solid start"
          disabled={chosen.length === 0}
          onClick={() => onStart(chosen, level, random)}
        >
          Start
        </button>
      </motion.section>
    </main>
  );
}
