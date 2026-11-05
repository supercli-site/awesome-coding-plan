/** 无 DOM 的图标解析器，构建检查与浏览器共享同一规则。 */
import manifest from "./icon-manifest.json" with { type: "json" };

export function iconForVendor(platformId) {
  return platformId && Object.hasOwn(manifest.vendors, platformId) ? manifest.vendors[platformId] : null;
}
export function iconForModel(name) {
  const key = Object.keys(manifest.families).find((prefix) => new RegExp(`^${prefix}(?=[\\s\\d.(/-]|$)`, "i").test(name.trim()));
  return key ? manifest.families[key] : null;
}
export function iconForRankedModel(name, creator) {
  const family = iconForModel(name);
  if (family) return { slug: family, kind: "model", label: "模型标识", reason: null };
  if (Object.hasOwn(manifest.creators, creator)) return { slug: manifest.creators[creator], kind: "creator", label: "厂商标识", reason: null };
  return { slug: null, kind: "none", label: "暂无已核实标识", reason: Object.hasOwn(manifest.unidentifiedCreators, creator) ? manifest.unidentifiedCreators[creator] : null };
}
export function iconFilename(slug) {
  return `${slug}.${["zed-official", "thinkingmachines-official", "multiverse-official"].includes(slug) ? "png" : slug === "comate-official" ? "ico" : "svg"}`;
}
