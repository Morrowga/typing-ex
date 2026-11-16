// Validates every lesson JSON under src/lessons. Exit code 1 on any problem.
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../src/lessons", import.meta.url).pathname;
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".json")) files.push(p);
  }
})(root);

// Syntax checkers per stack. Git has none (commands can't be checked without a repo).
// [command, args, versionArg, file?]  When `file` is set the code is written to that
// file name in a temp folder (Swift needs main.swift for top-level code) and its path is appended.
const CHECKERS = {
  Python: ["python3", ["-I", "-c", "import ast,sys; ast.parse(sys.stdin.read())"], "--version"],
  Linux: ["bash", ["-n"], "--version"],
  PHP: ["php", ["-l"], "--version"],
  Swift: ["swiftc", ["-typecheck"], "--version", "main.swift"],
  Kotlin: ["kotlinc", ["-script"], "-version", "main.kts"],
  js: ["node", ["--check"], "--version", "main.js"],
  ts: [
    join(root, "..", "..", "node_modules", ".bin", "tsc"),
    ["--noEmit", "--strict", "--target", "ES2022", "--lib", "ES2022,DOM"],
    "--version",
    "main.ts",
  ],
};
const available = {};
for (const [stack, [cmd, , versionArg]] of Object.entries(CHECKERS)) {
  available[stack] = spawnSync(cmd, [versionArg]).status === 0;
}
const skipped = new Set();

const errors = [];
const ids = new Set();
const err = (file, msg) => errors.push(`${file.replace(root + "/", "")}: ${msg}`);

for (const file of files) {
  let l;
  try {
    l = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    err(file, `invalid JSON (${e.message})`);
    continue;
  }
  for (const k of ["id", "category", "topic"]) {
    if (typeof l[k] !== "string" || !l[k].trim()) err(file, `"${k}" must be a non-empty string`);
  }
  if (l.level !== 1 && l.level !== 2) err(file, `"level" must be 1 (beginner) or 2 (pro)`);
  if (!Array.isArray(l.tags) || l.tags.some((t) => typeof t !== "string")) err(file, `"tags" must be a string array`);
  if (ids.has(l.id)) err(file, `duplicate id "${l.id}"`);
  ids.add(l.id);
  if (!Array.isArray(l.chunks) || l.chunks.length === 0) {
    err(file, `"chunks" must be a non-empty array`);
    continue;
  }
  l.chunks.forEach((c, i) => {
    if (typeof c.code !== "string" || !c.code.trim()) err(file, `chunk ${i}: empty code`);
    else if (c.code.includes("\n")) err(file, `chunk ${i}: code must be a single line`);
    if (typeof c.explain !== "string" || !c.explain.trim()) err(file, `chunk ${i}: empty explain`);
    else if (c.explain.length > 60) err(file, `chunk ${i}: explain is ${c.explain.length} chars, keep it under 60`);
  });
  if (l.category === "JS / TS" && l.lang !== "js" && l.lang !== "ts") err(file, `"lang" must be "js" or "ts" in the JS / TS stack`);
  const key = l.lang ?? l.category;
  const checker = CHECKERS[key];
  if (checker) {
    if (!available[key]) skipped.add(key);
    else {
      const code = l.chunks.map((c) => c.code).join("\n") + "\n";
      let r;
      if (checker[3]) {
        const dir = mkdtempSync(join(tmpdir(), "lesson-"));
        const path = join(dir, checker[3]);
        writeFileSync(path, code);
        r = spawnSync(checker[0], [...checker[1], path], { encoding: "utf8", cwd: dir });
        rmSync(dir, { recursive: true, force: true });
      } else {
        r = spawnSync(checker[0], checker[1], { input: code, encoding: "utf8" });
      }
      if (r.status !== 0) err(file, `${key} syntax check failed: ${(r.stderr || r.stdout).trim().split("\n")[0]}`);
    }
  }
  if (l.chunks.length > 10) err(file, `more than 10 chunks (keep snippets short)`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${files.length} lessons valid` + (skipped.size ? ` (syntax check skipped, tool missing: ${[...skipped].join(", ")})` : ""));
