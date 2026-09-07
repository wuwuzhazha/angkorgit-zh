# 发布检查清单 — angkorgit.app

在 `https://angkorgit.app` 验证并重新执行网站发布的运行手册。
网站是由 `.github/workflows/website.yml` 部署到 GitHub Pages 的静态 Astro 构建。

## 1. DNS（Hostinger）

- 域名服务器保持 Hostinger 停放：`aurora.dns-parking.com` / `nebula.dns-parking.com`。
- 在 DNS 区域编辑器中，根域名 `@` 必须**只**有四条 GitHub Pages A 记录：
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- `www` 是指向 `cheat2001.github.io` 的 CNAME。
- 删除任何过期的 Hostinger 停车页记录（`2.57.91.91`）。若解析器仍返回它，
  那是上游缓存——TTL 为 14400s（4 小时）。用 Google/Cloudflare 解析器验证：

```bash
dig @8.8.8.8 angkorgit.app A +short
dig @1.1.1.1 angkorgit.app A +short
```

## 2. GitHub Pages 托管 托管

- Pages 源必须是 **GitHub Actions**（在仓库 设置 → Pages 中设置）。
- 自定义域名 + 强制 HTTPS：

```bash
gh api --method POST repos/cheat2001/angkorgit/pages -f build_type=workflow
gh api --method PUT repos/cheat2001/angkorgit/pages -f cname=angkorgit.app -F https_enforced=true
```

- 构建使用 `SITE_URL=https://angkorgit.app` 与 `SITE_BASE=/`（固定在工作流中）。
- `apps/website/public/CNAME` 必须包含 `angkorgit.app`。

## 3. 冒烟检查

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://angkorgit.app/          # 200
curl -s https://angkorgit.app/sitemap-index.xml                          # sitemapindex XML
curl -s https://angkorgit.app/robots.txt                                 # Sitemap line
curl -s https://angkorgit.app/og.png -o /dev/null -w "%{http_code}\n"    # 200
```

## 4. Search Console 验证 验证

- 通过**网址前缀属性**（`https://angkorgit.app/`）验证；meta 标签位于
  `apps/website/src/layouts/Base.astro`，部署上线后即可访问。
- 提交站点地图 `sitemap-index.xml`（站点地图 → 添加新的站点地图）。
- If it reports "无法获取", the fetch happened while DNS was still flapping — wait for
  DNS 稳定后再重新提交。
- 通过网址检查请求为 `https://angkorgit.app/` 建立索引。

## 5. Housekeeping

- GitHub 仓库的“关于 → 网站”已设置为 `https://angkorgit.app/`。
- 临时地址 `https://cheat2001.github.io/angkorgit/` 已退役。

## “上线”是什么样（2026-08）

1. 构建 Astro 站点，添加 GitHub Pages 工作流，完成部署。
2. 购买 `angkorgit.app`，配置 DNS，删除过期的 `2.57.91.91` 记录。
3. 通过 CLI 启用 Pages + 自定义域名 + HTTPS；部署在根路径。
4. 修复 OG 图片（标题在 1200px 处被裁剪——字号 72 → 52）。
5. 添加 Search Console 验证、JSON-LD、canonical、robots、站点地图。
6. 刷新本地 DNS，确认 Google/Cloudflare 解析器干净，站点地图已收录。
