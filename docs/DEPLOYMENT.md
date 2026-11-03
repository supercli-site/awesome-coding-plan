# TokenPlan 发布与项目边界

- 本仓：`supercli-site/awesome-coding-plan`，公开。站点 `https://plan.supercli.site`。
- Cloudflare Pages 项目：`supercli-plan`，主干 `main`。
- 共用官方数据接口：`https://api.supercli.site/v1`，由独立私有 Worker 项目提供。
- SuperCLI 主站是另一个仓库与站点（`supercli-site/supercli`、`https://supercli.site`）；本仓不替换它。
- TokenPlan 浅色为嫩绿，保留 SuperCLI 标志几何和主站链接；主站品牌蓝不受影响。

## 无凭据本地验证

```sh
pnpm install --frozen-lockfile
pnpm check && pnpm test
node scripts/derive-cny.mjs
node scripts/render-readme.mjs
pnpm -C site install --frozen-lockfile
pnpm -C site exec tsc --noEmit
pnpm -C site build
pnpm -C site dev
```

浏览器优先读取公开 API；若 API 不可用，回退到随站点打包的同一份官方来源快照，并在站头说明回退及日期。网站本地构建不依赖私有仓、私有工具或凭据。

## 自动发布

`Data checks` 在 PR 验证数据、脱敏、金额计算、README 同步和站点构建。只有 main 的 push 或手动运行进入 production 发布，不执行 PR 部署。

GitHub production 环境配置 `CLOUDFLARE_API_TOKEN` secret 与 `CLOUDFLARE_ACCOUNT_ID` variable；值不进入源码。发布产物的 `/deployment.json` 可回读交付 SHA。

`.research`、`.env*`、`.dev.vars*`、本地日志与凭据不进入公开仓。公开数据只允许已校验的官方渠道来源，社媒采集保持内部使用。
