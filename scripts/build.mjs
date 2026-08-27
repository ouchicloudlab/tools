// =============================================================
//  静的サイトビルド
//  src/tools/*.mjs  ->  dist/<slug>/index.html
//  ツール定義ファイルを1つ置くだけでページが1本増える設計。
// =============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, categories, ads } from "../src/lib/config.mjs";
import { md, esc } from "../src/lib/markdown.mjs";
import {
  layout,
  withBase,
  absUrl,
  adSlot,
  jsonLd,
  breadcrumbLd,
  toolCard,
  contactBlock,
} from "../src/lib/templates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const toolsDir = path.join(root, "src", "tools");
const pagesDir = path.join(root, "src", "pages");
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

// ---- ユーティリティ --------------------------------------------------
const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });

// Markdown の本文中に書いた "/privacy/" のような内部リンクにベースパスを付ける。
// テンプレート側は withBase() で付与済みなので、二重付与しないよう判定する。
function applyBase(html) {
  const base = site.base || "";
  if (!base) return html;
  return html.replace(/(href|src)="(\/[^"]*)"/g, (whole, attr, p) => {
    if (p === base || p.startsWith(base + "/")) return whole;
    return `${attr}="${base}${p}"`;
  });
}

function writePage(relPath, html) {
  const out = path.join(distDir, relPath, "index.html");
  ensure(path.dirname(out));
  fs.writeFileSync(out, applyBase(html), "utf8");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensure(dest);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 全ページのヘッダー検索に埋め込むインデックス。
// q は検索用に正規化済みの文字列（カタカナ→ひらがな、小文字化）。
// slug も含めることで、ローマ字入力でも引けるようにしている。
function buildSearchIndex(tools) {
  const kana = (s) =>
    String(s).replace(/[ァ-ヶ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60));
  return tools.map((t) => {
    const title = t.h1 || t.title;
    const desc = t.cardText || t.description;
    const hay = [title, desc, (t.keywords || []).join(" "),
      t.yomi || "", t.slug].join(" ");
    return { s: t.slug, t: title, d: desc, q: kana(hay).toLowerCase() };
  });
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// ---- ツールの読み込み ------------------------------------------------
async function loadTools() {
  if (!fs.existsSync(toolsDir)) return [];
  const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith(".mjs"));
  const tools = [];
  for (const f of files) {
    const mod = await import(
      "file://" + path.join(toolsDir, f).replace(/\\/g, "/")
    );
    const tool = mod.default;
    if (!tool) throw new Error(`${f}: default export がありません`);
    tool.slug = tool.slug || f.replace(/\.mjs$/, "");
    if (!categories[tool.category]) {
      throw new Error(`${f}: 未定義のカテゴリ "${tool.category}"`);
    }
    tools.push(tool);
  }
  // 新しい順（updated 未設定は末尾）
  tools.sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
  return tools;
}

// ---- ツールページ ----------------------------------------------------
function renderTool(tool, all, searchIndex) {
  const cat = categories[tool.category];
  const crumbs = [
    { label: "ホーム", path: "/" },
    { label: cat.label, path: `/category/${tool.category}/` },
    { label: tool.h1 || tool.title, path: `/${tool.slug}/` },
  ];

  // FAQ（表示 + 構造化データ）
  const faqHtml = (tool.faq || []).length
    ? `<h2>よくある質問</h2>
<div class="faq">${tool.faq
        .map(
          (f) =>
            `<details><summary>${esc(f.q)}</summary>${md(f.a)}</details>`
        )
        .join("\n")}</div>`
    : "";

  const faqLd = (tool.faq || []).length
    ? jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: tool.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a.replace(/[*`\[\]]/g, ""),
          },
        })),
      })
    : "";

  const appLd = jsonLd({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.h1 || tool.title,
    url: absUrl(`/${tool.slug}/`),
    description: tool.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    browserRequirements: "JavaScript が有効なブラウザ",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
    inLanguage: "ja",
  });

  // 関連ツール（明示指定がなければ同カテゴリから自動補完）
  const relatedSlugs = new Set(tool.related || []);
  for (const t of all) {
    if (relatedSlugs.size >= 4) break;
    if (t.slug !== tool.slug && t.category === tool.category) {
      relatedSlugs.add(t.slug);
    }
  }
  const relatedTools = [...relatedSlugs]
    .map((s) => all.find((t) => t.slug === s))
    .filter(Boolean)
    .slice(0, 4);

  const relatedHtml = relatedTools.length
    ? `<section class="related"><h2>関連するツール</h2>
<div class="cards">${relatedTools.map(toolCard).join("\n")}</div></section>`
    : "";

  const body = `
<h1>${esc(tool.h1 || tool.title)}</h1>
<p class="lead">${esc(tool.description)}</p>
<p class="privacy-badge">🔒 入力内容はブラウザ内で処理され、送信されません</p>

<section class="tool">${tool.ui}</section>

${tool.intro ? `<div class="guide">${md(tool.intro)}</div>` : ""}

${adSlot("inArticle")}

<div class="guide">
${md(tool.guide || "")}
</div>

${faqHtml}

${relatedHtml}

<p class="hint">最終更新: ${fmtDate(tool.updated || Date.now())}</p>
${adSlot("footer")}
`;

  return layout({
    title: tool.title,
    description: tool.description,
    path: `/${tool.slug}/`,
    crumbs,
    body,
    extraStyle: tool.style || "",
    extraScript: tool.script || "",
    extraHead: appLd + faqLd + breadcrumbLd(crumbs),
    searchIndex,
  });
}

// ---- トップページ ----------------------------------------------------
function renderIndex(tools, searchIndex) {
  const byCat = Object.entries(categories)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, c]) => {
      const list = tools.filter((t) => t.category === key);
      if (!list.length) return "";
      return `<div class="cat-head">
  <h2>${c.emoji} ${esc(c.label)}</h2>
  <a href="${withBase("/category/" + key + "/")}">カテゴリを見る →</a>
</div>
<p class="lead">${esc(c.intro)}</p>
<div class="cards" data-cat="${key}">${list.map(toolCard).join("\n")}</div>`;
    })
    .join("\n");

  // トップページ内の一覧切り替え用。ヘッダー検索とは表示のしかたが違うため別に持つ。
  const topIndex = tools.map((t) => ({
    s: t.slug,
    t: t.h1 || t.title,
    d: t.cardText || t.description,
    k: (t.keywords || []).join(" "),
    c: t.category,
  }));

  const body = `
<h1>${esc(site.name)}</h1>
<p class="lead">${esc(site.description)}</p>

<div class="search-box">
  <input type="search" id="q" placeholder="やりたいことで探す（例: 消費税、年齢、坪）"
         aria-label="ツールを検索" autocomplete="off">
</div>
<div class="cards" id="searchResults" hidden></div>

<div id="catalog">
${byCat}
</div>
${adSlot("footer")}
`;

  const script = `
const IDX = ${JSON.stringify(topIndex)};
const BASE = ${JSON.stringify(site.base || "")};
const CATS = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, v.emoji + " " + v.label])
    )
  )};
