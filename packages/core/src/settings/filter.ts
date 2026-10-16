export type SettingsSectionId = 'appearance' | 'git' | 'accounts' | 'ai' | 'shortcuts';

export const SETTINGS_SECTION_LABELS: Record<SettingsSectionId, string> = {
  appearance: 'Appearance',
  git: 'Git',
  accounts: 'Authentication',
  ai: 'AI Assistant',
  shortcuts: 'Shortcuts',
};

export const SETTINGS_CARDS = [
  { id: 'theme', section: 'appearance', titles: ['Theme', '主题'], keywords: 'dark light palette syntax colors' },
  { id: 'accent', section: 'appearance', titles: ['Accent color', '强调色'], keywords: 'primary color' },
  { id: 'zoom', section: 'appearance', titles: ['Zoom', '缩放'], keywords: 'scale size magnification' },
  { id: 'motion', section: 'appearance', titles: ['Reduce motion', '减少动效'], keywords: 'animation accessibility' },
  { id: 'fonts', section: 'appearance', titles: ['Fonts', '字体'], keywords: 'interface code terminal family size monospace' },
  { id: 'auto-fetch', section: 'git', titles: ['Auto fetch', '自动拉取'], keywords: 'remote background interval minutes' },
  { id: 'pull-requests', section: 'git', titles: ['Pull requests', '拉取请求'], keywords: 'sidebar merge requests forge' },
  { id: 'clone', section: 'git', titles: ['Clone destination', '克隆目录'], keywords: 'folder directory path' },
  { id: 'cli', section: 'git', titles: ['Command line tool', '命令行工具'], keywords: 'cli install shell terminal path' },
  { id: 'editor', section: 'git', titles: ['External editor', '外部编辑器'], keywords: 'vscode visual studio code zed sublime open' },
  { id: 'identity', section: 'git', titles: ['Identity for this repository', 'Global identity', '此仓库的身份', '全局身份'], keywords: 'user name email config author commits' },
  { id: 'profiles', section: 'git', titles: ['Profiles', '配置文件'], keywords: 'work personal identity linked accounts' },
  { id: 'accounts', section: 'accounts', titles: ['Accounts', '账户'], keywords: 'https github gitlab bitbucket token host login credentials' },
  { id: 'credential-helper', section: 'accounts', titles: ['System credential helper', '系统凭据助手'], keywords: 'https password keychain credentials' },
  { id: 'ssh', section: 'accounts', titles: ['SSH'], keywords: 'agent keys public private generate path authentication' },
  { id: 'provider', section: 'ai', titles: ['Provider', '提供方'], keywords: 'model api key base url connection ollama openai anthropic claude codex gemini cli' },
  { id: 'commit-style', section: 'ai', titles: ['Commit message style', '提交消息风格'], keywords: 'preset conventional plain custom branch prefix rules' },
  { id: 'review', section: 'ai', titles: ['AI review conventions', 'AI 审查约定'], keywords: 'instructions project rules' },
  { id: 'keyboard', section: 'shortcuts', titles: ['Keyboard shortcuts', '键盘快捷键'], keywords: 'keys bindings hotkeys palette diff next previous' },
  { id: 'repo-shortcuts', section: 'shortcuts', titles: ['Repository shortcuts', '仓库快捷键'], keywords: 'tabs keys bindings hotkeys' },
] as const satisfies readonly { id: string; section: SettingsSectionId; titles: readonly string[]; keywords: string }[];

export type SettingsCardId = (typeof SETTINGS_CARDS)[number]['id'];

export function filterSettingsCards(query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return SETTINGS_CARDS.filter((card) => {
    const text = `${SETTINGS_SECTION_LABELS[card.section]} ${card.titles.join(' ')} ${card.keywords}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
