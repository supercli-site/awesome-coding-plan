/** 站点侧类型：cny.json（派生）+ 原始数据（详情）合并后的形状。 */

export interface Fx {
  rate: number;
  date: string;
  source: string;
  sourceUrl: string;
  fallbackUsed: boolean;
}

export interface CnyPlan {
  id: string;
  vendor: string;
  name: string;
  region: "cn" | "global";
  kind: string;
  originalCurrency: "CNY" | "USD";
  monthlyCny: number | null;
  firstPeriodCny: number | null;
  includedCreditCny: number | null;
  creditRatio: number | null;
  confidence: "high" | "medium" | "low";
  status: string;
  platformId: string | null;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller" | null;
  offeringLabel: string | null;
  bundle: "model-access" | "tool" | null;
  bundleLabel: string | null;
  platformUrl: string | null;
  // 来自 plans.json 的详情
  quota?: string;
  models?: string[];
  buyUrl?: string | null;
  sourceUrl?: string;
  verifiedAt?: string;
  notes?: string | null;
  multimodal?: boolean | null;
}

export interface CnyApi {
  id: string;
  vendor: string;
  model: string;
  region: "cn" | "global";
  originalCurrency: "CNY" | "USD";
  inputCny: number;
  outputCny: number;
  cacheHitCny: number | null;
  blendedCny: number;
  confidence: "high" | "medium" | "low";
  platformId: string | null;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller" | null;
  offeringLabel: string | null;
  platformUrl: string | null;
  context?: string | null;
  tiering?: string | null;
  sourceUrl?: string;
  buyUrl?: string;
  verifiedAt?: string;
  notes?: string | null;
}

export interface CnyModel {
  model: string;
  creator: string;
  openWeights: boolean;
  agenticIndex: number | null;
  costPerTaskCny: number | null;
  valuePerYuan: number | null;
  inputCny: number | null;
  outputCny: number | null;
}

export interface Platform {
  id: string;
  name: string;
  url: string;
  offering: "first-party" | "cloud-platform" | "tool-vendor" | "reseller";
  bundle: "model-access" | "tool";
  note: string;
}

export interface PlatformsFile {
  offeringDefs: Record<string, { label: string; desc: string }>;
  bundleDefs: Record<string, { label: string; desc: string }>;
  platforms: Platform[];
}

export interface CnyView {
  fx: Fx;
  method: Record<string, string>;
  highlights: {
    plans: { cheapest: string[]; priciest: string[]; mostCredit: string[] };
    api: { cheapest: string[]; priciest: string[] };
    models: { bestValue: string[]; cheapestPerTask: string[] };
  };
  plans: CnyPlan[];
  api: CnyApi[];
  models: CnyModel[];
}

export interface RawPlan {
  id: string;
  quota: string;
  models?: string[];
  buyUrl?: string | null;
  sourceUrl: string;
  verifiedAt: string;
  notes?: string | null;
  multimodal?: boolean | null;
  price: { note?: string | null };
  includedCredit?: { text?: string } | null;
}

export interface RawApi {
  id: string;
  context?: string | null;
  tiering?: string | null;
  sourceUrl: string;
  buyUrl: string;
  verifiedAt: string;
  notes?: string | null;
}
