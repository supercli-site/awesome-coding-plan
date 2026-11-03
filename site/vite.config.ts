// 站点构建：根 public 素材和 data JSON 一并进入 dist；不生成第二份数据真源。
import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";

const DATA_FILES = ["plans.json", "api-prices.json", "rankings.json", "fx.json", "cny.json", "platforms.json"];

export default defineConfig({
  publicDir: new URL("../public/", import.meta.url).pathname,
  plugins: [{
    name: "bundle-data",
    generateBundle() {
      for (const file of DATA_FILES) {
        const path = new URL(`../data/${file}`, import.meta.url);
        if (existsSync(path)) this.emitFile({ type: "asset", fileName: `data/${file}`, source: readFileSync(path) });
      }
    },
    configureServer(server) {
      server.middlewares.use("/data", (req, res, next) => {
        const name = req.url?.split("?")[0]?.replace(/^\//, "");
        if (!name || !DATA_FILES.includes(name)) return next();
        const path = new URL(`../data/${name}`, import.meta.url);
        if (!existsSync(path)) return next();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(readFileSync(path));
      });
    },
  }],
  build: { outDir: "dist" },
  server: { port: 5183, strictPort: true },
});
