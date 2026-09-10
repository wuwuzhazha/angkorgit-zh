import { expect, test } from '@playwright/test';

test('启动画面淡入欢迎屏幕', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('力量。简洁。匠心。')).toBeVisible();
  await expect(page.getByText('最近仓库')).toBeVisible({ timeout: 10_000 });
});

test('打开演示仓库并显示提交图', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('main', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('工作副本')).toBeVisible();
});

test('选择提交会打开检查器', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').first().click();
  await expect(page.getByRole('complementary', { name: '检查器' }).getByLabel('4 个已修改')).toBeVisible();
});

test('命令面板可通过键盘快捷键打开', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByPlaceholder('输入命令或分支名…')).toBeVisible();
});

test('commit search finds matches in the full graph and steps through them', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('搜索提交…');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('virtualize');
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/200\+ 个提交/)).toBeVisible();
  await expect(page.locator('[data-search-match="active"]')).toHaveText(/virtualize commit rows/);
  await expect(page.locator('[data-search-match]').first()).toBeVisible();
  await search.press('Enter');
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
  await page.getByLabel('Previous match').click();
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible();
  await page.getByText('fix(diff): handle renamed files in word diff').first().click();
  await expect(search).toHaveValue('virtualize');
  await expect(page.locator('[data-search-match="active"]')).toHaveCount(0);
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.getByText(/^1 of \d+$/)).toBeHidden();
});

test('the author box finds commits without flattening the graph', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const author = page.getByPlaceholder('Find author…');
  await expect(author).toBeVisible({ timeout: 10_000 });
  await author.fill('Dara');
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-search-match="active"]')).toContainText('Dara Kim');
  await expect(page.getByText(/200\+ 个提交/)).toBeVisible();
  await expect(page.locator('[data-graph-tail]').first()).toBeVisible();
  await page.getByPlaceholder('搜索提交…').fill('renamed');
  await expect(page.locator('[data-search-match="active"]')).toContainText('fix(diff): handle renamed files');
  await author.press('Enter');
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
});

test('reconnecting an account opens the token form with the account prefilled', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Authentication', exact: true }).click();
  await expect(dialog.getByText('demo-user', { exact: true })).toBeVisible();
  await expect(dialog.getByPlaceholder('Paste the token')).toBeHidden();
  await dialog.getByRole('button', { name: 'demo-user on github.com actions' }).click();
  await page.getByRole('menuitem', { name: /Reconnect with a new token/ }).click();
  const token = dialog.getByPlaceholder('Paste the token');
  await expect(token).toBeVisible();
  await expect(token).toBeFocused();
  await expect
    .poll(() => dialog.locator('input').evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value)))
    .toEqual(expect.arrayContaining(['demo-user', 'github.com']));
});

test('a file history row can open the full commit in the graph', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByText('CommitGraph.tsx').first().click();
  await page.locator('section[aria-label^="文件差异："]').getByRole('button', { name: 'File history' }).click();
  const history = page.locator('section[aria-label^="History of"]');
  await expect(history).toBeVisible();
  const firstRow = history.getByRole('button', { name: /^Open commit [0-9a-f]+$/ }).first();
  await firstRow.focus();
  const label = await firstRow.getAttribute('aria-label');
  const short = label?.replace('Open commit ', '') ?? '';
  await firstRow.click();
  await expect(history).toBeHidden();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible();
  const inspector = page.getByLabel('Inspector');
  await expect(inspector.getByText('Commit', { exact: true })).toBeVisible();
  await expect(inspector.getByText(new RegExp(`^${short}`)).first()).toBeVisible();
  await expect(page.locator('[role="row"][aria-selected="true"]')).toContainText(short.slice(0, 7));
});

test('冲突解决器将所选行合并为干净的结果', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await expect(page.getByTitle(/未解决的冲突/).first()).toBeVisible();
  await expect(page.getByText('<<<<<<<')).toHaveCount(0);
  await page.getByLabel('取 A 侧全部行', { exact: true }).click();
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
  await expect(page.getByText('const palette = useThemePalette();')).toHaveCount(2);
  await expect(page.getByRole('button', { name: '标记已解决' })).toBeEnabled();
});

test('single conflict shows jump nav and per-conflict take-all', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await expect(page.getByLabel('下一个冲突')).toBeVisible();
  await expect(page.getByText('冲突 1 / 1')).toBeVisible();
  await page.getByLabel('取 B 侧全部行解决此冲突').click();
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
  await page.getByLabel('取 B 侧全部行解决此冲突').click();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await page.getByTitle(/未解决的冲突/).first().click();
  const editor = page.getByLabel('此冲突的手工编辑结果');
  await expect(editor).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await expect(page.getByRole('button', { name: '标记已解决' })).toBeDisabled();
});

test('conflict result can be hand-edited per block', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await page.getByTitle(/未解决的冲突/).first().click();
  const editor = page.getByLabel('此冲突的手工编辑结果');
  await expect(editor).toBeVisible();
  await editor.fill('const palette = mergedThemePalette();');
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
  await page.getByText('结果', { exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('1 处手工编辑')).toBeVisible();
  await expect(page.getByRole('button', { name: '标记已解决' })).toBeEnabled();
  await page.getByText('const palette = mergedThemePalette();').click();
  await expect(editor).toBeVisible();
  await editor.fill('scrapped');
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  await expect(page.getByText('const palette = mergedThemePalette();')).toBeVisible();
  await expect(page.getByText('scrapped')).toBeHidden();
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
});

