"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useState } from "react";

interface Props {
  lines: string[];
  /** Seconds before typing starts. */
  delay?: number;
  /** Seconds per character. */
  speed?: number;
}

/**
 * Heading that types itself out. Every character is rendered from the start
 * (hidden until typed), so the layout never shifts while it types.
 */
export default function TypeHeading({ lines, delay = 0.35, speed = 0.07 }: Props) {
  const reduce = useReducedMotion();
  const total = lines.reduce((n, l) => n + l.length, 0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) {
      setCount(total);
      return;
    }
    const controls = animate(0, total, {
      duration: total * speed,
      delay,
      ease: "linear",
      onUpdate: (v) => setCount(Math.floor(v)),
    });
    return () => controls.stop();
  }, [reduce, total, delay, speed]);

  const finished = count >= total;
  let index = 0;

  return (
    <h1 aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span className="type-line" key={li} aria-hidden="true">
          {line.split(" ").map((word, wi, words) => (
            <Fragment key={wi}>
              <span className="type-word">
                {[...word].map((ch) => {
                  const i = index++;
                  return (
                    <span key={i}>
                      {i === count && !reduce && <Caret />}
                      <span className={i < count ? "tc on" : "tc"}>{ch}</span>
                    </span>
                  );
                })}
              </span>
              {wi < words.length - 1 && (() => {
                const i = index++; // the space between words
                return (
                  <span>
                    {i === count && !reduce && <Caret />}
                    {" "}
                  </span>
                );
              })()}
            </Fragment>
          ))}
          {/* Caret stays after the last character once typing is done. */}
          {li === lines.length - 1 && finished && !reduce && <Caret />}
        </span>
      ))}
    </h1>
  );
}

function Caret() {
  return (
    <span className="caret-wrap" aria-hidden="true">
      <motion.span
        className="caret"
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
      />
    </span>
  );
}
