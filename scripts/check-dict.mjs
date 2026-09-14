#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DICT = `${root}/zh-dict/dict.tsv`;
const SCOPES = new Set(['ui', 'rust', 'core', 'website', 'meta', 'docs', 'e2e', 'test']);
const MODES = new Set(['', 'whole']);

const lines = readFileSync(DICT, 'utf8').split(/\r?\n/);
const errors = [];
const warnings = [];
const entries = [];

lines.forEach((raw, index) => {
  const line = index + 1;
  if (!raw.trim() || raw.trimStart().startsWith('#')) return;
  const f = raw.split('\t');
  if (f.length < 3) {
    errors.push(`第 ${line} 行字段不足（需要 作用域<TAB>源文<TAB>译文）：${raw}`);
    return;
  }
  const [scopeField, src, tgt, anchor = '', mode = ''] = f;
  const scopes = scopeField.split(',').map((s) => s.trim()).filter(Boolean);
  for (const scope of scopes) {
    if (!SCOPES.has(scope)) errors.push(`第 ${line} 行未知作用域：${scope}`);
  }
  if (!src || !tgt) {
    errors.push(`第 ${line} 行源文或译文为空`);
    return;
  }
  if (!MODES.has(mode)) {
    errors.push(`第 ${line} 行非法匹配模式：${mode}（仅支持空或 whole）`);
  }
  if (anchor) {
    try {
      new RegExp(anchor);
    } catch (e) {
      errors.push(`第 ${line} 行锚点不是合法正则：${anchor}（${e.message}）`);
    }
  }
  if (!/\s/.test(src) && !anchor && mode !== 'whole') {
    errors.push(`第 ${line} 行单单词缺锚点：${src}（需 anchor 或 whole）`);
  }
  if (src === tgt) warnings.push(`第 ${line} 行译文与源文相同：${src}`);
  entries.push({ line, scopes, src, mode });
});

const seen = new Map();
for (const e of entries) {
  const key = `${[...e.scopes].sort().join(',')}\u0000${e.src}`;
  if (seen.has(key)) warnings.push(`第 ${e.line} 行与第 ${seen.get(key)} 行重复（同作用域同源文）：${e.src}`);
  else seen.set(key, e.line);
}

const byScope = new Map();
for (const e of entries) {
  for (const scope of e.scopes) {
    if (!byScope.has(scope)) byScope.set(scope, []);
    byScope.get(scope).push(e);
  }
}
for (const [scope, list] of byScope) {
  const sorted = [...list].sort((a, b) => a.src.length - b.src.length);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].mode === 'whole' || sorted[i].mode === 'whole') continue;
      if (sorted[j].src.startsWith(sorted[i].src) && sorted[j].src !== sorted[i].src) {
        warnings.push(
          `前缀重叠：『${sorted[i].src}』(第 ${sorted[i].line} 行) 是『${sorted[j].src}』(第 ${sorted[j].line} 行) 的前缀 — 已按最长源优先处理，确认是否符合预期`,
        );
      }
    }
  }
}

if (warnings.length) {
  const shown = warnings.slice(0, 15);
  console.warn(`词典提示（${warnings.length} 条，不阻塞）：`);
  for (const w of shown) console.warn(`  - ${w}`);
  if (warnings.length > shown.length) {
    console.warn(`  … 还有 ${warnings.length - shown.length} 条前缀重叠提示（均按最长源优先处理）`);
  }
}

if (errors.length) {
  console.error(`\n词典错误（${errors.length} 条）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`\n词典检查通过：${entries.length} 条词条，${warnings.length} 条提示。`);