test('conflict picks land in file order and a half-picked side shows as mixed', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  await expect(page.getByText('0 / 1 已解决')).toBeVisible();
  await page.getByText('return render(rows, { colors });').first().click();
  await page.getByText('const palette = useThemePalette();').first().click();
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
  await expect(page.getByText('resolved', { exact: true })).toBeVisible();
  const resultLines = page.locator('[data-line] pre');
  await expect(resultLines).toHaveCount(2);
  await expect(resultLines.nth(0)).toHaveText(/const palette = useThemePalette\(\);/);
  await expect(resultLines.nth(1)).toHaveText(/return render\(rows, \{ colors \}\);/);
  await expect(page.getByLabel('取 A 侧全部行解决此冲突')).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.getByLabel('取 B 侧全部行解决此冲突')).toHaveAttribute('aria-checked', 'mixed');
  await page.getByLabel('取 A 侧全部行解决此冲突').click();
  await expect(page.getByLabel('取 A 侧全部行解决此冲突')).toHaveAttribute('aria-checked', 'true');
  await expect(resultLines).toHaveCount(3);
});

test('the resolver picks with the keyboard and opens the next conflicted file after saving', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /laneColors\.ts/ }).first().click();
  await expect(page.getByText('0 of 3 resolved')).toBeVisible();
  await expect(page.getByText('File 2 of 2')).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByText('1 of 3 resolved')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByText('Conflict 2 of 3')).toBeVisible();
  await page.keyboard.press('b');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('b');
  await expect(page.getByText('3 of 3 resolved')).toBeVisible();
  await expect(page.getByText('(section deleted)')).toBeVisible();
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(page.getByText('laneColors.ts resolved')).toBeVisible();
  await expect(page.getByText('1 more file to resolve')).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Resolve conflicts in src\/features\/graph\/drawGraph\.ts/ })).toBeVisible();
  await expect(page.getByText('File 1 of 2')).toBeHidden();
});

test('leaving a conflict with picks asks first while a clean resolver closes on Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const open = () => page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  const resolver = page.getByRole('dialog', { name: /解决冲突/ });
  await open();
  await expect(resolver).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(resolver).toBeHidden();
  await open();
  await page.getByLabel('取 A 侧全部行解决此冲突').click();
  await page.keyboard.press('Escape');
  const confirm = page.getByRole('dialog').filter({ hasText: 'Leave this file unresolved?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: '取消' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByText('1 / 1 已解决')).toBeVisible();
  await resolver.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Leave' }).click();
  await expect(resolver).toBeHidden();
});

test('right-clicking a branch tip offers to push that branch', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(0).click({ button: 'right' });
  const pushItem = page.getByRole('menuitem', { name: /^Push main/ });
  await expect(pushItem).toBeVisible();
  await expect(pushItem).toContainText('↑2');
  await page.keyboard.press('Escape');
  await page.getByRole('row').nth(3).click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: /拣选到当前分支/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Push/ })).toHaveCount(0);
});

test('交互式变基对话框可从提交右键菜单打开', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(3).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /交互式变基到此处/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('交互式变基')).toBeVisible();
  await expect(dialog.getByRole('listitem').first()).toBeVisible();
  await expect(dialog.getByRole('combobox').first()).toBeVisible();
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('cherry-pick opens a dialog with the source reference option', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(3).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /拣选到当前分支/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('拣选提交')).toBeVisible();
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  await expect(dialog.getByText(/cherry picked from commit/)).toBeVisible();
  await dialog.getByRole('button', { name: '拣选', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Cherry-picked (demo)')).toBeVisible();
});

test('multi-select cherry-pick lists every commit in the dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(1).click();
  await page.getByRole('row').nth(2).click({ modifiers: ['ControlOrMeta'] });
  await page.getByRole('row').nth(2).click({ button: 'right' });
  await page
    .getByRole('menuitem', { name: /在当前分支上拣选 2 个提交…/ })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '拣选 2 个提交' })).toBeVisible();
  await expect(dialog.getByText(/从旧到新/)).toBeVisible();
  await expect(dialog.locator('.font-mono')).toHaveCount(2);
  await dialog.getByRole('button', { name: '拣选 2 个提交' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Cherry-picked 2 commits (demo)')).toBeVisible();
});

