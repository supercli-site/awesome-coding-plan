import test from "node:test";
import assert from "node:assert/strict";
import { convertCny } from "./currency.mjs";
import { assertPublicData } from "./public-boundary.mjs";

test("cache-hit and low token prices retain precision instead of becoming free", () => {
  assert.equal(convertCny(0.001, "USD", 6.7186, 6), 0.006719);
  assert.equal(convertCny(0.02, "CNY", 6.7186, 6), 0.02);
  assert.equal(convertCny(20, "USD", 6.7186), 134.37);
  assert.equal(convertCny(null, "USD", 6.7186), null);
  assert.equal(convertCny(0, "USD", 6.7186, 6), 0);
});
test("invalid exchange rates and prices do not silently produce comparable data", () => {
  for (const args of [[2,"USD",0],[NaN,"CNY",6.7],[-1,"USD",6.7],[1,"EUR",6.7]])
    assert.throws(() => convertCny(...args));
});
test("public boundary accepts ordinary public model pricing", () => {
  assert.doesNotThrow(() => assertPublicData({ sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing", input:2, cacheHit:0.04, quotaUnit:"tokens", notes:"缓存命中另计" }));
});
test("internal social datasets and credential fields are rejected at any depth", () => {
  for (const value of [
    {sourceUrl:"https://www.xiaohongshu.com/explore/internal"},
    {nested:[{sourceUrl:"https://v.douyin.com/private"}]},
    {nested:{apiKey:"test-only"}},
    {sourceUrl:"https://user:example@public.example/pricing"},
    {sourceUrl:"https://public.example/pricing?access_token=test-only"},
    {notes:"file:///private/internal/file"},
  ]) assert.throws(() => assertPublicData(value));
});
