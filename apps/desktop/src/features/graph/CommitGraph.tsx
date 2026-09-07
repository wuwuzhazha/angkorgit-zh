import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import { toastOutcome } from '@/shared/toastOutcome';
import { Archive, ArchiveRestore, ArrowDownToLine, ArrowUpFromLine, Check, Combine, Copy, Filter, FolderTree, GitBranchPlus, Settings2, GitMerge, ListOrdered, ListRestart, RotateCcw, Search, Tag as TagIcon, Trash2, Undo2, User, X } from 'lucide-react';
import type { CommitInfo, RefInfo } from '@angkorgit/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Hint,
  Input,
  Spinner,
  cn,
} from '@angkorgit/design-system';
import { ipc } from '@/core/ipc';
import { useRepo } from '@/features/repository/store';
import { useGraph } from './store';
import { useUi } from '@/features/ui/store';
import { useUndo, type UndoKind } from '@/features/history/undoStore';
import { AUTHOR_COL_WIDTH, CommitRow, FLAT_GUTTER_WIDTH, GUTTER_GAP, GraphTailDefs, REF_COL_WIDTH, ROW_HEIGHT, gutterWidthFor, laneWidthFor } from './GraphRow';
import { WipRow } from './WipRow';
import { confirmDialog } from '@/components/confirm';
import { useShortcuts } from '@/shared/useShortcuts';

const HASH_QUERY = /^[0-9a-f]{4,40}$/i;
const AMBIGUOUS_HASH_MAX = 6;

interface MenuState {
  x: number;
  y: number;
  commit: CommitInfo;
}

interface RefMenuState {
  x: number;
  y: number;
  ref: RefInfo;
}

const stashIndexOf = (ref: RefInfo) => Number(/\{(\d+)\}/.exec(ref.name)?.[1] ?? 0);