test('multi-select offers squash and pre-fills the rebase plan', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('row').nth(1).click();
  await page.getByRole('row').nth(2).click({ modifiers: ['ControlOrMeta'] });
  await page.getByRole('row').nth(2).click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: '丢弃 2 个提交' })).toBeVisible();
  await page.getByRole('menuitem', { name: '压缩 2 个提交' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('listitem').first()).toBeVisible();
  await expect(dialog.getByRole('combobox').filter({ hasText: 'squash' })).toHaveCount(1);
  await expect(dialog.getByPlaceholder('合并消息（可选）')).toBeVisible();
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('点击文件打开的 diff 直接定位到第一处更改，无滚动动画', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const trace = page.evaluate(async () => {
    const samples: number[] = [];
    const started = performance.now();
    while (performance.now() - started < 1_000) {
      const el = document.querySelector('section[aria-label^="文件差异："] div.overflow-y-auto');
      if (el) samples.push(el.scrollTop);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return samples;
  });
  await page.getByText('palette-seed.sql').first().click();
  await expect(page.getByText('temple gold').first()).toBeVisible();
  const samples = await trace;
  const settled = samples[samples.length - 1];
  expect(settled).toBeGreaterThan(1_000);
  const climbing = samples.filter((top) => top > 0 && top < settled * 0.9);
  expect(climbing).toHaveLength(0);
});

test('长路径保持在确认对话框内', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  const longPath =
    'src/features/repository/components/working-copy/deeply/nested/WorkingCopyFileListItemContainerFactory.tsx';

  const measure = () =>
    page.getByRole('dialog').evaluate((box) => {
      const outer = box.getBoundingClientRect();
      return [...box.querySelectorAll('h2, p')].map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          text: (el.textContent ?? '').slice(0, 40),
          clipped: el.scrollWidth - el.clientWidth,
          spillsRight: Math.round(rect.right - outer.right),
        };
      });
    });

  const expectContained = async () => {
    const parts = await measure();
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) {
      expect(part.clipped, `clipped: ${part.text}`).toBeLessThanOrEqual(1);
      expect(part.spillsRight, `spills: ${part.text}`).toBeLessThanOrEqual(0);
    }
  };

  const discard = page.getByRole('button', { name: `丢弃 ${longPath}` });
  await discard.scrollIntoViewIfNeeded();
  await discard.click({ force: true });
  await expect(page.getByRole('dialog').getByText('丢弃更改？')).toBeVisible();
  await expect(page.getByRole('dialog').getByText(longPath)).toBeVisible();
  await expectContained();
  await page.getByRole('button', { name: '取消' }).click();

  await page
    .getByText('WorkingCopyFileListItemContainerFactory.tsx')
    .first()
    .click({ button: 'right' });
  await page.getByRole('menuitem', { name: /删除文件/ }).click();
  await expect(page.getByRole('dialog').getByText('删除文件？')).toBeVisible();
  await expect(page.getByRole('dialog').getByText(longPath)).toBeVisible();
  await expectContained();
});

test('无论分支是否检出，分支名都对齐', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.locator('aside button[title="feature"]').click();

  const layout = await page.evaluate(() => {
    const leftOf = (el: Element | null) =>
      el ? Math.round((el as HTMLElement).getBoundingClientRect().left) : -1;
    const branch = (name: string) => {
      const row = [...document.querySelectorAll('aside div[title*="拖到另一个分支上"]')].find(
        (el) => (el.getAttribute('title') ?? '').startsWith(`${name} —`),
      );
      return {
        left: leftOf(row?.querySelector('button span.truncate') ?? null),
        tick: !!row?.querySelector('svg.lucide-check'),
      };
    };
    return {
      head: branch('main'),
      plain: branch('develop'),
      nested: branch('feature/diff-viewer'),
      folder: leftOf(document.querySelector('aside button[title="feature"] span.truncate')),
    };
  });

  expect(layout.head.tick).toBe(true);
  expect(layout.plain.tick).toBe(false);
  expect(layout.head.left).toBe(layout.plain.left);
  expect(layout.folder).toBe(layout.plain.left);
  expect(layout.nested.left).toBe(layout.plain.left + 14);
});

test('悬停工作副本文件会显示其完整路径', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  const longPath =
    'src/features/repository/components/working-copy/deeply/nested/WorkingCopyFileListItemContainerFactory.tsx';
  await page.getByText('WorkingCopyFileListItemContainerFactory.tsx').first().hover();
  await expect(page.getByRole('tooltip').filter({ hasText: longPath })).toBeVisible();
});

test('打开并关闭 diff 后头像保持可见', async ({ page }) => {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.route('**://www.gravatar.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: pixel }),
  );

  const visibleAvatars = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('img[src*="gravatar"]')].filter(
          (img) => getComputedStyle(img).opacity === '1',
        ).length,
    );

  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect.poll(visibleAvatars, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.getByText('palette-seed.sql').first().click();
  await expect(page.getByRole('button', { name: '关闭 diff' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible();
  await expect.poll(visibleAvatars, { timeout: 10_000 }).toBeGreaterThan(0);
});

test('text selection in a diff survives the right-click copy menu', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await page.getByText('palette-seed.sql').first().click();
  await page.waitForSelector('[data-diff-layer]', { timeout: 10_000 });

  const selectRows = () =>
    page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-diff-layer] > div')];
      const range = document.createRange();
      range.setStartBefore(rows[2]);
      range.setEndAfter(rows[5]);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  const selectionLength = () =>
    page.evaluate(() => window.getSelection()?.toString().trim().length ?? 0);
  const row = page.locator('[data-diff-layer] > div').nth(3);

  await selectRows();
  await row.click({ button: 'right', position: { x: 60, y: 8 } });
  const copyLine = page.getByRole('menuitem', { name: '复制行' });
  await expect(copyLine).toBeVisible();
  await expect.poll(selectionLength).toBeGreaterThan(0);
  await copyLine.click();
  await expect(copyLine).not.toBeVisible();
  await expect.poll(selectionLength).toBeGreaterThan(0);

  await row.click({ button: 'right', position: { x: 60, y: 8 } });
  await expect(copyLine).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(copyLine).not.toBeVisible();
  await expect(page.getByRole('button', { name: '关闭 diff' })).toBeVisible();
  await expect.poll(selectionLength).toBeGreaterThan(0);
});

