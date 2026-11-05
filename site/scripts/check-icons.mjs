/** 构建前门禁：真实映射覆盖、资产安全/哈希、状态价格语义；仅本地读取。 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { iconForModel, iconForVendor, iconFilename, iconForRankedModel } from "../src/ui/icon-resolver.mjs";
const root = new URL("../../", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const manifest = json("site/src/ui/icon-manifest.json");
const sources = json("site/src/ui/icon-sources.json");
const platforms = json("data/platforms.json").platforms;
const plans = json("data/plans.json");
const api = json("data/api-prices.json");
const view = json("data/cny.json");
const failures = [];
const check = (truth, text) => { if (!truth) failures.push(text); };
const slugs = new Set([...Object.values(manifest.vendors), ...Object.values(manifest.families), ...Object.values(manifest.creators)]);
for (const slug of slugs) {
  const file = iconFilename(slug);
  const url = new URL(`site/public/model-icons/${file}`, root);
  if (!existsSync(url)) { failures.push(`Missing asset ${file}`); continue; }
  const bytes = readFileSync(url);
  const evidence = sources[file];
  check(evidence && /^https:\/\//.test(evidence.source) && evidence.license, `Missing provenance ${file}`);
  check(createHash("sha256").update(bytes).digest("hex") === evidence?.sha256, `Unexpected asset modification ${file}`);
  if (file.endsWith(".svg")) {
    const svg = bytes.toString("utf8");
    check(/<svg\b/.test(svg) && /<\/(?:svg)>/.test(svg), `Invalid SVG ${file}`);
    check(!/<(?:script|foreignObject|image|animate\w*|set)\b|\bon\w+\s*=|<!DOCTYPE|<!ENTITY/i.test(svg), `Unsafe active SVG ${file}`);
    check(!/(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)[^)]/i.test(svg), `External SVG resource ${file}`);
  } else if (file.endsWith(".png")) check(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `Invalid PNG ${file}`);
  else check(bytes.readUInt32LE(0) === 0x00010000, `Invalid ICO ${file}`);
}
for (const platform of platforms) check(iconForVendor(platform.id), `Unmapped platform ${platform.id}`);
for (const entry of api) check(iconForModel(entry.model), `Unmapped API model ${entry.id}: ${entry.model}`);
let tags = 0;
let vendorTags = 0;
for (const plan of plans) {
  check(iconForVendor(plan.platformId), `Unmapped plan vendor ${plan.id}: ${plan.platformId}`);
  for (const model of plan.models ?? []) {
    tags++;
    if (!iconForModel(model)) vendorTags++;
    check(iconForModel(model) || iconForVendor(plan.platformId), `Unidentified model tag ${plan.id}: ${model}`);
  }
}
assert.equal(iconForModel("Multiple (Claude/GPT/Gemini)"), null, "Mixed model labels cannot pretend to be Claude");
assert.equal(iconForModel("Unknown based on GPT"), null, "Embedded brand names cannot trigger model logos");
assert.equal(iconForVendor("unknown-new-brand"), null, "Unknown vendors must not inherit another brand");
const rankingStats = { model: 0, creator: 0, none: 0 };
const visibleStats = { model: 0, creator: 0, none: 0 };
for (const entry of view.models) {
  const resolved = iconForRankedModel(entry.model, entry.creator);
  rankingStats[resolved.kind]++;
  const visible = Number.isFinite(entry.agenticIndex) && Number.isFinite(entry.costPerTaskCny) && entry.costPerTaskCny > 0;
  if (visible) visibleStats[resolved.kind]++;
  if (resolved.slug) check(slugs.has(resolved.slug), `Unvalidated ranking asset ${entry.model}`);
  else {
    check(typeof resolved.reason === "string" && resolved.reason.trim().length >= 20, `Unexplained ranking icon gap ${entry.model} / ${entry.creator}`);
    if (visible) console.log(`Explained visible icon gap: ${entry.model} / ${entry.creator} — ${resolved.reason}`);
  }
  if (resolved.kind === "creator") check(resolved.label === "厂商标识", `Creator fallback must not claim model identity ${entry.model}`);
}
assert.equal(iconForRankedModel("Quasar 438B (Based on GLM-5.2)", "Multiverse Computing").kind, "creator");
assert.equal(iconForRankedModel("New Anonymous Model", "Unknown Creator").reason, null, "New gaps must require explicit explanation");
const prices = new Map(view.plans.map((p) => [p.id, p]));
for (const plan of plans) {
  const p = prices.get(plan.id);
  check(p, `Missing derived plan ${plan.id}`);
  if (!p) continue;
  const value = p.monthlyCny;
  if (value !== null) check(Number.isFinite(value) && value >= 0, `Invalid price ${p.id}: ${value}`);
  if (["discontinued", "no-plan", "coming-soon"].includes(p.status)) continue;
  check(["active", "sold-out-daily"].includes(p.status), `Unpublishable price status ${p.id}: ${p.status}`);
  check(value !== null, `Missing active plan price ${p.id}`);
  check(p.kind === "free" ? value === 0 : Number.isFinite(value) && value > 0, `Invalid free/paid price ${p.id}: ${value}`);
}
if (process.argv.includes("--dist")) {
  for (const slug of slugs) {
    const file = iconFilename(slug);
    const built = new URL(`site/dist/model-icons/${file}`, root);
    check(existsSync(built), `Missing bundled icon ${slug}`);
    if (existsSync(built)) check(readFileSync(built).equals(readFileSync(new URL(`site/public/model-icons/${file}`, root))), `Bundled asset differs ${file}`);
  }
  for (const file of ["LICENSE", "README.md"]) check(existsSync(new URL(`site/dist/model-icons/${file}`, root)), `Missing bundled attribution ${file}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Icon checks passed: ${platforms.length}/${platforms.length} platforms; ${api.length}/${api.length} API rows (${new Set(api.map((p) => p.model)).size} model names); ${tags} model tags (${vendorTags} explicit seller marks); rankings ${view.models.length} records (model-family ${rankingStats.model}, creator marks ${rankingStats.creator}, explained unknown ${rankingStats.none}); visible ${Object.values(visibleStats).reduce((a,b)=>a+b,0)} (model-family ${visibleStats.model}, creator marks ${visibleStats.creator}, explained unknown ${visibleStats.none}); ${slugs.size} verified assets; ${plans.length} strict plan prices${process.argv.includes("--dist") ? "; built assets verified" : ""}.`);
