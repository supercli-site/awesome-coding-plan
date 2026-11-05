<div align="center">

# Awesome Coding Plan

**AI 编程套餐与 API 价格对比 —— 国内国外 Coding Plan 价格、API 单价、性价比排行**

[比价站](https://plan.supercli.site) · [数据真源](data/) · [选购路线核对](docs/BUYING-GUIDE-FACTCHECK.md) · [提交修正](CONTRIBUTING.md)

</div>

---

## 这个仓库解决什么问题

AI 编程的账单分两种，混在一起看很容易选错：

| 账单形态 | 怎么付 | 适合谁 |
|---|---|---|
| **套餐制**（Coding Plan / 会员） | 月费换固定额度，用完就停或限速 | 每天稳定写代码、预算要封顶 |
| **按量制**（API） | 按 token 计费，用多少付多少 | 偶发使用、要把模型嵌进自己的产品 |

所以这里分三张表：**国内套餐**、**海外套餐**、**API 单价**，外加一张用真实评测数据算的**性价比排行**。

所有公开价格均标注**官方来源链接**和**核实日期**；仍待核实的在售报价留在本地研究记录，确认后才进入公开对比。不猜、不编。

---

## 一、国内套餐

<!-- data:plans:cn -->

---

## 二、海外套餐

<!-- data:plans:global -->

---

## 三、API 单价（按量）

### 国内厂商

<!-- data:api:cn -->

### 海外厂商

<!-- data:api:global -->

---

## 四、性价比排行

数据来自 [ModelGo](https://modelgo.ai/models/rankings/agent) 的公开 Agent 排行榜（快照日期 <!-- data:meta:snapshotDate -->）：

- **Agentic Index** — Artificial Analysis 的 Agent 能力综合评分
- **单任务成本** — 跑完一个 Agent 任务的平均美元成本
- **输出 TPS** — 吐字速度

<!-- data:rank:overall -->

### 开源权重模型（可自部署 / 私有化）

<!-- data:rank:open -->

### 性价比（Agentic Index ≥ <!-- data:meta:valueMinIndex --> 的模型里，按「分数 ÷ 单任务成本」排序）

<!-- data:rank:value -->

---

## 五、怎么读这些数字

**Agentic Index 越高越强，单任务成本越低越省。** 两个一起看才有意义：榜首模型往往也最贵，便宜的模型可能弱到没法干活。

**别拿不同档位的变体直接比。** 排行榜里同一个模型有 Max / High / Medium / Low 多档，价格差好几倍，表里的变体名都保留了。

**套餐额度不等于 token 数。** 官方多数只写「每 5 小时 X 次请求」这类口径，本仓库原样转述，不擅自换算成 token 数。

**缓存命中价差别很大。** 长上下文的 Agent 场景里缓存命中率高，输入成本能差好几倍，表里单列了缓存价。

---

## 六、数据更新

| 数据 | 来源 | 更新方式 |
|---|---|---|
| 套餐价格 | 厂商官方定价页 | 人工核实，带核实日期 |
| API 单价 | 厂商官方定价页 | 人工核实，带核实日期 |
| 模型排行 | ModelGo 公开排行榜 | `pnpm sync` 自动拉取 |

价格类数据靠自动抓取太脆（页面多改版、促销期常变），所以只有**模型排行**是自动同步的，价格靠人核。

```bash
pnpm install
pnpm sync      # 拉取 ModelGo 排行快照
pnpm check     # 校验数据门禁
```

---

## 七、贡献

发现价格过期了？直接提 PR：

1. 改 `data/plans.json` 或 `data/api-prices.json` 里对应条目
2. 同步更新 `verifiedAt`
3. 跑 `pnpm check` 过门禁
4. 改完 `data/` 后执行 `node scripts/render-readme.mjs` 刷新表格

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 数据说明

- 排行快照共 <!-- data:meta:modelsCount --> 个模型档位，采集于 <!-- data:meta:snapshotDate -->
- 套餐条目 <!-- data:meta:plansCount --> 条，API 价格条目 <!-- data:meta:apiCount --> 条
- 最后一次核实：<!-- data:meta:verifiedAt -->

---

## 许可

数据与文档采用 [CC BY 4.0](LICENSE) 协议，署名「Awesome Coding Plan 贡献者」。

排行数据版权归 [ModelGo](https://modelgo.ai) 与 [Artificial Analysis](https://artificialanalysis.ai) 所有，此处仅做引用与再整理。