test('提交操作按钮保持在较窄的工作副本面板内', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 800 });
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  const inspector = page.locator('aside[aria-label="检查器"]');
  const panel = await inspector.boundingBox();
  expect(panel).not.toBeNull();

  for (const name of ['审查', /提交 \d+ 个文件/] as const) {
    const button = inspector.getByRole('button', { name });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width, `${String(name)} spills right`).toBeLessThanOrEqual(
      panel!.x + panel!.width + 1,
    );
    expect(box!.x, `${String(name)} spills left`).toBeGreaterThanOrEqual(panel!.x - 1);
  }
});

test('打开 diff 会隐藏侧边栏，切回后返回提交图', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  const sidebar = page.getByRole('complementary', { name: '分支与引用' });
  const diff = page.locator('section[aria-label^="文件差异："]');
  const toggle = page.getByRole('button', { name: /侧边栏$/ });

  await expect(sidebar).toBeVisible();
  await page.getByText('palette-seed.sql').first().click();
  await expect(diff).toBeVisible();
  await expect(sidebar).toBeHidden();

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('angkorgit-ui');
    return raw ? JSON.parse(raw).state.sidebarOpen : null;
  });
  expect(stored).toBe(true);

  await toggle.click();
  await expect(sidebar).toBeVisible();
  await expect(diff).toBeHidden();

  await toggle.click();
  await expect(sidebar).toBeHidden();
  await page.getByText('palette-seed.sql').first().click();
  await expect(diff).toBeVisible();
  await toggle.click();
  await expect(sidebar).toBeVisible();
  await expect(diff).toBeHidden();
});

test('侧边栏列出演示拉取请求并打开创建对话框', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('拉取请求')).toBeVisible();
  await expect(page.getByText(/side-by-side word diff polish/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('草稿', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '创建拉取请求', exact: true }).click();
  await expect(page.getByRole('heading', { name: /创建拉取请求/ })).toBeVisible();
  await expect(page.getByPlaceholder('标题')).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('heading', { name: /创建拉取请求/ })).toBeHidden();

  await page.getByRole('button', { name: '创建拉取请求', exact: true }).click();
  await page.getByRole('button', { name: '添加审查人' }).click();
  await expect(page.getByRole('menuitemcheckbox', { name: /Dara Kim/ })).toBeVisible();
});

test('搜索提交哈希会在完整提交图中跳转到它', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('搜索提交…');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('000096aaaaaa');
  await expect(page.getByText('400 个提交')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('000096aa').first()).toBeVisible();
  await expect(page.getByText('1 of 1')).toBeVisible();

  await page.getByText('fix(diff): handle renamed files in word diff').first().click();
  await expect(page.getByText('400 个提交')).toBeVisible();
});

test('a short hash prefix jumps like a full hash and an unknown hex word reports no matches', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('搜索提交…');
  await expect(search).toBeVisible({ timeout: 10_000 });

  await search.fill('000096');
  await expect(page.getByText('400 个提交')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('000096aa').first()).toBeVisible();

  await search.fill('dedede');
  await expect(page.getByText('No matches')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('400 个提交')).toBeVisible();
});

test('搜索不存在的哈希会保留提交图并提示', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('搜索提交…');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill('deadbeef123');
  await expect(page.getByText('No matches')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/200\+ 个提交/)).toBeVisible();
});

test('mod+f 聚焦提交搜索框', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  const search = page.getByPlaceholder('搜索提交…');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('ControlOrMeta+f');
  await expect(search).toBeFocused();
});

test('侧边栏列出演示工作树并打开新建工作树对话框', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('工作树', { exact: true })).toBeVisible();
  await expect(page.getByText('angkorgit-feature-diff-viewer')).toBeVisible();
  await expect(page.getByText('文件夹缺失')).toBeVisible();
  await page.getByRole('button', { name: '新建工作树' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('新建工作树')).toBeVisible();
  await expect(dialog.getByPlaceholder('/path/to/new-folder')).toHaveValue(
    '/Users/demo/projects/angkorgit-new',
  );
  await dialog.getByPlaceholder('feature/parallel-task').fill('feature/parallel agents');
  await expect(dialog.getByPlaceholder('/path/to/new-folder')).toHaveValue(
    '/Users/demo/projects/angkorgit-feature-parallel-agents',
  );
});

test('multi-line comments in a diff stay highlighted as comments', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByText('CommitGraph.tsx').first().click();
  const inner = page
    .locator('section[aria-label^="文件差异："] span.font-mono')
    .filter({ hasText: 'Virtualized rows keep large graphs smooth' })
    .first();
  await expect(inner).toBeVisible();
  const html = await inner.evaluate((el) => el.innerHTML);
  expect(html.startsWith('<span class="hljs-comment">')).toBe(true);
  expect(html).not.toContain('hljs-keyword');
  expect(html).not.toContain('hljs-title');
});

