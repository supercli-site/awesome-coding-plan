import test from "node:test";
import assert from "node:assert/strict";
import { convertCny } from "./currency.mjs";
import { readFileSync } from "node:fs";
import { assertPublicData } from "./public-boundary.mjs";
import { assertPublishablePlan, assertCnyMatchesSources } from "./price-semantics.mjs";
import { deriveCny } from "./derive-cny.mjs";

const fixture = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const sourceData = () => ({ fx: fixture("fx"), plans: fixture("plans"), platforms: fixture("platforms"), api: fixture("api-prices"), rankings: fixture("rankings") });

test("cache-hit and low token prices retain precision instead of becoming free", () => {
  assert.equal(convertCny(0.001, "USD", 6.7186, 6), 0.006719);
  assert.equal(convertCny(0.02, "CNY", 6.7186, 6), 0.02);
  assert.equal(convertCny(20, "USD", 6.7186), 134.37);
  assert.equal(convertCny(null, "USD", 6.7186), null);
  assert.equal(convertCny(0, "USD", 6.7186, 6), 0);
});
test("invalid exchange rates and prices do not silently produce comparable data", () => {
  for (const args of [[2,"USD",0],[NaN,"CNY",6.7],[-1,"USD",6.7],[1,"EUR",6.7]])
    assert.throws(() => convertCny(...args));
});
test("public boundary accepts ordinary public model pricing", () => {
  assert.doesNotThrow(() => assertPublicData({ sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing", input:2, cacheHit:0.04, quotaUnit:"tokens", notes:"缓存命中另计" }));
});
test("internal social datasets and credential fields are rejected at any depth", () => {
  for (const value of [
    {sourceUrl:"https://www.xiaohongshu.com/explore/internal"},
    {nested:[{sourceUrl:"https://v.douyin.com/private"}]},
    {nested:{apiKey:"test-only"}},
    {sourceUrl:"https://user:example@public.example/pricing"},
    {sourceUrl:"https://public.example/pricing?access_token=test-only"},
    {notes:"file:///private/internal/file"},
  ]) assert.throws(() => assertPublicData(value));
});

test("free is exactly zero, PAYG and retired unknown-price plans remain non-comparable", () => {
  const source = sourceData();
  const byId = (id) => source.plans.find((p) => p.id === id);
  const view = deriveCny(source);
  const monthly = (id) => view.plans.find((p) => p.id === id).monthlyCny;
  for (const p of source.plans) assertPublishablePlan(p);
  assert.equal(byId("gemini-cli-free").status, "discontinued");
  assert.equal(monthly("gemini-cli-free"), 0);
  assert.equal(monthly("opencode-zen-free"), 0);
  assert.equal(monthly("deepseek-api-payg"), null);
  assert.equal(monthly("minimax-token-plan-legacy"), null);
  assert.equal(monthly("tencent-coding-plan"), null);
  for (const id of ["fireworks-fire-pass", "xai-supergrok", "xai-grok-build", "baidu-comate-personal"])
    assert.equal(byId(id), undefined, `${id} should stay in the private research list`);
});

test("public catalog rejects speculative, active unpriced and mislabeled free plans", () => {
  const baseline = sourceData().plans.find((p) => p.id === "opencode-zen-free");
  assert.throws(() => assertPublishablePlan({ ...baseline, confidence: "low" }), /未核实/);
  assert.throws(() => assertPublishablePlan({ ...baseline, status: "unknown" }), /状态未知/);
  assert.throws(() => assertPublishablePlan({ ...baseline, price: { ...baseline.price, amount: null } }), /免费档价格/);
  assert.throws(() => assertPublishablePlan({ ...baseline, kind: "coding-plan", price: { ...baseline.price, amount: null } }), /在售非免费/);
  assert.throws(() => assertPublishablePlan({ ...baseline, kind: "coding-plan" }), /付费档价格/);
  const paid = { ...baseline, kind: "coding-plan", price: { ...baseline.price, amount: 20, period: "month" } };
  assert.throws(() => assertPublishablePlan({ ...paid, status: "no-plan" }), /无订阅档/);
  assert.throws(() => assertPublishablePlan({ ...paid, price: { ...paid.price, period: "none" } }), /可折算的周期/);
});

test("paid monthly equivalents use the billing period and ignore first-period promotions", () => {
  const sources = sourceData();
  sources.fx.rate = 7;
  const plan = sources.plans.find((p) => p.id === "claude-pro");
  for (const [amount, currency, period, expected] of [
    [20, "USD", "month", 140], [120, "CNY", "quarter", 40],
    [120, "CNY", "year", 10], [12, "CNY", "week", 52],
  ]) {
    const changed = { ...plan, price: { amount, currency, period, firstPeriodAmount: 1 } };
    const view = deriveCny({ ...sources, plans: sources.plans.map((p) => p.id === plan.id ? changed : p) });
    assert.equal(view.plans.find((p) => p.id === plan.id).monthlyCny, expected, period);
  }
});

test("derived view matches every source row and rejects stale prices, rows and highlights", () => {
  const sources = sourceData();
  const valid = deriveCny(sources);
  assert.doesNotThrow(() => assertCnyMatchesSources(sources, valid));
  for (const changed of [
    { ...valid, plans: valid.plans.slice(1) },
    { ...valid, plans: [...valid.plans, { id: "speculative", monthlyCny: null }] },
    { ...valid, plans: valid.plans.map((p, index) => index === 0 ? { ...p, monthlyCny: 999999 } : p) },
    { ...valid, highlights: { ...valid.highlights, plans: { ...valid.highlights.plans, cheapest: ["speculative"] } } },
    { ...valid, fx: { ...valid.fx, date: "2020-01-01" } },
  ]) assert.throws(() => assertCnyMatchesSources(sources, changed), /不一致/);
  const staleSources = { ...sources, plans: sources.plans.map((p, index) =>
    index === 0 ? { ...p, price: { ...p.price, amount: p.price.amount + 1 } } : p) };
  assert.throws(() => assertCnyMatchesSources(staleSources, valid), /不一致/);
});
