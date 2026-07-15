#!/usr/bin/env node
// Claude Code PostToolUse hook: lints a TS/TSX/JS file right after the agent
// edits it. Exit code 2 feeds the lint errors back to the agent so it fixes
// them immediately, instead of failing later in CI.
import { execFileSync } from "node:child_process";

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

let filePath;
try {
  filePath = JSON.parse(input)?.tool_input?.file_path;
} catch {
  process.exit(0);
}

if (
  !filePath ||
  !/\.(ts|tsx|js|jsx|mjs)$/.test(filePath) ||
  filePath.includes("node_modules")
) {
  process.exit(0);
}

try {
  execFileSync("npx", ["eslint", "--no-warn-ignored", filePath], {
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 50_000,
  });
} catch (err) {
  const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
  // eslint exits 1 when it found problems; anything else (missing deps,
  // config error, timeout) should not block the agent.
  if (err.status === 1 && out) {
    console.error(`eslint found problems in ${filePath}:\n${out}`);
    process.exit(2);
  }
}
process.exit(0);