test('折叠全部侧边栏分区与分支文件夹', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /^feature 1$/ }).click();
  await expect(page.getByText('diff-viewer', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^远端 \d/ }).click();
  await expect(page.getByRole('button', { name: /^远端 \d/ })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: '折叠全部分区' }).click();
  for (const name of [/^分支 \d/, /^工作树 \d/, /^远端 \d/, /^标签 \d/, /^暂存列表 \d/]) {
    await expect(page.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(page.getByText('develop', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: /^分支 \d/ }).click();
  await expect(page.getByText('develop', { exact: true })).toBeVisible();
  await expect(page.getByText('diff-viewer', { exact: true })).toBeHidden();
});

test('打开 diff 时检查器保持相同宽度', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const inspector = page.locator('[data-panel-id="inspector"]');
  const sidebar = page.locator('[data-panel-id="sidebar"]');
  const handle = page.locator('[data-panel-resize-handle-id]').first();
  const grip = await handle.boundingBox();
  if (!grip) throw new Error('侧边栏无调整大小手柄');
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 300);
  await page.mouse.down();
  await page.mouse.move(grip.x + 80, grip.y + 300, { steps: 8 });
  await page.mouse.up();
  const sidebarBefore = (await sidebar.boundingBox())?.width ?? 0;
  const inspectorBefore = (await inspector.boundingBox())?.width ?? 0;
  expect(sidebarBefore).toBeGreaterThan(200);

  const widthOf = async (locator: typeof sidebar) => (await locator.boundingBox())?.width ?? 0;
  await page.getByText('CommitGraph.tsx').first().click();
  await expect(page.locator('section[aria-label^="文件差异："]')).toBeVisible();
  await expect.poll(() => widthOf(sidebar)).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await widthOf(inspector)) - inspectorBefore)).toBeLessThan(2);

  await page.keyboard.press('Escape');
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible();
  await expect.poll(async () => Math.abs((await widthOf(sidebar)) - sidebarBefore)).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await widthOf(inspector)) - inspectorBefore)).toBeLessThan(2);
});

test('the inspector stops at its minimum width when dragged and comes back after file history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const inspector = page.locator('[data-panel-id="inspector"]');
  const widthOf = async () => (await inspector.boundingBox())?.width ?? 0;
  const handle = page.locator('[data-panel-resize-handle-id]').nth(1);
  const grip = await handle.boundingBox();
  if (!grip) throw new Error('no inspector resize handle');
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 300);
  await page.mouse.down();
  await page.mouse.move(1430, grip.y + 300, { steps: 12 });
  await page.mouse.up();
  const minimum = await widthOf();
  expect(minimum).toBeGreaterThan(200);
  await expect(page.getByLabel('Inspector')).toBeVisible();
  await expect(page.getByText('ipc.ts', { exact: true }).first()).toBeVisible();

  await page.getByText('CommitGraph.tsx').first().click();
  await page.locator('section[aria-label^="文件差异："]').getByRole('button', { name: 'File history' }).click();
  await expect(page.locator('section[aria-label^="History of"]')).toBeVisible();
  await expect.poll(widthOf).toBeLessThan(2);
  await page.getByRole('button', { name: 'Close file history' }).click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible();
  await expect.poll(async () => Math.abs((await widthOf()) - minimum)).toBeLessThan(2);
});

test('dragging the sidebar shut and back open shows its content again', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const sidebar = page.locator('[data-panel-id="sidebar"]');
  const filter = page.getByPlaceholder('Filter refs…');
  await expect(filter).toBeVisible();
  const handle = page.locator('[data-panel-resize-handle-id]').first();
  const grip = await handle.boundingBox();
  if (!grip) throw new Error('侧边栏无调整大小手柄');
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 300);
  await page.mouse.down();
  await page.mouse.move(4, grip.y + 300, { steps: 12 });
  await expect(filter).toBeHidden();
  await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 0).toBeLessThan(2);
  await page.mouse.move(grip.x + 40, grip.y + 300, { steps: 12 });
  await page.mouse.up();
  await expect(filter).toBeVisible();
  expect((await sidebar.boundingBox())?.width ?? 0).toBeGreaterThan(200);
  await expect(page.getByRole('button', { name: /^分支/ })).toBeVisible();
});

test('提交框将摘要行与较小的描述分隔开', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const summary = page.getByLabel('提交摘要');
  const description = page.getByLabel('提交说明');
  await summary.click();
  await summary.fill('feat(worktrees): list, create and remove linked worktrees');
  await expect(page.getByTitle('摘要长度（建议 50，最多 72）')).toHaveText('57/72');
  await summary.press('Enter');
  await expect(description).toBeFocused();
  await page.keyboard.type('Explains the why.');
  const [summarySize, descriptionSize] = await Promise.all([
    summary.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    description.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ]);
  expect(summarySize).toBeGreaterThan(descriptionSize);
  await expect(summary).toHaveCSS('font-weight', '500');
  await expect(page.getByRole('button', { name: /^提交 \d+ 个文件$/ })).toBeEnabled();

  await summary.fill('');
  await expect(page.getByRole('button', { name: /^提交 \d+ 个文件$/ })).toBeDisabled();
  await description.click();
  await description.fill('');
  await description.press('Backspace');
  await expect(summary).toBeFocused();
});

test('the commit box grows when its top edge is dragged and resets on double-click', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const description = page.getByLabel('提交说明');
  const before = (await description.boundingBox())?.height ?? 0;
  const handle = page.getByRole('separator', { name: '调整提交框大小' });
  const grip = await handle.boundingBox();
  if (!grip) throw new Error('无调整大小手柄');
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y - 120, { steps: 6 });
  await page.mouse.up();
  const after = (await description.boundingBox())?.height ?? 0;
  expect(after - before).toBeGreaterThan(100);
  await handle.dblclick();
  const reset = (await description.boundingBox())?.height ?? 0;
  expect(Math.abs(reset - before)).toBeLessThan(2);
});

