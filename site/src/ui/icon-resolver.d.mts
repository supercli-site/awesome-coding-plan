/** 共享图标纯解析器的浏览器侧类型契约。 */
export function iconForVendor(platformId: string | null | undefined): string | null;
export function iconForModel(name: string): string | null;
export function iconFilename(slug: string): string;
export function iconForRankedModel(name: string, creator: string): {
  slug: string | null;
  kind: "model" | "creator" | "none";
  label: string;
  reason: string | null;
};