export function CommitGraph() {
  const repo = useRepo((s) => s.repo);
  const refresh = useRepo((s) => s.refresh);
  const worktrees = useRepo((s) => s.worktrees);
  const branches = useRepo((s) => s.branches);
  const { rows, commits, maxLane, hasMore, loading, error, filters, selectedOid, selectedOids, pendingScrollIndex, loadMore, reload, setFilters, select, toggleSelect, rangeSelect, jumpTo, clearPendingScroll } =
    useGraph();
  const openDialog = useUi((s) => s.openDialog);
  const graphColumns = useUi((s) => s.graphColumns);
  const graphTail = useUi((s) => s.graphTail);
  const setGraphTail = useUi((s) => s.setGraphTail);
  const setGraphColumn = useUi((s) => s.setGraphColumn);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [refMenu, setRefMenu] = useState<RefMenuState | null>(null);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [authorDraft, setAuthorDraft] = useState(filters.author);
  const [jumpedOid, setJumpedOid] = useState<string | null>(null);
  const [jumpMiss, setJumpMiss] = useState(false);
  const jumpedRef = useRef('');
  const draftsRef = useRef({ search: '', author: '' });
  draftsRef.current = { search: searchDraft, author: authorDraft };
  const searchInputRef = useRef<HTMLInputElement>(null);

  const path = repo?.path ?? '';
  const graphFocusSeq = useUi((s) => s.graphFocusSeq);
  useEffect(() => {
    if (graphFocusSeq > 0) scrollRef.current?.focus();
  }, [graphFocusSeq]);

  const worktreeBranches = useMemo(() => {
    const map = new Map<string, string>();
    for (const wt of worktrees) if (wt.branch && !wt.isCurrent) map.set(wt.branch, wt.name);
    return map;
  }, [worktrees]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const items = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = items[items.length - 1];
    if (last && last.index >= rows.length - 40 && hasMore && !loading && !error && path) {
      void loadMore(path);
    }
  }, [items, rows.length, hasMore, loading, error, path, loadMore]);

  const runJump = useCallback(
    (rev: string) => {
      void jumpTo(path, rev).then((oid) => {
        if (useGraph.getState().lastPath !== path) return;
        if (draftsRef.current.search.trim() !== rev || draftsRef.current.author) return;
        if (oid) {
          jumpedRef.current = rev;
          setJumpedOid(oid);
          setJumpMiss(false);
          return;
        }
        if (rev.length <= AMBIGUOUS_HASH_MAX) {
          jumpedRef.current = rev;
          setJumpedOid(null);
          setJumpMiss(false);
          setFilters(path, { search: rev, author: '' });
          return;
        }
        setJumpMiss(true);
      });
    },
    [jumpTo, path, setFilters],
  );

  useEffect(() => {
    const trimmed = searchDraft.trim();
    const hashLike = HASH_QUERY.test(trimmed);
    if (jumpedRef.current && jumpedRef.current !== trimmed) {
      jumpedRef.current = '';
      setJumpMiss(false);
    }
    const timer = setTimeout(() => {
      if (hashLike && !authorDraft) {
        if (jumpedRef.current !== trimmed) runJump(trimmed);
        return;
      }
      if (searchDraft !== filters.search || authorDraft !== filters.author) {
        setJumpedOid(null);
        setJumpMiss(false);
        setFilters(path, { search: searchDraft, author: authorDraft });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchDraft, authorDraft, filters.search, filters.author, path, setFilters, runJump]);

  useEffect(() => {
    if (!jumpedOid || selectedOid === jumpedOid) return;
    setJumpedOid(null);
    setJumpMiss(false);
    jumpedRef.current = '';
    setSearchDraft('');
  }, [selectedOid, jumpedOid]);

  useEffect(() => {
    if (pendingScrollIndex === null || pendingScrollIndex >= rows.length) return;
    virtualizer.scrollToIndex(pendingScrollIndex, { align: 'center' });
    clearPendingScroll();
  }, [pendingScrollIndex, rows.length, virtualizer, clearPendingScroll]);

  const flat = Boolean(filters.search || filters.author);
  const laneWidth = laneWidthFor(maxLane);
  const gutterWidth = flat ? FLAT_GUTTER_WIDTH : gutterWidthFor(maxLane, laneWidth);
  const filtersActive = Boolean(filters.search || filters.author || filters.branch);

  const moveSelection = useCallback(
    (step: 1 | -1 | 'home' | 'end') => {
      const ui = useUi.getState();
      if (ui.centerDiff || ui.centerEditor || ui.centerFileHistory || ui.paletteOpen || ui.dialog || ui.conflictFile) return;
      if (commits.length === 0) return;
      const current = commits.findIndex((c) => c.oid === selectedOid);
      const next =
        step === 'home'
          ? 0
          : step === 'end'
            ? commits.length - 1
            : current === -1
              ? step === 1
                ? 0
                : commits.length - 1
              : Math.min(commits.length - 1, Math.max(0, current + step));
      select(commits[next].oid);
      virtualizer.scrollToIndex(next, { align: 'auto' });
    },
    [commits, selectedOid, select, virtualizer],
  );

  const keyNav = useMemo(
    () => [
      { combo: 'arrowdown', handler: () => moveSelection(1) },
      { combo: 'arrowup', handler: () => moveSelection(-1) },
      { combo: 'home', handler: () => moveSelection('home') },
      { combo: 'end', handler: () => moveSelection('end') },
      {
        combo: 'arrowright',
        handler: () => {
          const ui = useUi.getState();
          if (ui.centerDiff || ui.centerEditor || ui.centerFileHistory || ui.paletteOpen || ui.dialog || ui.conflictFile) return;
          ui.focusInspector();
        },
      },
      {
        combo: 'mod+f',
        handler: () => {
          const ui = useUi.getState();
          if (ui.centerDiff || ui.centerEditor || ui.centerFileHistory || ui.paletteOpen || ui.dialog || ui.conflictFile) return;
          searchInputRef.current?.select();
        },
      },
    ],
    [moveSelection],
  );
  useShortcuts(keyNav);

  const act = useCallback(
    async (
      label: string,
      op: () => Promise<unknown>,
      undoable?: { kind: UndoKind; extra?: Record<string, string> },
    ) => {
      try {
        const run = undoable
          ? () =>
              useUndo.getState().tracked({
                path,
                kind: undoable.kind,
                label,
                extra: undoable.extra,
                action: op,
                shouldRecord: (r) => {
                  const status = (r as { status?: string } | undefined)?.status;
                  return status === undefined || status === 'ok' || status === 'fast_forward';
                },
              })
          : op;
        const result = (await run()) as { status?: string; message?: string } | undefined;
        toastOutcome(result, `${label} 已完成`);
        await refresh();
        await reload(path);
      } catch (error) {
        toast.error(`${label} 失败：${(error as { message?: string }).message ?? error}`);
      }
    },
    [refresh, reload, path],
  );

  const onContextMenu = useCallback((event: React.MouseEvent, commit: CommitInfo) => {
    event.preventDefault();
    const stashRef = commit.refs.find((ref) => ref.kind === 'stash');
    if (stashRef) {
      setRefMenu({ x: event.clientX, y: event.clientY, ref: stashRef });
      return;
    }
    setMenu({ x: event.clientX, y: event.clientY, commit });
  }, []);

  const onRowSelect = useCallback(
    (oid: string, event: React.MouseEvent) => {
      if (event.shiftKey) rangeSelect(oid);
      else if (event.metaKey || event.ctrlKey) toggleSelect(oid);
      else select(oid);
    },
    [select, toggleSelect, rangeSelect],
  );

  const multiSelection = useMemo(() => {
    if (!menu || selectedOids.length < 2 || !selectedOids.includes(menu.commit.oid)) return null;
    const indices = selectedOids.map((oid) => commits.findIndex((c) => c.oid === oid));
    if (indices.some((i) => i < 0)) return null;
    if (indices.some((i) => commits[i].parents.length > 1)) return null;
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    const baseOid = commits[max].parents[0];
    if (!baseOid) return null;
    return {
      baseOid,
      count: selectedOids.length,
      contiguous: max - min === selectedOids.length - 1,
    };
  }, [menu, selectedOids, commits]);

  const pickSelection = useMemo(() => {
    if (!menu || selectedOids.length < 2 || !selectedOids.includes(menu.commit.oid)) return null;
    const indices = selectedOids.map((oid) => commits.findIndex((c) => c.oid === oid));
    if (indices.some((i) => i < 0)) return null;
    if (indices.some((i) => commits[i].parents.length > 1)) return null;
    return [...indices].sort((a, b) => b - a).map((i) => commits[i].oid);
  }, [menu, selectedOids, commits]);

  const checkoutRef = useCallback(
    (ref: RefInfo) => {
      const held = ref.kind === 'localBranch' ? worktrees.find((w) => w.branch === ref.shorthand && !w.isCurrent) : undefined;
      if (held && !held.isMissing) {
        void useRepo
          .getState()
          .open(held.path)
          .catch((error) =>
            toast.error(`无法打开 ${held.name}：${(error as { message?: string }).message ?? error}`),
          );
        return;
      }
      void act(`检出 ${ref.shorthand}`, () => ipc.checkout(path, ref.shorthand), {
        kind: 'checkout',
      });
    },
    [act, path, worktrees],
  );

  const onRefMenu = useCallback((event: React.MouseEvent, ref: RefInfo) => {
    setRefMenu({ x: event.clientX, y: event.clientY, ref });
  }, []);

  const resetToRemote = useCallback(
    (ref: RefInfo, commit: CommitInfo) => {
      const name = ref.shorthand.split('/').slice(1).join('/');
      const local = branches.find((b) => !b.isRemote && b.name === name);
      if (!local) return;
      const held = worktrees.find((w) => w.branch === name && !w.isCurrent);
      if (held) {
        toast.error(`${name} is checked out in worktree ${held.name} — reset it from there`);
        return;
      }
      const losing =
        local.upstream === ref.shorthand && local.ahead > 0
          ? ` ${local.ahead} commit${local.ahead === 1 ? '' : 's'} only on the local branch will be lost.`
          : '';
      void confirmDialog({
        title: 'Reset branch to its remote?',
        description: local.isHead
          ? `硬重置 to ${ref.shorthand} (${commit.shortOid}).${losing} 未提交的更改 are discarded and cannot be recovered.`
          : `This branch is not checked out. It is checked out first, then hard reset to ${ref.shorthand} (${commit.shortOid}).${losing} 未提交的更改 are discarded and cannot be recovered.`,
        path: name,
        confirmLabel: 'Reset branch',
        destructive: true,
      }).then(async (ok) => {
        if (!ok) return;
        if (!local.isHead) {
          try {
            await useUndo.getState().tracked({
              path,
              kind: 'checkout',
              label: `Checkout ${name}`,
              action: () => ipc.checkout(path, name),
            });
          } catch (error) {
            toast.error(`Checkout ${name} failed: ${(error as { message?: string }).message ?? error}`);
            return;
          }
        }
        await act(`Reset ${name} to ${ref.shorthand}`, () => ipc.reset(path, commit.oid, 'hard'), {
          kind: 'reset',
        });
      });
    },
    [act, branches, path, worktrees],
  );

  const localBranchNames = useMemo(
    () => new Set(branches.filter((b) => !b.isRemote && b.ahead > 0).map((b) => b.name)),
    [branches],
  );

  return (
    <section className="relative flex h-full flex-col bg-background" aria-label="提交历史">
      <GraphTailDefs />
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3 py-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            ref={searchInputRef}
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const trimmed = searchDraft.trim();
              if (HASH_QUERY.test(trimmed) && !authorDraft) {
                jumpedRef.current = '';
                runJump(trimmed);
              }
            }}
            placeholder="搜索提交…"
            className="h-7 pl-8 text-xs"
          />
        </div>
        {jumpMiss && <span className="text-xs text-danger">找不到提交</span>}
        <div className="relative w-44">
          <User className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            value={authorDraft}
            onChange={(e) => setAuthorDraft(e.target.value)}
            placeholder="按作者过滤…"
            className="h-7 pl-8 text-xs"
          />
        </div>
        {filters.branch && (
          <span className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
            <Filter className="size-3" />
            {filters.branch}
            <button aria-label="清除分支过滤" onClick={() => setFilters(path, { branch: '' })}>
              <X className="size-3" />
            </button>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-faint">
          {loading && <Spinner className="size-3.5" />}
          <span>
            {commits.length.toLocaleString()}
            {hasMore ? '+' : ''} 个提交
          </span>
          <DropdownMenu>
            <Hint label="提交图显示">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="提交图显示选项">
                  <Settings2 className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </Hint>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>在图中显示</DropdownMenuLabel>
              {(
                [
                  ['refs', '分支与标签'],
                  ['message', '提交消息'],
                  ['author', '作者'],
                  ['hash', '哈希'],
                  ['date', '日期'],
                ] as const
              ).map(([key, label]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={graphColumns[key]}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => setGraphColumn(key, checked === true)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuCheckboxItem
                checked={graphTail}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => setGraphTail(checked === true)}
              >
                Lane color band
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className={cn(
          'flex h-6 shrink-0 select-none items-center gap-2 border-b border-border-subtle bg-surface pr-4 text-[10px] font-semibold uppercase tracking-wide text-faint',
          graphColumns.refs || flat ? 'pl-1' : 'pl-4',
        )}
        aria-hidden
      >
        {!flat && graphColumns.refs && (
          <span className="-mr-2 shrink-0 truncate" style={{ width: REF_COL_WIDTH }}>
            分支 / 标签
          </span>
        )}
        <span className="shrink-0 truncate" style={{ width: gutterWidth, marginRight: flat ? 0 : GUTTER_GAP }}>
          {flat ? '' : '图表'}
        </span>
        {(graphColumns.message || flat) && (
          <span className="min-w-0 flex-1 truncate">
            {flat && graphColumns.refs ? '分支 / 标签 · 消息' : graphColumns.message ? '消息' : ''}
          </span>
        )}
        {graphColumns.author && (
          <span className="shrink-0 truncate" style={{ width: AUTHOR_COL_WIDTH }}>
            作者
          </span>
        )}
        {graphColumns.hash && (
          <span className={cn('w-14 shrink-0', graphColumns.message ? 'text-right' : 'text-left')}>哈希</span>
        )}
        {graphColumns.date && (
          <span className={cn('w-[4.5rem] shrink-0', graphColumns.message ? 'text-right' : 'text-left')}>日期</span>
        )}
        {!graphColumns.message && !flat && <span className="min-w-0 flex-1" />}
      </div>
      <div ref={scrollRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none" role="table" aria-label="Commits">
        <WipRow gutterWidth={gutterWidth} flat={flat} showRefs={graphColumns.refs} />
        {rows.length === 0 && !loading ? (
          error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-danger">
              <span className="[overflow-wrap:anywhere]">无法加载历史记录： {error}</span>
              <Button variant="ghost" size="sm" onClick={() => void reload(path)}>
                重试
              </Button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-faint">
              <span>{filtersActive ? '没有提交匹配这些过滤条件' : '还没有提交'}</span>
              {filtersActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchDraft('');
                    setAuthorDraft('');
                    setFilters(path, { search: '', author: '', branch: '' });
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {items.map((item) => {
              const row = rows[item.index];
              const commit = commits[item.index];
              if (!row || !commit) return null;
              return (
                <div
                  key={commit.oid}
                  className={
                    jumpedOid === commit.oid
                      ? 'animate-locate rounded-md bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]'
                      : undefined
                  }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: item.size,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  <CommitRow
                    commit={commit}
                    row={row}
                    gutterWidth={gutterWidth}
                    flat={flat}
                    selected={selectedOid === commit.oid || selectedOids.includes(commit.oid)}
                    laneWidth={laneWidth}
                    columns={graphColumns}
                    showTail={graphTail}
                    worktrees={worktreeBranches}
                    resettableBranches={localBranchNames}
                    onSelect={onRowSelect}
                    onContextMenu={onContextMenu}
                    onCheckoutRef={checkoutRef}
                    onRefMenu={onRefMenu}
                    onResetToRemote={resetToRemote}
                  />
                </div>
              );
            })}
          </div>
        )}
        {error && rows.length > 0 && !loading && (
          <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-danger">
            <span className="[overflow-wrap:anywhere]">无法加载更多提交： {error}</span>
            <button className="shrink-0 underline underline-offset-2" onClick={() => void reload(path)}>
              重试
            </button>
          </div>
        )}
      </div>

      {refMenu && (
        <DropdownMenu open onOpenChange={(o) => !o && setRefMenu(null)}>
          <DropdownMenuTrigger asChild>
            <span style={{ position: 'fixed', left: refMenu.x, top: refMenu.y }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel className={cn('max-w-64 truncate', refMenu.ref.kind === 'stash' ? 'font-normal' : 'font-mono')}>
              {refMenu.ref.shorthand}
            </DropdownMenuLabel>
            {refMenu.ref.kind === 'stash' && (
              <>
                <DropdownMenuItem
                  onClick={() => void act('应用暂存', () => ipc.stashApply(path, stashIndexOf(refMenu.ref)))}
                >
                  <Archive /> 应用暂存 (keep it)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void act('弹出暂存', () => ipc.stashPop(path, stashIndexOf(refMenu.ref)))}
                >
                  <ArchiveRestore /> 弹出暂存
                </DropdownMenuItem>
                <DropdownMenuItem
                  destructive
                  onClick={() => {
                    const ref = refMenu.ref;
                    void confirmDialog({
                      title: 'Drop this stash?',
                      description: 'The stashed changes are deleted and cannot be recovered.',
                      path: ref.shorthand,
                      confirmLabel: '丢弃暂存',
                      destructive: true,
                    }).then((ok) => {
                      if (ok) void act('丢弃暂存', () => ipc.stashDrop(path, stashIndexOf(ref)));
                    });
                  }}
                >
                  <Trash2 /> 丢弃暂存…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {refMenu.ref.kind !== 'tag' && refMenu.ref.kind !== 'stash' && (
              <>
                <DropdownMenuItem onClick={() => checkoutRef(refMenu.ref)}>
                  <Check /> Checkout {refMenu.ref.shorthand}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    void act(`合并 ${refMenu.ref.shorthand}`, () => ipc.merge(path, refMenu.ref.shorthand, true), {
                      kind: 'merge',
                      extra: { branch: refMenu.ref.shorthand },
                    })
                  }
                >
                  <GitMerge /> Merge into current branch
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    void act(`变基到 ${refMenu.ref.shorthand}`, () => ipc.rebase(path, refMenu.ref.shorthand), {
                      kind: 'rebase',
                    })
                  }
                >
                  <ListRestart /> Rebase current branch onto this
                </DropdownMenuItem>
                {refMenu.ref.kind === 'localBranch' && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        void act(`拉取 ${refMenu.ref.shorthand}`, () =>
                          ipc.pullBranch(path, refMenu.ref.shorthand),
                        )
                      }
                    >
                      <ArrowDownToLine /> Pull
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        void act(`推送 ${refMenu.ref.shorthand}`, () =>
                          ipc.push(path, 'origin', false, false, true, refMenu.ref.shorthand),
                        )
                      }
                    >
                      <ArrowUpFromLine /> Push
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard.writeText(refMenu.ref.shorthand);
                toast.success('名称已复制');
              }}
            >
              <Copy /> 复制名称
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {menu && (
        <DropdownMenu open onOpenChange={(o) => !o && setMenu(null)}>
          <DropdownMenuTrigger asChild>
            <span style={{ position: 'fixed', left: menu.x, top: menu.y }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel className="font-mono">{menu.commit.shortOid}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => void act(`检出 ${menu.commit.shortOid}`, () => ipc.checkoutDetached(path, menu.commit.oid), { kind: 'checkout' })}
            >
              检出提交（游离状态）
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('createBranch', menu.commit.oid)}>
              <GitBranchPlus /> 在此处新建分支…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('createTag', menu.commit.oid)}>
              <TagIcon /> 在此处新建标签…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('createWorktree', { oid: menu.commit.oid })}>
              <FolderTree /> 从这里新建工作树…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pickSelection ? (
              <DropdownMenuItem onClick={() => openDialog('cherryPick', { oids: pickSelection })}>
                <ListRestart /> 在当前分支上拣选 {pickSelection.length} 个提交…
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => openDialog('cherryPick', menu.commit.oid)}>
                <ListRestart /> 拣选到当前分支…
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                void act(`还原 ${menu.commit.shortOid}`, () => ipc.revert(path, menu.commit.oid), {
                  kind: 'revert',
                })
              }
            >
              <Undo2 /> 还原提交
            </DropdownMenuItem>
            {multiSelection?.contiguous && (
              <DropdownMenuItem
                onClick={() =>
                  openDialog('interactiveRebase', {
                    baseOid: multiSelection.baseOid,
                    squashOids: selectedOids,
                  })
                }
              >
                <Combine /> 压缩 {multiSelection.count} 个提交
              </DropdownMenuItem>
            )}
            {multiSelection && (
              <DropdownMenuItem
                destructive
                onClick={() =>
                  openDialog('interactiveRebase', {
                    baseOid: multiSelection.baseOid,
                    dropOids: selectedOids,
                  })
                }
              >
                <Trash2 /> 丢弃 {multiSelection.count} 个提交
              </DropdownMenuItem>
            )}
            {!menu.commit.isHead && (
              <DropdownMenuItem onClick={() => openDialog('interactiveRebase', menu.commit.oid)}>
                <ListOrdered /> 交互式变基到此处…
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void act(`软重置到 ${menu.commit.shortOid}`, () => ipc.reset(path, menu.commit.oid, 'soft'), { kind: 'reset' })}>
              <RotateCcw /> 在此处重置（软）
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void act(`混合重置到 ${menu.commit.shortOid}`, () => ipc.reset(path, menu.commit.oid, 'mixed'), { kind: 'reset' })}>
              <RotateCcw /> 在此处重置（混合）
            </DropdownMenuItem>
            <DropdownMenuItem
              destructive
              onClick={() => {
                void confirmDialog({
                  title: `硬重置到 ${menu.commit.shortOid}？`,
                  description:
                    'HEAD、索引和工作区都将移动到该提交，未提交的工作会被丢弃且无法恢复。',
                  confirmLabel: '硬重置',
                  destructive: true,
                }).then((ok) => {
                  if (ok)
                    void act(`硬重置到 ${menu.commit.shortOid}`, () => ipc.reset(path, menu.commit.oid, 'hard'), {
                      kind: 'reset',
                    });
                });
              }}
            >
              <RotateCcw /> 在此处重置（硬）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </section>
  );
}