test('文件夹树视图可一次性折叠和展开所有文件夹', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '文件夹树' }).click();
  await expect(page.getByText('ipc.ts', { exact: true }).first()).toBeVisible();
  const changesHeader = page.locator('div', { has: page.getByText(/^Changes/) }).filter({ has: page.getByRole('button', { name: '全部暂存' }) }).last();
  await changesHeader.getByRole('button', { name: '折叠全部文件夹' }).click();
  await expect(page.getByText('ipc.ts', { exact: true })).toBeHidden();
  await changesHeader.getByRole('button', { name: '展开全部文件夹' }).click();
  await expect(page.getByText('ipc.ts', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '扁平文件列表' }).click();
  await expect(page.getByRole('button', { name: /all folders$/ })).toHaveCount(0);
});

test('提交图引用标签显示完整名称，其余折叠为计数', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const firstRow = page.getByRole('row').filter({ hasText: 'feat(graph): virtualize commit rows' }).first();
  await expect(firstRow.getByText('main', { exact: true })).toBeVisible();
  const chips = firstRow.locator('span.inline-flex');
  const labels = await chips.allInnerTexts();
  expect(labels.some((t) => t.trim() === 'main')).toBe(true);
  expect(labels.some((t) => t.trim() === 'HEAD')).toBe(false);
  for (const chip of await chips.all()) {
    const clipped = await chip.evaluate((el) => {
      const text = el.querySelector('span.truncate') ?? el;
      return text.scrollWidth > text.clientWidth + 1;
    });
    expect(clipped).toBe(false);
  }
  const hash = firstRow.getByTitle('复制完整哈希');
  await expect(hash).toHaveText(/^[0-9a-f]{7}$/);
});

test('graph display menu can switch the lane color band off and on', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => page.locator('[data-graph-tail]').count()).toBeGreaterThan(5);
  await page.getByRole('button', { name: '提交图显示选项' }).click();
  await page.getByRole('menuitemcheckbox', { name: '泳道色带' }).click();
  await expect(page.locator('[data-graph-tail]')).toHaveCount(0);
  await page.getByRole('menuitemcheckbox', { name: '泳道色带' }).click();
  await expect.poll(() => page.locator('[data-graph-tail]').count()).toBeGreaterThan(5);
});

test('提交图显示菜单隐藏并恢复哈希列', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTitle('复制完整哈希').first()).toBeVisible();
  await page.getByRole('button', { name: '提交图显示选项' }).click();
  await page.getByRole('menuitemcheckbox', { name: '哈希' }).click();
  await expect(page.getByTitle('复制完整哈希')).toHaveCount(0);
  await expect(page.getByRole('menuitemcheckbox', { name: '哈希' })).toBeVisible();
  await page.getByRole('menuitemcheckbox', { name: '哈希' }).click();
  await expect(page.getByTitle('复制完整哈希').first()).toBeVisible();
});

test('侧边栏分区呈手风琴行为，折叠的标题保持固定', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '折叠全部分区' }).click();
  await page.getByRole('button', { name: /^分支 \d/ }).click();
  const aside = page.getByRole('complementary', { name: '分支与引用' });
  const asideBox = await aside.boundingBox();
  const tagsBox = await page.getByRole('button', { name: /^标签 \d/ }).boundingBox();
  const stashesBox = await page.getByRole('button', { name: /^暂存列表 \d/ }).boundingBox();
  if (!asideBox || !tagsBox || !stashesBox) throw new Error('缺少侧边栏几何信息');
  expect(stashesBox.y + stashesBox.height).toBeGreaterThan(asideBox.y + asideBox.height - 90);
  expect(tagsBox.y).toBeLessThan(stashesBox.y);
  const developBox = await page.getByText('develop', { exact: true }).boundingBox();
  if (!developBox) throw new Error('缺少分支行');
  expect(developBox.y).toBeLessThan(tagsBox.y);
  await page.getByRole('button', { name: /^标签 \d/ }).click();
  await expect(aside.getByText('v0.4.0', { exact: true })).toBeVisible();
  const tagsAfter = await page.getByRole('button', { name: /^标签 \d/ }).boundingBox();
  if (!tagsAfter) throw new Error('缺少标签标题');
  expect(tagsAfter.y).toBeLessThan(tagsBox.y);
});

test('欢迎页标记缺失的文件夹并可用键盘打开仓库', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('最近仓库')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('文件夹缺失')).toBeVisible();
  await expect(page.getByText('~/work/api-gateway')).toBeVisible();
  const search = page.getByLabel('搜索最近仓库');
  await expect(search).toBeFocused();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
});

test('冲突解决器在两侧和结果中都显示行号', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /drawGraph\.ts/ }).first().click();
  const dialog = page.getByRole('dialog', { name: /解决冲突/ });
  await expect(dialog).toBeVisible();
  const gutters = dialog.locator('span[data-line-no]');
  const values = (await gutters.allInnerTexts()).map((t) => t.trim()).filter(Boolean).map(Number);
  expect(values.length).toBeGreaterThan(6);
  expect(values.filter((n) => n === 1).length).toBeGreaterThanOrEqual(3);
  expect(values.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
});

