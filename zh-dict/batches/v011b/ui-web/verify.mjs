// verify.mjs — independent validation of v011b ui-web batch (translator-a · t17)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = 'E:/angkorgit_zh/build/angkorgit';
const dirs = ['apps/desktop/src', 'apps/website/src', 'docs'];
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?|astro|md|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = dirs.flatMap((d) => walk(join(root, d)));
const cache = new Map();
const fileOf = (f) => (cache.has(f) ? cache.get(f) : (cache.set(f, readFileSync(f, 'utf8')), cache.get(f)));

const batch = readFileSync(join(root, 'zh-dict/batches/v011b/ui-web/batch.tsv'), 'utf8')
  .split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
const skip = readFileSync(join(root, 'zh-dict/batches/v011b/ui-web/skip.tsv'), 'utf8')
  .split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));

let problems = 0;
const check = (ok, msg) => { if (!ok) { console.error('FAIL:', msg); problems++; } };

// 1) every batch source is a literal substring of some scanned file
for (const row of batch) {
  const [, src] = row;
  const hit = files.find((f) => fileOf(f).includes(src));
  if (!hit) check(false, `source not found: ${src}`);
}

// 2) anchors compile and hit a line containing the source
for (const row of batch) {
  const [, src, , anchor] = row;
  if (!anchor) continue;
  let re;
  try { re = new RegExp(anchor); } catch (e) { check(false, `anchor does not compile [${anchor}] for ${src}`); continue; }
  const hit = files.find((f) => fileOf(f).split(/\r?\n/).some((l) => l.includes(src) && re.test(l)));
  if (!hit) check(false, `no line with both source and anchor [${anchor}] for: ${src}`);
}

// 3) coverage of forward batches
const batchSrcs = batch.map((r) => r[1]);
const skipSrcs = new Set(skip.map((l) => l[1]));
for (const bn of ['batch1.tsv', 'batch2.tsv']) {
  const rows = readFileSync(join(root, `zh-dict/research/${bn}`), 'utf8')
    .split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
  for (const row of rows) {
    const src = row[1];
    if (skipSrcs.has(src)) continue;
    const covered = batchSrcs.includes(src) || batchSrcs.some((s) => s.includes(src));
    if (!covered) check(false, `UNCOVERED in ${bn}: ${src}`);
  }
}

// 4) F7 family + blind spots present (as entry source or covered by a longer entry)
const f7 = [
  'Reset branch to its remote?', 'Reset branch', 'Checkout ${name}', 'Reset ${name} to ${ref.shorthand}',
  'Pop latest stash', 'Stash this file…', 'Stash selected changes',
  'Only this file is stashed. Everything else stays in your working copy.',
  'Applied ${files.length} files from the stash', 'The stash itself is unchanged.',
  'This is a stash. Tick files to apply only those to the working copy.',
  'Drop this stash?', 'Clear filter', 'Commit files', 'aria-label="Stash"',
  '${stash.message} — click to preview, right-click for actions',
  '${local.ahead} commit${local.ahead === 1 ? \'\' : \'s\'} only on the local branch will be lost.',
];
for (const s of f7) {
  if (!batchSrcs.includes(s) && !batchSrcs.some((x) => x.includes(s))) check(false, `F7 missing: ${s}`);
}

// 5) TSV shape: 3-4 cols, unique sources, no-space sources carry anchor
const seen = new Set();
for (const row of batch) {
  if (row.length < 3 || row.length > 4) check(false, `bad column count (${row.length}) for ${row[1]}`);
  if (seen.has(row[1])) check(false, `duplicate source: ${row[1]}`);
  seen.add(row[1]);
  if (!/\s/.test(row[1]) && !row[3]) check(false, `no-space source without anchor: ${row[1]}`);
  if (!/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(row[2])) check(false, `target has no CJK: ${row[1]}`);
}

console.log(`batch entries=${batch.length} skip rows=${skip.length}`);
console.log(problems === 0 ? 'ALL CHECKS PASSED' : `${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);