/** 数据模型：与 data/*.schema.json 一一对应，站点侧只读。 */

export interface PlanPrice {
  amount: number | null;
  currency: "CNY" | "USD";
  period: "month" | "quarter" | "year" | "week" | "none";
  firstPeriodAmount?: number | null;
  note?: string | null;
}

export interface Plan {
  id: string;
  vendor: string;
  name: string;
  region: "cn" | "global";
  kind: "coding-plan" | "token-plan" | "ide" | "free";
  price: PlanPrice;
  models?: string[];
  quota: string;
  quotaWindow?: { fiveHours?: string | null; week?: string | null; month?: string | null } | null;
  tokenAllowance?: { amount: number; unit: string; period: string; model?: string | null } | null;
  multimodal?: boolean | null;
  buyUrl: string;
  sourceUrl: string;
  verifiedAt: string;
  status: "active" | "sold-out-daily" | "discontinued" | "coming-soon" | "unknown" | "no-plan";
  includedCredit?: { amount: number | null; currency: string; period: string; text: string } | null;
  confidence: "high" | "medium" | "low";
  notes?: string | null;
}

export interface ApiPrice {
  id: string;
  vendor: string;
  model: string;
  region: "cn" | "global";
  currency: "CNY" | "USD";
  input: number;
  output: number;
  cacheHit?: number | null;
  cacheWrite?: number | null;
  context?: string | null;
  tiering?: string | null;
  multimodal?: boolean | null;
  buyUrl: string;
  sourceUrl: string;
  verifiedAt: string;
  confidence: "high" | "medium" | "low";
  notes?: string | null;
}

export interface RankedModel {
  model: string;
  baseModel: string;
  variant: string | null;
  creator: string;
  openWeights: boolean;
  releaseDate: string | null;
  agenticIndex: number | null;
  costPerTaskUsd: number | null;
  outputTps: number | null;
  latencyMs: number | null;
  valueScore: number | null;
  onModelGo: boolean;
  modelgoId: string | null;
  markets: string[];
  priceUsdPer1M: { input: number | null; output: number | null; cacheHit: number | null } | null;
}

export interface Rankings {
  source: string;
  attribution: string;
  snapshotDate: string;
  total: number;
  valueMinIndex: number;
  highlights: { topOverall: string[]; topOpenWeights: string[]; bestValue: string[] };
  models: RankedModel[];
}

async function fetchJson<T>(file: string): Promise<T | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/${file}`, { cache: "no-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const loadPlans = () => fetchJson<Plan[]>("plans.json");
export const loadApiPrices = () => fetchJson<ApiPrice[]>("api-prices.json");
export const loadRankings = () => fetchJson<Rankings>("rankings.json");
