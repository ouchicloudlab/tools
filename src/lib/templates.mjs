// =============================================================
//  ページの共通レイアウトと部品
// =============================================================
import { site, ads, analytics, categories, owner } from "./config.mjs";
import { esc } from "./markdown.mjs";
import { runtimeScript } from "./runtime.mjs";

// 内部リンク（ベースパス付き）
export const withBase = (p = "/") => (site.base || "") + p;
// 絶対URL（canonical / OGP / sitemap 用）
export const absUrl = (p = "/") => site.url + (site.base || "") + p;

// ---- 広告スロット ----------------------------------------------------
// slot が未設定なら何も出さない。空の広告枠を並べると
// 「広告のための箱だけがある未完成サイト」と判定されるため。
export function adSlot(kind = "inArticle") {
  const slotId = ads.slots[kind];
  if (!ads.adsenseClient || !slotId) return "";
  return `
<div class="ad-slot" aria-label="広告">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="${esc(ads.adsenseClient)}"
       data-ad-slot="${esc(slotId)}"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;
}

// ---- 構造化データ ----------------------------------------------------
export function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(
    /</g,
    "\u003c"
  )}</script>`;
}

export function breadcrumbLd(trail) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: t.label,
      item: absUrl(t.path),
    })),
  });
}

export function breadcrumbHtml(trail) {
  const items = trail.map((t, idx) =>
    idx === trail.length - 1
      ? `<span aria-current="page">${esc(t.label)}</span>`
      : `<a href="${withBase(t.path)}">${esc(t.label)}</a>`
  );
  return `<nav class="crumbs" aria-label="パンくずリスト">${items.join(
    '<span class="sep">›</span>'
  )}</nav>`;
}

// ---- お問い合わせ ----------------------------------------------------
export function contactBlock() {
  if (owner.contactFormUrl) {
    return `<p><a class="btn" href="${esc(
      owner.contactFormUrl
    )}" target="_blank" rel="noopener">お問い合わせフォームを開く</a></p>`;
  }
  if (owner.contactEmail) {
    const e = esc(owner.contactEmail);
    return `<p>ご意見・不具合のご報告は下記アドレスまでお願いします。</p>
<p class="contact-email"><a href="mailto:${e}">${e}</a></p>`;
  }
  return `<p class="empty">お問い合わせ先は準備中です。</p>`;
}

// ---- ツールカード ----------------------------------------------------
export function toolCard(tool) {
  const cat = categories[tool.category];
  return `<a class="card" href="${withBase("/" + tool.slug + "/")}">
  <span class="card-cat">${cat ? cat.emoji + " " + esc(cat.label) : ""}</span>
  <span class="card-title">${esc(tool.h1 || tool.title)}</span>
  <span class="card-desc">${esc(tool.cardText || tool.description)}</span>
</a>`;
}

// ---- 全体レイアウト --------------------------------------------------
export function layout({
  title,
  description,
  path = "/",
  body,
  extraHead = "",
  extraStyle = "",
  extraScript = "",
  crumbs = null,
}) {
  const fullTitle =
    path === "/" ? `${site.name}｜${site.tagline}` : `${title}｜${site.name}`;
  const canonical = absUrl(path);

  const nav = Object.entries(categories)
    .sort((a, b) => a[1].order - b[1].order)
    .map(
      ([key, c]) =>
        `<a href="${withBase("/category/" + key + "/")}">${c.emoji} ${esc(
          c.label
        )}</a>`
    )
    .join("");

  const adsense = ads.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(
        ads.adsenseClient
      )}" crossorigin="anonymous"></script>`
    : "";

  const ga = analytics.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(
        analytics.gaId
      )}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(
        analytics.gaId
      )}');</script>`
    : "";

  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || site.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>🧮</text></svg>">
<link rel="stylesheet" href="${withBase("/styles.css")}">
${adsense}${ga}${extraHead}
${extraStyle ? `<style>${extraStyle}</style>` : ""}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${withBase("/")}">
      <span class="brand-mark">🧮</span>
      <span class="brand-text"><b>${esc(site.name)}</b><small>${esc(
    site.tagline
  )}</small></span>
    </a>
    <nav class="cats">${nav}</nav>
  </div>
</header>
<main class="wrap">
${crumbs ? breadcrumbHtml(crumbs) : ""}
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="footer-desc">${esc(site.description)}</p>
    <nav class="footer-nav">
      <a href="${withBase("/")}">ツール一覧</a>
      <a href="${withBase("/about/")}">運営者情報</a>
      <a href="${withBase("/privacy/")}">プライバシーポリシー</a>
      <a href="${withBase("/contact/")}">お問い合わせ</a>
      <a href="${withBase("/disclaimer/")}">免責事項</a>
    </nav>
    <p class="sister-site">
      姉妹サイト:
      <a href="${site.url}/">🖥️ おうちクラウド Lab</a>
      — ミニPC・NAS・ネットワーク機材を、消費電力と総コストから選ぶメディアです。
    </p>
    <p class="copy">© ${new Date().getFullYear()} ${esc(site.name)}</p>
  </div>
</footer>
<script>${runtimeScript}</script>
${extraScript ? `<script>${extraScript}</script>` : ""}
</body>
</html>`;
}
