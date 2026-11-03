/** Public datasets contain official-source research, never credentials or internal social feeds. */
import assert from "node:assert/strict";
const PRIVATE_FIELD = /^(pass(?:word|wd)|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|private[_-]?key)$/i;
const SOCIAL = /(^|\.)(xiaohongshu\.com|xhslink\.com|douyin\.com|iesdouyin\.com|tiktok\.com)$/i;
export function assertPublicData(value, path = "data") {
  if (Array.isArray(value)) return value.forEach((v, index) => assertPublicData(v, `${path}[${index}]`));
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert(!PRIVATE_FIELD.test(key), `Private field forbidden at ${path}.${key}`);
      assertPublicData(child, `${path}.${key}`);
    }
    return;
  }
  if (typeof value !== "string") return;
  assert(!/(?:file:\/\/|\/Users\/|Bearer\s+[A-Za-z0-9._-]{12,}|-----BEGIN .*PRIVATE KEY-----)/i.test(value), `Private value forbidden at ${path}`);
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    assert(!url.username && !url.href.split("/")[2].includes("@"), `Credentials in URL forbidden at ${path}`);
    assert(!SOCIAL.test(url.hostname), `Internal social source forbidden at ${path}`);
    assert(!/^(localhost|127\.|192\.168\.|10\.)/.test(url.hostname), `Private host forbidden at ${path}`);
    for (const key of url.searchParams.keys())
      assert(!PRIVATE_FIELD.test(key), `Credential query forbidden at ${path}`);
  }
}
