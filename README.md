# サクッとツール

日常の計算・変換を1ページで片づける実用ツール集。静的サイトとして GitHub Pages に公開する。

- 公開予定URL: https://ouchicloudlab.github.io/tools/
- 収益化: Google AdSense（`ouchi-cloud-lab` と同一ドメインのため、審査通過済みのアカウントをそのまま使える）

## なぜこの形なのか

検索需要は「消費税 計算」「坪 平米」のように細かく分散している。1つの用件に1ページを割り当てて数を増やすほど流入の入口が増える構造なので、**1ツール=1ファイルで量産できること** を最優先に設計している。

- 外部依存ゼロ（`npm install` 不要）。Markdownレンダラも自前。
- 計算はすべてブラウザ内で完結。サーバー費用ゼロ、入力内容は送信されない。
- `npm run check` に品質の下限を機械的に埋め込んであり、薄いページが増えない。

## コマンド

```bash
node scripts/build.mjs   # dist/ を生成
node scripts/check.mjs   # 公開前チェック（CIでも実行）
node scripts/serve.mjs   # http://localhost:4323/tools/ で確認
```

`npm run build` / `npm run check` / `npm run dev` でも同じ。

## ツールの追加方法

`src/tools/<slug>.mjs` を1つ置くだけでページが1本増える。ビルド時に自動で以下が生成される。

- ツールページ `dist/<slug>/index.html`
- トップページのカードと検索インデックスへの登録
- カテゴリページへの掲載
- sitemap.xml への追加
- 構造化データ（WebApplication / FAQPage / BreadcrumbList）

### ファイルの構造

```js
export default {
  category: "money",        // src/lib/config.mjs の categories のキー
  updated: "2026-08-26",    // 更新日（一覧の並び順に使う）
  title: "…",               // <title>。40字以内
  h1: "…",                  // ページ見出し
  description: "…",         // meta description。60〜130字
  cardText: "…",            // 一覧カードの短い説明（省略可）
  keywords: ["…"],          // トップの検索に使う
  related: ["slug"],        // 関連ツール（省略時は同カテゴリから自動）

  ui: `…`,                  // ツール本体のHTML
  script: `…`,              // ツールのJS（ST.* が使える）
  style: `…`,               // 追加CSS（省略可）

  intro: `…`,               // ツール直後の短い説明（Markdown）
  guide: `…`,               // 解説本文（Markdown）。800字以上が必須
  faq: [{ q: "…", a: "…" }] // 3件以上が必須
};
```

### script から使える共通ランタイム（`src/lib/runtime.mjs`）

すべてのページに `ST` として埋め込まれる。丸め誤差や数値整形の実装がツールごとにばらつかないよう、ここに寄せる。

| 関数 | 用途 |
|---|---|
| `ST.live(fn)` | `.tool` 内の入力変化で `fn` を呼ぶ。初回も1度実行する |
| `ST.n(el, def)` | 入力値を数値にする。空欄・不正値は `def`（既定0） |
| `ST.fix(n)` | 浮動小数点の誤差をならす（`1100/1.1` を1000にする） |
| `ST.round(n, mode)` | 端数処理。`floor` / `ceil` / `round` / `none` |
| `ST.num(n, digits)` | 桁区切りの数値表記 |
| `ST.yen(n)` | 「1,000円」形式 |
| `ST.$(id)` / `ST.set(id, text)` | 要素の取得 / テキスト差し替え |
| `ST.pick(name)` | ラジオボタンの選択値 |
| `ST.copy(text, btn)` | クリップボードにコピー |

`document.getElementById` を直接使うと `check.mjs` が警告する。

### 書くときの決まりごと

- **入力のたびに結果が変わる**。「計算」ボタンは置かない。
- **計算式を必ず表示する**。答えだけでなく、どの式でその数字になったかを出す。
- **解説は800字以上**。用語の定義、間違えやすい点、実務での注意を書く。数字を並べただけのページは作らない。
- **エラー時は全項目をクリアする**。前回の結果が残っていると誤読のもとになる。
- `script` はテンプレートリテラルの中に入るため、**バッククォートを使わない**（文字列連結で書く）。

## 設定

`src/lib/config.mjs` の一箇所にまとめてある。

| 項目 | 内容 |
|---|---|
| `site.base` | 公開パスの接頭辞。`/tools`。独自ドメインでルート公開にするときは `""` |
| `ads.adsenseClient` | AdSenseのパブリッシャーID |
| `ads.slots` | 広告スロットID。**空のうちは広告枠を出力しない**（審査対策） |
| `analytics.gaId` | GA4の測定ID。空なら計測タグを出力しない |
| `owner.contactEmail` | 連絡先。AdSense審査に必要 |
| `categories` | カテゴリの定義。追加するとナビと一覧に反映される |

## 公開の手順

1. GitHub に `tools` という名前でリポジトリを作る（`ouchicloudlab` アカウント）
2. このディレクトリを push する
3. リポジトリの Settings → Pages → Source を **GitHub Actions** にする
4. `main` に push すると自動でビルド・公開される

公開後、Google Search Console に `https://ouchicloudlab.github.io/tools/sitemap.xml` を登録する。

## 収益化までの流れ

1. ツールを増やす（当面の目標は50本）
2. Search Console でインデックス登録を確認
3. AdSenseの広告ユニットを作り、`config.mjs` の `ads.slots` に入れる
4. 検索順位のついたページを見て、そこから派生するツールを追加していく

広告スロットを入れるのは、ページがある程度インデックスされてからでよい。空の広告枠が並んだ状態は審査上の減点になるため、`slots` が空のときは枠そのものを出力しない実装にしてある。
