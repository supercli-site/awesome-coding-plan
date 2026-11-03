/** 套餐、API、平台清单与真实观测值散点图；路由：单页锚点。API：静态 data/*.json。 */
import { h, clear } from "./dom";
import { modelBadge, vendorBadge } from "./model-icons";
import { CONFIDENCE, KIND, REGION, STATUS, money, moneyCompact } from "./format";
import type { CnyApi, CnyModel, CnyPlan, PlatformsFile, RawApi, RawPlan } from "../types";

const link = (text: string, url?: string | null) => url && /^https:\/\//.test(url)
  ? h("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, text)
  : h("span", null, text);
const label = (text: string) => h("span", { class: "chip" }, text);
const confidence = (value: string) => h("span", { class: `conf conf--${value}` }, CONFIDENCE[value] ?? "未核实");
const field = (name: string, options: [string, string][]) => h("label", { class: "field" }, [name,
  h("select", { "aria-label": name }, options.map(([value, text]) => h("option", { value }, text))),
]);

/** 过滤套餐卡，原始数据详情与人民币派生数据按 id 对齐。 */
export function renderPlans(plans: CnyPlan[], raw: RawPlan[]): HTMLElement {
  const details = new Map(raw.map((p) => [p.id, p]));
  const region = field("地区", [["all", "全部"], ["cn", "国内"], ["global", "海外"]]);
  const status = field("状态", [["all", "全部"], ["active", "在售"], ["sold-out-daily", "每日限量"], ["other", "其他"]]);
  const kind = field("类型", [["all", "全部"], ["coding-plan", "Coding Plan"], ["token-plan", "Token Plan"], ["ide", "IDE"], ["free", "免费"]]);
  const search = h("input", { type: "search", placeholder: "搜索厂商或套餐", "aria-label": "搜索套餐" });
  const count = h("span", { class: "toolbar__count", role: "status" });
  const grid = h("div", { class: "plan-grid" });
  const toolbar = h("div", { class: "toolbar" }, [region, status, kind, h("label", { class: "field" }, ["搜索", search]), count]);
  function update() {
    const matches = plans.filter((p) => {
      const text = `${p.vendor} ${p.name} ${details.get(p.id)?.models?.join(" ") ?? ""}`.toLocaleLowerCase();
      return (region.querySelector("select")!.value === "all" || p.region === region.querySelector("select")!.value)
        && (kind.querySelector("select")!.value === "all" || p.kind === kind.querySelector("select")!.value)
        && (status.querySelector("select")!.value === "all" || (status.querySelector("select")!.value === "other"
          ? !["active", "sold-out-daily"].includes(p.status) : p.status === status.querySelector("select")!.value))
        && text.includes(search.value.trim().toLocaleLowerCase());
    });
    clear(grid);
    count.textContent = `显示 ${matches.length} / ${plans.length} 款`;
    if (!matches.length) grid.append(h("div", { class: "empty" }, "没有符合条件的套餐，试试调整筛选。"));
    for (const p of matches) {
      const detail = details.get(p.id);
      const price = p.monthlyCny != null ? money(p.monthlyCny)
        : p.status === "no-plan" ? "按量计费"
        : p.status === "discontinued" ? "已下架"
        : p.status === "coming-soon" ? "未开售" : "待核实";
      grid.append(h("article", { class: "plan" }, [
        h("div", { class: "plan__top" }, [vendorBadge(p.platformId, p.vendor),
          h("div", { class: "plan__head" }, [h("h3", { class: "plan__name" }, p.name), h("p", { class: "plan__vendorline" }, p.vendor)])]),
        h("div", { class: "plan__price" }, [h("strong", { class: "plan__amount" }, price),
          h("span", { class: "plan__period" }, p.monthlyCny == null ? "" : "/月（折算）")]),
        p.firstPeriodCny != null ? h("p", { class: "plan__credithint" }, `首期 ${money(p.firstPeriodCny)}，不参与月费排序`) : null,
        h("p", { class: "plan__quota" }, detail?.quota ?? "额度说明待补充"),
        h("div", { class: "plan__models" }, (detail?.models ?? []).slice(0, 3).map(label)),
        h("div", { class: "plan__meta" }, [label(REGION[p.region] ?? p.region), label(KIND[p.kind] ?? p.kind),
          label(STATUS[p.status] ?? p.status), confidence(p.confidence),
          h("div", { class: "plan__links" }, [link(p.status === "active" || p.status === "sold-out-daily" ? "购买 ↗" : "查看官方 ↗", detail?.buyUrl ?? p.platformUrl), link("来源 ↗", detail?.sourceUrl)])]),
        h("small", { class: "detail-note" }, `核实 ${detail?.verifiedAt ?? "日期未知"}${detail?.price?.note ? ` · 价格条件：${detail.price.note}` : ""}${detail?.includedCredit?.text ? ` · 套餐内额度：${detail.includedCredit.text}` : ""}${detail?.notes ? ` · 使用条款：${detail.notes}` : ""}`),
      ]));
    }
  }
  toolbar.addEventListener("input", update);
  toolbar.addEventListener("change", update);
  update();
  return h("div", null, [toolbar, grid]);
}

/** API 单价列表：以每百万 token 的真实输入、输出与 3:1 加权价展示。 */
export function renderApi(prices: CnyApi[], raw: RawApi[]): HTMLElement {
  const details = new Map(raw.map((p) => [p.id, p]));
  const region = field("地区", [["all", "全部"], ["cn", "国内"], ["global", "海外"]]);
  const search = h("input", { type: "search", placeholder: "搜索模型或厂商", "aria-label": "搜索 API 模型" });
  const count = h("span", { class: "toolbar__count", role: "status" });
  const body = h("tbody");
  const table = h("table", { class: "data" }, [
    h("thead", null, h("tr", null, ["模型 / 厂商", "地区", "缓存未命中输入", "输出", "缓存命中输入", "3:1 综合", "核实 / 来源"].map((x) => h("th", { scope: "col" }, x)))), body,
  ]);
  function update() {
    const found = prices.filter((p) => (region.querySelector("select")!.value === "all" || p.region === region.querySelector("select")!.value)
      && `${p.model} ${p.vendor}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()));
    count.textContent = `显示 ${found.length} / ${prices.length} 个报价`;
    clear(body);
    for (const p of found) {
      const detail = details.get(p.id);
      const source = detail?.sourceUrl ?? p.sourceUrl;
      body.append(h("tr", null, [
        h("td", null, h("div", { class: "model-cell" }, [modelBadge(p.model), h("div", null, [h("strong", { class: "cell-model" }, p.model), h("span", { class: "cell-vendor block" }, `${p.vendor} · ${p.offeringLabel ?? "主体未知"}`)])])),
        h("td", null, REGION[p.region] ?? p.region),
        h("td", { class: "num" }, money(p.inputCny)), h("td", { class: "num" }, money(p.outputCny)),
        h("td", { class: "num" }, money(p.cacheHitCny)), h("td", { class: "num" }, money(p.blendedCny)),
        h("td", null, [confidence(p.confidence), h("span", { class: "block detail-note" }, detail?.verifiedAt ?? p.verifiedAt ?? "日期未知"),
          link("官方来源 ↗", source), detail?.tiering ? h("span", { class: "block detail-note" }, `计费条件：${detail.tiering}`) : null,
          detail?.notes ? h("span", { class: "block detail-note" }, `附注：${detail.notes}`) : null]),
      ]));
    }
  }
  const toolbar = h("div", { class: "toolbar" }, [region, h("label", { class: "field" }, ["搜索", search]), count]);
  toolbar.addEventListener("input", update);
  toolbar.addEventListener("change", update);
  update();
  return h("div", null, [toolbar, h("div", { class: "table-wrap" }, table)]);
}

/** 绘制完整观测点；缺 Agentic Index 或单任务成本的记录不进入图。 */
export function renderScatter(models: CnyModel[]): HTMLElement {
  const valid = models.filter((m) => m.agenticIndex != null && Number.isFinite(m.agenticIndex)
    && m.costPerTaskCny != null && Number.isFinite(m.costPerTaskCny) && m.costPerTaskCny > 0);
  if (!valid.length) return h("div", { class: "empty" }, "缺少同时包含 Agentic Index 与单任务成本的观测值，暂无法绘制散点图。");
  const width = 760, height = 390, left = 58, right = 22, top = 20, bottom = 55;
  const maxX = Math.max(...valid.map((m) => m.costPerTaskCny!));
  const minY = Math.min(...valid.map((m) => m.agenticIndex!));
  const maxY = Math.max(...valid.map((m) => m.agenticIndex!));
  const x = (n: number) => left + (n / maxX) * (width - left - right);
  const y = (n: number) => top + (1 - (n - minY) / (maxY - minY || 1)) * (height - top - bottom);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${valid.length} 个模型的单任务成本与 Agentic Index 散点图`);
  const add = (tag: string, attrs: Record<string, string>, text?: string) => {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text) el.textContent = text;
    svg.append(el);
    return el;
  };
  for (let i = 0; i <= 4; i++) {
    const vx = maxX * i / 4, vy = minY + (maxY - minY) * i / 4;
    add("line", { x1: String(x(vx)), x2: String(x(vx)), y1: String(top), y2: String(height - bottom), stroke: "var(--line)" });
    add("line", { x1: String(left), x2: String(width - right), y1: String(y(vy)), y2: String(y(vy)), stroke: "var(--line)" });
    add("text", { x: String(x(vx)), y: String(height - 28), "text-anchor": "middle", fill: "var(--muted)", "font-size": "11" }, vx.toFixed(0));
    add("text", { x: String(left - 9), y: String(y(vy) + 4), "text-anchor": "end", fill: "var(--muted)", "font-size": "11" }, vy.toFixed(0));
  }
  add("text", { x: String(width / 2), y: String(height - 5), "text-anchor": "middle", fill: "var(--ink)", "font-size": "12" }, "单任务成本（人民币）");
  add("text", { x: "14", y: "17", fill: "var(--ink)", "font-size": "12" }, "Agentic Index");
  for (const m of valid) {
    const dot = add("circle", { cx: String(x(m.costPerTaskCny!)), cy: String(y(m.agenticIndex!)), r: "4.5",
      fill: m.openWeights ? "var(--warn)" : "var(--accent)", opacity: ".82", tabindex: "0" });
    dot.append(Object.assign(document.createElementNS(ns, "title"), { textContent: `${m.model} · ${money(m.costPerTaskCny)} /任务 · 指数 ${m.agenticIndex}` }));
  }
  return h("figure", { class: "scatter__card" }, [svg, h("figcaption", { class: "detail-note" }, `共 ${valid.length} 个同时具备两项观测值的模型；绿点为闭源，黄点为开放权重。悬停或聚焦查看名称与数值。`) ]);
}

/** 平台登记表：售卖主体与工具绑定方式均来自 platforms.json。 */
export function renderPlatforms(file: PlatformsFile, plans: CnyPlan[], api: CnyApi[]): HTMLElement {
  return h("div", { class: "platform-grid" }, file.platforms.map((p) => h("article", { class: "platform" }, [
    h("div", { class: "platform__top" }, [vendorBadge(p.id, p.name), h("h3", { class: "platform__name" }, p.name),
      h("span", { class: `chip chip--${p.offering}` }, file.offeringDefs[p.offering]?.label ?? p.offering)]),
    h("p", { class: "platform__note" }, p.note),
    h("div", { class: "platform__foot" }, [label(file.bundleDefs[p.bundle]?.label ?? p.bundle), link("平台 ↗", p.url),
      h("span", { class: "platform__count" }, `${plans.filter((x) => x.platformId === p.id).length} 套餐 · ${api.filter((x) => x.platformId === p.id).length} API`)]),
  ])));
}
