// Bargain Beacon — entry program for black-friday-deal-finder-01 (Node 22+, stdlib only).
//
// What it does, in order:
//   1. Finds the repo root (the folder this file lives in) and the output folder
//      (/output, or $MAKEFUN_OUTPUT_DIR when set, e.g. `out` for a local run).
//   2. Pre-flight: app/ must exist with an index.html, screenshots/ must hold
//      3 or 4 PNG/JPEG files. Anything else is a hard failure, so a broken
//      entry never ships silently.
//   3. Copies app/ and screenshots/ into the output folder, replacing any
//      previous copy, then writes /output/dossier.json with the vendored
//      make.fun library (vendor/makefun-frontend.ts, shipped unchanged from
//      the kit — the scorer requires dossier.json to be byte-for-byte what
//      that library writes).
//   4. Prints a one-line summary: deal count is not known here, so it reports
//      the app file count, the screenshot count and the dossier size.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: same inputs, same bytes, every run.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    total += statSync(p).isDirectory() ? countEntries(p) : 1;
  }
  return total;
}

function listShots(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => /\.(png|jpe?g)$/i.test(n))
    .sort();
}

// --- Pre-flight -----------------------------------------------------------
if (!existsSync(join(appDir, 'index.html'))) {
  fail('app/index.html is missing — nothing to hand in.');
}
const shots = listShots(shotsDir);
if (shots.length < 3 || shots.length > 4) {
  fail(`expected 3 or 4 screenshots in screenshots/, found ${shots.length}.`);
}
for (const shot of shots) {
  if (statSync(join(shotsDir, shot)).size > 262144) {
    fail(`screenshots/${shot} is over the 256 KiB cap.`);
  }
}

// --- Copy -----------------------------------------------------------------
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'app'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// --- Dossier --------------------------------------------------------------
// Caps mirror the scorer's reference/gate.json: dossier text is capped at
// 160 KiB, at most 4 screenshots of 256 KiB each, app/ at most 993 files and
// directories totalling 16 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// --- Summary --------------------------------------------------------------
console.log(
  `Bargain Beacon handed in: ${countEntries(join(outDir, 'app'))} app files, ` +
  `${shots.length} screenshots (${shots.join(', ')}), ` +
  `dossier.json ${Buffer.byteLength(dossier)} bytes.`
);
