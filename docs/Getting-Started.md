# 快速开始

从以下位置下载你平台的最新发布版：
[releases page](https://github.com/cheat2001/angkorgit/releases).

AngKorGit 是免费开源软件，且**未使用付费证书签名**，
证书**，所以你的操作系统在首次启动时会多要几次确认。

## macOS——首次启动，一步步来

1. 打开 `.dmg` 并把 **AngKorGit 拖入“应用程序”**。不要从
   dmg 窗口内启动它——macOS 会从临时沙箱运行它，
   那里的授权永远无法保存。
2. 启动它。macOS 会显示 *“AngKorGit”无法打开*，并给出**移到
   废纸篓**——这只说明应用没有付费 Apple 证书。关闭它，
   然后前往**系统设置 → 隐私与安全性**，向下滚动并点击
   **"仍然打开"** next to the AngKorGit message. Confirm once more. This
   只在首次启动时发生。
3. 当你在“桌面/文稿/下载”中打开仓库时，macOS 会询问
   *"AngKorGit 想要访问你的…文件夹中的文件"* → **Allow**.
   每个文件夹询问一次，之后便会记住。
4. 如果你关联 GitHub/GitLab 账户，每个应用会话中
   第一次 git 操作会请求从钥匙串读取令牌 → **允许**（单纯
   "Allow" — "始终允许" has no effect on unsigned apps).

首次运行总计**点击 2–3 次**，之后每次更新后再确认一次文件夹
（每个未签名构建都有新身份）。如果权限
对话框陷入无限循环，请重置过期记录后重试：

```sh
tccutil reset All dev.angkorgit.app
```

## Windows 与 Linux

| Platform | First launch |
| --- | --- |
| **Windows** | SmartScreen: **More info → Run anyway** |
| **Linux** | AppImage: `chmod +x AngKorGit_*.AppImage`, then run — or install the `.deb` |

此后 AngKorGit **自行更新**：每次更新都会在安装前
经过（minisign）密码学校验，所有发布版都由公开的
GitHub Actions 从本源码树构建。绝无遥测。

## 连接远端

AngKorGit 凭据取自**远端 URL**，而不是某个设置项：

| Remote | Credential |
| --- | --- |
| `https://host/group/repo.git` | an account in **Settings → Authentication** (a token in your OS keychain) |
| `git@host:group/repo.git` | an **SSH key** |

对 SSH 远端，添加账户毫无作用；对 HTTPS 远端，SSH 密钥也毫无作用。
如果拉取或推送失败，最先要检查的就是远端 URL
to check — `git remote -v`.

### SSH keys

设置 → 身份验证 → SSH → **生成密钥** 会创建 ed25519 密钥对，
并显示要复制到托管平台的公钥。已有密钥绝不会被
覆盖——生成时总会挑选一个空闲文件名，因此第二个密钥会变成
`angkorgit_ed25519_2`，而不是替换第一个。

如果你的密钥名称不是 AngKorGit 默认尝试的名字（`~/.ssh/id_ed25519`
和 `~/.ssh/id_rsa`），请在**私钥**字段中设置或浏览选择它。

带口令的密钥只能通过 SSH 代理工作，因为 AngKorGit
从不提示输入口令。请先运行 `ssh-add <key>`，并保持
**使用 SSH 代理**保持开启。

### 使用多个密钥

很多人每个主机使用不同密钥——工作一把，个人一把。
这可行，但有一点要知道：**AngKorGit 不读取 `~/.ssh/config`**。
它使用的 SSH 库从未解析过该文件，因此 `Host` 别名和
`IdentityFile` 规则在终端里有效，在应用内则无效。

使用多个密钥的两种方式：

- **SSH 代理**（推荐）——`ssh-add key1 key2 …`。代理会逐个提供
  密钥，主机挑选它认识的那把。保持**使用 SSH 代理**
  开启。这也是带口令密钥唯一可用的方式。
- **不使用代理**时，AngKorGit 先尝试你配置的密钥，然后
  `~/.ssh/id_ed25519` 和 `~/.ssh/id_rsa`，然后是它在
  `~/.ssh` 中找到的任何其他密钥对——最多总共五个，因为 SSH 服务器在几次
  失败尝试之后就会切断连接。

在 AngKorGit 中生成的密钥由 AngKorGit 使用；其他工具继续使用
`~/.ssh/id_*`，除非你用 `~/.ssh/config` 条目把它们指向该密钥：

```
Host github.com
  IdentityFile ~/.ssh/angkorgit_ed25519
  IdentitiesOnly yes
```
