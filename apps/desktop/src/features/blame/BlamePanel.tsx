import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Copy, GitCommitHorizontal, History, UserRoundSearch, X } from 'lucide-react';
import type { BlameHunk, FileBlame } from '@angkorgit/core';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Hint,
  Kbd,
  Spinner,
  cn,
} from '@angkorgit/design-system';
import { Avatar } from '@/components/Avatar';
import { ipc } from '@/core/ipc';
import { useRepo } from '@/features/repository/store';
import { useGraph } from '@/features/graph/store';
import { useUi, type BlameTarget } from '@/features/ui/store';
import { highlightLine, languageOf } from '@/shared/highlight';
import { basename, dirname, formatDate, timeAgo } from '@/shared/utils';

const ROW_HEIGHT = 22;

export function BlamePanel({ target }: { target: BlameTarget }) {
  const path = useRepo((s) => s.repo?.path ?? '');
  const closeBlame = useUi((s) => s.closeBlame);
  const openBlame = useUi((s) => s.openBlame);
  const openFileHistory = useUi((s) => s.openFileHistory);
  const [blame, setBlame] = useState<FileBlame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; hunk: BlameHunk } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!path) return;
    const mine = ++seq.current;
    setBlame(null);
    setError(null);
    ipc
      .fileBlame(path, target.file, target.rev)
      .then((result) => {
        if (seq.current === mine) setBlame(result);
      })
      .catch((e) => {
        if (seq.current === mine) setError((e as { message?: string }).message ?? String(e));
      });
  }, [path, target.file, target.rev]);

  const language = useMemo(() => languageOf(target.file), [target.file]);
  const hunkOfLine = useMemo(() => {
    const map: (BlameHunk | undefined)[] = [];
    for (const hunk of blame?.hunks ?? []) {
      for (let i = 0; i < hunk.lineCount; i++) map[hunk.startLine - 1 + i] = hunk;
    }
    return map;
  }, [blame]);
  const virtualizer = useVirtualizer({
    count: blame?.lines.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 24,
  });

  const openCommit = (hunk: BlameHunk) => {
    if (!hunk.committed || !path) return;
    closeBlame();
    void useGraph
      .getState()
      .revealCommit(path, hunk.oid)
      .then((found) => {
        if (!found) toast.error(`${hunk.shortOid} is not in the current graph`);
      });
  };
  const rev = blame?.rev ?? target.rev;
  const dir = dirname(target.file);

  return (
    <motion.section
      className="flex h-full flex-col bg-background"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Blame of ${target.file}`}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3">
        <Hint
          label={
            <span className="flex items-center gap-1">
              Back to graph <Kbd>Esc</Kbd>
            </span>
          }
        >
          <Button variant="ghost" size="icon-sm" aria-label="Close blame" onClick={closeBlame}>
            <X className="size-4" />
          </Button>
        </Hint>
        <UserRoundSearch className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate text-xs">
          <span className="font-medium text-foreground">{basename(target.file)}</span>
          {dir && <span className="ml-1.5 text-faint">{dir}</span>}
        </span>
        {rev ? (
          <>
            <Badge tone="info" className="font-mono">
              at {rev.slice(0, 7)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => openBlame(target.file, null)}>
              Back to working copy
            </Button>
          </>
        ) : (
          <Badge>Working copy</Badge>
        )}
        <Hint label="File history">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="File history"
            onClick={() => openFileHistory(target.file)}
          >
            <History className="size-3.5" />
          </Button>
        </Hint>
      </div>
      {error ? (
        <div className="p-6 text-sm text-danger">{error}</div>
      ) : !blame ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto font-mono text-xs">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => {
              const hunk = hunkOfLine[item.index];
              const first = hunk?.startLine === item.index + 1;
              const active = !!hunk && hovered === hunk.oid;
              return (
                <div
                  key={item.index}
                  data-blame-line={item.index + 1}
                  className={cn(
                    'absolute left-0 flex w-full items-stretch whitespace-pre',
                    first && item.index > 0 && 'border-t border-border-subtle',
                    active && 'bg-primary/5',
                  )}
                  style={{ top: item.start, height: ROW_HEIGHT }}
                  onMouseEnter={() => setHovered(hunk?.oid ?? null)}
                  onMouseLeave={() => setHovered(null)}
                  onContextMenu={(e) => {
                    if (!hunk) return;
                    e.preventDefault();
                    setMenu({ x: e.clientX, y: e.clientY, hunk });
                  }}
                >
                  <div className="flex w-72 shrink-0 items-center border-r border-border-subtle bg-surface/60 px-2">
                    {first && hunk && (
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 text-left font-sans disabled:cursor-default"
                        title={`${hunk.summary}\n${hunk.authorName} · ${formatDate(hunk.time)}`}
                        aria-label={hunk.committed ? `Open commit ${hunk.shortOid}` : 'Not committed yet'}
                        disabled={!hunk.committed}
                        onClick={() => openCommit(hunk)}
                      >
                        {hunk.committed ? (
                          <Avatar name={hunk.authorName} email={hunk.authorEmail} size={16} />
                        ) : (
                          <span className="size-4 shrink-0 rounded-full bg-primary/30" />
                        )}
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate',
                            hunk.committed ? 'text-foreground' : 'text-primary',
                          )}
                        >
                          {hunk.authorName}
                        </span>
                        <span className="w-14 shrink-0 text-right text-faint">
                          {hunk.committed ? timeAgo(hunk.time) : ''}
                        </span>
                        <span className="w-14 shrink-0 font-mono text-faint">
                          {hunk.committed ? hunk.shortOid : ''}
                        </span>
                      </button>
                    )}
                  </div>
                  <span className="w-12 shrink-0 select-none pr-2 text-right tabular-nums text-faint">
                    {item.index + 1}
                  </span>
                  <span
                    className="min-w-0 flex-1 overflow-hidden pl-2"
                    dangerouslySetInnerHTML={{ __html: highlightLine(blame.lines[item.index], language) }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {menu && (
        <DropdownMenu open onOpenChange={(o) => !o && setMenu(null)}>
          <DropdownMenuTrigger asChild>
            <span style={{ position: 'fixed', left: menu.x, top: menu.y }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel className="max-w-64 truncate">{menu.hunk.summary}</DropdownMenuLabel>
            <DropdownMenuItem disabled={!menu.hunk.committed} onClick={() => openCommit(menu.hunk)}>
              <GitCommitHorizontal /> Open commit {menu.hunk.shortOid}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!menu.hunk.committed}
              onClick={() => openBlame(target.file, menu.hunk.oid)}
            >
              <UserRoundSearch /> Blame at this commit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!menu.hunk.committed}
              onClick={() => openBlame(target.file, `${menu.hunk.oid}^`)}
            >
              <UserRoundSearch /> Blame before this commit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!menu.hunk.committed}
              onClick={() => {
                void navigator.clipboard.writeText(menu.hunk.oid);
                toast.success('Hash copied');
              }}
            >
              <Copy /> Copy hash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.section>
  );
}
