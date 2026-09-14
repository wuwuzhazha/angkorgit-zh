#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const allowlist = JSON.parse(readFileSync(join(root, 'scripts/copy-allowlist.json'), 'utf8'));

const DEFAULT_TARGETS = [
  'apps/desktop/src',
  'packages/core/src',
  'tests/e2e',
  'apps/website/src',
];
const EXTENSIONS = new Set(['.ts', '.tsx', '.astro', '.mjs', '.js', '.jsx']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', 'target', 'test-results']);

const HAN = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const PATH_CHARS = /[.\\/_:-]/;
const SEGMENT_RE = new RegExp(`[^${HAN}A-Za-z0-9\\s.\\/_:-]+`, 'gu');
const HAN_RE = new RegExp(`[${HAN}]`, 'u');
const LATIN_RE = /[A-Za-z][A-Za-z0-9.\\/_:\-]*/g;

const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phraseRe = new RegExp(
  allowlist.phrases.map((p) => `(?<![A-Za-z0-9])${escapeRe(p)}(?![A-Za-z0-9])`).join('|'),
  'g',
);
const allowedWords = new Set(allowlist.words.map((w) => w.toLowerCase()));

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) walk(abs, out);
    else if (EXTENSIONS.has(extname(entry))) out.push(abs);
  }
  return out;
}

function violatingTokens(segment) {
  if (!HAN_RE.test(segment)) return [];
  const stripped = segment.replace(phraseRe, ' ');
  const tokens = stripped.match(LATIN_RE) ?? [];
  return tokens.filter((token) => {
    const lower = token.toLowerCase();
    if (token.length < 2) return false;
    if (PATH_CHARS.test(token)) return false;
    if (/\d/.test(token)) return false;
    return !allowedWords.has(lower);
  });
}

const targets = process.argv.slice(2);
const dirs = (targets.length ? targets : DEFAULT_TARGETS).map((t) => join(root, t));

const files = [];
for (const dir of dirs) {
  try {
    if (statSync(dir).isDirectory()) walk(dir, files);
  } catch {
    // missing optional target
  }
}

const findings = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const segment of line.split(SEGMENT_RE)) {
      const tokens = violatingTokens(segment);
      if (tokens.length) {
        findings.push({
          file: relative(root, file).replace(/\\/g, '/'),
          line: index + 1,
          text: segment.trim(),
          tokens,
        });
      }
    }
  });
}

if (findings.length) {
  console.error('Mixed Chinese/English copy found — translate the English words or allowlist the term:\n');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.tokens.join(', ')}]  ${f.text}`);
  }
  console.error(`\n${findings.length} occurrence(s). Edit scripts/copy-allowlist.json only for real proper nouns or technical terms.`);
  process.exit(1);
}

console.log(`Copy check clean: ${files.length} file(s) scanned, no mixed Chinese/English strings.`);
