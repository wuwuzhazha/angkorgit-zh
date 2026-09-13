import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import {
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cloud,
  Code,
  Copy,
  ExternalLink,
  FolderOpen,
  History,
  Maximize2,
  Monitor,
  Pencil,
  Sparkles,
  Tag as TagIcon,
  UserRoundSearch,
} from 'lucide-react';
import type { CommitFileInfo, CommitInfo, FileDiff } from '@angkorgit/core';
import { aiCapabilities, filterFiles } from '@angkorgit/core';
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Hint,
  Logo,
  cn,
} from '@angkorgit/design-system';
import { ipc } from '@/core/ipc';
import { FileFilterInput } from '@/components/FileFilterInput';
import { useGraph } from '@/features/graph/store';
import { useRepo } from '@/features/repository/store';
import { focusRequests, useUi } from '@/features/ui/store';
import { useSettings } from '@/features/settings/store';
import { openInEditor, preferredEditor, useEditors } from '@/features/settings/editors';
import { aiConfigured, getAiProvider } from '@/features/ai/client';
import { AiText } from '@/features/ai/AiText';
import { AiResultDialog } from '@/features/ai/AiResultDialog';
import { explainKeyFor, useAiWork } from '@/features/ai/workStore';
import { Avatar } from '@/components/Avatar';
import {
  FileTree,
  FileTreeFoldButton,
  INITIAL_FOLD,
  nextFold,
  treeIndent,
  type FileTreeFold,
  type FileTreeFoldState,
} from '@/components/FileTree';
import { basename, dirname, formatDate, isMac, timeAgo } from '@/shared/utils';

const diffPath = (diff: CommitFileInfo) => diff.path;

const VIRTUAL_FILE_THRESHOLD = 200;
const FILE_ROW_HEIGHT = 34;

const statusMeta: Record<
  CommitFileInfo['status'],
  { label: string; mark: string; className: string; tone: 'info' | 'success' | 'danger' | 'primary' }
> = {
  modified: { label: '已修改', mark: 'M', className: 'text-info', tone: 'info' },
  new: { label: '新增', mark: 'A', className: 'text-success', tone: 'success' },
  deleted: { label: '已删除', mark: 'D', className: 'text-danger', tone: 'danger' },
  renamed: { label: '重命名', mark: 'R', className: 'text-primary', tone: 'primary' },
};

function ChangeSummary({ diffs }: { diffs: CommitFileInfo[] }) {
  if (diffs.length === 0) return <>无更改</>;
  const order: CommitFileInfo['status'][] = ['modified', 'new', 'deleted', 'renamed'];
  const parts = order
    .map((status) => ({ status, count: diffs.filter((d) => d.status === status).length }))
    .filter((p) => p.count > 0);
  return (
    <span className="flex items-center gap-x-2.5 whitespace-nowrap">
      {parts.map(({ status, count }) => (
        <span
          key={status}
          title={`${count} 个${statusMeta[status].label}`}
          aria-label={`${count} 个${statusMeta[status].label}`}
          className={cn('flex items-center gap-1 tabular-nums', statusMeta[status].className)}
        >
          <span className="font-mono">{statusMeta[status].mark}</span>
          {count}
        </span>
      ))}
    </span>
  );
}

function diffToText(diffs: FileDiff[]): string {
  return diffs
    .map(
      (d) =>
        `--- ${d.oldPath ?? d.path}\n+++ ${d.path}\n` +
        d.hunks
          .map((h) => `${h.header}\n${h.lines.map((l) => `${l.kind === 'addition' ? '+' : l.kind === 'deletion' ? '-' : ' '}${l.content}`).join('\n')}`)
          .join('\n'),
    )
    .join('\n\n');
}

