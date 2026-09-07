// verify.mjs — independent validation of ui batch outputs (translator-a · t2)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'E:/angkorgit_zh/build/angkorgit';
const srcDir = join(root, 'apps/desktop/src');

// collect all text files under apps/desktop/src
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(srcDir);
const cache = new Map();
const fileOf = (f) => (cache.has(f) ? cache.get(f) : (cache.set(f, readFileSync(f, 'utf8')), cache.get(f)));

const batch = readFileSync(join(root, 'zh-dict/batches/ui/batch.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('\t'));
const skip = readFileSync(join(root, 'zh-dict/batches/ui/skip-ui.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#'));

let problems = 0;
const check = (ok, msg) => {
  if (!ok) { console.error('FAIL:', msg); problems++; }
};

// 1) every batch source must be a literal substring of some src file
for (const [ /*scope*/, src ] of batch) {
  const hit = files.find((f) => fileOf(f).includes(src));
  if (!hit) {
    // allow regex-bearing entries to be checked separately
    check(false, `source not found in any src file: ${src}`);
  }
}

// 2) anchors compile and hit at least one line containing their source
for (const row of batch) {
  const [, src, , anchor] = row;
  if (!anchor) continue;
  let re;
  try { re = new RegExp(anchor); } catch (e) { check(false, `anchor does not compile [${anchor}] for source ${src}: ${e.message}`); continue; }
  const hit = files.find((f) => fileOf(f).split(/\r?\n/).some((l) => l.includes(src) && re.test(l)));
  if (!hit) check(false, `no line with both source and anchor [${anchor}] for: ${src}`);
}

// 3) coverage: every batch1.tsv ui row is skipped or covered by a batch source
const batch1 = readFileSync(join(root, 'zh-dict/research/batch1.tsv'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter((c) => c[0] === 'ui');
const batchSrcs = batch.map((r) => r[1]);
const skipSrcs = new Set(skip.map((l) => l.split('\t')[1]));
for (const row of batch1) {
  const src = row[1];
  if (skipSrcs.has(src)) continue;
  const covered = batchSrcs.includes(src) || batchSrcs.some((s) => s.includes(src));
  if (!covered) { check(false, `batch1 row uncovered: ${src}`); }
}
console.log(`batch1 rows=${batch1.length} batch entries=${batch.length} skip rows=${skip.length - 6} (+6 verify)`);
console.log(problems === 0 ? 'ALL CHECKS PASSED' : `${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);