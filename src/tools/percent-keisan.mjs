export default {
  category: "money",
  updated: "2026-08-24",
  title: "パーセント計算ツール｜「〇の△%」「何%？」「増減率」を同時に計算",
  h1: "パーセント計算ツール",
  description:
    "「500の15%はいくつ？」「80は200の何%？」「120から150は何%増？」という3種類のパーセント計算を、1ページでまとめて行えます。計算式も一緒に表示する無料ツールです。",
  cardText: "3種類のパーセント計算を1画面で。式も表示。",
  keywords: [
    "パーセント", "％", "計算", "百分率", "割合", "何パーセント", "増加率", "減少率", "％増", "％引き",
  ],
  yomi: "ぱーせんと わりあい",
  related: ["waribiki-keisan", "shohizei-keisan"],

  ui: `
<h3 style="margin-top:0">① AのB%はいくつ？</h3>
<div class="row">
  <div class="field"><label for="a1">A（もとの数）</label>
    <input type="number" id="a1" inputmode="decimal" value="500"></div>
  <div class="field"><label for="b1">B（%）</label>
    <input type="number" id="b1" inputmode="decimal" value="15"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-label">答え</div>
  <div class="result-main" id="r1">75</div>
  <p class="result-sub" id="f1"></p>
</div>

<h3>② AはBの何%？</h3>
<div class="row">
  <div class="field"><label for="a2">A（比べる数）</label>
    <input type="number" id="a2" inputmode="decimal" value="80"></div>
  <div class="field"><label for="b2">B（もとにする数）</label>
    <input type="number" id="b2" inputmode="decimal" value="200"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-label">答え</div>
  <div class="result-main" id="r2">40%</div>
  <p class="result-sub" id="f2"></p>
</div>

<h3>③ AからBへ変化したときの増減率は？</h3>
<div class="row">
  <div class="field"><label for="a3">A（変化前）</label>
    <input type="number" id="a3" inputmode="decimal" value="120"></div>
  <div class="field"><label for="b3">B（変化後）</label>
    <input type="number" id="b3" inputmode="decimal" value="150"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-label">答え</div>
  <div class="result-main" id="r3">25%増</div>
  <p class="result-sub" id="f3"></p>
</div>

<h3>④ Aの◯%増し／◯%引き</h3>
<div class="row">
  <div class="field"><label for="a4">A（もとの数）</label>
    <input type="number" id="a4" inputmode="decimal" value="1000"></div>
  <div class="field"><label for="b4">変化させる%</label>
    <input type="number" id="b4" inputmode="decimal" value="30"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k" id="labelUp">30%増し</div><div class="v" id="r4up">1,300</div></div>
    <div><div class="k" id="labelDown">30%引き</div><div class="v" id="r4down">700</div></div>
  </div>
</div>
`,

  script: `
ST.live(function () {
  // ① AのB%
  var a1 = ST.n(ST.$("a1")), b1 = ST.n(ST.$("b1"));
  var v1 = ST.fix(a1 * b1 / 100);
  ST.set("r1", ST.num(v1, 4));
  ST.set("f1", "計算式: " + ST.num(a1, 4) + " × " + ST.num(b1, 4) + " ÷ 100 = " + ST.num(v1, 4));

  // ② AはBの何%
  var a2 = ST.n(ST.$("a2")), b2 = ST.n(ST.$("b2"));
  if (b2 === 0) {
    ST.set("r2", "-");
    ST.set("f2", "もとにする数に0は使えません。");
  } else {
    var v2 = ST.fix(a2 / b2 * 100);
    ST.set("r2", ST.num(v2, 3) + "%");
    ST.set("f2", "計算式: " + ST.num(a2, 4) + " ÷ " + ST.num(b2, 4) + " × 100 = " + ST.num(v2, 3) + "%");
  }

  // ③ 増減率
  var a3 = ST.n(ST.$("a3")), b3 = ST.n(ST.$("b3"));
  if (a3 === 0) {
    ST.set("r3", "-");
    ST.set("f3", "変化前に0が入っていると増減率は計算できません。");
  } else {
    var d = ST.fix((b3 - a3) / a3 * 100);
    var word = d > 0 ? "増" : (d < 0 ? "減" : "変化なし");
    ST.set("r3", d === 0 ? "変化なし" : ST.num(Math.abs(d), 3) + "%" + word);
    ST.set("f3", "計算式: (" + ST.num(b3, 4) + " − " + ST.num(a3, 4) + ") ÷ " + ST.num(a3, 4) + " × 100 = " + ST.num(d, 3) + "%");
  }

  // ④ ◯%増し／◯%引き
  var a4 = ST.n(ST.$("a4")), b4 = ST.n(ST.$("b4"));
  ST.set("r4up", ST.num(ST.fix(a4 * (1 + b4 / 100)), 4));
  ST.set("r4down", ST.num(ST.fix(a4 * (1 - b4 / 100)), 4));
  ST.set("labelUp", ST.num(b4, 3) + "%増し");
  ST.set("labelDown", ST.num(b4, 3) + "%引き");
});
`,

  intro: `
パーセントの計算でつまずくのは、「どの数をどの数で割るのか」が混乱するときです。このページでは用途別に4つの計算欄を用意し、それぞれに使った式を表示します。
`,

  guide: `
## 4つのパターンを見分ける

パーセントの計算は、次の4つに分けて考えると迷いません。

| やりたいこと | 例 | 式 |
|---|---|---|
| ① AのB%を出す | 500円の15% | A × B ÷ 100 |
| ② AがBの何%か出す | 80点は200点満点の何% | A ÷ B × 100 |
| ③ 変化した割合を出す | 120円が150円になった | (B − A) ÷ A × 100 |
| ④ ◯%増し・◯%引き | 1,000円の30%引き | A × (1 ± B ÷ 100) |

②と③を取り違えるのが典型的な誤りです。「80は200の40%」と「200から80への変化は60%減」は、同じ2つの数字を使いながら別の答えになります。**何をもとにするか（分母は何か）**をはっきりさせてから計算してください。

## %（パーセント）と%（パーセントポイント）の違い

ニュースでよく出てくる、混同されやすい2つの言い方です。

支持率が **40%から44%に上がった** とき、

- **4ポイント（パーセントポイント）増えた** — 引き算した差
- **10%増えた** — 変化の割合（4 ÷ 40 × 100）

どちらも正しい表現ですが、指している内容が違います。「4%増えた」と書くと、40 × 1.04 = 41.6% になったという意味にも読めてしまうため、割合そのものの増減は「ポイント」で表すのが慣例になっています。

## 増減が元に戻らない理由

100円のものが **20%値上がりして、その後20%値下がりした** とき、価格は100円に戻りません。

- 100 × 1.2 = 120円
- 120 × 0.8 = **96円**

値上げは100円に対する20%（20円）、値下げは120円に対する20%（24円）で、基準にする数が違うためです。同じ%だけ上下しても必ず元より小さくなります。

元に戻すには、20%増えた分を打ち消す **16.7%引き**（1 ÷ 1.2 = 0.833）が必要です。

## 歩合との対応

日本では「割・分・厘」という言い方も残っています。

| 歩合 | パーセント | 小数 |
|---|---|---|
| 1割 | 10% | 0.1 |
| 1分 | 1% | 0.01 |
| 1厘 | 0.1% | 0.001 |

野球の打率「3割2分5厘」は32.5%のことです。ただし利息の世界では「日歩1銭」のように別の基準が使われることがあり、同じ「分」でも意味が変わる点に注意してください。

## ％の計算を暗算する小技

- **10%** は小数点を1つ左にずらすだけ（1,480円 → 148円）
- **5%** は10%の半分（148 → 74円）
- **15%** は10% + 5%（148 + 74 = 222円）
- **1%** は小数点を2つ左に（1,480円 → 14.8円）

飲食店のサービス料や、おおよその割引額を頭の中で見積もるときに使えます。正確な金額が必要なときは、このツールで確認してください。
`,

  faq: [
    {
      q: "「AはBの何%か」と「AからBへの増減率」は何が違いますか？",
      a: "分母が違います。前者は A ÷ B × 100 で、Bを全体としたときのAの割合です。後者は (B − A) ÷ A × 100 で、変化前のAを基準にした変化の大きさです。同じ数字でも答えは変わります。",
    },
    {
      q: "%と%ポイントはどう使い分けますか？",
      a: "40%から44%への変化は、差で言えば4ポイント、割合で言えば10%増です。もともとパーセントで表されている数値の増減には「ポイント」を使うと誤解がありません。",
    },
    {
      q: "20%上げてから20%下げると元に戻りませんか？",
      a: "戻りません。100円は96円になります。値上げは100円基準、値下げは120円基準で計算されるためです。元に戻すには約16.7%引きが必要です。",
    },
    {
      q: "小数点以下は何桁まで表示されますか？",
      a: "計算結果に応じて最大3〜4桁まで表示します。割り切れない場合は丸めた値が表示されるため、厳密な値が必要な場合は表示された計算式で確認してください。",
    },
  ],
};
