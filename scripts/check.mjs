// =============================================================
//  公開前チェック
//  ツールが増えても品質が落ちないよう、機械的に検査できる項目を
//  すべてここで見る。npm run check で実行。
//  致命的な問題があれば終了コード1で落ちる（CIで止められる）。
// =============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories, site, owner } from "../src/lib/config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const toolsDir = path.join(root, "src", "tools");
const distDir = path.join(root, "dist");

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// ---- ツール定義の検査 ------------------------------------------------
const files = fs.existsSync(toolsDir)
  ? fs.readdirSync(toolsDir).filter((f) => f.endsWith(".mjs"))
  : [];

const tools = [];
for (const f of files) {
  const mod = await import(
    "file://" + path.join(toolsDir, f).replace(/\\/g, "/")
  );
  const t = mod.default;
  if (!t) {
    err(`${f}: default export がありません`);
    continue;
  }
  t.slug = t.slug || f.replace(/\.mjs$/, "");
  tools.push(t);
}

const slugs = new Set();
for (const t of tools) {
  const at = `[${t.slug}]`;

  // 必須項目
  for (const key of ["title", "h1", "description", "category", "ui", "guide"]) {
    if (!t[key]) err(`${at} ${key} がありません`);
  }
  if (slugs.has(t.slug)) err(`${at} slug が重複しています`);
  slugs.add(t.slug);

  if (!categories[t.category]) err(`${at} 未定義のカテゴリ: ${t.category}`);

  // タイトル: 検索結果で切れない長さに収める
  const tLen = [...(t.title || "")].length;
  if (tLen > 40) warn(`${at} title が長すぎます（${tLen}字。40字以内が目安）`);
  if (tLen < 12) warn(`${at} title が短すぎます（${tLen}字）`);

  // ディスクリプション
  const dLen = [...(t.description || "")].length;
  if (dLen > 130) warn(`${at} description が長すぎます（${dLen}字。120字前後が目安）`);
  if (dLen < 60) warn(`${at} description が短すぎます（${dLen}字）`);

  // 解説の分量。中身の薄いページを増やさないための下限。
  const gLen = [...(t.guide || "")].length;
  if (gLen < 800) err(`${at} guide が短すぎます（${gLen}字。800字以上必要）`);

  // 見出し構成
  if (!/^##\s/m.test(t.guide || "")) warn(`${at} guide に見出し(##)がありません`);

  // FAQ
  if (!Array.isArray(t.faq) || t.faq.length < 3) {
    err(`${at} FAQ が3件未満です`);
  } else {
    t.faq.forEach((f, i) => {
      if (!f.q || !f.a) err(`${at} FAQ[${i}] に q または a がありません`);
      if (f.a && [...f.a].length < 40) warn(`${at} FAQ[${i}] の回答が短すぎます`);
    });
  }

  // キーワード（トップの検索に使う）
  if (!t.keywords || t.keywords.length < 3) warn(`${at} keywords が3件未満です`);

  // 更新日
  if (!t.updated || isNaN(new Date(t.updated))) warn(`${at} updated が不正です`);

  // related の参照先
  for (const r of t.related || []) {
    if (!files.some((f) => f.replace(/\.mjs$/, "") === r)) {
      warn(`${at} related に存在しないツール: ${r}`);
    }
  }

  // UI と script の対応: script が参照する ID が UI にあるか
  const uiIds = new Set([...(t.ui || "").matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const usedIds = [...(t.script || "").matchAll(/ST\.\$\("([^"]+)"\)/g)].map((m) => m[1]);
  const setIds = [...(t.script || "").matchAll(/ST\.set\("([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set([...usedIds, ...setIds])) {
    if (!uiIds.has(id)) err(`${at} script が参照する id="${id}" が ui にありません`);
  }

  // 生の DOM API を直接使っていないか（共通ランタイムに寄せる方針）
  if (/document\.getElementById/.test(t.script || "")) {
    warn(`${at} document.getElementById ではなく ST.$() を使ってください`);
  }
}

// ---- 設定の検査 ------------------------------------------------------
if (!owner.contactEmail && !owner.contactFormUrl) {
  err("config: 連絡先が設定されていません（AdSense審査に必要）");
}
if (!site.url.startsWith("https://")) err("config: site.url が https ではありません");
if (site.base && !site.base.startsWith("/")) err("config: site.base は / で始めてください");
if (site.base.endsWith("/")) err("config: site.base の末尾に / は不要です");

// ---- ビルド結果の検査 ------------------------------------------------
if (!fs.existsSync(distDir)) {
  warn("dist/ がありません。npm run build を先に実行してください。");
} else {
  const htmlFiles = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) htmlFiles.push(p);
    }
  })(distDir);

  const titles = new Map();
  const descs = new Map();

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const rel = "/" + path.relative(distDir, file).replace(/\\/g, "/");

    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1];
    if (!title) err(`${rel}: <title> がありません`);
    if (!desc) err(`${rel}: meta description がありません`);
    if (!/rel="canonical"/.test(html)) err(`${rel}: canonical がありません`);
    if (!/<h1>/.test(html)) err(`${rel}: <h1> がありません`);

    // タイトル・説明文の重複（重複コンテンツ扱いを避ける）
    if (title) {
      if (titles.has(title)) err(`title が重複: ${rel} と ${titles.get(title)}`);
      titles.set(title, rel);
    }
    if (desc) {
      if (descs.has(desc)) warn(`description が重複: ${rel} と ${descs.get(desc)}`);
      descs.set(desc, rel);
    }

    // 内部リンクの参照先が存在するか
    for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      let target = m[1];
      if (site.base && target.startsWith(site.base)) target = target.slice(site.base.length);
      if (!target.startsWith("/")) target = "/" + target;
      const candidates = [
        path.join(distDir, target),
        path.join(distDir, target, "index.html"),
      ];
      if (!candidates.some((c) => fs.existsSync(c))) {
        err(`${rel}: リンク切れ ${m[1]}`);
      }
    }

    // ベースパスの付け忘れ（base 設定時に / 直下を指すリンクがないか）
    if (site.base) {
      for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
        if (!m[1].startsWith(site.base + "/") && m[1] !== site.base) {
          err(`${rel}: ベースパスが付いていないリンク ${m[1]}`);
        }
      }
    }
  }

  for (const f of ["sitemap.xml", "robots.txt", "styles.css"]) {
    if (!fs.existsSync(path.join(distDir, f))) err(`dist/${f} がありません`);
  }

  const sitemap = fs.existsSync(path.join(distDir, "sitemap.xml"))
    ? fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8")
    : "";
  for (const t of tools) {
    if (!sitemap.includes(`/${t.slug}/`)) err(`sitemap に /${t.slug}/ がありません`);
  }
}

// ---- 結果表示 --------------------------------------------------------
console.log(`ツール ${tools.length} 本を検査しました。`);
if (warns.length) {
  console.log(`\n注意 (${warns.length}件)`);
  warns.forEach((w) => console.log("  - " + w));
}
if (errors.length) {
  console.log(`\nエラー (${errors.length}件)`);
  errors.forEach((e) => console.log("  x " + e));
  console.log("\n公開前に修正してください。");
  process.exit(1);
}
console.log(warns.length ? "\nエラーはありません。" : "\n問題は見つかりませんでした。");
