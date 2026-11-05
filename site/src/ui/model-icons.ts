/** 真实品牌图标：平台 ID 严格对应售卖者，模型名只匹配开头家族；路由：站点单页。 */
import { h } from "./dom";
import { iconFilename, iconForModel, iconForVendor, iconForRankedModel } from "./icon-resolver.mjs";

function badge(slug: string | null, name: string, type: "model" | "vendor"): HTMLElement {
  if (!slug) return h("span", { class: "model-icon model-icon--unknown", title: `暂无${type === "model" ? "模型" : "厂商"}图标：${name}`, "aria-label": `暂无${type === "model" ? "模型" : "厂商"}图标` }, "·");
  return h("span", { class: "model-icon", title: `${name} · ${type === "model" ? "模型" : "厂商"}图标` },
    h("img", { src: `${import.meta.env.BASE_URL}model-icons/${iconFilename(slug)}`, alt: "", width: "22", height: "22", loading: "lazy", decoding: "async" }));
}

/** 只根据稳定平台 ID 显示售卖者标记。 */
export function vendorBadge(platformId: string | null | undefined, name: string): HTMLElement {
  return badge(iconForVendor(platformId), name, "vendor");
}

/** 无模型家族匹配时，使用已明确标注的销售者标记；不会冒充模型 logo。 */
/** 评测表明确露出模型/厂商标识类别；无标识时露出原因。 */
export function rankedModelBadge(name: string, creator: string): HTMLElement {
  const resolved = iconForRankedModel(name, creator);
  return h("span", { class: "ranking-mark", title: resolved.reason ?? undefined }, [
    badge(resolved.slug, resolved.kind === "creator" ? creator : name, resolved.kind === "model" ? "model" : "vendor"),
    h("small", { class: "detail-note" }, resolved.kind === "creator" ? `${creator} · 厂商标识` : resolved.label),
  ]);
}

export function modelBadge(name: string, platformId?: string | null): HTMLElement {
  const model = iconForModel(name);
  return model ? badge(model, name, "model") : badge(iconForVendor(platformId), name, "vendor");
}
