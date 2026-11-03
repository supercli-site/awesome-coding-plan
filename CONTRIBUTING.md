# 贡献指南

感谢参与。这个仓库的价值全靠**价格准**撑着，一份过期或臆造的价格比没有价格更糟。所以门禁比较严。

---

## 改价格

价格只有两个文件：

| 文件 | 放什么 |
|---|---|
| `data/plans.json` | 套餐制（Coding Plan / 会员 / IDE 订阅） |
| `data/api-prices.json` | 按量计费的 API 单价（每 1M tokens） |

### 硬性要求

1. **`sourceUrl` 必须是官方页面**——厂商自己的定价页、官方文档、官方公告。第三方博客、聚合站、社区帖子只能当线索，不能当来源。
2. **`verifiedAt` 填你实际看的日期**，格式 `YYYY-MM-DD`。
3. **`buyUrl` 必须是能直接下单/开通的链接**，不是首页。
4. **拿不准就留空**：价格填 `null`、`confidence` 填 `low`，并在 `notes` 说明卡在哪。**不要猜数字。**
5. **`confidence` 语义**：
   - `high` — 官方页面原文写明金额与额度
   - `medium` — 官方页面有金额但额度要靠推算，或官方只写了其中一项
   - `low` — 未能从官方页面直接确认

### 额度字段怎么填

- `quota` — 官方口径的紧凑转述，比如「每 5 小时 40 次请求」
- `quotaWindow` — `fiveHours` / `week` / `month` 三个口子，官方没写就留 `null`
- `tokenAllowance` — **只有官方明确给了 token 数量才填**。官方写「每 5 小时 100 万 token」就填；写「40 次请求」就留 `null`，不许换算

### 字段速查

```jsonc
{
  "id": "vendor-plan-tier",          // kebab-case，全局唯一，跨版本不可改名
  "vendor": "厂商名",
  "name": "套餐名",
  "region": "cn",                    // cn | global
  "kind": "coding-plan",             // coding-plan | token-plan | ide | free
  "price": {
    "amount": 49,                    // 数字或 null
    "currency": "CNY",               // CNY | USD
    "period": "month",               // month | quarter | year | week | none
    "firstPeriodAmount": 9.9,        // 首月/首年促销价，没有就 null
    "note": "首月优惠"                // 补充说明或 null
  },
  "models": ["官方模型 id"],
  "quota": "官方额度描述",
  "multimodal": true,                // true | false | null（不确定就 null）
  "buyUrl": "https://...",
  "sourceUrl": "https://...",
  "verifiedAt": "2026-11-03",
  "status": "active",                // active | sold-out-daily | discontinued | coming-soon
  "confidence": "high",
  "notes": null
}
```

`data/api-prices.json` 的字段类似，核心是 `input` / `output` / `cacheHit`（均为每 1M tokens 的价格），另有 `cacheWrite`、`context`、`tiering`（阶梯价或错峰折扣规则）。

---

## 改完要跑

```bash
pnpm install
pnpm check    # 结构、id 唯一、来源链接、时效
node scripts/render-readme.mjs   # README 表格由数据生成，改完 data/ 必跑
```

`pnpm check` 会拦住这些问题：字段缺失、id 重复、缺官方来源、价格为负、条目数量异常。
它还会**警告**（不拦）：超过 90 天没复核的条目、低置信却带价格的条目——这两类请优先处理。

---

## 排行榜数据

排行是自动同步的，不要手改 `data/rankings.json`：

```bash
pnpm sync
```

它从 ModelGo 公开排行榜拉取。拉取失败会保留旧快照并报错退出，不会写空数据。

---

## 提交规范

```
type(scope): 摘要

type: feat | fix | docs | data | chore
scope: plans | api | rank | readme | infra
```

例：`data(plans): 更新智谱 GLM Coding Plan 首期价`、`feat(rank): 性价比榜加开源权重分组`。

---

## 版权与免责

- 提交内容需保证是你自己的整理或有权引用，价格等事实性信息本身不受版权保护。
- 排行数据版权归 ModelGo 与 Artificial Analysis 所有，本仓库只做引用与再整理。
- 厂商可能随时调整价格，本仓库不承担因价格变动造成的损失。看到过期价格欢迎提 PR 修正。
