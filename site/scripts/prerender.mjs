import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const data = (name) => JSON.parse(readFileSync(new URL(`data/${name}.json`, root), 'utf8'));
const plans = data('plans');
const api = data('api-prices');
const view = data('cny');
const rankings = data('rankings');
const platforms = data('platforms');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (url, label) => /^https:\/\//.test(url ?? '') ? `<a href="${esc(url)}">${esc(label)}</a>` : '';
const status = { active: '在售', discontinued: '已停售', 'sold-out-daily': '每日售罄', 'no-plan': '无套餐', 'coming-soon': '即将推出' };
const planRows = plans.map(p => {
  const price = p.kind === 'free' ? '免费档' : p.price.amount == null ? '官方未公布' : `${p.price.currency} ${p.price.amount} / ${p.price.period}`;
  const first = p.price.firstPeriodAmount == null ? '' : `；首期优惠 ${p.price.currency} ${p.price.firstPeriodAmount}，不参与月费排序`;
  return `<li><strong>${esc(p.vendor)} ${esc(p.name)}</strong>：${esc(status[p.status] ?? p.status)}；${esc(price)}${esc(first)}。${esc(p.quota ?? '')} ${esc(p.price.note ?? '')} ${esc(p.notes ?? '')} ${link(p.sourceUrl, '官方来源')} ${link(p.buyUrl, '购买入口')}（核实日期 ${esc(p.verifiedAt)}）</li>`;
}).join('\n');
const apiRows = api.map(p => `<li><strong>${esc(p.vendor)} ${esc(p.model)}</strong>：每百万 tokens 输入 ${esc(p.currency)} ${esc(p.input ?? '官方未公布')}，输出 ${esc(p.currency)} ${esc(p.output ?? '官方未公布')}，缓存命中 ${p.cacheHit == null ? '官方未公布' : `${esc(p.currency)} ${esc(p.cacheHit)}`}。${esc(p.tiering ?? '')} ${esc(p.notes ?? '')} ${link(p.sourceUrl, '官方来源')}（核实日期 ${esc(p.verifiedAt)}）</li>`).join('\n');
const platformRows = platforms.platforms.map(p => `<li>${link(p.url, p.name)}：${esc(platforms.offeringDefs[p.offering]?.label ?? p.offering)}；${esc(platforms.bundleDefs[p.bundle]?.label ?? p.bundle)}。${esc(p.note ?? '')}</li>`).join('\n');
const html = `<header class="site-header"><nav class="shell" aria-label="站点导航"><a href="/">TokenPlan</a> · <a href="#plans">套餐</a> · <a href="#api">API 价格</a> · <a href="#value">公开评测</a> · <a href="#platforms">平台</a> · <a href="#method">计算方法</a></nav></header><main><section class="hero"><div class="shell"><h1>AI 编程套餐与 API 价格对比</h1><p>TokenPlan 汇总国内外 AI 编程套餐、按量 API 价格与公开模型评测，提供官方来源和核实日期，帮助开发者核对价格及购买条件。</p><p>构建快照：套餐 ${plans.length} 项，API 报价 ${api.length} 项，公开评测模型 ${rankings.models.length} 项；评测快照 ${esc(rankings.snapshotDate)}，汇率日期 ${esc(view.fx.date)}。</p></div></section><section id="plans" class="section shell"><h2>Coding Plan 套餐</h2><p>免费档单独标识；停售和每日售罄状态按数据记录展示。首期优惠与普通价格分列，价格与额度以官方条款为准。</p><ul>${planRows}</ul></section><section id="api" class="section shell"><h2>API 按量价格</h2><p>输入、输出和缓存命中单价分别列示；峰谷时段、阶梯价格与其他条件见备注和官方来源。</p><ul>${apiRows}</ul></section><section id="value" class="section shell"><h2>模型能力与成本：公开评测</h2><p>数据引用 ${link(rankings.source, 'ModelGo 公开排行')}；${esc(rankings.attribution)}。快照日期 ${esc(rankings.snapshotDate)}。评测不代表本站自行测试，实际任务结果可能不同。</p><p>${esc(view.method.value)}。${esc(view.method.excluded)}。</p></section><section id="platforms" class="section shell"><h2>购买平台与渠道</h2><ul>${platformRows}</ul></section><section id="method" class="section shell"><h2>数据来源与计算方法</h2><p>${esc(view.method.planMonthly)}。${esc(view.method.apiBlended)}。汇率 ${esc(view.fx.date)}，${link(view.fx.sourceUrl, view.fx.source)}。价格可能调整，购买前请核实官方来源。</p><p>查看 <a href="/llms.txt">机器可读摘要</a>、<a href="/data/plans.json">套餐数据</a>、<a href="/data/api-prices.json">API 数据</a>与<a href="/data/rankings.json">公开评测数据</a>。</p></section></main><footer class="site-footer shell"><a href="https://supercli.site/">SuperCLI 主站</a></footer>`;
const llms = `# TokenPlan\n\n> AI 编程套餐、API 价格和公开模型评测的来源索引。\n\n## 数据快照\n\n- 套餐条目：${plans.length}；API 报价：${api.length}；公开评测模型：${rankings.models.length}。\n- 公开评测快照：${rankings.snapshotDate}；汇率日期：${view.fx.date}。\n- 免费档不是付费订阅；停售条目有状态标记。首期优惠、缓存命中与峰谷价格须与普通价格分开核对。\n- 模型排行来自公开评测：${rankings.attribution}。\n\n## 内容与数据\n\n- [首页](https://plan.supercli.site/)：套餐、API、评测和方法。\n- [套餐数据](https://plan.supercli.site/data/plans.json)：官方来源、价格、状态和核实日期。\n- [API 价格](https://plan.supercli.site/data/api-prices.json)：输入、输出和缓存命中价格及计费条件。\n- [人民币视图](https://plan.supercli.site/data/cny.json)：换算与排序口径。\n- [平台数据](https://plan.supercli.site/data/platforms.json)：销售主体与绑定方式。\n- [公开评测数据](https://plan.supercli.site/data/rankings.json)：引用来源及快照。\n`;
const index = new URL('../dist/index.html', import.meta.url);
const source = readFileSync(index, 'utf8');
if (!source.includes('<div id="app"></div>')) throw new Error('Missing app mount point');
writeFileSync(index, source.replace('<div id="app"></div>', `<div id="app">${html}</div>`));
writeFileSync(new URL('../dist/llms.txt', import.meta.url), llms);
console.log(`Prerendered ${plans.length} plans, ${api.length} API prices and ${rankings.models.length} ranking records.`);
