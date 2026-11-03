/**
 * 每日汇率：美元 → 人民币，用于把所有价格统一折算成人民币比较。
 *
 * 主源：中国外汇交易中心（CFETS）人民币汇率中间价，每个工作日 9:15 公示。
 *   https://www.chinamoney.com.cn/chinese/bkccpr/  （官网公示页）
 *   数据走官网自己的公开 JSON：/r/cms/www/chinamoney/data/fx/ccpr.json
 * 备源：欧洲央行（ECB）每日参考汇率，用 EUR/CNY ÷ EUR/USD 交叉得到 USD/CNY。
 *
 * 失败策略：
 * - 主源失败才用备源，并在 fx.json 里标明实际来源，不冒充中间价；
 * - 两路都失败 → 保留旧文件、退出码 1（宁可旧，不可空）；
 * - 数值越界（不在 5~9）或较上次变动超过 3% → 拒绝写入，防止解析错位把全站价格带偏。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OUT = new URL("../data/fx.json", import.meta.url);
const CFETS = "https://www.chinamoney.com.cn/r/cms/www/chinamoney/data/fx/ccpr.json";
const CFETS_PAGE = "https://www.chinamoney.com.cn/chinese/bkccpr/";
const ECB = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const ECB_PAGE = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (awesome-coding-plan fx sync)", accept: "*/*" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      last = err;
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${url} → ${last?.message}`);
}

async function fromCfets() {
  const body = JSON.parse(await get(CFETS));
  const usd = body.data && body.records?.find((r) => r.vrtEName === "USD/CNY");
  if (!usd) throw new Error("CFETS 返回里没有 USD/CNY");
  return {
    rate: Number(usd.price),
    date: body.data.lastDate.slice(0, 10),
    publishedAt: body.data.lastDate,
    source: "中国外汇交易中心 人民币汇率中间价",
    sourceUrl: CFETS_PAGE,
  };
}

async function fromEcb() {
  const xml = await get(ECB);
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rate = (cur) => Number(xml.match(new RegExp(`currency=['"]${cur}['"]\\s+rate=['"]([\\d.]+)['"]`))?.[1]);
  const usd = rate("USD");
  const cny = rate("CNY");
  if (!date || !usd || !cny) throw new Error("ECB XML 解析失败");
  return {
    rate: Number((cny / usd).toFixed(4)),
    date,
    publishedAt: date,
    source: "欧洲央行参考汇率（EUR/CNY ÷ EUR/USD 交叉）",
    sourceUrl: ECB_PAGE,
  };
}

async function main() {
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
  let fx;
  const errors = [];
  for (const [name, fn] of [["CFETS", fromCfets], ["ECB", fromEcb]]) {
    try {
      fx = await fn();
      break;
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  if (!fx) throw new Error(errors.join("；"));
  if (!(fx.rate > 5 && fx.rate < 9)) throw new Error(`汇率越界：${fx.rate}`);
  if (prev?.rate && Math.abs(fx.rate / prev.rate - 1) > 0.03) {
    throw new Error(`汇率较上次变动超过 3%（${prev.rate} → ${fx.rate}），疑似解析错位，需人工确认`);
  }

  const next = { base: "USD", quote: "CNY", ...fx, fallbackUsed: errors.length > 0, fetchedAt: new Date().toISOString().slice(0, 10) };
  if (prev && prev.rate === next.rate && prev.date === next.date) {
    return console.log(`汇率无变化：${next.rate}（${next.date}）`);
  }
  writeFileSync(OUT, JSON.stringify(next, null, 2) + "\n");
  console.log(`汇率已更新：1 USD = ${next.rate} CNY（${next.source}，${next.publishedAt}）`);
  if (errors.length) console.warn(`⚠️  主源失败，已用备源：${errors.join("；")}`);
}

main().catch((err) => {
  console.error(`汇率同步失败，保留旧值：${err.message}`);
  process.exit(1);
});
