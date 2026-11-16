const KEY = "typing-exe:seen";

/** Lesson ids the user has already been shown. Stored in this browser only. */
export function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(seen: ReadonlySet<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    // private mode or storage full: the app still works, it just forgets
  }
}
