/** 数值格式化：全站统一口径，别在组件里各写一套。 */

const cny = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const cnyTiny = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 6, minimumFractionDigits: 2 });
const int = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });

/** 小于一分的 token / 任务成本保留最多六位；极小正数不显示为 ¥0.00。 */
export const money = (v: number | null | undefined) => {
  if (v == null) return "—";
  if (v !== 0 && Math.abs(v) < 0.000001) return `${v < 0 ? "−" : ""}¥<0.000001`;
  return `¥${Math.abs(v) < 0.01 && v !== 0 ? cnyTiny.format(v) : cny.format(v)}`;
};

export const moneyCompact = (v: number | null | undefined) => {
  if (v == null) return "—";
  if (v !== 0 && Math.abs(v) < 0.01) return money(v);
  if (v >= 10000) return `¥${(v / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return `¥${v >= 1000 ? cny.format(v) : v.toFixed(v < 10 ? 2 : 0)}`;
};

export const num = (v: number | null | undefined) => (v == null ? "—" : int.format(v));

export const pct = (v: number | null | undefined) => (v == null ? "—" : `${(v * 100).toFixed(0)}%`);

export const PERIOD: Record<string, string> = { month: "/月", quarter: "/季", year: "/年", week: "/周", none: "" };

export const REGION: Record<string, string> = { cn: "国内", global: "海外" };

export const KIND: Record<string, string> = {
  "coding-plan": "Coding Plan",
  "token-plan": "Token Plan",
  ide: "IDE",
  free: "免费",
};

export const STATUS: Record<string, string> = {
  active: "在售",
  "sold-out-daily": "每日限量",
  discontinued: "已下架",
  "coming-soon": "未上线",
  unknown: "未核实",
  "no-plan": "无套餐",
};

export const CONFIDENCE: Record<string, string> = { high: "已核实", medium: "部分核实", low: "未核实" };

/** 相对最贵者的条宽，用于表格里的可视化，避免引入图表库。 */
export const barWidth = (value: number | null, max: number) =>
  value == null || !max ? 0 : Math.max(2, Math.round((value / max) * 100));