const q = document.getElementById("q");
const res = document.getElementById("searchResults");
const catalog = document.getElementById("catalog");
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
q.addEventListener("input", () => {
  const v = q.value.trim().toLowerCase();
  if (!v) { res.hidden = true; catalog.hidden = false; return; }
  const hits = IDX.filter(x =>
    (x.t + " " + x.d + " " + x.k).toLowerCase().includes(v));
  res.innerHTML = hits.length
    ? hits.map(x => '<a class="card" href="' + BASE + '/' + x.s + '/">'
        + '<span class="card-cat">' + esc(CATS[x.c] || "") + '</span>'
        + '<span class="card-title">' + esc(x.t) + '</span>'
        + '<span class="card-desc">' + esc(x.d) + '</span></a>').join("")
    : '<p class="lead">該当するツールが見つかりませんでした。</p>';
  res.hidden = false;
  catalog.hidden = true;
});
`;

  return layout({
    title: site.name,
    description: site.description,
    path: "/",
    body,
    extraScript: script,
    extraHead: jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: absUrl("/"),
      description: site.description,
      inLanguage: "ja",
    }),
    searchIndex,
  });
}

// ---- カテゴリページ --------------------------------------------------
function renderCategory(key, cat, tools, searchIndex) {
  const list = tools.filter((t) => t.category === key);
  const crumbs = [
    { label: "ホーム", path: "/" },
    { label: cat.label, path: `/category/${key}/` },
  ];
  const body = `
