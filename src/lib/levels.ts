export type Level = 1 | 2;

export const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: 1, label: "Beginner", hint: "Core syntax and everyday commands" },
  { value: 2, label: "Pro", hint: "Idioms, patterns and real-world tooling" },
];

export const levelLabel = (level: number) => LEVELS.find((l) => l.value === level)?.label ?? "";
