/**
 * 从 ModelGo 公开排行榜（https://modelgo.ai/models/rankings/agent）同步 Agent 模型快照。
 *
 * 数据源是该页面前端调用的公开只读接口，无需鉴权：
 *   GET https://modelgo-web-api.modelgo.ai/api/v1/model-discovery/rankings
 *       ?type=AGENT&metric=<AGENTIC_INDEX|COST_PER_TASK|VALUE_SCORE|OUTPUT_TPS|USAGE>&page=&page_size=
 * 原始评分来自 Artificial Analysis（Agentic Index / Cost per Task / TPS），
 * 使用量与 API 单价来自 ModelGo 平台。我们只保留公开展示的字段。
 *
 * 失败策略：接口偶发 SSL 握手失败，每个请求重试 4 次；
 * 任何指标拉取失败都不覆盖 data/rankings.json（宁可旧，不可空）。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BASE = "https://modelgo-web-api.modelgo.ai/api/v1/model-discovery/rankings";
const OUT = new URL("../data/rankings.json", import.meta.url);
const PAGE_SIZE = 100;
const VALUE_MIN_INDEX = 40;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "awesome-coding-plan-sync/1.0" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.code !== 0) throw new Error(`api code ${body.code}: ${body.msg}`);
      return body.data;
    } catch (err) {
      last = err;
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${url} → ${last?.message}`);
}

async function fetchAll(metric) {
  const items = [];
  let snapshotDate = "";
  for (let page = 1; page < 20; page++) {
    const q = new URLSearchParams({ type: "AGENT", metric, page: String(page), page_size: String(PAGE_SIZE) });
    const data = await getJson(`${BASE}?${q}`);
    snapshotDate ||= data.snapshot_date;
    items.push(...(data.items ?? []));
    if (items.length >= data.total || !data.items?.length) break;
  }
  return { snapshotDate, items };
}

const pick = (m) => ({
  model: m.model_name,
  baseModel: m.model_base_name,
  variant: m.model_variant ?? null,
  creator: m.creator_name,
  openWeights: !!m.is_open_source,
  releaseDate: m.release_date ?? null,
  agenticIndex: m.primary_score ?? null,
  costPerTaskUsd: m.cost_value ?? null,
  outputTps: m.output_tps ?? null,
  latencyMs: m.end_to_end_latency_ms ?? null,
  valueScore: m.value_score ?? null,
  onModelGo: !!m.is_integrated,
  modelgoId: m.modelgo_id ?? null,
  markets: m.integrated_markets ?? [],
  priceUsdPer1M: m.unit_prices
    ? {
        input: m.unit_prices.input_tokens ?? null,
        output: m.unit_prices.output_tokens ?? null,
        cacheHit: m.unit_prices.cache_hit_tokens ?? null,
      }
    : null,
});

async function main() {
  const agentic = await fetchAll("AGENTIC_INDEX");
  if (!agentic.items.length) throw new Error("AGENTIC_INDEX 返回 0 条，拒绝覆盖快照");

  const models = agentic.items.map(pick);
  const top = (arr, n) => arr.slice(0, n).map((m) => m.model);
  const snapshot = {
    source: "https://modelgo.ai/models/rankings/agent",
    attribution: "Agentic Index / Cost per Task / TPS: Artificial Analysis; usage & unit prices: ModelGo",
    snapshotDate: agentic.snapshotDate,
    total: models.length,
    valueMinIndex: VALUE_MIN_INDEX,
    highlights: {
      topOverall: top(models, 10),
      topOpenWeights: top(models.filter((m) => m.openWeights), 10),
      // 性价比 = Agentic Index ÷ 单任务成本。只在「够用」的模型里比，避免低档变体霸榜。
      bestValue: top(
        models
          .filter((m) => (m.agenticIndex ?? 0) >= VALUE_MIN_INDEX && m.valueScore != null)
          .sort((a, b) => b.valueScore - a.valueScore),
        10,
      ),
    },
    models,
  };

  const prev = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  const next = JSON.stringify(snapshot, null, 2) + "\n";
  if (prev === next) return console.log(`rankings 无变化（${snapshot.snapshotDate}）`);
  writeFileSync(OUT, next);
  console.log(`rankings 已更新：${snapshot.snapshotDate} · ${models.length} 个模型`);
}

main().catch((err) => {
  console.error(`同步失败，保留旧快照：${err.message}`);
  process.exit(1);
});
