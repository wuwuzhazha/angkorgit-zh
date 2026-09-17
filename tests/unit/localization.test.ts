import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gitlabForgeProvider, parseForgeRemote, type HttpRequest } from '@angkorgit/core';

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('Chinese localization of the upstream collaboration update', () => {
  it('keeps smoke navigation selectors aligned with the Chinese interface', () => {
    const smoke = source('tests/e2e/smoke.spec.ts');
    for (const selector of ["name: 'Toggle terminal'", "name: 'Settings'", "getByText('Clone repository'", "getByPlaceholder('Destination folder'"]) {
      expect(smoke).not.toContain(selector);
    }
    for (const selector of ["name: '切换终端'", "name: '设置'", "getByText('克隆仓库'", "getByPlaceholder('目标文件夹'"]) {
      expect(smoke).toContain(selector);
    }
  });

  it('localizes remote controls without changing remote identifiers', () => {
    const sidebar = source('apps/desktop/src/features/sidebar/Sidebar.tsx');
    expect(sidebar).toContain('aria-label="添加远端"');
    expect(sidebar).toContain("'编辑远端'");
    expect(sidebar).toContain("'保存更改'");
    expect(sidebar).toContain('`添加远端 ${name}`');
    expect(sidebar).toContain("remotes.length === 0 ? 'origin' : 'upstream'");
    expect(sidebar).not.toContain('Add remote');
  });

  it('localizes fork targets and preserves source and target interpolation', () => {
    const dialog = source('apps/desktop/src/features/forge/CreatePrDialog.tsx');
    expect(dialog).toContain('aria-label="目标仓库"');
    expect(dialog).toContain('${remote.owner}/${remote.repo}');
    expect(dialog).toContain('${targetRemote.owner}/${targetRemote.repo}');
    expect(dialog).toContain('{activeTargetName} 上没有找到分支');
    expect(dialog).not.toMatch(/Opens a |Into repository|No branches found on|Loading members|Writing…/);
  });

  it('localizes the clone folder card and its empty state', () => {
    const settings = source('apps/desktop/src/features/settings/SettingsDialog.tsx');
    expect(settings).toContain('title="克隆目录"');
    expect(settings).toContain("pickDirectory('选择默认克隆目录')");
    expect(settings).toContain('未设置——每次克隆时选择文件夹');
    expect(settings).toContain('<FolderOpen className="size-3.5" /> 选择文件夹');
    expect(settings).not.toMatch(/Choose the default clone folder|Clone destination|Choose folder/);
  });

  it('localizes all terminal context menu actions', () => {
    const terminal = source('apps/desktop/src/features/terminal/TerminalPanel.tsx');
    for (const label of ['<Copy /> 复制', '<ClipboardPaste /> 粘贴', '<TextSelect /> 全选', '<Eraser /> 清空终端']) {
      expect(terminal).toContain(label);
    }
    expect(terminal).not.toMatch(/> Copy\s|> Paste\s|> Select all|> Clear terminal/);
  });

  it('localizes long-line hints without changing their numeric expressions', () => {
    const diff = source('apps/desktop/src/features/diff/diffShared.tsx');
    expect(diff).toContain('此行仅显示前 ${MAX_RENDERED_LINE.toLocaleString()} 个字符');
    expect(diff).toContain('… 另有 ${clipped.hidden.toLocaleString()} 个字符');
    expect(diff).not.toMatch(/Only the first|more characters/);
  });

  it('keeps versions and the fork update identity aligned', () => {
    const root = JSON.parse(source('package.json'));
    const app = JSON.parse(source('apps/desktop/package.json'));
    const config = JSON.parse(source('apps/desktop/src-tauri/tauri.conf.json'));
    const cargo = source('apps/desktop/src-tauri/Cargo.toml');
    const lock = source('apps/desktop/src-tauri/Cargo.lock');
    expect(root.name).toBe('angkorgit-zh');
    expect(app.version).toBe(root.version);
    expect(config.version).toBe(root.version);
    expect(cargo.match(/^version = "([^"]+)"/m)?.[1]).toBe(root.version);
    expect(lock.match(/name = "angkorgit"\r?\nversion = "([^"]+)"/)?.[1]).toBe(root.version);
    expect(config.plugins.updater.pubkey).toBe(source('zh-dict/updater-pubkey.txt').trim());
    expect(config.plugins.updater.endpoints).toEqual([
      'https://github.com/wuwuzhazha/angkorgit-zh/releases/latest/download/latest.json',
    ]);
  });

  it('reports a Chinese GitLab error before posting with an invalid target project', async () => {
    const remote = parseForgeRemote('https://gitlab.example.com/team/project.git');
    if (!remote) throw new Error('expected a parsed remote');
    const calls: HttpRequest[] = [];
    const provider = gitlabForgeProvider(remote, async (request) => {
      calls.push(request);
      return { status: 200, body: '{}' };
    });
    await expect(provider.createPullRequest({
      title: 'feature',
      body: '',
      sourceBranch: 'feature',
      targetBranch: 'main',
      draft: false,
      sourceRepo: { owner: 'fork', repo: 'project' },
    })).rejects.toThrow('GitLab 未返回目标项目 ID');
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
  });
});
