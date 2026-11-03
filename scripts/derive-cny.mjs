/**
 * 统一人民币视图：把套餐、API 单价、排行全部按当日汇率折算成人民币，输出 data/cny.json。
 *
 * 口径（站点与 README 都引用这里，改口径只改这一处）：
 * - 汇率：data/fx.json（中国外汇交易中心中间价，失败时 ECB 交叉），全站同一个数。
 * - 套餐月费：year ÷ 12、quarter ÷ 3、week × 52 ÷ 12；首期优惠不参与排序，只展示。
 * - API 综合单价：按「输入 3 : 输出 1」加权（Agent/编程场景输入远多于输出，
 *   与 Artificial Analysis 的 blended price 同口径），单位 元 / 百万 tokens。
 * - 性价比：Agentic Index ÷ 单任务人民币成本，只在 Agentic Index ≥ valueMinIndex 的模型里比。
 * - 原币为人民币的条目不经汇率，避免来回换算引入误差。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { convertCny, round } from "./currency.mjs";

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const fx = read("fx.json");
const plans = read("plans.json");
const platforms = read("platforms.json");
const PLATFORM = Object.fromEntries(platforms.platforms.map((p) => [p.id, p]));
const api = read("api-prices.json");
const rankings = read("rankings.json");

const RATE = fx.rate;
const BLEND = { input: 3, output: 1 };
const toCny = (value, currency, digits = 2) => convertCny(value, currency, RATE, digits);
const perMonth = { month: 1, quarter: 1 / 3, year: 1 / 12, week: 52 / 12, none: null };

const planRows = plans.map((p) => {
  const factor = perMonth[p.price.period];
  const monthly = p.price.amount == null || factor == null ? null : toCny(p.price.amount * factor, p.price.currency);
  const credit = p.includedCredit?.amount != null ? toCny(p.includedCredit.amount, p.includedCredit.currency ?? "USD") : null;
  return {
    id: p.id,
    vendor: p.vendor,
    name: p.name,
    region: p.region,
    kind: p.kind,
    originalCurrency: p.price.currency,
    monthlyCny: monthly,
    firstPeriodCny: toCny(p.price.firstPeriodAmount ?? null, p.price.currency),
    includedCreditCny: credit,
    // 附带额度 ÷ 月费：>1 说明官方送的用量额度比月费还多
    creditRatio: monthly && credit ? round(credit / monthly) : null,
    confidence: p.confidence,
    status: p.status,
    platformId: p.platformId ?? null,
    offering: PLATFORM[p.platformId ?? ""]?.offering ?? null,
    offeringLabel: PLATFORM[p.platformId ?? ""]?.offering ? platforms.offeringDefs[PLATFORM[p.platformId].offering].label : null,
    bundle: PLATFORM[p.platformId ?? ""]?.bundle ?? null,
    bundleLabel: PLATFORM[p.platformId ?? ""]?.bundle ? platforms.bundleDefs[PLATFORM[p.platformId].bundle].label : null,
    platformUrl: PLATFORM[p.platformId ?? ""]?.url ?? null,
  };
});

const apiRows = api.map((a) => {
  const input = toCny(a.input, a.currency, 6);
  const output = toCny(a.output, a.currency, 6);
  return {
    id: a.id,
    vendor: a.vendor,
    model: a.model,
    region: a.region,
    originalCurrency: a.currency,
    inputCny: input,
    outputCny: output,
    cacheHitCny: toCny(a.cacheHit ?? null, a.currency, 6),
    blendedCny: round((input * BLEND.input + output * BLEND.output) / (BLEND.input + BLEND.output), 6),
    confidence: a.confidence,
    platformId: a.platformId ?? null,
    offering: PLATFORM[a.platformId ?? ""]?.offering ?? null,
    offeringLabel: PLATFORM[a.platformId ?? ""]?.offering ? platforms.offeringDefs[PLATFORM[a.platformId].offering].label : null,
    platformUrl: PLATFORM[a.platformId ?? ""]?.url ?? null,
  };
});

const minIndex = rankings.valueMinIndex ?? 40;
const rankRows = rankings.models
  .filter((m) => m.costPerTaskUsd != null)
  .map((m) => {
    const cost = toCny(m.costPerTaskUsd, "USD", 6);
    return {
      model: m.model,
      creator: m.creator,
      openWeights: m.openWeights,
      agenticIndex: m.agenticIndex,
      costPerTaskCny: cost,
      valuePerYuan: m.agenticIndex != null && cost ? round(m.agenticIndex / cost, 1) : null,
      inputCny: toCny(m.priceUsdPer1M?.input ?? null, "USD", 6),
      outputCny: toCny(m.priceUsdPer1M?.output ?? null, "USD", 6),
    };
  });

// 只在「价格已核实」的条目里评选，低置信的不进榜，避免把猜测价当最便宜。
const trusted = (x) => x.confidence !== "low";
const paidPlans = planRows.filter((p) => trusted(p) && p.monthlyCny > 0 && p.status !== "discontinued");
const byAsc = (k) => (a, b) => a[k] - b[k];
const pickIds = (arr, n = 5) => arr.slice(0, n).map((x) => x.id ?? x.model);

const out = {
  fx: { rate: RATE, date: fx.date, source: fx.source, sourceUrl: fx.sourceUrl, fallbackUsed: fx.fallbackUsed },
  method: {
    planMonthly: "年付÷12、季付÷3、周付×52÷12；首期优惠不参与排序",
    apiBlended: `输入:输出 = ${BLEND.input}:${BLEND.output} 加权，元/百万 tokens`,
    value: `Agentic Index ÷ 单任务人民币成本，仅比较 Agentic Index ≥ ${minIndex} 的模型`,
    excluded: "置信度 low 的条目不参与最便宜/最贵/性价比评选",
  },
  highlights: {
    plans: {
      cheapest: pickIds([...paidPlans].sort(byAsc("monthlyCny"))),
      priciest: pickIds([...paidPlans].sort(byAsc("monthlyCny")).reverse()),
      mostCredit: pickIds(paidPlans.filter((p) => p.creditRatio).sort((a, b) => b.creditRatio - a.creditRatio)),
    },
    api: {
      cheapest: pickIds(apiRows.filter(trusted).sort(byAsc("blendedCny"))),
      priciest: pickIds(apiRows.filter(trusted).sort(byAsc("blendedCny")).reverse()),
    },
    models: {
      bestValue: pickIds(
        rankRows.filter((m) => (m.agenticIndex ?? 0) >= minIndex && m.valuePerYuan).sort((a, b) => b.valuePerYuan - a.valuePerYuan),
      ),
      cheapestPerTask: pickIds(rankRows.filter((m) => (m.agenticIndex ?? 0) >= minIndex).sort(byAsc("costPerTaskCny"))),
    },
  },
  plans: planRows,
  api: apiRows,
  models: rankRows,
};

writeFileSync(new URL("../data/cny.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`人民币视图已生成：1 USD = ${RATE} CNY（${fx.date}）· 套餐 ${planRows.length} · API ${apiRows.length} · 模型 ${rankRows.length}`);
