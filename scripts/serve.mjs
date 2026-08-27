// =============================================================
//  開発用の簡易サーバー（依存なし）
//  site.base 配下で公開する構成をローカルでも再現する。
// =============================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/lib/config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const base = site.base || "";
const port = Number(process.env.PORT) || 4323;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    // ベースパス配下でのみ配信（本番と同じ形）
    if (base) {
      if (urlPath === base) urlPath = "/";
      else if (urlPath.startsWith(base + "/")) urlPath = urlPath.slice(base.length);
      else if (urlPath === "/") {
        res.writeHead(302, { Location: base + "/" });
        return res.end();
      }
    }

    let filePath = path.join(distDir, urlPath);
    if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const alt = path.join(distDir, urlPath, "index.html");
      if (fs.existsSync(alt)) filePath = alt;
      else {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end("<h1>404</h1><p>" + urlPath + " は見つかりません</p>");
      }
    }

    const type = MIME[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(port, () => {
    console.log(`http://localhost:${port}${base}/ で確認できます`);
  });
