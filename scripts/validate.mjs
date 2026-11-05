/**
 * 数据门禁：结构、唯一性、来源、时效，以及 platformId 与 platforms.json 的交叉引用。
 *
 * 原则：
 * - 价格必须能溯源到官方页面（sourceUrl），不接受二手博客。
 * - verifiedAt 过旧（默认 90 天）只警告不阻断，但会在报告里点名。
 * - 任何低置信、未知状态或在售无价套餐均不能进入公开目录。
 * - platformId 必须能在 platforms.json 里找到，杜绝拼错后静默丢失「原厂/中转」标注。
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import Ajv from "ajv";
import { assertPublicData } from "./public-boundary.mjs";
import { assertPublishablePlan, assertCnyMatchesSources } from "./price-semantics.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const plans = read("../data/plans.json");
const apiPrices = read("../data/api-prices.json");
const rankings = read("../data/rankings.json");
const fx = read("../data/fx.json");
const cny = read("../data/cny.json");
const platforms = read("../data/platforms.json");
for (const [name, data] of Object.entries({ plans, apiPrices, rankings, fx, cny, platforms }))
  assertPublicData(data, name);
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const validate = (schemaName, data, label) => {
  const schema = read(`../data/${schemaName}`);
  const ok = ajv.validate(schema, data);
  if (!ok) {
    const errs = ajv.errors
      .map((e) => `  ${e.instancePath || "/"} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues})` : ""}`)
      .join("\n");
    assert.fail(`${label} 结构不合法：\n${errs}`);
  }
};

validate("plans.schema.json", plans, "plans");
validate("api-prices.schema.json", apiPrices, "api-prices");

const platformIds = new Set(platforms.platforms.map((p) => p.id));
assert.ok(platformIds.size >= 30, `platforms 注册表过小：${platformIds.size}`);
const offeringIds = new Set(Object.keys(platforms.offeringDefs));
const bundleIds = new Set(Object.keys(platforms.bundleDefs));
for (const p of platforms.platforms) {
  assert.ok(offeringIds.has(p.offering), `platforms ${p.id} offering 非法：${p.offering}`);
  assert.ok(bundleIds.has(p.bundle), `platforms ${p.id} bundle 非法：${p.bundle}`);
  assert.ok(/^https:\/\//.test(p.url), `platforms ${p.id} url 非 https`);
}

const ids = new Set();
for (const p of plans) {
  assert.ok(!ids.has(p.id), `plans id 重复：${p.id}`);
  ids.add(p.id);
  assert.ok(p.sourceUrl.startsWith("https://"), `plans ${p.id} 缺官方来源`);
  assertPublishablePlan(p);
  const noPurchase = p.status === "no-plan" || p.status === "discontinued";
  assert.ok(p.buyUrl?.startsWith("https://") || noPurchase, `plans ${p.id} 缺购买直达链接（仅无订阅/停售可为空）`);
  assert.ok(p.platformId == null || platformIds.has(p.platformId), `plans ${p.id} platformId 未注册：${p.platformId}`);
  if (p.platformId == null) console.warn(`⚠️  未标注售卖主体：plans ${p.id}（${p.vendor}）`);
}

const apiIds = new Set();
for (const a of apiPrices) {
  assert.ok(!apiIds.has(a.id), `api-prices id 重复：${a.id}`);
  apiIds.add(a.id);
  assert.ok(a.sourceUrl.startsWith("https://"), `api-prices ${a.id} 缺官方来源`);
  assert.ok(a.input >= 0 && a.output >= 0, `api-prices ${a.id} 价格非法`);
  assert.ok(a.platformId == null || platformIds.has(a.platformId), `api-prices ${a.id} platformId 未注册：${a.platformId}`);
  if (a.platformId == null) console.warn(`⚠️  未标注售卖主体：api ${a.id}（${a.vendor}）`);
}

assert.ok(plans.length >= 20, `plans 条目过少：${plans.length}`);
assert.ok(apiPrices.length >= 15, `api-prices 条目过少：${apiPrices.length}`);
assert.ok(rankings.models.length > 50, "rankings 模型数异常");
assert.ok(rankings.snapshotDate, "rankings 缺 snapshotDate");

// 汇率与人民币视图必须同源，否则页面上会出现两套折算口径
assert.ok(fx.rate > 5 && fx.rate < 9, `fx.rate 越界：${fx.rate}`);
assert.ok(/^\d{4}-\d{2}-\d{2}/.test(fx.date), "fx.date 非法");
assertCnyMatchesSources({ fx, plans, platforms, api: apiPrices, rankings }, cny);
for (const key of ["cheapest", "priciest"]) {
  assert.ok(cny.highlights.plans[key].length > 0, `cny.highlights.plans.${key} 为空`);
}

const staleDays = 90;
const today = new Date();
for (const item of [...plans, ...apiPrices]) {
  const days = (today - new Date(item.verifiedAt)) / 86400000;
  if (days > staleDays) {
    console.warn(`⚠️  超过 ${staleDays} 天未复核：${item.id}（${item.verifiedAt}）`);
  }
}

const cn = plans.filter((p) => p.region === "cn").length;
const global = plans.filter((p) => p.region === "global").length;
console.log(
  `✅ 校验通过：套餐 ${plans.length}（国内 ${cn} / 海外 ${global}）· 按量 ${apiPrices.length} · 排行 ${rankings.models.length} · 平台 ${platformIds.size}`,
);
