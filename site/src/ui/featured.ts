/** 官方云平台套餐入口；路由：/#featured；API：由 main 注入的 cny 和 plans 数据。 */
import { h } from "./dom";
import { money } from "./format";
import { modelBadge, vendorBadge } from "./model-icons";
import type { CnyApi, CnyPlan, RawApi, RawPlan } from "../types";

/** 按可核实的销售主体挑入口；月费仅辅助定位，绝不用于性价比推荐排序。 */
/** 用户选购经验导航，编辑判断和报价事实分别列示，购买入口只向在售官方产品开放。 */
export function renderBuyingRoute(plans: CnyPlan[], raw: RawPlan[], api: CnyApi[], rawApi: RawApi[]): HTMLElement {
  const detail = new Map(raw.map((p) => [p.id, p]));
  const paths: [string, string, string, string[]][] = [
    ["按量调用", "DeepSeek V4 Flash", "先对比高峰和空闲价格，并确认缓存是否命中；Search / Fetch 工具另收费。", ["deepseek-flash-cn"]],
    ["个人 Agent", "MiniMax M 计划", "个人交互式 Agent 优先看 M Plan：5 小时和周双窗口，未用额度不结转。团队请使用独立账户并按官方企业或按量方案确认，不共享个人账号。",  ["minimax-m-plan-explore", "minimax-m-plan-go"]],
    ["国内 Coding", "智谱 GLM Coding", "先看个人 Coding Plan：限定官方指定工具，个人账户不可共享；团队使用团队版，自建 SaaS/API 走标准 API。", ["zhipu-glm-coding-pro", "zhipu-glm-coding-lite"]],
    ["海外 Coding", "Claude → Codex → Grok", "Claude 条件合适时优先；再看 Codex 和 Grok。各家额度及重置规则以官方当前页面为准。", ["claude-pro", "chatgpt-plus", "xai-supergrok"]],
    ["海外工具订阅", "Cursor", "偏 Grok 使用及工具整合时值得看；Plus 月费仅含 Grok，Premium 起 Claude / GPT 等第三方模型另按 API 价计费。查看官方当前规则。", ["cursor-plus"]],
  ];
  return h("div", null, [
    h("p", { class: "featured__notice" }, "webkubor 的使用经验与选购顺序；属于编辑推荐，不是官方评测或保证。价格、限额和状态来自各条记录，请以官方实时条款为准。"),
    h("div", { class: "route-grid" }, paths.map(([context, name, desc, ids]) => {
      const entries = ids.map((id) => ({ plan: plans.find((p) => p.id === id), raw: detail.get(id), api: api.find((p) => p.id === id), rawApi: rawApi.find((p) => p.id === id) }));
      return h("article", { class: "route-card" }, [
        h("span", { class: "featured-card__category" }, context), h("h3", null, name), h("p", null, desc),
        h("div", { class: "route-card__links" }, entries.map(({ plan, raw: entry, api: apiEntry, rawApi: apiDetail }) => {
          const active = plan ? ["active", "sold-out-daily"].includes(plan.status) : !!apiEntry && apiEntry.offering === "first-party" && apiEntry.confidence === "high";
          const url = entry?.buyUrl ?? apiDetail?.buyUrl;
          if (!active || !url || !/^https:\/\//.test(url)) return null;
          return h("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, `${plan?.name ?? apiEntry?.model ?? name} · 官网 ↗`);
        })),
      ]);
    })),
  ]);
}

export function renderFeatured(plans: CnyPlan[], raw: RawPlan[], api: CnyApi[], rawApi: RawApi[]): HTMLElement {
  const source = new Map(raw.map((p) => [p.id, p]));
  const eligible = plans.filter((p) => p.offering === "cloud-platform" && p.bundle === "model-access"
    && ["active", "sold-out-daily"].includes(p.status) && p.confidence !== "low"
    && /^https:\/\//.test(source.get(p.id)?.buyUrl ?? ""));
  const vendors = new Set<string>();
  const shown = eligible.filter((p) => {
    if (vendors.has(p.vendor)) return false;
    vendors.add(p.vendor);
    return true;
  });
  const flash = api.find((item) => item.id === "deepseek-flash-cn" && item.offering === "first-party");
  const flashDetails = rawApi.find((item) => item.id === flash?.id);
  if (!shown.length && !flash) return h("p", { class: "empty" }, "暂无核实过购买链接的官方云平台纯模型额度套餐。请查看完整套餐清单与来源。");
  return h("div", null, [
    h("p", { class: "featured__notice" }, "按厂商各展示一个可核实的官方入口，属于购买导航，不是性价比排名。各套餐请求额度、模型范围、限流与计费方式不同，请点开来源核对。"),
    h("div", { class: "featured-grid" }, shown.map((p) => {
      const detail = source.get(p.id)!;
      return h("article", { class: "featured-card" }, [
        h("span", { class: "featured-card__category" }, `${p.vendor} · 云平台官方`),
        h("div", { class: "model-cell" }, [vendorBadge(p.platformId, p.vendor), h("h3", null, p.name)]),
        h("p", { class: "featured-card__price" }, [money(p.monthlyCny), h("small", null, " / 月折算")]),
        h("p", { class: "featured-card__quota" }, detail.quota || "额度请按官方条款核对"),
        h("p", { class: "detail-note" }, `核实 ${detail.verifiedAt} · ${p.status === "sold-out-daily" ? "每日限量" : "在售"}`),
        h("div", { class: "featured-card__links" }, [
          h("a", { href: detail.buyUrl!, target: "_blank", rel: "noopener noreferrer" }, "前往官方购买 ↗"),
          h("a", { href: detail.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "核对来源"),
        ]),
      ]);
    })),
    flash && flashDetails ? h("article", { class: "featured-card featured-card--api" }, [
      h("span", { class: "featured-card__category" }, "DeepSeek · 原厂 API 直连例外"),
      h("div", { class: "model-cell" }, [modelBadge("DeepSeek V4 Flash"), h("h3", null, "DeepSeek V4 Flash / deepseek-flash")]),
      h("p", { class: "featured-card__quota" }, `当前表列高峰价（每百万 tokens）：缓存未命中输入 ${money(flash.inputCny)} / 缓存命中 ${money(flash.cacheHitCny)} / 输出 ${money(flash.outputCny)}。空闲价与时段详见官方来源。`),
      h("p", { class: "detail-note" }, flashDetails.tiering ?? "峰谷时段以官方说明为准"),
      h("p", { class: "detail-note" }, flashDetails.notes ?? "搜索与 Fetch 工具调用可能另计费；请查看官方价格表。"),
      h("p", { class: "detail-note" }, `核实 ${flashDetails.verifiedAt}。缓存命中价不是统一输入价。`),
      h("div", { class: "featured-card__links" }, [
        h("a", { href: flashDetails.buyUrl, target: "_blank", rel: "noopener noreferrer" }, "前往 DeepSeek 官方 ↗"),
        h("a", { href: flashDetails.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "核对价格与时段"),
      ]),
    ]) : null,
  ]);
}
