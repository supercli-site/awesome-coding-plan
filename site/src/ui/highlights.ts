/** 榜单条：最便宜 / 最贵 / 性价比最高，一眼给出三个答案。 */
import { h } from "./dom";
import { money, moneyCompact } from "./format";
import type { CnyApi, CnyModel, CnyPlan, CnyView } from "../types";

interface Row {
  name: string;
  sub?: string;
  value: string;
}

const card = (label: string, title: string, rows: Row[], feature = false): HTMLElement =>
  h("article", { class: `podium${feature ? " podium--feature" : ""}` }, [
    h("span", { class: "podium__label" }, label),
    h("h3", { class: "podium__title" }, title),
    h(
      "ol",
      { class: "podium__list" },
      rows.map((r, i) =>
        h("li", { class: "podium__row" }, [
          h("span", { class: "podium__rank tabular" }, String(i + 1)),
          h("span", { class: "podium__name" }, [r.name, r.sub ? h("span", { class: "podium__sub" }, r.sub) : null]),
          h("span", { class: "podium__value" }, r.value),
        ]),
      ),
    ),
  ]);

export function renderPodiums(view: CnyView, plans: CnyPlan[], api: CnyApi[], models: CnyModel[]): HTMLElement {
  const planById = new Map(plans.map((p) => [p.id, p]));
  const apiById = new Map(api.map((a) => [a.id, a]));
  const modelByName = new Map(models.map((m) => [m.model, m]));

  const planRows = (ids: string[]): Row[] =>
    ids.slice(0, 5).map((id) => {
      const p = planById.get(id);
      if (!p) return { name: id, value: "—" };
      return { name: p.name, sub: `${p.vendor} · ${p.offeringLabel ?? "主体未知"}`, value: money(p.monthlyCny) };
    });

  const apiRows = (ids: string[]): Row[] =>
    ids.slice(0, 5).map((id) => {
      const a = apiById.get(id);
      if (!a) return { name: id, value: "—" };
      return { name: a.model, sub: `${a.vendor} · ${a.offeringLabel ?? "主体未知"}`, value: moneyCompact(a.blendedCny) };
    });

  const valueRows = (ids: string[]): Row[] =>
    ids.slice(0, 5).map((name) => {
      const m = modelByName.get(name);
      if (!m) return { name, value: "—" };
      return {
        name: m.model,
        sub: `${m.creator} · 单任务 ${moneyCompact(m.costPerTaskCny)} · 指数 ${m.agenticIndex ?? "—"}`,
        value: `${m.valuePerYuan ?? "—"}`,
      };
    });

  return h("div", { class: "podiums" }, [
    card("Cheapest", "最便宜套餐（每月人民币）", planRows(view.highlights.plans.cheapest)),
    card("Priciest", "最贵套餐（每月人民币）", planRows(view.highlights.plans.priciest)),
    card("Best value", "性价比最高模型", valueRows(view.highlights.models.bestValue), true),
  ]);
}

/** 第二组榜单：API 单价两头 + 额度倍率。拆开避免一张卡塞太多信息。 */
export function renderPodiumsSecond(view: CnyView, plans: CnyPlan[], api: CnyApi[]): HTMLElement {
  const planById = new Map(plans.map((p) => [p.id, p]));
  const apiById = new Map(api.map((a) => [a.id, a]));

  const apiRows = (ids: string[]): Row[] =>
    ids.slice(0, 5).map((id) => {
      const a = apiById.get(id);
      if (!a) return { name: id, value: "—" };
      return {
        name: a.model,
        sub: `${a.vendor} · 输入 ${moneyCompact(a.inputCny)} / 输出 ${moneyCompact(a.outputCny)}`,
        value: moneyCompact(a.blendedCny),
      };
    });

  const creditRows = (ids: string[]): Row[] =>
    ids.slice(0, 5).map((id) => {
      const p = planById.get(id);
      if (!p) return { name: id, value: "—" };
      return {
        name: p.name,
        sub: `${p.vendor} · 月费 ${moneyCompact(p.monthlyCny)}`,
        value: `${p.creditRatio ?? "—"}×`,
      };
    });

  return h("div", { class: "podiums" }, [
    card("API cheapest", "API 综合单价最低", apiRows(view.highlights.api.cheapest)),
    card("API priciest", "API 综合单价最高", apiRows(view.highlights.api.priciest)),
    card("Credit ratio", "附带额度 / 月费 倍率", creditRows(view.highlights.plans.mostCredit)),
  ]);
}
