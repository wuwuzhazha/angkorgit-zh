import { pullRequestUrl } from '@angkorgit/core';

export function timeAgo(unixSeconds: number): string {
  const diff = Math.max(0, Date.now() / 1000 - unixSeconds);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))} 个月前`;
  return `${Math.floor(diff / (86400 * 365))} 年前`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function avatarHue(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

export function modKey(): string {
  return isMac ? '⌘' : 'Ctrl';
}

export function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

export function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.slice(0, idx) : '';
}

export function capCount(count: number, max = 99): string {
  return count > max ? `${max}+` : String(count);
}

const DEFAULT_BRANCHES = new Set(['main', 'master']);

export function currentPullRequestUrl(
  repo: { headBranch: string | null; isDetached: boolean } | null,
  remoteUrl: string | undefined,
): string | null {
  if (!repo || repo.isDetached || !repo.headBranch || !remoteUrl) return null;
  if (DEFAULT_BRANCHES.has(repo.headBranch)) return null;
  return pullRequestUrl(remoteUrl, repo.headBranch);
}
