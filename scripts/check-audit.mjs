#!/usr/bin/env node
// Wraps `npm audit --omit=dev` so a fixed, justified set of unfixable
// high/critical findings doesn't block CI, while any *new* high/critical
// finding still fails the build. Re-justify (or remove) an entry here
// whenever its package's audit output changes.
import { execSync } from "node:child_process";

const ACCEPTED_RISK = {
  postcss:
    "Vendored inside next's own node_modules for its build pipeline. This repo never runs postcss over user-supplied CSS at request time (only build-time Tailwind config), so the XSS/path-traversal advisories have no reachable input here. No fix available: every next release up to the latest stable (16.2.11) vendors an affected postcss version.",
  sharp:
    "Vendored inside next's own node_modules for the next/image optimizer. This app never imports next/image (grep for it in src/ turns up nothing), so the libvips parsing surface is unreachable. No fix available: every next release up to the latest stable (16.2.11) vendors an affected sharp version.",
};

function runAudit() {
  try {
    return execSync("npm audit --omit=dev --json", {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (err) {
    // npm audit exits non-zero when it finds vulnerabilities; the JSON body
    // we need is still on stdout.
    if (err.stdout) return err.stdout;
    throw err;
  }
}

const report = JSON.parse(runAudit());
const vulnerabilities = report.vulnerabilities ?? {};

// A package's `via` list holds either advisory objects (its own direct
// findings) or plain strings naming another vulnerable package it depends
// on. A package with no advisories of its own — only string `via` entries —
// is purely a carrier of its dependencies' risk, so it's accepted whenever
// every one of those dependencies is (transitively) accepted.
function isAccepted(name, seen = new Set()) {
  if (Object.prototype.hasOwnProperty.call(ACCEPTED_RISK, name)) return true;
  if (seen.has(name)) return false;
  seen.add(name);
  const vuln = vulnerabilities[name];
  if (!vuln) return false;
  const hasOwnAdvisory = vuln.via.some((v) => typeof v === "object");
  if (hasOwnAdvisory) return false;
  const viaNames = vuln.via.filter((v) => typeof v === "string");
  return viaNames.length > 0 && viaNames.every((n) => isAccepted(n, seen));
}

const blocking = [];
const accepted = [];

for (const [name, vuln] of Object.entries(vulnerabilities)) {
  if (vuln.severity !== "high" && vuln.severity !== "critical") continue;
  if (isAccepted(name)) {
    accepted.push(name);
  } else {
    blocking.push(name);
  }
}

if (accepted.length > 0) {
  console.log(
    "Accepted, documented high/critical findings (re-review if `npm audit` output for these packages changes):"
  );
  for (const name of accepted) {
    const reason = ACCEPTED_RISK[name] ?? "depends only on already-accepted packages above";
    console.log(`  - ${name}: ${reason}`);
  }
}

if (blocking.length > 0) {
  console.error(
    "\nBlocking high/critical vulnerabilities in production dependencies:"
  );
  for (const name of blocking) {
    console.error(`  - ${name}`);
  }
  console.error(
    "\nRun `npm audit --omit=dev` for details. Fix the dependency, or " +
      "if it's genuinely unfixable and unreachable in this app, add a " +
      "justified entry to ACCEPTED_RISK in scripts/check-audit.mjs."
  );
  process.exit(1);
}

console.log(
  "\nNo unaccepted high/critical vulnerabilities in production dependencies."
);
