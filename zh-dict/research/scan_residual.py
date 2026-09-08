#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scan_residual.py v3 — 高精度残留英文扫描器（researcher · t1）

关键设计（相对 sync-localize.ps1 Scan-Pending 的增强与修正）：
  1. JSX 文本节点 / 属性文案（aria-label、title、placeholder、alt、description…）
  2. 模板字面量（${} 整串保留；仅当表达式为简单标识符时整串可译；复杂表达式内嵌引号另抽）
  3. Rust 字符串 / raw 串 / format 宏格式串（{} 占位符保留）
  4. Astro（frontmatter TS + 正文）
  5. docs Markdown 散文（候选=原始行，代码块/行内代码/链接行排除）
  6. 误报过滤：标识符/路径/URL/哈希/版本/日期/CSS 类/命令/品牌/AI 提示词/演示数据/断言耦合/
     changelog/政策模板文件
  7. protect 修正：单连字符英文词（right-click）不再被 kebab 规则误伤（建议同步改 protect.txt）

产物（zh-dict/research/）：
  residual.tsv / residual-lines.tsv / residual-stats.json / batch1.tsv / batch2.tsv / batch3.tsv / verify.tsv
"""
from __future__ import annotations
import argparse, json, os, re, sys
from collections import Counter, defaultdict

REPO = r"E:\angkorgit_zh\build\angkorgit"

SCOPE_GLOBS = {
    'ui':      ['apps/desktop/src/**/*.ts', 'apps/desktop/src/**/*.tsx'],
    'rust':    ['apps/desktop/src-tauri/src/**/*.rs', 'apps/desktop/src-tauri/tests/**/*.rs'],
    'core':    ['packages/core/src/**/*.ts'],
    'website': ['apps/website/src/**/*.ts', 'apps/website/src/**/*.tsx', 'apps/website/src/**/*.astro'],
    'meta':    ['apps/desktop/src-tauri/tauri.conf.json', 'package.json',
                'apps/desktop/package.json', 'apps/desktop/src-tauri/Cargo.toml',
                'apps/desktop/index.html'],
    'docs':    ['docs/**/*.md', 'CHANGELOG.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'],
    'e2e':     ['tests/e2e/**/*.ts'],
    'test':    ['tests/unit/**/*.ts'],
}

# 全文件跳过（低翻译价值 / 惯例保持英文）——仅扫描器视角；契约建议同步 skip-files.txt
FILE_SKIP_VERDICT = {
    'CHANGELOG.md':       ('skip', 'changelog', '发布历史不译（惯例）；建议加入 skip-files.txt'),
    'SECURITY.md':        ('skip', 'policy', '安全政策模板，低价值；建议加入 skip-files.txt'),
    'CODE_OF_CONDUCT.md': ('skip', 'policy', '行为准则模板，低价值；建议加入 skip-files.txt'),
}

def glob_to_regex(glob: str) -> str:
    esc = re.escape(glob)
    esc = esc.replace(r'\*\*/', '(?:.*/)?').replace(r'\*\*', '.*').replace(r'\*', '[^/]*')
    return '^' + esc + '$'

def load_skip_files(dict_dir):
    pats = []
    p = os.path.join(dict_dir, 'skip-files.txt')
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            pats.append(re.compile(glob_to_regex(line)))
    def skipped(rel):
        return any(rx.match(rel) for rx in pats)
    return skipped

def load_protect(dict_dir, refined=True):
    """refined=True 用契约建议的修正版（单连字符英文词不拦截）"""
    pats = []
    p = os.path.join(dict_dir, 'protect.txt')
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line == '[a-z][a-z0-9]*(-[a-z0-9]+)+' and refined:
                # 契约建议：kebab 规则改为"必须含数字段"，防止误伤纯英文连字符词（side-by-side 等）
                line = r'[a-z][a-z0-9]*(-[a-z0-9]*[0-9][a-z0-9]*)+'
            line = line.replace(r'~\/', r'~/')
            try:
                pats.append(re.compile(line))
            except re.error as e:
                print(f'WARN protect 正则无法编译: {line!r} -> {e}', file=sys.stderr)
    return pats

def load_dict_sources(dict_dir):
    srcs = set()
    p = os.path.join(dict_dir, 'dict.tsv')
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            line = line.rstrip('\n')
            if not line or line.startswith('#'):
                continue
            f = line.split('\t')
            if len(f) >= 3 and f[1]:
                srcs.add(f[1])
    return srcs

def collect_files(repo, skipped):
    all_files = []
    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', 'target', 'dist', '.github')]
        for fn in files:
            abs = os.path.join(root, fn)
            rel = os.path.relpath(abs, repo).replace('\\', '/')
            all_files.append((rel, abs))
    scopes = {}
    for name, globs in SCOPE_GLOBS.items():
        rxs = [re.compile(glob_to_regex(g)) for g in globs]
        scopes[name] = [(rel, abs) for rel, abs in all_files
                        if any(rx.match(rel) for rx in rxs) and not skipped(rel)]
    return scopes

# ----------------------------------------------------------------
CJK = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]')
def has_cjk(s): return bool(CJK.search(s))

BRAND_EXACT = {
    'Claude Code', 'Codex CLI', 'Gemini CLI', 'Antigravity CLI', 'Ollama', 'LM Studio',
    'Google Gemini', 'OpenAI', 'Anthropic', 'AngKorGit', 'Angkor Git', 'Git Angkor',
    'AngKorGit Contributors', 'temple gold', 'Angkor Dawn', 'Angkor Dusk',
    'AngKor Dark', 'AngKor Light', 'Ayu Dark', 'Ayu Light', 'Catppuccin Latte',
    'Catppuccin Mocha', 'GitHub Dark', 'GitHub Light', 'One Dark Pro', 'Temple Gold',
    'Tokyo Night', 'VS Code Dark+', 'VS Code Light+', 'GitKraken', 'Fork',
    'Sublime Merge', 'GitHub Desktop', 'GitLab', 'Bitbucket', 'GitHub', 'Git',
    'Linux', 'macOS', 'Windows', 'Angkor Wat', 'JetBrains Mono', 'Inter Variable',
    'Instrument Serif', 'React', 'Rust', 'TypeScript', 'Tauri', 'Vite',
    'TailwindCSS', 'Zustand', 'Framer Motion', 'Playwright', 'Vitest', 'Astro',
    'Homebrew', 'Gatekeeper', 'Apple', 'Git Credential Manager', 'Linear', 'Raycast',
    'GitHub Actions', 'Azure',
}
PROMPT_HINTS = [
    'you are', 'you\'re an', 'your task', 'respond with', 'reply with exactly',
    'return json', 'output json', 'ignore the', 'conventions above', 'this diff',
    'the changes in', 'review the diff', 'pretend', 'in one word', 'only respond',
    'output the message', 'no fencing', 'write only the', 'do not include',
    'then a blank line', 'start the first line with', 'respond only with',
    'flag any',
]
BRAND_PAT = None
def build_brand_pattern():
    global BRAND_PAT
    BRAND_PAT = re.compile('|'.join(re.escape(b) for b in sorted(BRAND_EXACT, key=len, reverse=True)))

ATTR_UI = {
    'aria-label', 'title', 'placeholder', 'alt', 'description', 'tooltip', 'hint',
    'message', 'prompt', 'label', 'text', 'emptyTitle', 'emptyText', 'badgeText',
    'confirmText', 'cancelText', 'heading', 'subheading', 'footer', 'eyebrow',
    'helperText', 'detail', 'buttonText', 'cancelLabel', 'confirmLabel',
}
ATTR_CODE = {
    'class', 'className', 'style', 'id', 'key', 'variant', 'size', 'type', 'name',
    'provider', 'section', 'data-testid', 'data-state', 'data-slot', 'data-value',
    'aria-hidden', 'role', 'viewBox', 'width', 'height', 'fill', 'stroke',
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'xmlns', 'd', 'r', 'cx', 'cy',
    'href', 'src', 'target', 'rel', 'for', 'htmlFor', 'value', 'defaultValue',
}

def looks_identifier(s: str) -> bool:
    if not s: return True
    if re.fullmatch(r'[a-z][a-z0-9]*', s): return True
    if re.fullmatch(r'[a-z][a-z0-9]*(_|-|\.)[a-z0-9_.-]+', s): return True   # kebab/snake/dot
    if re.fullmatch(r'[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*', s): return True  # camelCase
    if re.fullmatch(r'[A-Z][A-Za-z0-9]*', s): return True
    if re.fullmatch(r'[A-Z][A-Z0-9_]{2,}', s): return True
    if re.fullmatch(r'_{1,2}[A-Za-z0-9_]+', s): return True
    if re.fullmatch(r'[0-9a-fA-F]{7,}', s): return True
    if re.fullmatch(r'[A-Za-z0-9+/]{20,}={0,2}', s): return True
    if re.fullmatch(r'\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?([+-]\d{2}:?\d{2})?', s): return True
    if re.fullmatch(r'(\d+\.)+\d+', s): return True
    if re.fullmatch(r'[a-z]{2}(-[A-Z]{2})?', s): return True
    if re.fullmatch(r'[\w.-]+(\.[\w-]+)+', s): return True                  # 域名/glue-key/file.ext
    if re.fullmatch(r'[A-Za-z0-9_.@/-]+', s) and re.search(r'\d', s): return True  # 含数字的 token
    return False

def hit_protect(s, protect):
    for p in protect:
        if p.search(s):
            return True
    return False

def no_ascii_letters(s):
    return not re.search(r'[A-Za-z]', s)

CSS_TOK = re.compile(r'^[a-z0-9\[\]\._:/%#(),&!-]+$')
def looks_css(s):
    """Tailwind/CSS 值：全小写 token 且 ≥50% token 含 - [ ] : ( / % 或数字"""
    if any(ch.isupper() for ch in s):
        return False
    toks = s.split()
    if len(toks) < 2:
        return False
    if not all(CSS_TOK.match(t) for t in toks):
        return False
    mark = [t for t in toks if re.search(r'[-\[\]:()/%\d\.\#]', t)]
    return len(mark) >= len(toks) * 0.5

def likely_shortcut(s):
    return (len(s) <= 14 and
            any(ch in '↑↓⇧⌘⌥⌃⏎→←' for ch in s) and
            all(ch.isascii() or ch in '↑↓⇧⌘⌥⌃⏎→←' for ch in s))

def sanitize(s):
    return s.replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r')

# ---------------------------------------------------------------- 扫描器
class Cand:
    __slots__ = ('scope', 'file', 'line', 'source', 'kind')
    def __init__(self, scope, file, line, source, kind):
        self.scope, self.file, self.line, self.source, self.kind = scope, file, line, source, kind

MIN_LEN = 3
SIMPLE_EXPR = re.compile(r'^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]*\])*$')
# t11 升级规则③（含中文混杂行）：先剥 ${…} 占位符再统计——英文占优（ascii > 2×cjk）才算待修混杂行
# （'Bitbucket rejected these credentials …账户邮箱… scope' → 待修；'…无需 API 密钥。' → 已译跳过）
def _strip_placeholders(s):
    """平衡括号地剥除 ${...}（含嵌套 { message?: string } 等），供混杂行判定使用"""
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c == '$' and i + 1 < n and s[i + 1] == '{':
            depth = 1
            i += 2
            while i < n and depth > 0:
                if s[i] == '{':
                    depth += 1
                elif s[i] == '}':
                    depth -= 1
                i += 1
            continue
        out.append(c)
        i += 1
    return ''.join(out)

def _needs_fix(s):
    if not has_cjk(s):
        return True
    st = _strip_placeholders(s)
    # 剥占位符后仍有连续英文短语 → 待修（Bitbucket rejected these credentials…账户邮箱…）
    if re.search(r'[A-Za-z]{2,}(?: [A-Za-z]{2,}){1,}', st):
        return True
    # 否则按比例：英文显著占优才算待修（避免品牌/术语混排的已译串误报）
    ascii_n = len(re.findall(r'[A-Za-z]', st))
    cjk_n = len(CJK.findall(st))
    return ascii_n > 3 * cjk_n
# 片段混杂：≥4 字母英文词后随非字母（'failed: '、'right-click for'），用于模板字面量前缀串
SEG_MIXED = re.compile(r'[A-Za-z]{4,}[^A-Za-z]|^[A-Za-z]{4,}$')

def _tmpl_seg_ok(sg):
    """模板字面量前缀片段候选（升级规则①）：'Commit failed: '、'移除工作树 failed: ' 等"""
    if len(sg) < 4:
        return False
    if not re.search(r'[A-Za-z]{3,}', sg):
        return False
    if has_cjk(sg):
        return bool(SEG_MIXED.search(sg))
    return len(sg.split()) >= 2 or sg.rstrip().endswith((':', '?', '.', '!', '-'))

def scan_ts_lines(scope, rel, text, out):
    lines = text.split('\n')
    n = len(lines)
    i = 0
    while i < n:
        line = lines[i]
        ln = i + 1
        j = 0
        m = len(line)
        while j < m:
            c = line[j]
            if c == '/' and j + 1 < m:
                nxt = line[j + 1]
                if nxt == '/':
                    break
                if nxt == '*':
                    end = line.find('*/', j + 2)
                    while end == -1:
                        i += 1
                        if i >= n: break
                        end = lines[i].find('*/')
                    if end == -1: j = m
                    else: j = end + 2
                    continue
            if c in ('\'', '"'):
                q = c
                jj = j + 1
                buf = []
                while jj < m:
                    ch = line[jj]
                    if ch == '\\':
                        if jj + 1 < m:
                            buf.append(ch)          # 保留转义原文（\n 记作反斜杠+n，与文件一致）
                            buf.append(line[jj + 1])
                        jj += 2
                        continue
                    if ch == q: break
                    buf.append(ch)
                    jj += 1
                s = ''.join(buf).strip()
                if s and len(s) >= MIN_LEN and _needs_fix(s):
                    before = line[max(0, j - 80):j]
                    mm = re.search(r'([\w-]+)\s*=\s*$', before.rstrip())
                    attr = mm.group(1) if mm else None
                    if attr:
                        kind = f'attr:{attr}'
                    elif re.search(r'(test|it|describe)\s*\(\s*$', before):
                        kind = 'test-name'
                    else:
                        kind = 'string'
                    out.append(Cand(scope, rel, ln, s, kind))
                j = jj + 1
                continue
            if c == '`':
                # 模板字面量（t11 升级）：单行模板产出整串候选（含复杂 ${…} 原样保留），
                # 复杂模板另按字面片段产出前缀串候选（tmpl-seg），并识别属性模板（attr:xxx）
                jj = j + 1
                pieces = []          # ('lit', text) / ('code', code) 有序片段，可原样重建整串
                lit_buf = []
                exprs = []
                exprs_simple = True
                attr = None
                before = line[max(0, j - 80):j]
                mmb = re.search(r'([\w-]+)\s*=\s*\{?\s*$', before.rstrip())
                if mmb:
                    attr = mmb.group(1)
                while True:
                    closed = False
                    while jj < m:
                        ch = line[jj]
                        if ch == '\\':
                            if jj + 1 < m:
                                lit_buf.append(ch)
                                lit_buf.append(line[jj + 1])
                            jj += 2
                            continue
                        if ch == '`':
                            closed = True
                            break
                        if ch == '$' and jj + 1 < m and line[jj + 1] == '{':
                            if lit_buf:
                                pieces.append(('lit', ''.join(lit_buf)))
                                lit_buf = []
                            k = jj + 2
                            depth = 1
                            while k < m:
                                if line[k] == '{':
                                    depth += 1
                                elif line[k] == '}':
                                    depth -= 1
                                    if depth == 0: break
                                k += 1
                            code = line[jj:k + 1]          # 原样片段 ${...}
                            inner = code[2:-1].strip()
                            if SIMPLE_EXPR.match(inner):
                                pieces.append(('code', code))
                                exprs.append(code)
                            else:
                                exprs_simple = False
                                pieces.append(('code', code))
                                for mm2 in re.finditer(r"(['\"])((?:\\.|(?!\1).)*)\1", inner):
                                    inner_s = mm2.group(2).strip()
                                    if inner_s and len(inner_s) >= MIN_LEN and _needs_fix(inner_s):
                                        out.append(Cand(scope, rel, ln, inner_s, 'string'))
                            jj = k + 1
                            continue
                        lit_buf.append(ch)
                        jj += 1
                    if closed:
                        break
                    exprs_simple = False          # 跨行模板：引擎行级替换无法处理 → 不产出整串
                    jj = m
                    break
                if closed:
                    if lit_buf:
                        pieces.append(('lit', ''.join(lit_buf)))
                    whole = ''.join(t for _, t in pieces)
                    s = whole.strip()
                    kind_base = f'attr:{attr}' if attr else 'template'
                    if s and len(s) >= MIN_LEN and _needs_fix(s):
                        out.append(Cand(scope, rel, ln, s, kind_base))
                    # 前缀串候选（仅复杂模板）：'Commit failed: ' / '移除工作树 failed: ' 等字面片段
                    if not exprs_simple:
                        seg_kind = f'attr:{attr}' if attr else 'tmpl-seg'
                        for pk, pt in pieces:
                            if pk != 'lit':
                                continue
                            sg = pt.strip()
                            if _tmpl_seg_ok(sg):
                                out.append(Cand(scope, rel, ln, sg, seg_kind))
                j = jj + 1
                continue
            if c == '<' and (rel.endswith('.tsx') or rel.endswith('.astro')):
                if line[j:j + 4] == '{/*':
                    end = line.find('*/}', j + 4)
                    j = (end + 3) if end != -1 else m
                    continue
                if line[j:j + 3] == '</>':
                    j += 3
                    continue
                if line[j:j + 2] == '<>':
                    j += 2
                    continue
                mm = re.match(r'<(/?)([A-Za-z][\w.]*)\b', line[j:])
                if mm and mm.group(1) == '/':
                    j += mm.end()
                    continue
                if mm:
                    rest = line[j:]
                    gt = _find_tag_close(rest)
                    if gt is None:
                        j = m
                        continue
                    seg = rest[:gt]
                    if re.search(r'/\s*$', seg):
                        j += gt + 1
                        continue
                    void_tags = {'input', 'img', 'br', 'hr', 'meta', 'link', 'area',
                                 'base', 'col', 'embed', 'source', 'track', 'wbr'}
                    if mm.group(2).lower() in void_tags:
                        j += gt + 1
                        continue
                    j += gt + 1
                    jj2 = j
                    while jj2 < m and line[jj2] not in '<{':
                        jj2 += 1
                    t = line[j:jj2].strip()
                    if len(t) >= MIN_LEN and _needs_fix(t):
                        out.append(Cand(scope, rel, ln, t, 'jsx-text'))
                    j = jj2
                    continue
                j += 1
                continue
            j += 1
        i += 1

def _find_tag_close(s):
    idx = 0
    depth = 0
    while idx < len(s):
        c = s[idx]
        if c in ('\'', '"'):
            q = c
            idx += 1
            while idx < len(s):
                if s[idx] == '\\':
                    idx += 2; continue
                if s[idx] == q: break
                idx += 1
            idx += 1
            continue
        if c == '<':
            depth += 1
        elif c == '>':
            depth -= 1
            if depth <= 0:
                return idx
        idx += 1
    return None

def scan_rust_lines(scope, rel, text, out):
    lines = text.split('\n')
    n = len(lines)
    i = 0
    while i < n:
        line = lines[i]
        ln = i + 1
        m = len(line)
        j = 0
        while j < m:
            c = line[j]
            if c == '/' and j + 1 < m:
                nxt = line[j + 1]
                if nxt == '/': break
                if nxt == '*':
                    end = line.find('*/', j + 2)
                    while end == -1:
                        i += 1
                        if i >= n: break
                        end = lines[i].find('*/')
                    if end == -1: j = m
                    else: j = end + 2
                    continue
            if c == 'r' and j + 1 < m and line[j + 1] == '"':
                jj = j + 2
                buf = []
                while jj < m and line[jj] != '"':
                    buf.append(line[jj]); jj += 1
                s = ''.join(buf).strip()
                if s and not has_cjk(s) and len(s) >= MIN_LEN:
                    out.append(Cand(scope, rel, ln, s, 'rust-raw'))
                j = jj + 1
                continue
            if c == 'r' and j + 2 < m and line[j + 1] == '#' and line[j + 2] == '"':
                k = j + 1
                hashes = 0
                while k < m and line[k] == '#':
                    hashes += 1; k += 1
                if k < m and line[k] == '"':
                    jj = k + 1
                    buf = []
                    endmark = '"' + '#' * hashes
                    while jj < len(line) and not line.startswith(endmark, jj):
                        buf.append(line[jj]); jj += 1
                    s = ''.join(buf).strip()
                    if s and not has_cjk(s) and len(s) >= MIN_LEN:
                        out.append(Cand(scope, rel, ln, s, 'rust-raw'))
                    j = jj + len(endmark)
                    continue
            if c == '"':
                jj = j + 1
                buf = []
                while jj < m:
                    ch = line[jj]
                    if ch == '\\':
                        if jj + 1 < m:
                            buf.append(ch)
                            buf.append(line[jj + 1])
                        jj += 2
                        continue
                    if ch == '"': break
                    buf.append(ch)
                    jj += 1
                s = ''.join(buf).strip()
                if s and not has_cjk(s) and len(s) >= MIN_LEN:
                    before = line[max(0, j - 60):j]
                    kind = 'rust-fmt' if re.search(r'(format|println|eprintln|print|eprint|writeln|write|panic|assert_eq|assert|anyhow|bail|ensure|expect|unwrap_or_else|format_args)\s*!\s*\(?\s*$', before) else 'rust'
                    out.append(Cand(scope, rel, ln, s, kind))
                j = jj + 1
                continue
            if c == '\'':
                j += 2 if j + 1 < m else 1
                continue
            j += 1
        i += 1

MD_FENCE = re.compile(r'^(\s*)(```|~~~)')
MD_RULER = re.compile(r'^\s*([-*_])\1{2,}\s*$')

def scan_md_lines(scope, rel, text, out):
    lines = text.split('\n')
    in_fence = False
    fence_mark = None
    for i, raw in enumerate(lines):
        ln = i + 1
        fm = MD_FENCE.match(raw)
        if fm:
            if not in_fence:
                in_fence = True; fence_mark = fm.group(2)
            elif fence_mark == fm.group(2):
                in_fence = False
            continue
        if in_fence:
            continue
        line = raw.strip()
        if not line or has_cjk(line):
            continue
        if MD_RULER.match(line):
            continue
        if re.match(r'^<[a-z!][^>]*>$', line, re.I):
            continue
        if line.startswith('|') or line.endswith('|'):
            continue
        if re.match(r'^!\[[^\]]*\]\([^)]*\)$', line):
            continue
        if re.match(r'^\[[^\]]*\]:\s*\S+', line):  # 引用式链接定义
            continue
        plain = re.sub(r'`[^`]*`', '', line)
        plain = re.sub(r'\[[^\]]*\]\([^)]*\)', '', plain)
        plain = plain.replace('**', '').replace('*', '').replace('_', '')
        words = re.findall(r'[A-Za-z][A-Za-z\'\-]*', plain)
        if len(words) < 2:
            continue
        letters = sum(1 for ch in plain if ch.isascii() and ch.isalpha())
        if letters < 10:
            continue
        # 版本号/日期占主体的 heading 行（如 ## [0.10.0] - 2026-09-05）已因 words<2 或 letters<10 过滤
        kind = 'md-prose'
        if '`' in line or '](' in line:
            kind = 'md-prose-fmt'
        out.append(Cand(scope, rel, ln, line, kind))  # 候选=原始行（引擎字面替换需精确匹配）

def scan_meta_lines(scope, rel, text, out):
    if rel.endswith('.toml'):
        scan_rust_lines(scope, rel, text, out)
    elif rel.endswith('.json'):
        for i, line in enumerate(text.split('\n')):
            for mm in re.finditer(r'"((?:\\.|[^"\\])*)"', line):
                s = mm.group(1).strip()
                if s and not has_cjk(s) and len(s) >= MIN_LEN:
                    out.append(Cand(scope, rel, i + 1, s, 'json'))
    else:
        scan_ts_lines(scope, rel, text, out)

def scan_file(scope, rel, abs_path, out):
    try:
        with open(abs_path, encoding='utf-8-sig') as f:
            text = f.read()
    except (UnicodeDecodeError, OSError):
        return
    if scope == 'docs' and rel in FILE_SKIP_VERDICT:
        return  # 全部按文件级裁决 skip（在 classify 中体现）
    if rel.endswith('.rs'):
        scan_rust_lines(scope, rel, text, out)
    elif rel.endswith('.md'):
        scan_md_lines(scope, rel, text, out)
    elif rel.endswith('.astro'):
        m = re.match(r'^---\n(.*?)\n---\n?', text, re.S)
        if m:
            scan_ts_lines(scope, rel, m.group(1), out)
            body = text[m.end():]
        else:
            body = text
        scan_ts_lines(scope, rel, body, out)
    elif scope == 'meta':
        scan_meta_lines(scope, rel, text, out)
    else:
        scan_ts_lines(scope, rel, text, out)

# ---------------------------------------------------------------- 甄别
def classify(c, protect, dict_sources, demo_sources):
    file_key = c.file if c.scope == 'docs' else None
    if file_key in FILE_SKIP_VERDICT:
        v, r, h = FILE_SKIP_VERDICT[file_key]
        return v, r, h
    s = c.source
    if s in dict_sources:
        return 'skip', 'dup', '已入词库'
    if has_cjk(s):
        # t11 升级规则③：中英混杂行（英文占优 / 前缀片段）不算已译，须修复
        if not (_needs_fix(s) or (c.kind == 'tmpl-seg' and SEG_MIXED.search(s))):
            return 'skip', 'cjk', '含中文（已译）'
    if s in demo_sources:
        return 'skip', 'demo', '仅演示数据（demo.ts 被 skip-files 排除）'
    if not s or len(s) < MIN_LEN:
        return 'skip', 'short', '过短'
    if no_ascii_letters(s):
        return 'skip', 'code', '无英文字母（数字/符号）'
    if likely_shortcut(s):
        return 'skip', 'code', '快捷键标签'
    if '<path' in s or re.match(r'^<[a-z]+[ >]', s) or ('d="' in s and ('<svg' in s or '<path' in s)):
        return 'skip', 'code', 'SVG/图标数据'
    if '<<<<<<<' in s or '>>>>>>>' in s or '=======' in s:
        return 'skip', 'gitraw', '冲突标记/差异内容'
    if ' ' not in s:
        if s.startswith('--') or s[-1] in '-_.:' or '/' in s or '://' in s or '${' in s \
           or '(' in s or '[' in s or ']' in s or ')' in s or '{' in s or '}' in s \
           or re.search(r'[?#&=;:+@$]', s):
            if not (re.fullmatch(r'[A-Za-z][A-Za-z0-9.,:/-]*', s) and re.search(r'\s', s)):
                return 'skip', 'code', 'URL/路径/模板/选择器/函数式（无空格代码串）'
    if c.kind.startswith('attr:'):
        attr = c.kind[5:]
        if attr in ATTR_CODE:
            return 'skip', 'ident' if re.fullmatch(r'[A-Za-z0-9_.\\-]+', s) else 'code', f'属性值（{attr}）代码'
        if attr in ATTR_UI:
            if ' ' not in s:
                return 'translate', 'attr-ui', f'属性文案（{attr}），裸词须配 anchor'
            return 'translate', 'attr-ui', f'属性文案（{attr}）'
    if BRAND_PAT and BRAND_PAT.fullmatch(s):
        return 'skip', 'brand', '品牌/产品名（保留英文）'
    if c.kind == 'jsx-text':
        # 代码尾巴混入 JSX 文本（{openDialog(...)} 之后的残渣）
        if '=' in s or ';' in s or ')}' in s or re.match(r'^[A-Za-z_$][\w$]*\s*\(', s):
            return 'skip', 'code', 'JSX 代码残渣'
        if ' ' not in s:
            return 'translate', 'jsx-text', 'JSX 文本裸词，须配 anchor'
        return 'translate', 'jsx-text', 'JSX 文本'
    if looks_css(s):
        return 'skip', 'css', 'Tailwind/CSS 类'
    if hit_protect(s, protect):
        if len(s.split()) >= 4:
            return 'verify', 'protect-mixed', '含受保护片段（URL/哈希/路径/版本），译时须原样保留'
        return 'skip', 'protect', '命中保护正则'
    low = s.lower()
    for h in PROMPT_HINTS:
        if h in low:
            return 'skip', 'prompt', 'AI 提示词/探针'
    if c.kind == 'test-name':
        return 'skip', 'test-name', 'vitest test/it/describe 用例名（不译）'
    if re.match(r'^\((cherry picked from commit|.*tag [0-9a-f]|.*branch )', low) or \
       re.match(r'^(merge branch |revert .*#|already up to date|no newline)', low):
        return 'skip', 'gitraw', 'git 原始输出/消息模板'
    if re.match(r'^(pnpm|npm|yarn|cargo|brew|chmod|xattr|shasum|tccutil|tauri|corepack|clippy|printf|cat|sleep|playwright|vitest|tsc|ts-node|vite|git|node|python|pwsh|sh|bash|zsh|curl|wget|ssh|rg|grep|find|sed|awk|rm|ditto|mv|cp|mkdir|touch|open -a)\b', low):
        return 'skip', 'command', 'CLI 命令/脚本片段'
    if re.match(r'^[a-z][a-z0-9-]*=[^ ]', s):
        return 'skip', 'code', '键值对/元标签'
    if looks_identifier(s):
        return 'skip', 'ident', '标识符/路径/哈希/日期'
    if ' ' not in s:
        if c.scope in ('rust', 'meta', 'test'):
            return 'skip', 'ident', '裸词（rust/meta/test 默认标识符）'
        return 'verify', 'single-word', '裸词：须配 anchor，e2e 断言同步'
    if c.kind in ('template', 'rust-fmt') and ('${' in s or re.search(r'\{[^\n{}]*\}', s)):
        static = re.sub(r'\$\{[^}]*\}', ' ', s)
        static = re.sub(r'\{[^\n{}]*\}', ' ', static)
        if len(re.findall(r'[A-Za-z]{3,}', static)) < 1:
            return 'skip', 'code', '纯占位符拼接'
        return 'translate', 'fmt', '模板串：${x}/{} 占位符必须原样保留'
    if 'Bearer ' in s or s.startswith('Authorization: '):
        return 'skip', 'code', '请求头/鉴权模板'
    if c.scope in ('e2e', 'test'):
        if re.search(r'\[data-|title="|> div|=>|\.flatMap|\.map\(f\)|const \w+\s*=|function \w*\(', s):
            return 'skip', 'code', '选择器/代码片段（测试）'
        if '(demo)' in s:
            return 'skip', 'demo', '演示数据断言（demo.ts 不译，断言保持英文）'
    if c.scope == 'test':
        if re.match(r'^(feat|fix|docs|chore|refactor|style|test|ci)(\([\w-]+\))?:', low):
            return 'skip', 'fixture', '提交消息夹具（测试）'
    if c.scope == 'rust' and '/tests/' in c.file:
        if re.match(r'^(feat|fix|docs|chore|refactor|style|test|ci):', low) \
           or '(cherry picked from commit' in s or 'Signed-off-by' in s:
            return 'skip', 'fixture', 'Rust 集成测试断言/夹具（不译）'
    if c.kind in ('rust', 'rust-raw') and c.scope in ('rust', 'meta'):
        return 'translate', 'new', 'Rust 字符串'
    return 'translate', 'new', '待译'

# ---------------------------------------------------------------- 主流程
def effort(s):
    return max(1, len(s) / 60.0)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', default=REPO)
    args = ap.parse_args()
    repo = os.path.abspath(args.repo)
    dict_dir = os.path.join(repo, 'zh-dict')
    out_dir = os.path.join(dict_dir, 'research')
    os.makedirs(out_dir, exist_ok=True)

    skipped = load_skip_files(dict_dir)
    protect = load_protect(dict_dir, refined=True)
    protect_legacy = load_protect(dict_dir, refined=False)
    dict_sources = load_dict_sources(dict_dir)
    build_brand_pattern()

    scopes = collect_files(repo, skipped)

    demo_sources = set()
    demo_path = os.path.join(repo, 'apps/desktop/src/core/demo.ts')
    if os.path.exists(demo_path):
        tmp = []
        with open(demo_path, encoding='utf-8-sig') as f:
            scan_ts_lines('demo', 'apps/desktop/src/core/demo.ts', f.read(), tmp)
        demo_sources = {cc.source for cc in tmp}

    raw = []
    for scope, files in scopes.items():
        for rel, abs in files:
            scan_file(scope, rel, abs, raw)

    by_key = {}
    locs = defaultdict(list)
    for c in raw:
        key = (c.scope, c.source)
        by_key.setdefault(key, c)
        locs[key].append(f'{c.file}:{c.line}')

    e2e_srcs = {c.source for c in raw if c.scope in ('e2e', 'test')}
    items = sorted(by_key.values(), key=lambda c: (-len(c.source), c.scope, c.source))

    rows = []
    stats = Counter()
    for c in items:
        verdict, reason, hint = classify(c, protect, dict_sources, demo_sources)
        key = (c.scope, c.source)
        sync = ''
        if verdict == 'translate' and c.source in e2e_srcs:
            sync = 'e2e/test 断言同步：scope 写 ui,e2e 或同名 e2e 词条'
        req_anchor = 'yes' if (' ' not in c.source and verdict in ('translate', 'verify')) else ''
        stats[(c.scope, verdict)] += 1
        rows.append([c.scope, c.source, verdict, reason, hint, c.kind, req_anchor, sync,
                     locs[key][0], str(len(locs[key]))])

    def w_tsv(name, header_lines, data_rows, ncols):
        with open(os.path.join(out_dir, name), 'w', encoding='utf-8') as f:
            for h in header_lines:
                f.write('# ' + h + '\n')
            for r in data_rows:
                f.write('\t'.join(sanitize(r[i]) for i in range(ncols)) + '\n')

    w_tsv('residual.tsv',
          ['残留英文候选（researcher 增强扫描，自动生成）',
           '列：scope<TAB>source<TAB>verdict<TAB>reason<TAB>hint<TAB>kind<TAB>require_anchor<TAB>sync<TAB>first_loc<TAB>occurrences'],
          rows, 10)

    line_rows = [[c.scope, c.file, str(c.line), c.source, c.kind]
                 for c in sorted(raw, key=lambda x: (x.scope, x.file, x.line))]
    w_tsv('residual-lines.tsv',
          ['明细定位：scope<TAB>file<TAB>line<TAB>source<TAB>kind'],
          line_rows, 5)

    translate_rows = [r for r in rows if r[2] == 'translate']
    b1 = [r for r in translate_rows if r[0] == 'ui']
    b2 = [r for r in translate_rows if r[0] in ('website', 'docs')]
    b3 = [r for r in translate_rows if r[0] in ('rust', 'core', 'meta', 'e2e', 'test')]
    batch_defs = [('batch1.tsv', 'UI（桌面）', b1),
                  ('batch2.tsv', 'website + docs', b2),
                  ('batch3.tsv', 'rust + core + meta + e2e/test 其余', b3)]
    for fn, label, br in batch_defs:
        hd = [f'批次 {fn}（{label}）：translate {len(br)} 条；source 按长度降序（长串优先）',
              '列：scope<TAB>source<TAB>require_anchor<TAB>sync<TAB>hint<TAB>first_loc<TAB>occurrences']
        w_tsv(fn, hd, [r[:5] + r[8:10] for r in br], 7)

    verify_rows = [r for r in rows if r[2] == 'verify']
    w_tsv('verify.tsv',
          ['待决清单：翻译前逐条裁决 → 转 translate（产出词条）或转 skip（记入批次 skip 文件 + 理由）',
           '列：scope<TAB>source<TAB>reason<TAB>hint<TAB>kind<TAB>require_anchor<TAB>sync<TAB>first_loc<TAB>occurrences'],
          [r[:7] + r[8:10] for r in verify_rows], 9)

    # 引擎启用清单：当前 protect.txt（legacy）会拦截的可译/待决串——须先改 protect 才能替换生效
    blocked = [r for r in rows if r[2] in ('translate', 'verify') and hit_protect(r[1], protect_legacy)]
    w_tsv('protect-blocked.tsv',
          ['受 protect.txt(legacy) 拦截的候选：不改 protect 则引擎永不替换（建议升级 kebab 规则）',
           '列：scope<TAB>source<TAB>verdict<TAB>hint<TAB>first_loc'],
          [[r[0], r[1], r[2], r[4], r[8]] for r in blocked], 5)

    summary = {}
    for (sc, vd), cnt in sorted(stats.items()):
        summary.setdefault(sc, {})[vd] = cnt
    json.dump({'per_scope_verdict': summary,
               'translate_count': len(translate_rows),
               'verify_count': len(verify_rows),
               'skip_count': sum(1 for r in rows if r[2] == 'skip'),
               'batch_workload': {fn: round(sum(effort(r[1]) for r in br), 1) for fn, _, br in batch_defs},
               'batch_rows': {fn: len(br) for fn, _, br in batch_defs}},
              open(os.path.join(out_dir, 'residual-stats.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    print('=== scope x verdict ===')
    total = Counter()
    for sc in sorted(summary):
        line = []
        for vd in ('translate', 'verify', 'skip'):
            n = summary[sc].get(vd, 0)
            total[vd] += n
            line.append(f'{vd}={n}')
        print(f'{sc:8s} ' + '  '.join(line))
    print('TOTAL translate=%d verify=%d skip=%d' % (total['translate'], total['verify'], total['skip']))
    print('raw=%d dedup=%d' % (len(raw), len(rows)))
    print('batch rows:', {fn: len(br) for fn, _, br in batch_defs})
    print('out:', out_dir)

if __name__ == '__main__':
    main()