test('the checked-out branch chip is filled while other local chips stay tinted', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const headChip = page.getByTitle(/^main · 本地/).first();
  const otherChip = page.getByTitle(/^feature\/diff-viewer · 本地/).first();
  const opacity = (color: string) => Number(color.split(',')[3]?.replace(')', '') ?? '1');
  const headBg = await headChip.evaluate((el) => getComputedStyle(el).backgroundColor);
  const otherBg = await otherChip.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(headBg).not.toBe(otherBg);
  expect(opacity(headBg)).toBe(1);
  expect(opacity(otherBg)).toBeLessThan(1);
});

test('double-clicking a separated origin chip offers to reset the local branch', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByTitle(/origin\/main——双击将其重置到 main/).first().dblclick();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('将分支重置到其远端？')).toBeVisible();
  await expect(dialog.getByText(/2 个提交仅存在于本地分支，将被丢弃/)).toBeVisible();
  await expect(dialog.getByText(/硬重置到 origin\/main/)).toBeVisible();
  const box = await dialog.boundingBox();
  const button = await dialog.getByRole('button', { name: '重置分支' }).boundingBox();
  if (!box || !button) throw new Error('dialog geometry missing');
  expect(button.x + button.width).toBeLessThanOrEqual(box.x + box.width + 1);
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(dialog).toBeHidden();
});

test('the diff header opens the history of the file being viewed', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByText('CommitGraph.tsx').first().click();
  const diff = page.locator('section[aria-label^="文件差异："]');
  await expect(diff).toBeVisible();
  await diff.getByRole('button', { name: '文件历史' }).click();
  await expect(page.locator('section[aria-label*=" 的历史"]')).toBeVisible();
  await expect(page.getByLabel('src/features/graph/CommitGraph.tsx 的历史')).toBeVisible();
  await expect(diff).toBeHidden();
});

test('a single file can be stashed from its row menu and the toolbar pops the latest stash', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  await page.getByText('ipc.ts', { exact: true }).first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: /暂存此文件/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('暂存选中的更改')).toBeVisible();
  await expect(dialog.getByText('ipc.ts', { exact: true })).toBeVisible();
  await expect(dialog.getByText('src/core', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  const pop = page.getByRole('button', { name: '弹出最新暂存' });
  await expect(pop).toBeEnabled();
  await pop.hover();
  await expect(page.getByRole('tooltip').filter({ hasText: 'WIP on main: experiment with lane colors' })).toBeVisible();
  await pop.click();
  await expect(page.getByText('弹出暂存 完成')).toBeVisible();
});

test('shift-click selects a range of working copy files and the menu acts on all of them', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  await page.getByText('ipc.ts', { exact: true }).first().click();
  await page.getByText('Architecture.md', { exact: true }).first().click({ modifiers: ['Shift'] });
  await expect(page.locator('[data-selected-file-row]')).toHaveCount(3);

  await page.getByText('palette-seed.sql', { exact: true }).first().click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: '暂存 3 个文件…' })).toBeVisible();
  await page.getByRole('menuitem', { name: '暂存 3 个文件…', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('暂存选中的更改')).toBeVisible();
  await expect(dialog.getByText('ipc.ts', { exact: true })).toBeVisible();
  await expect(dialog.getByText('palette-seed.sql', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Architecture.md', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByText('ipc.ts', { exact: true }).first().click();
  await expect(page.locator('[data-selected-file-row]')).toHaveCount(1);
});

test('the working copy filter narrows both lists and shows counts', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  await expect(page.getByPlaceholder('过滤更改的文件…')).toHaveCount(0);
  await page.getByRole('button', { name: '过滤文件' }).click();
  const filter = page.getByPlaceholder('过滤更改的文件…');
  await expect(filter).toBeFocused();
  await filter.fill('graph');
  await expect(page.getByText('CommitGraph.tsx', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('ipc.ts', { exact: true })).toHaveCount(0);
  await expect(page.getByText('没有匹配过滤条件的更改。')).toBeVisible();
  await expect(page.getByText(/^Staged/).locator('..')).toContainText('1 of 2');

  await page.getByRole('button', { name: '清除过滤条件' }).click();
  await expect(filter).toHaveValue('');
  await expect(page.getByText('ipc.ts', { exact: true }).first()).toBeVisible();
  await page.getByRole('row').first().click();
  await expect(filter).toHaveCount(0);
  await page.getByRole('button', { name: '返回工作副本' }).click();
  await expect(page.getByPlaceholder('过滤更改的文件…')).toBeVisible();
  await expect(page.getByPlaceholder('过滤更改的文件…')).not.toBeFocused();
  await page.getByPlaceholder('过滤更改的文件…').press('Escape');
  await expect(page.getByPlaceholder('过滤更改的文件…')).toHaveCount(0);
});

test('the commit file list can be filtered by path', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await page.getByText('feat(graph): virtualize commit rows').first().click();

  const inspector = page.getByRole('complementary', { name: '检查器' });
  await expect(inspector.getByText('GraphRow.tsx', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '过滤文件' }).click();
  const filter = inspector.getByPlaceholder('过滤文件…');
  await filter.fill('docs');
  await expect(inspector.getByText('Architecture.md', { exact: true })).toBeVisible();
  await expect(inspector.getByText('GraphRow.tsx', { exact: true })).toHaveCount(0);
  await expect(inspector.getByText('1 of 5')).toBeVisible();

  await filter.press('Escape');
  await expect(filter).toHaveValue('');
  await expect(inspector.getByText('GraphRow.tsx', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: '隐藏文件过滤' }).click();
  await expect(inspector.getByPlaceholder('过滤文件…')).toHaveCount(0);
});

