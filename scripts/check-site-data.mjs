import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { assertPublicData } from "./public-boundary.mjs";

const FILES = ["plans.json", "api-prices.json", "platforms.json", "rankings.json", "fx.json", "cny.json"];
const source = new URL("../data/", import.meta.url);
const destination = new URL("../site/dist/data/", import.meta.url);
assert.deepStrictEqual(readdirSync(destination).sort(), [...FILES].sort(),
  "站点镜像只允许六份公开 JSON，不得混入研究、账号或额外数据");
for (const file of FILES) {
  const original = readFileSync(new URL(file, source));
  const mirrored = readFileSync(new URL(file, destination));
  assertPublicData(JSON.parse(mirrored.toString("utf8")), `site/dist/data/${file}`);
  assert.ok(original.equals(mirrored), `${file} 构建镜像与根数据不一致，请重新构建站点`);
}
console.log(`✅ 站点 ${FILES.length} 份公开 JSON 镜像逐字节一致`);
