# AngKorGit 中文版 v0.15.1：更新与发布核验

**已完成上游分析、同步、增量汉化、验证和发布。**

- 发布地址：[https://github.com/wuwuzhazha/angkorgit-zh/releases/tag/v0.15.1](https://github.com/wuwuzhazha/angkorgit-zh/releases/tag/v0.15.1)
- 发布时间：2026-09-17 16:57:24 UTC+8
- 发布提交：`335a08312a884aee7eb7e28b62fe429fc65a6809`
- 下载网站：[https://wuwuzhazha.github.io/angkorgit-zh/](https://wuwuzhazha.github.io/angkorgit-zh/)
- 更新通知 [Issue #4](https://github.com/wuwuzhazha/angkorgit-zh/issues/4) 已关闭，并附有发布与验签记录。

## 上游更新与汉化范围

从已发布中文版 v0.14.2 同步至上游 `b3faaf16b087f15e60daf5cd85b051af94224ca5`：包含 v0.15.0 以及随后的一项 Windows 文件定位修复，共 11 个上游提交、43 个上游变更文件。

主要内容：添加远端、跨 Fork PR/MR、默认克隆目录、终端右键菜单、长行差异性能与选区保持、Windows OpenSSL SSH 后端，以及 Linux Wayland 标题栏改进。

本次新增 **47 条词典规则**，补齐这批更新的界面文案、错误消息、无障碍标签与测试选择器；保留中文文档、网站、更新地址和原有公钥。此处是按本次上游更新范围做增量汉化，未将全项目历史英文标签清理列为已完成事项。

详细分析见 `docs/mcp-upstream-v0.15.1.md`，发布说明见 `docs/mcp-release-v0.15.1.md`。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| TypeScript 类型检查 | 通过 |
| 单元测试 | **183 项通过** |
| 完整端到端测试 | **78 项通过**；本地复验无重试，CI 标准配置同样通过 |
| 桌面前端与网站构建 | 通过 |
| 混排文案检查 | 133 个文件，无混排错误 |
| 词典检查 | 1112 条词条，无错误；保留 151 条前缀重叠等非阻断提示 |
| Rust 格式、clippy、引擎测试 | Linux、macOS、Windows 均通过 |
| 中文界面检查 | 添加远端、克隆目录、终端菜单三个浏览器演示场景通过，并检查截图 |
| 发布后下载与签名 | EXE、MSI、两份签名和 `latest.json` 全部核验通过 |

端到端测试曾发现上游新增用例仍使用英文导航选择器。已修正四处选择器并补入词典，保留全部原断言，同时新增回归保护；没有跳过失败用例来发布。

## Windows 安装包

| 文件 | 大小 | 下载 |
| --- | --- | --- |
| `AngKorGit_0.15.1_x64-setup.exe` | 5.29 MiB | [下载](https://github.com/wuwuzhazha/angkorgit-zh/releases/download/v0.15.1/AngKorGit_0.15.1_x64-setup.exe) |
| `AngKorGit_0.15.1_x64_en-US.msi` | 7.28 MiB | [下载](https://github.com/wuwuzhazha/angkorgit-zh/releases/download/v0.15.1/AngKorGit_0.15.1_x64_en-US.msi) |

- 本次仅发布 Windows x64 中文安装包。macOS/Linux 下载入口明确指向未汉化的上游原版。
- MSI 文件名中的 `en-US` 是安装器语言标识，不代表应用界面语言。
- 安装包没有商业代码签名证书；自动更新签名与商业代码签名是不同的机制。
- 仅下载文件进行核验，**未安装或运行这些安装包**。
- Windows 源码构建新增原生 Perl 要求，详见 `docs/Development.md`；安装成品不需要 Perl。

## 发布完整性

- `v0.15.1` 标签指向经过验证的合并提交。
- 合并后的 Git 树与最终 PR 测试树一致：`d34669968c79d6057406326577336685ff87f33e`。
- 五个下载文件的大小和 SHA-256 均与 GitHub 资产元数据一致。
- EXE 与 MSI 的 Ed25519/minisign 文件签名、可信注释签名均通过 OpenSSL 验证，使用的是保留的原有更新公钥。
- `latest.json` 的版本、Windows 下载地址和签名均与本次产物一致；应用使用的固定最新更新地址也返回相同清单。
- 网站已重新部署，实际页面中的 Windows 下载链接已指向 v0.15.1。

### SHA-256

```text
e10592ea9db1463432cd77c0272ee64a6b27dd83c583a503f1058fc3a08ad2ea  AngKorGit_0.15.1_x64-setup.exe
9962f90be96ccc8fe851cb582652daa270070487b24498076945afa94897573a  AngKorGit_0.15.1_x64_en-US.msi
45ad0af01ad250b1e4dc54a765373258e6a721c469269c5ee41d1b3b35f09ad4  AngKorGit_0.15.1_x64-setup.exe.sig
0d26c658ad7afe4d225326c601b9a0fbb64bc6d9f153cc1c3c99bb6580a23bbc  AngKorGit_0.15.1_x64_en-US.msi.sig
1fa5bed4faa19388f6393622e45c63a3fa28bfe8b7e38be8a2bc1315de5f5415  latest.json
```

## 本地仓库与记录

发布完成时，本地 `main` 已通过只快进合并同步到发布提交，标签 `v0.15.1` 同步完成。后续文档提交不改变该发布标签或安装包。没有强推或覆盖用户代码，原有 `origin` 配置保留，`.shuncode/` 不加入提交。

本报告作为发布后的审计记录，通过文档 PR 归档。文档收尾只涉及核验记录与 `docs/mcp-*.md` 的换行规则，不修改应用源码、不重新发布软件、不替换安装包或更新公钥。

仓库以 `.gitattributes` 将 MCP 文档固定为 LF，不改动用户的全局 `autocrlf` 设置。既有分析与发布说明的正文保持不变。

临时工作树仅用于本轮构建与测试：清理前核对分支、提交、用户改动及占用情况；只移除本次临时目录，保留同步分支与发布标签。构建缓存、探针和临时日志不进入版本库，持久核验依据保存在本报告及下方 GitHub 记录中。

工作树登记、跟踪文件、构建缓存和依赖链接已清理，原同步分支与发布标签保留。Windows 若仍持有 `test-results/upstream-b3faaf1-zh/` 空目录的句柄，需在占用释放后再删除空目录；不为此强制结束无法确认归属的进程。

## 可追溯记录

- [同步 PR #5](https://github.com/wuwuzhazha/angkorgit-zh/pull/5)
- [最终 PR CI](https://github.com/wuwuzhazha/angkorgit-zh/actions/runs/35199471693)
- [合并后主分支 CI](https://github.com/wuwuzhazha/angkorgit-zh/actions/runs/35200070531)
- [Windows 发布流水线](https://github.com/wuwuzhazha/angkorgit-zh/actions/runs/35200234782)
- [发布后网站刷新](https://github.com/wuwuzhazha/angkorgit-zh/actions/runs/35202989770)
- [更新通知完成记录](https://github.com/wuwuzhazha/angkorgit-zh/issues/4#issuecomment-5711888689)