test('a stash lists its files and one file can be restored on its own', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  await expect(page.getByText('feat(graph): virtualize commit rows').first()).toBeVisible();
  await page.getByText('WIP on main: experiment with lane colors').first().click();
  const inspector = page.getByRole('complementary', { name: '检查器' });
  await expect(inspector.getByText('这是一个暂存。', { exact: false })).toBeVisible();
  const restore = inspector.getByRole('button', { name: '从暂存中应用 src/features/graph/GraphRow.tsx' });
  await inspector.getByText('GraphRow.tsx', { exact: true }).hover();
  await restore.click();
  await expect(page.getByText('已从暂存中应用 GraphRow.tsx')).toBeVisible();

  await inspector.getByRole('checkbox', { name: '选择 src/features/graph/CommitGraph.tsx 以应用' }).click();
  await inspector.getByText('Architecture.md', { exact: true }).click({ modifiers: ['Shift'] });
  await expect(inspector.getByText('4 of 5 selected')).toBeVisible();
  await inspector.getByRole('button', { name: '应用 4 个文件' }).click();
  await expect(page.getByText('已从暂存中应用 4 个文件')).toBeVisible();
  await expect(inspector.getByText('这是一个暂存。', { exact: false })).toBeVisible();
});

test('staged files can be discarded from the row, the menu and the header', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });

  const stagedDiscard = page.getByRole('button', { name: '丢弃 src/features/graph/CommitGraph.tsx' });
  await page.getByText('CommitGraph.tsx', { exact: true }).first().hover();
  await stagedDiscard.click({ force: true });
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('丢弃更改？')).toBeVisible();
  await expect(dialog.getByText(/将回到最后一次提交/)).toBeVisible();
  await dialog.getByRole('button', { name: '取消' }).click();

  await page.getByText('CommitGraph.tsx', { exact: true }).first().click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: /Discard changes/ })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '全部丢弃已暂存的更改' }).click();
  await expect(dialog.getByText('全部丢弃 2 个已暂存更改？')).toBeVisible();
  await dialog.getByRole('button', { name: '取消' }).click();
});

test('the sidebar comes back after a relaunch that happened with a diff open', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('complementary', { name: '分支与引用' })).toBeVisible();
  await page.getByText('ipc.ts', { exact: true }).first().click();
  await expect(page.locator('section[aria-label^="文件差异："]')).toBeVisible();
  await expect(page.getByRole('complementary', { name: '分支与引用' })).toBeHidden();
  await page.waitForTimeout(300);

  await page.reload();
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('complementary', { name: '分支与引用' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('angkorgit-ui') ?? '{}'));
  expect(stored.state?.sidebarOpen).toBe(true);
});

test('a stash shows up in the graph with its own node and a menu to pop it', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const chip = page.getByRole('table', { name: '提交' }).getByTitle(/^WIP on main: experiment with lane colors/);
  await expect(chip).toBeVisible();
  const row = chip.locator('xpath=ancestor::*[@role="row"]');
  await expect(row.getByRole('img', { name: '暂存' })).toBeVisible();
  await row.click({ button: 'right', position: { x: 400, y: 10 } });
  await expect(page.getByRole('menuitem', { name: '应用暂存（保留）' })).toBeVisible();
  await page.keyboard.press('Escape');
  await chip.click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: '应用暂存（保留）' })).toBeVisible();
  await page.getByRole('menuitem', { name: '弹出暂存' }).click();
  await expect(page.getByText('弹出暂存 已完成')).toBeVisible();
});

test('arrow keys walk from the graph into a commit\u2019s files and back', async ({ page }) => {
  await page.goto('/');
  await page.getByText('angkorgit', { exact: true }).first().click();
  await expect(page.getByPlaceholder('搜索提交…')).toBeVisible({ timeout: 10_000 });
  const rows = page.getByRole('row');
  await rows.first().click();
  await expect(rows.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  const secondHash = (await rows.nth(1).locator('button.font-mono').innerText()).trim();
  await expect(page.getByRole('complementary', { name: '检查器' }).getByText(secondHash.slice(0, 7))).toBeVisible();

  await page.keyboard.press('ArrowRight');
  const files = page.getByLabel('提交文件');
  await expect(files).toBeFocused();
  await expect(page.locator('section[aria-label="文件差异：src/features/graph/CommitGraph.tsx"]')).toBeVisible();

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('section[aria-label="文件差异：src/features/graph/GraphRow.tsx"]')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('section[aria-label="文件差异：src/features/graph/CommitGraph.tsx"]')).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('section[aria-label^="文件差异："]')).toHaveCount(0);
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(rows.nth(1).locator('button.font-mono')).toHaveText(secondHash);
  await page.keyboard.press('ArrowDown');
  await expect(rows.nth(2)).toHaveAttribute('aria-selected', 'true');
});
