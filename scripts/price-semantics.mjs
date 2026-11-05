import assert from "node:assert/strict";
import { deriveCny } from "./derive-cny.mjs";

/** The public plan catalog contains only verified prices, actual free tiers or documented exceptions. */
export function assertPublishablePlan(plan) {
  const { amount, period } = plan.price;
  assert.notEqual(plan.confidence, "low", `${plan.id}: 未核实条目不能公开展示`);
  assert.notEqual(plan.status, "unknown", `${plan.id}: 状态未知的条目不能公开展示`);
  if (plan.kind === "free") {
    assert.equal(amount, 0, `${plan.id}: 免费档价格必须明确为0`);
  } else if (amount === null) {
    assert.ok(["no-plan", "discontinued"].includes(plan.status),
      `${plan.id}: 在售非免费套餐必须有已核实价格`);
  } else {
    assert.ok(Number.isFinite(amount) && amount > 0, `${plan.id}: 付费档价格必须大于0`);
    assert.notEqual(period, "none", `${plan.id}: 付费档需要可折算的周期`);
    assert.notEqual(plan.status, "no-plan", `${plan.id}: 无订阅档不得标记为有订阅价格`);
  }
}

/** Compare the full derived view, including membership, ordering, highlights and price values. */
export function assertCnyMatchesSources(sources, actual) {
  const expected = deriveCny(sources);
  try {
    assert.deepStrictEqual(actual, expected);
  } catch {
    const actualById = new Map((actual.plans ?? []).map((p) => [p.id, p]));
    const missing = expected.plans.filter((p) => !actualById.has(p.id)).map((p) => p.id);
    const extra = [...actualById.keys()].filter((id) => !expected.plans.some((p) => p.id === id));
    throw new Error(`cny.json 与源数据不一致（缺少: ${missing.join(", ") || "无"}；多余: ${extra.join(", ") || "无"}）；请运行 node scripts/derive-cny.mjs`);
  }
}