function VirtualFileRows({
  diffs,
  scrollRef,
  renderRow,
}: {
  diffs: CommitFileInfo[];
  scrollRef: React.RefObject<HTMLDivElement>;
  renderRow: (diff: CommitFileInfo) => React.ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) setScrollMargin((prev) => (prev === el.offsetTop ? prev : el.offsetTop));
  });
  const virtualizer = useVirtualizer({
    count: diffs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => FILE_ROW_HEIGHT,
    getItemKey: (index) => diffs[index].path,
    overscan: 12,
    scrollMargin,
  });
  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          className="absolute left-0 w-full"
          style={{
            top: 0,
            height: item.size,
            transform: `translateY(${item.start - scrollMargin}px)`,
          }}
        >
          {renderRow(diffs[item.index])}
        </div>
      ))}
    </div>
  );
}

export function CommitDetails({
  commit,
  diffs,
  loading,
  error,
  onRetry,
}: {
  commit: CommitInfo;
  diffs: CommitFileInfo[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const select = useGraph((s) => s.select);
  const openCenterDiff = useUi((s) => s.openCenterDiff);
  const closeCenterDiff = useUi((s) => s.closeCenterDiff);
  const centerDiff = useUi((s) => s.centerDiff);
  const fileTree = useUi((s) => s.fileTree);
  const repoPath = useRepo((s) => s.repo?.path ?? '');
  const editorId = useSettings((s) => s.editorId);
  const { editors } = useEditors();
  const editor = preferredEditor(editors, editorId);
  const stash = useRepo((s) => s.stashes.find((entry) => entry.oid === commit.oid) ?? null);
  const refreshStatus = useRepo((s) => s.refreshStatus);
  const explainKey = explainKeyFor(repoPath, commit.oid);
  const aiText = useAiWork((s) => s.explains[explainKey] ?? null);
  const aiBusy = useAiWork((s) => !!s.explainBusy[explainKey]);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [fold, setFold] = useState<FileTreeFold>(INITIAL_FOLD);
  const [foldState, setFoldState] = useState<FileTreeFoldState | null>(null);
  const [fileQuery, setFileQuery] = useState('');
  const fileFilterOpen = useUi((s) => s.fileFilterOpen);
  const fileFilterFocusSeq = useUi((s) => s.fileFilterFocusSeq);
  useEffect(() => {
    if (!fileFilterOpen) setFileQuery('');
  }, [fileFilterOpen]);
  const filtering = fileQuery.trim().length > 0;
  const shownDiffs = useMemo(() => filterFiles(diffs, diffPath, fileQuery), [diffs, fileQuery]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const pickAnchor = useRef<string | null>(null);
  useEffect(() => {
    setFileQuery('');
    setPicked(new Set());
    pickAnchor.current = null;
  }, [commit.oid]);
  useEffect(() => {
    if (picked.size === 0) return;
    const present = new Set(diffs.map((d) => d.path));
    if ([...picked].every((p) => present.has(p))) return;
    setPicked(new Set([...picked].filter((p) => present.has(p))));
  }, [diffs, picked]);

  const togglePick = (file: string, range: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (range && pickAnchor.current) {
        const order = shownDiffs.map((d) => d.path);
        const from = order.indexOf(pickAnchor.current);
        const to = order.indexOf(file);
        if (from >= 0 && to >= 0) {
          const [a, b] = from < to ? [from, to] : [to, from];
          for (const p of order.slice(a, b + 1)) next.add(p);
          return next;
        }
      }
      if (next.has(file)) next.delete(file);
      else next.add(file);
      pickAnchor.current = file;
      return next;
    });
  };
  const longBody = commit.body.split('\n').length > 8 || commit.body.length > 600;
  const scrollRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const activeIndex = shownDiffs.findIndex(
    (d) => centerDiff?.path === d.path && centerDiff.oid === (d.sourceOid ?? commit.oid),
  );
  const openFileAt = useCallback(
    (index: number) => {
      const d = shownDiffs[index];
      if (!d) return;
      openCenterDiff({ path: d.path, oid: d.sourceOid ?? commit.oid, oldPath: d.oldPath });
      requestAnimationFrame(() => {
        filesRef.current?.querySelector('[data-active-file]')?.scrollIntoView({ block: 'nearest' });
      });
    },
    [shownDiffs, openCenterDiff, commit.oid],
  );
  const inspectorFocusSeq = useUi((s) => s.inspectorFocusSeq);
  const wantFirstFile = useRef(false);
  useEffect(() => {
    if (inspectorFocusSeq === focusRequests.inspectorConsumed) return;
    if (focusRequests.inspectorTarget !== commit.oid) return;
    const el = filesRef.current;
    if (!el) return;
    focusRequests.inspectorConsumed = inspectorFocusSeq;
    el.focus();
    if (activeIndex >= 0) return;
    if (!loading && shownDiffs.length > 0) openFileAt(0);
    else wantFirstFile.current = true;
  }, [inspectorFocusSeq, commit.oid, activeIndex, loading, shownDiffs, openFileAt]);
  useEffect(() => {
    if (!wantFirstFile.current || loading || shownDiffs.length === 0) return;
    wantFirstFile.current = false;
    openFileAt(0);
  }, [loading, shownDiffs, openFileAt]);
  useEffect(() => {
    wantFirstFile.current = false;
  }, [commit.oid]);
  const onFilesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (shownDiffs.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const next =
        activeIndex < 0
          ? step === 1
            ? 0
            : shownDiffs.length - 1
          : Math.min(shownDiffs.length - 1, Math.max(0, activeIndex + step));
      openFileAt(next);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (shownDiffs.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      openFileAt(activeIndex < 0 ? 0 : activeIndex);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      closeCenterDiff();
      useUi.getState().focusGraph();
    }
  };

  const [fileMenu, setFileMenu] = useState<{ x: number; y: number; file: CommitFileInfo } | null>(null);
  const restoreFromStash = async (files: string[]) => {
    if (!stash || files.length === 0) return;
    try {
      await ipc.stashRestoreFiles(repoPath, stash.index, files);
      await refreshStatus();
      toast.success(
        files.length === 1
          ? `已从暂存中应用 ${basename(files[0])}`
          : `已从暂存中应用 ${files.length} 个文件`,
        { description: '暂存本身保持不变。' },
      );
      setPicked(new Set());
    } catch (error) {
      toast.error(`应用失败：${(error as { message?: string }).message ?? error}`);
    }
  };

  const renderDiffRow = (diff: CommitFileInfo, depth?: number) => {
    const diffOid = diff.sourceOid ?? commit.oid;
    const active = centerDiff?.path === diff.path && centerDiff.oid === diffOid;
    const meta = statusMeta[diff.status];
    return (
      <Hint key={diff.path} label={diff.path} side="left" className="max-w-[34rem] font-mono">
        <div
          data-active-file={active || undefined}
          className={cn(
            'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
            active ? 'bg-primary/10 text-foreground' : 'hover:bg-surface-raised',
            stash && picked.has(diff.path) && !active && 'bg-primary/5',
          )}
          style={fileTree && depth !== undefined ? { paddingLeft: treeIndent(depth) } : undefined}
          onContextMenu={(e) => {
            e.preventDefault();
            setFileMenu({ x: e.clientX, y: e.clientY, file: diff });
          }}
        >
        {stash && (
          <Checkbox
            checked={picked.has(diff.path)}
            aria-label={`选择 ${diff.path} 以应用`}
            onCheckedChange={() => togglePick(diff.path, false)}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey) {
                e.preventDefault();
                togglePick(diff.path, true);
              }
            }}
          />
        )}
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={(e) => {
            if (stash && (e.shiftKey || e.metaKey || e.ctrlKey)) {
              togglePick(diff.path, e.shiftKey);
              return;
            }
            if (active) closeCenterDiff();
            else openCenterDiff({ path: diff.path, oid: diffOid, oldPath: diff.oldPath });
          }}
        >
          <Badge tone={meta?.tone ?? 'neutral'} className="w-5 shrink-0 justify-center px-0 font-mono">
            {meta?.mark ?? '?'}
          </Badge>
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="max-w-full shrink-0 truncate">{basename(diff.path)}</span>
            {!fileTree && dirname(diff.path) && (
              <span className="min-w-0 flex-1 truncate text-[11px] text-faint">{dirname(diff.path)}</span>
            )}
          </span>
          {diff.additions > 0 && <span className="shrink-0 font-mono text-[11px] text-success">+{diff.additions}</span>}
          {diff.deletions > 0 && <span className="shrink-0 font-mono text-[11px] text-danger">−{diff.deletions}</span>}
          <ChevronRight className={cn('size-3.5 shrink-0 text-faint transition-transform', active && 'rotate-90')} />
        </button>
        {stash && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`从暂存中应用 ${diff.path}`}
            className="-my-1 -mr-1 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
            onClick={() => void restoreFromStash([diff.path])}
          >
            <ArchiveRestore className="size-3.5 text-primary" />
          </Button>
        )}
        </div>
      </Hint>
    );
  };

  const explain = async () => {
    const key = explainKey;
    if (aiBusy) {
      useAiWork.getState().stopExplain(key);
      return;
    }
    if (!aiConfigured()) {
      toast.info('请先在设置中配置 AI 提供方');
      return;
    }
    const run = useAiWork.getState().startExplain(key);
    const stillRunning = () => useAiWork.getState().isExplainRun(key, run);
    try {
      const fullDiffs = await ipc.diffCommit(repoPath, commit.oid);
      if (!stillRunning()) return;
      const text = await aiCapabilities.explainDiff(getAiProvider(), diffToText(fullDiffs));
      if (stillRunning()) useAiWork.getState().setExplain(key, text);
    } catch (error) {
      if (stillRunning()) {
        toast.error(`AI 请求失败：${(error as { message?: string } | null)?.message ?? String(error)}`);
      }
    } finally {
      useAiWork.getState().endExplain(key, run);
    }
  };

  return (
    <div ref={scrollRef} className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border-subtle px-4 pb-4 pt-3">
        <h2 className="text-sm font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
          {commit.summary}
        </h2>
        {commit.body && (
          <div className="mt-2">
            <pre
              className={cn(
                'whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-muted',
                longBody && !bodyExpanded && 'line-clamp-[8]',
              )}
            >
              {commit.body}
            </pre>
            {longBody && (
              <button
                type="button"
                className="mt-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                onClick={() => setBodyExpanded((v) => !v)}
              >
                {bodyExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {bodyExpanded ? '收起' : '显示完整消息'}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 rounded-md border border-border-subtle bg-surface-raised/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={commit.author.name} email={commit.author.email} size={28} />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-xs font-medium text-foreground">{commit.author.name}</span>
              <span className="truncate text-[11px] text-faint" title={formatDate(commit.author.time)}>
                {timeAgo(commit.author.time)} · {formatDate(commit.author.time)}
                {commit.committer.email !== commit.author.email && ` · 由 ${commit.committer.name} 提交`}
              </span>
            </span>
            <Hint label="复制完整哈希">
              <button
                className="flex h-6 shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-1.5 font-mono text-[11px] text-muted hover:text-foreground"
                aria-label="复制提交哈希"
                onClick={() => {
                  void navigator.clipboard.writeText(commit.oid);
                  toast.success('已复制提交哈希');
                }}
              >
                {commit.shortOid} <Copy className="size-2.5" />
              </button>
            </Hint>
          </div>
          {(commit.parents.length > 0 || commit.refs.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2">
              {commit.parents.length > 0 && (
                <span className="text-[11px] text-faint">{commit.parents.length > 1 ? '父提交' : '父提交'}</span>
              )}
              {commit.parents.map((parent) => (
                <button
                  key={parent}
                  className="flex h-5 items-center rounded border border-border-subtle bg-surface px-1.5 font-mono text-[10px] text-muted hover:text-foreground"
                  onClick={() => select(parent)}
                  title="显示此提交"
                >
                  {parent.slice(0, 7)}
                </button>
              ))}
              {commit.refs.length > 0 && commit.parents.length > 0 && (
                <span className="mx-0.5 h-3 w-px bg-border-subtle" />
              )}
              {commit.refs.map((ref) => (
                <Badge
                  key={ref.name}
                  tone={ref.kind === 'tag' ? 'primary' : ref.kind === 'remoteBranch' ? 'info' : 'success'}
                  className="max-w-48"
                >
                  {ref.kind === 'tag' && <TagIcon className="size-2.5 shrink-0" />}
                  {ref.kind === 'remoteBranch' && <Cloud className="size-2.5 shrink-0" />}
                  {(ref.kind === 'localBranch' || ref.kind === 'head') && <Monitor className="size-2.5 shrink-0" />}
                  <span className="truncate">{ref.shorthand}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" className="text-muted" onClick={() => void explain()} disabled={loading}>
            {aiBusy ? (
              <>
                <Logo size={14} animated="loop" className="logo-draw-loop" />
                停止解释
              </>
            ) : (
              <>
                <Sparkles className="text-primary" />
                用 AI 解释
              </>
            )}
          </Button>
        </div>
        {aiText && (
          <div className="mt-1 rounded-md border border-primary/30 bg-primary/5 text-xs leading-relaxed">
            <div className="flex items-center justify-between pl-3 pr-1.5 pt-1.5">
              <span className="flex items-center gap-1.5 font-medium text-primary">
                <Sparkles className="size-3.5" /> AI 解释
              </span>
              <Hint label="在完整视图中打开解释">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="在完整视图中打开 AI 解释"
                  onClick={() => setAiExpanded(true)}
                >
                  <Maximize2 className="size-3" />
                </Button>
              </Hint>
            </div>
            <div className="px-3 pb-2.5 pt-1">
              <AiText text={aiText} />
            </div>
          </div>
        )}
        <AiResultDialog
          open={aiExpanded && !!aiText}
          onOpenChange={(open) => !open && setAiExpanded(false)}
          title="AI 解释"
          icon={<Sparkles className="size-4 text-primary" />}
          text={aiText ?? ''}
        />
      </div>

      <div
        ref={filesRef}
        tabIndex={0}
        aria-label="提交文件"
        onKeyDown={onFilesKeyDown}
        className="rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <p className="flex items-center justify-between gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <span className="shrink-0">
            Files
            {!loading && !error && (
              <span className="ml-1 text-faint">
                {filtering ? (
                  <>
                    {shownDiffs.length} <span className="font-normal normal-case tracking-normal">of {diffs.length}</span>
                  </>
                ) : (
                  diffs.length
                )}
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-normal normal-case tracking-normal">
            {loading ? '加载中…' : error ? '' : <ChangeSummary diffs={diffs} />}
            {fileTree && !loading && !error && (
              <FileTreeFoldButton state={foldState} onFold={(mode) => setFold((f) => nextFold(f, mode))} />
            )}
          </span>
        </p>
        {stash && !loading && !error && diffs.length > 0 && (
          <div className="mb-1.5 flex min-h-7 items-center gap-2 rounded-md border border-border-subtle bg-surface-raised/50 px-2 py-1 text-[11px]">
            {picked.size === 0 ? (
              <>
                <span className="min-w-0 flex-1 text-faint">
                  这是一个暂存。勾选文件即可只将这些文件应用到工作副本。
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-[11px]"
                  onClick={() => setPicked(new Set(shownDiffs.map((d) => d.path)))}
                >
                  全选
                </Button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-muted">
                  {picked.size} of {diffs.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-[11px]"
                  onClick={() => setPicked(new Set())}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="h-6 shrink-0 px-2 text-[11px]"
                  onClick={() => void restoreFromStash([...picked])}
                >
                  <ArchiveRestore className="size-3" /> 应用 {picked.size} 个文件
                </Button>
              </>
            )}
          </div>
        )}
        {!loading && !error && fileFilterOpen && (
          <div className="mb-1 px-0.5">
            <FileFilterInput
              value={fileQuery}
              onChange={setFileQuery}
              onClose={() => useUi.getState().setFileFilterOpen(false)}
            focusSeq={fileFilterFocusSeq}
              placeholder="过滤文件…"
            />
          </div>
        )}
        {loading ? (
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-7 animate-pulse rounded-md bg-surface-raised" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="min-w-0 flex-1 text-xs text-danger [overflow-wrap:anywhere]">
              无法加载更改：{error}
            </span>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={onRetry}>
              重试
            </Button>
          </div>
        ) : shownDiffs.length === 0 && filtering ? (
          <p className="px-2 py-1.5 text-xs text-faint">没有匹配过滤条件的文件。</p>
        ) : fileTree ? (
          <FileTree items={shownDiffs} pathOf={diffPath} renderFile={renderDiffRow} fold={fold} onFoldState={setFoldState} />
        ) : shownDiffs.length > VIRTUAL_FILE_THRESHOLD ? (
          <VirtualFileRows diffs={shownDiffs} scrollRef={scrollRef} renderRow={renderDiffRow} />
        ) : (
          shownDiffs.map((diff) => renderDiffRow(diff))
        )}
      </div>
      {fileMenu && (
        <DropdownMenu open onOpenChange={(o) => !o && setFileMenu(null)}>
          <DropdownMenuTrigger asChild>
            <span style={{ position: 'fixed', left: fileMenu.x, top: fileMenu.y }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel className="max-w-64 truncate font-mono">{fileMenu.file.path}</DropdownMenuLabel>
            {stash && (
              <>
                <DropdownMenuItem onClick={() => void restoreFromStash([fileMenu.file.path])}>
                  <ArchiveRestore /> Apply this file to the working copy
                </DropdownMenuItem>
                {picked.size > 1 && picked.has(fileMenu.file.path) && (
                  <DropdownMenuItem onClick={() => void restoreFromStash([...picked])}>
                    <ArchiveRestore /> Apply {picked.size} selected files
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              disabled={fileMenu.file.status === 'deleted'}
              onClick={() => useUi.getState().openEditor(fileMenu.file.path)}
            >
              <Pencil /> Edit file
            </DropdownMenuItem>
            {editor && (
              <DropdownMenuItem
                disabled={fileMenu.file.status === 'deleted'}
                onClick={() => void openInEditor(editor.id, `${repoPath}/${fileMenu.file.path}`)}
              >
                <Code /> 打开 in {editor.label}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => useUi.getState().openFileHistory(fileMenu.file.path)}>
              <History /> 文件历史
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={fileMenu.file.status === 'deleted'}
              onClick={() => useUi.getState().openBlame(fileMenu.file.path, fileMenu.file.sourceOid ?? commit.oid)}
            >
              <UserRoundSearch /> Blame at this commit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={fileMenu.file.status === 'deleted'}
              onClick={() =>
                void ipc
                  .openPath(`${repoPath}/${fileMenu.file.path}`)
                  .catch((error) =>
                    toast.error(`Could not open the file: ${(error as { message?: string }).message ?? error}`),
                  )
              }
            >
              <ExternalLink /> 打开 in external app
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={fileMenu.file.status === 'deleted'}
              onClick={() =>
                void ipc
                  .revealPath(`${repoPath}/${fileMenu.file.path}`)
                  .catch((error) =>
                    toast.error(`Could not reveal the file: ${(error as { message?: string }).message ?? error}`),
                  )
              }
            >
              <FolderOpen /> {isMac ? 'Show in Finder' : '在文件管理器中显示'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(fileMenu.file.path);
                toast.success('路径已复制');
              }}
            >
              <Copy /> 复制路径
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(`${repoPath}/${fileMenu.file.path}`);
                toast.success('Absolute path copied');
              }}
            >
              <Copy /> Copy absolute path
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
