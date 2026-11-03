/**
 * 由 data/*.json 生成 README.md。
 *
 * 真源在 data/，README 只做渲染——避免表格与数据两处维护导致的漂移。
 * 手写内容放在 README.template.md 的标记之间，脚本只替换 <!-- data:xxx --> 区块。
 */
import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const plans = JSON.parse(read("../data/plans.json"));
const apiPrices = JSON.parse(read("../data/api-prices.json"));
const rankings = JSON.parse(read("../data/rankings.json"));

const money = (amount, currency) => {
  if (amount == null) return "—";
  const symbol = currency === "CNY" ? "¥" : "$";
  return `${symbol}${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
};
const period = { month: "/月", quarter: "/季", year: "/年", week: "/周", none: "" };
const priceCell = (p) => {
  const base = `${money(p.price.amount, p.price.currency)}${period[p.price.period] ?? ""}`;
  const first =
    p.price.firstPeriodAmount != null
      ? ` <sub>首期 ${money(p.price.firstPeriodAmount, p.price.currency)}</sub>`
      : "";
  return base + first;
};
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");

function plansTable(region) {
  const rows = plans.filter((p) => p.region === region);
  return [
    "| 套餐 | 厂商 | 价格 | 额度 | 主力模型 | 多模态 | 购买 | 来源 |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map(
      (p) =>
        `| **${esc(p.name)}** | ${esc(p.vendor)} | ${priceCell(p)} | ${esc(p.quota)} | ${esc(
          (p.models ?? []).join("、") || "—",
        )} | ${p.multimodal === null ? "—" : p.multimodal ? "✅" : "❌"} | [直达](${p.buyUrl}) | [官方](${p.sourceUrl}) |`,
    ),
  ].join("\n");
}

function apiTable(region) {
  const rows = apiPrices.filter((a) => a.region === region);
  return [
    "| 模型 | 厂商 | 输入 / 1M | 输出 / 1M | 缓存命中 | 上下文 | 开通 | 来源 |",
    "|---|---|---:|---:|---:|---|---|---|",
    ...rows.map(
      (a) =>
        `| **${esc(a.model)}** | ${esc(a.vendor)} | ${money(a.input, a.currency)} | ${money(
          a.output,
          a.currency,
        )} | ${a.cacheHit == null ? "—" : money(a.cacheHit, a.currency)} | ${esc(
          a.context ?? "—",
        )} | [直达](${a.buyUrl}) | [官方](${a.sourceUrl}) |`,
    ),
  ].join("\n");
}

function rankingTable(models, limit = 12) {
  return [
    "| # | 模型 | 厂商 | Agentic Index | 单任务成本 | 输出 TPS | 权重 | API 单价（入/出, $/1M） |",
    "|---:|---|---|---:|---:|---:|---|---|",
    ...models.slice(0, limit).map(
      (m, i) =>
        `| ${i + 1} | ${esc(m.model)} | ${esc(m.creator)} | ${m.agenticIndex ?? "—"} | ${
          m.costPerTaskUsd != null ? `$${m.costPerTaskUsd}` : "—"
        } | ${m.outputTps ?? "—"} | ${m.openWeights ? "开源" : "闭源"} | ${
          m.priceUsdPer1M
            ? `${money(m.priceUsdPer1M.input, "USD")} / ${money(m.priceUsdPer1M.output, "USD")}`
            : "—"
        } |`,
    ),
  ].join("\n");
}

const templates = {
  "plans:cn": plansTable("cn"),
  "plans:global": plansTable("global"),
  "api:cn": apiTable("cn"),
  "api:global": apiTable("global"),
  "rank:overall": rankingTable(rankings.highlights.topOverall.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "rank:open": rankingTable(rankings.highlights.topOpenWeights.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "rank:value": rankingTable(rankings.highlights.bestValue.map((name) => rankings.models.find((m) => m.model === name) ?? { model: name })),
  "meta:snapshotDate": rankings.snapshotDate,
  "meta:valueMinIndex": String(rankings.valueMinIndex ?? 40),
  "meta:plansCount": String(plans.length),
  "meta:apiCount": String(apiPrices.length),
  "meta:modelsCount": String(rankings.models.length),
  "meta:verifiedAt": [...new Set([...plans, ...apiPrices].map((x) => x.verifiedAt))].sort().pop() ?? "",
};

let out = read("../README.template.md");
const missing = [];
out = out.replace(/<!--\s*data:([a-zA-Z]+:[a-zA-Z]+)\s*-->/g, (_, key) => {
  if (!(key in templates)) {
    missing.push(key);
    return `<!-- 未生成：${key} -->`;
  }
  return templates[key];
});
if (missing.length) {
  console.error(`模板里有未知占位符：${missing.join(", ")}`);
  process.exit(1);
}
writeFileSync(new URL("../README.md", import.meta.url), out);
console.log(`README.md 已生成（套餐 ${plans.length} · 按量 ${apiPrices.length}）`);
