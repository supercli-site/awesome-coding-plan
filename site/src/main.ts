/** TokenPlan 单页入口；路由：/ 与各锚点；API：/data/{cny,plans,api-prices,platforms}.json。 */
import "./styles/tokens.css";
import "./styles/main.css";
import { h } from "./ui/dom";
import { renderHeader } from "./ui/header";
import { renderPodiums, renderPodiumsSecond } from "./ui/highlights";
import { renderApi, renderPlans, renderPlatforms, renderScatter } from "./ui/catalog";
import { renderBuyingRoute, renderFeatured } from "./ui/featured";
import { money, num } from "./ui/format";
import type { CnyView, PlatformsFile, RawApi, RawPlan } from "./types";

const app = document.getElementById("app");
if (!app) throw new Error("缺少站点入口 #app");
const section = (id: string, number: string, title: string, intro: string, content: HTMLElement) =>
  h("section", { id, class: "section shell" }, [h("header", { class: "section__head" }, [
    h("div", null, [h("span", { class: "section__index" }, number), h("h2", { class: "section__title" }, title)]),
    h("p", { class: "section__desc" }, intro),
  ]), content]);

/** 优先请求实时 API；任一请求失败后整组读取本站构建快照，避免混入不同时间的数据。 */
async function loadData(): Promise<{ view: CnyView; rawPlans: RawPlan[]; rawApi: RawApi[]; platforms: PlatformsFile; rankings: { snapshotDate: string; models: unknown[] }; snapshot: boolean }> {
  const names = ["cny", "plans", "api-prices", "platforms", "rankings"];
  const fetchSet = async (base: string) => Promise.all(names.map(async (name) => {
    const url = `${base}/${name}${base.includes("/data") ? ".json" : ""}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!response.ok) throw new Error(`${url} 返回 HTTP ${response.status}`);
    return response.json();
  }));
  try {
    const [view, rawPlans, rawApi, platforms, rankings] = await fetchSet("https://api.supercli.site/v1");
    return { view, rawPlans, rawApi, platforms, rankings, snapshot: false };
  } catch {
    const [view, rawPlans, rawApi, platforms, rankings] = await fetchSet(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/data`);
    return { view, rawPlans, rawApi, platforms, rankings, snapshot: true };
  }
}

async function mount() {
  const { view, rawPlans, rawApi, platforms, rankings, snapshot } = await loadData();
  const hero = h("section", { class: "hero" }, [h("div", { class: "shell hero__inner" }, [
    h("div", { class: "hero__copy" }, [
      h("span", { class: "hero__badge" }, "TOKENPLAN / SUPERCLI"),
      h("h1", null, ["找到值得付费的", h("br"), h("span", null, "AI 编程能力。")]),
      h("p", null, "先看云厂商官方 Coding / Token Plan，再对照国内外 API 报价与公开模型评测。价格按人民币统一展示，额度与价格条件以官方条款为准。"),
      h("div", { class: "hero__actions" }, [h("a", { href: "#route", class: "button button--primary" }, "查看选购路线 ↗"),
        h("a", { href: "#value", class: "button button--outline" }, "对比性价比 ↗")]),
      h("span", { class: "hero__date" }, `汇率基准 ${view.fx.date} · 1 USD ≈ ¥${view.fx.rate} · 报价各自按核实日期`),
    ]),
    h("div", { class: "terminal", "aria-label": "数据概览" }, [
      h("div", { class: "terminal__bar" }, [h("span", { class: "terminal__dots", "aria-hidden": "true" }, "● ● ●"), "tokenplan / overview"]),
      h("div", { class: "terminal__body" }, [
        h("p", null, [h("span", { class: "terminal__prompt" }, "$"), " tokenplan compare --all"]),
        h("p", { class: "terminal__muted" }, "// 官方来源快照已加载，价格条件可逐项核对"),
        h("div", { class: "terminal__metric" }, [h("span", null, "套餐条目"), h("strong", null, num(view.plans.length))]),
        h("div", { class: "terminal__metric" }, [h("span", null, "API 报价"), h("strong", null, num(view.api.length))]),
        h("div", { class: "terminal__metric" }, [h("span", null, "上游模型记录"), h("strong", null, num(rankings.models.length))]),
        h("p", { class: "terminal__status" }, `✓ ${view.models.length} 项具备任务成本 · 快照 ${rankings.snapshotDate}`),
      ]),
    ]),
  ])]);
  const method = h("div", { class: "method" }, [
    ["月费", view.method.planMonthly], ["API 综合价", view.method.apiBlended],
    ["模型性价比", view.method.value], ["评选边界", view.method.excluded],
  ].map(([title, text]) => h("article", { class: "method__item" }, [h("h3", null, title), h("p", null, text)])));
  const dataNotice = h("p", { class: "data-notice shell", role: "status" }, snapshot
    ? `当前展示本站构建时收录的数据快照（汇率基准 ${view.fx.date}）；API 暂不可用，价格不是实时值，请按各条核实日期与来源确认。`
    : `当前数据来自 api.supercli.site；汇率基准 ${view.fx.date}，价格以各条核实日期和官方来源为准。`);
  app!.append(renderHeader(), dataNotice, h("main", null, [hero,
    section("route", "01 / EDITOR PICKS", "webkubor 的选购路线", "基于使用场景的编辑推荐，与价格事实分开看。", renderBuyingRoute(view.plans, rawPlans, view.api, rawApi)),
    section("featured", "02 / OFFICIAL CLOUD", "先从云厂商官方入口开始", "仅列云平台官方、纯模型额度且仍在售的套餐；DeepSeek V4 Flash 原厂 API 为单独标注的直连例外。", renderFeatured(view.plans, rawPlans, view.api, rawApi)),
    section("highlights", "02 / PRICE RANGE", "价格分布速览", "展示公开报价的两端，不作为购买推荐或性价比排名；额度与单价不同维度不可直接相除。", renderPodiums(view, view.plans, view.api, view.models)),
    section("plans", "02 / SUBSCRIPTIONS", "Coding Plan 套餐", "在这里中立对照原厂、云平台和其他渠道。月费仅是价格维度，额度、限流与超额规则以各条官方来源为准。", renderPlans(view.plans, rawPlans)),
    section("api", "03 / TOKEN PRICES", "API 单价对照", "人民币 / 百万 tokens。分别列缓存未命中输入、缓存命中与输出；3:1 综合价仅是标准化参考，峰谷时段、阶梯价和有效条件见各条备注。", renderApi(view.api, rawApi)),
    section("value", "04 / MODEL VALUE", "能力与成本，放在一张图", "横轴为单任务人民币成本，纵轴为 Agentic Index；点位来自同时具备两项观测值的模型。", renderScatter(view.models)),
    section("platforms", "05 / MARKETPLACE", "在哪里购买", "区分原厂、云平台和聚合渠道，留意额度是否绑定工具。", renderPlatforms(platforms, view.plans, view.api)),
    section("more", "06 / THE OTHER END", "还有哪些极值", "两端的 API 价格与套餐附带额度，提供另一种挑选视角。", renderPodiumsSecond(view, view.plans, view.api)),
    section("method", "07 / METHODOLOGY", "数据怎么计算", "统一币种只用于对照，不代表实时结算价格。", method),
  ]), h("footer", { class: "site-footer" }, [h("div", { class: "shell site-footer__grid" }, [
    h("span", null, "TokenPlan · SuperCLI"),
    h("span", null, ["汇率 ", money(view.fx.rate), " / USD · ", view.fx.date, " · ",
      h("a", { href: view.fx.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, view.fx.source)]),
    h("a", { href: "https://supercli.site", target: "_blank", rel: "noopener noreferrer" }, "SuperCLI 主站 ↗"),
  ])]));
}

mount().catch((error: unknown) => {
  const reason = error instanceof Error ? error.message : String(error);
  const retry = h("button", { type: "button" }, "重新加载");
  retry.addEventListener("click", () => window.location.reload());
  app!.append(h("div", { class: "error shell", role: "alert" }, [
    h("h1", null, "价格数据暂时无法加载"), h("p", null, `加载失败：${reason}`), retry,
  ]));
});