<h1>${cat.emoji} ${esc(cat.label)}のツール</h1>
<p class="lead">${esc(cat.intro)}</p>
<div class="cards">${list.map(toolCard).join("\n")}</div>
${adSlot("footer")}
`;
  return layout({
    title: `${cat.label}のツール一覧`,
    description: cat.intro,
    path: `/category/${key}/`,
    crumbs,
    body,
    extraHead: breadcrumbLd(crumbs),
    searchIndex,
  });
}

// ---- 固定ページ ------------------------------------------------------
function renderPages(searchIndex) {
  if (!fs.existsSync(pagesDir)) return [];
  const out = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(pagesDir, f), "utf8");
    // 先頭の "# タイトル" を H1 として取り出す
    const m = raw.match(/^#\s+(.*)\n/);
    const title = m ? m[1].trim() : f.replace(/\.md$/, "");
    const rest = m ? raw.slice(m[0].length) : raw;
    const slug = f.replace(/\.md$/, "");
    const html = md(rest).replace("<!-- CONTACT -->", contactBlock());
    const crumbs = [
      { label: "ホーム", path: "/" },
      { label: title, path: `/${slug}/` },
    ];
    writePage(
      slug,
      layout({
        title,
        description: `${site.name}の${title}のページです。`,
        path: `/${slug}/`,
        crumbs,
        body: `<h1>${esc(title)}</h1><div class="guide">${html}</div>`,
        extraHead: breadcrumbLd(crumbs),
        searchIndex,
      })
    );
    out.push({ slug, title });
  }
  return out;
}

// ---- 404ページ ------------------------------------------------------
// GitHub Pages は存在しないURLでこのファイルを返す。
// 標準の404だとサイトの外に出てしまうため、検索とカテゴリ一覧を置いて戻れるようにする。
function render404(searchIndex) {
  const cats = Object.entries(categories)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, c]) =>
      `<a class="card" href="${withBase("/category/" + key + "/")}">
  <span class="card-cat">${c.emoji}</span>
  <span class="card-title">${esc(c.label)}</span>
  <span class="card-desc">${esc(c.intro.slice(0, 40))}…</span>
</a>`)
    .join("\n");

  return layout({
    title: "ページが見つかりません",
    description: "お探しのページは見つかりませんでした。カテゴリ一覧または検索からお探しください。",
    path: "/404.html",
    body: `
<h1>ページが見つかりませんでした</h1>
<p class="lead">
  URLが変わったか、入力に誤りがあるようです。
  上の「🔍 探す」から検索するか、下のカテゴリからお探しください。
</p>
<p><a class="btn" href="${withBase("/")}">ツール一覧に戻る</a></p>
<h2>カテゴリから探す</h2>
<div class="cards">${cats}</div>
`,
    searchIndex,
  });
}

// ---- PWA（ホーム画面に追加）------------------------------------------
function writePwa() {
  // アイコンは絵文字を描いたSVG。ラスタ画像を持たずに済ませる。
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1f6feb"/>
  <text x="256" y="360" font-size="280" text-anchor="middle">🧮</text>
</svg>`;
  fs.writeFileSync(path.join(distDir, "icon.svg"), icon, "utf8");

  const manifest = {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: (site.base || "") + "/",
    scope: (site.base || "") + "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#1f6feb",
    lang: "ja",
    icons: [
      { src: (site.base || "") + "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
  fs.writeFileSync(
    path.join(distDir, "manifest.webmanifest"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
}

// ---- sitemap / robots / ads.txt --------------------------------------
function writeMeta(tools, pages) {
  const urls = [
    { loc: absUrl("/"), pri: "1.0" },
    ...Object.keys(categories).map((k) => ({
      loc: absUrl(`/category/${k}/`),
      pri: "0.6",
    })),
    ...tools.map((t) => ({
      loc: absUrl(`/${t.slug}/`),
      pri: "0.8",
      lastmod: t.updated,
    })),
    ...pages.map((p) => ({ loc: absUrl(`/${p.slug}/`), pri: "0.3" })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${
        u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""
      }<priority>${u.pri}</priority></url>`
  )
  .join("\n")}
</urlset>`;
  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

  fs.writeFileSync(
    path.join(distDir, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${absUrl("/sitemap.xml")}\n`,
    "utf8"
  );

  if (ads.adsenseClient) {
    const pub = ads.adsenseClient.replace(/^ca-/, "");
    fs.writeFileSync(
      path.join(distDir, "ads.txt"),
      `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`,
      "utf8"
    );
  }
}

// ---- 実行 ------------------------------------------------------------
const tools = await loadTools();
fs.rmSync(distDir, { recursive: true, force: true });
ensure(distDir);
copyDir(publicDir, distDir);

const searchIndex = buildSearchIndex(tools);

for (const tool of tools) writePage(tool.slug, renderTool(tool, tools, searchIndex));
for (const [key, cat] of Object.entries(categories)) {
  writePage(`category/${key}`, renderCategory(key, cat, tools, searchIndex));
}
writePage("", renderIndex(tools, searchIndex));
const pages = renderPages(searchIndex);
fs.writeFileSync(path.join(distDir, "404.html"), applyBase(render404(searchIndex)), "utf8");
writePwa();
writeMeta(tools, pages);

console.log(
  `ビルド完了: ツール ${tools.length} 本 / 固定ページ ${pages.length} 枚 -> dist/`
);
for (const t of tools) console.log(`  - /${t.slug}/  ${t.h1 || t.title}`);
