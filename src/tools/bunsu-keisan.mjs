export default {
  category: "math",
  updated: "2026-08-27",
  title: "分数の計算ツール｜足し算引き算から約分・小数変換まで",
  h1: "分数の計算ツール",
  description:
    "分数どうしの四則計算を、約分まで自動で行います。通分の過程も表示。小数や帯分数への変換、比の簡略化にも対応した無料ツールです。",
  cardText: "分数の四則計算と約分。通分の途中式も表示。",
  keywords: [
    "分数", "計算", "約分", "通分", "足し算", "引き算", "掛け算", "割り算", "帯分数", "小数",
  ],
  related: ["percent-keisan"],

  ui: `
<div class="row" style="align-items:flex-end">
  <div class="field" style="flex:0 0 90px">
    <label for="n1">分子</label>
    <input type="number" id="n1" inputmode="numeric" value="1">
    <div style="border-top:2px solid var(--text);margin:6px 0"></div>
    <input type="number" id="d1" inputmode="numeric" value="2" aria-label="分母">
  </div>
  <div class="field" style="flex:0 0 90px">
    <label for="op">計算</label>
    <select id="op">
      <option value="+" selected>＋ 足す</option>
      <option value="-">− 引く</option>
      <option value="*">× 掛ける</option>
      <option value="/">÷ 割る</option>
    </select>
  </div>
  <div class="field" style="flex:0 0 90px">
    <label for="n2">分子</label>
    <input type="number" id="n2" inputmode="numeric" value="1">
    <div style="border-top:2px solid var(--text);margin:6px 0"></div>
    <input type="number" id="d2" inputmode="numeric" value="3" aria-label="分母">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">答え（約分済み）</div>
  <div class="result-main" id="ansVal">-</div>
  <div class="result-grid">
    <div><div class="k">約分する前</div><div class="v" id="rawVal">-</div></div>
    <div><div class="k">帯分数</div><div class="v" id="mixedVal">-</div></div>
    <div><div class="k">小数</div><div class="v" id="decVal">-</div></div>
    <div><div class="k">パーセント</div><div class="v" id="pctVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>1つの分数を約分・変換する</h3>
<div class="row" style="align-items:flex-end">
  <div class="field" style="flex:0 0 110px">
    <label for="n3">分子</label>
    <input type="number" id="n3" inputmode="numeric" value="36">
    <div style="border-top:2px solid var(--text);margin:6px 0"></div>
    <input type="number" id="d3" inputmode="numeric" value="48" aria-label="分母">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="simpVal" style="font-size:24px">-</div>
  <div class="result-grid">
    <div><div class="k">最大公約数</div><div class="v" id="gcdVal">-</div></div>
    <div><div class="k">小数</div><div class="v" id="simpDecVal">-</div></div>
    <div><div class="k">比で表すと</div><div class="v" id="ratioVal">-</div></div>
  </div>
</div>
`,

  script: `
(function () {
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

  function reduce(n, d) {
    if (d === 0) return null;
    // 分母は正に揃える
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g, g: g };
  }

  function frac(n, d) {
    if (d === 1) return String(n);
    return n + "/" + d;
  }

  function mixed(n, d) {
    if (d === 1) return String(n);
    if (Math.abs(n) < d) return frac(n, d);
    var sign = n < 0 ? "-" : "";
    var a = Math.abs(n);
    var whole = Math.floor(a / d);
    var rest = a % d;
    return rest === 0 ? sign + whole : sign + whole + " と " + rest + "/" + d;
  }

  function clearMain(msg) {
    ["ansVal","rawVal","mixedVal","decVal","pctVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    // ---- 2つの分数の計算 ----
    var n1 = Math.round(ST.n(ST.$("n1")));
    var d1 = Math.round(ST.n(ST.$("d1")));
    var n2 = Math.round(ST.n(ST.$("n2")));
    var d2 = Math.round(ST.n(ST.$("d2")));
    var op = ST.$("op").value;

    if (d1 === 0 || d2 === 0) {
      clearMain("分母に0は使えません。");
    } else if (op === "/" && n2 === 0) {
      clearMain("0で割ることはできません。");
    } else {
      var rn, rd, steps;
      if (op === "+" || op === "-") {
        var L = lcm(d1, d2);
        var a = n1 * (L / d1);
        var b = n2 * (L / d2);
        rn = op === "+" ? a + b : a - b;
        rd = L;
        steps = "通分: " + frac(n1, d1) + " = " + frac(a, L) + "、" +
          frac(n2, d2) + " = " + frac(b, L) + " → " +
          frac(a, L) + " " + (op === "+" ? "+" : "−") + " " + frac(b, L) +
          " = " + frac(rn, rd);
      } else if (op === "*") {
        rn = n1 * n2; rd = d1 * d2;
        steps = "分子どうし・分母どうしを掛ける: (" + n1 + "×" + n2 + ") / (" +
          d1 + "×" + d2 + ") = " + frac(rn, rd);
      } else {
        rn = n1 * d2; rd = d1 * n2;
        steps = "割る数をひっくり返して掛ける: " + frac(n1, d1) + " × " +
          frac(d2, n2) + " = " + frac(rn, rd);
      }

      var r = reduce(rn, rd);
      ST.set("ansVal", frac(r.n, r.d));
      ST.set("rawVal", frac(rn, rd < 0 ? -rd : rd));
      ST.set("mixedVal", mixed(r.n, r.d));
      ST.set("decVal", ST.num(r.n / r.d, 6));
      ST.set("pctVal", ST.num(r.n / r.d * 100, 3) + "%");
      ST.set("detail", steps +
        (r.g > 1 ? "。最大公約数 " + r.g + " で約分して " + frac(r.n, r.d) : "。これ以上約分できません"));
    }

    // ---- 1つの分数の約分 ----
    var n3 = Math.round(ST.n(ST.$("n3")));
    var d3 = Math.round(ST.n(ST.$("d3")));
    if (d3 === 0) {
      ["simpVal","gcdVal","simpDecVal","ratioVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      return;
    }
    var s = reduce(n3, d3);
    ST.set("simpVal", frac(n3, Math.abs(d3)) + " = " + frac(s.n, s.d));
    ST.set("gcdVal", String(s.g));
    ST.set("simpDecVal", ST.num(s.n / s.d, 6));
    ST.set("ratioVal", s.n + " : " + s.d);
  });
})();
`,

  intro: `
分数どうしの足し算・引き算・掛け算・割り算を、約分まで自動で行います。**通分の途中式も表示する**ので、手計算の確認にも使えます。
`,

  guide: `
## 計算のしかた

| 計算 | やり方 |
|---|---|
| 足し算・引き算 | **通分**して分母を揃えてから、分子どうしを計算 |
| 掛け算 | 分子どうし、分母どうしを掛ける |
| 割り算 | 割る数の **分子と分母をひっくり返して掛ける** |

足し算と引き算だけが通分を必要とします。掛け算・割り算では通分しません。ここを混同しやすいので注意してください。

### 足し算の例

1/2 + 1/3 を計算します。

1. 分母2と3の最小公倍数は6
2. 1/2 = 3/6、1/3 = 2/6 に通分する
3. 3/6 + 2/6 = **5/6**

### 割り算の例

2/3 ÷ 4/5 を計算します。

1. 割る数 4/5 をひっくり返して 5/4 にする
2. 2/3 × 5/4 = 10/12
3. 約分して **5/6**

なぜひっくり返すのかというと、「÷ 4/5」は「× 5/4」と同じ意味だからです。4/5で割るということは、4/5がいくつ入るかを求めることであり、これは5/4を掛けるのと同じ結果になります。

## 約分と最大公約数

約分とは、分子と分母を同じ数で割って簡単にすることです。**最大公約数（GCD）** で割れば、一度で最も簡単な形になります。

36/48 を例にすると、

- 36と48の最大公約数は12
- 36 ÷ 12 = 3、48 ÷ 12 = 4
- 答えは **3/4**

最大公約数を求めるには **ユークリッドの互除法** が使えます。

1. 48 ÷ 36 = 1 余り12
2. 36 ÷ 12 = 3 余り0
3. 余りが0になったときの割る数「12」が最大公約数

大きな数でも数回の割り算で求まる方法です。このツールもこの手順で計算しています。

## 通分と最小公倍数

通分では **最小公倍数（LCM）** を使います。分母どうしを掛けても通分はできますが、数が大きくなり、あとで約分する手間が増えます。

- 分母4と6: 掛けると24。最小公倍数は **12**
- 12を使うほうが、計算する数が小さくて済みます

最小公倍数は次の式で求められます。

> **最小公倍数 = a × b ÷ 最大公約数**

4と6なら、4 × 6 ÷ 2 = 12 です。

## 帯分数と仮分数

- **仮分数**: 分子が分母以上の分数（7/3）
- **帯分数**: 整数と分数を並べた形（2と1/3）

計算の途中では仮分数のまま扱うほうが簡単で、最後に帯分数へ直します。帯分数のまま掛け算をしようとすると間違えやすいため、いったん仮分数に直してから計算してください。

- 帯分数 → 仮分数: 整数 × 分母 ＋ 分子 を分子にする（2と1/3 → (2×3+1)/3 = 7/3）
- 仮分数 → 帯分数: 分子 ÷ 分母 の商が整数部分、余りが分子（7/3 → 2余り1 → 2と1/3）

## 小数に直せない分数がある

分数を小数にすると、割り切れる場合（有限小数）と、同じ数字が繰り返される場合（循環小数）があります。

- 1/4 = 0.25（有限）
- 1/3 = 0.333...（循環）
- 1/7 = 0.142857142857...（6桁の繰り返し）

**分母が2と5だけでできている分数は有限小数になり、それ以外の素因数を含むと循環小数になります。** 1/8（=1/2³）は0.125で割り切れますが、1/6（=1/(2×3)）は0.1666...と循環します。

このツールの小数表示は6桁で丸めているため、循環小数は近似値になります。正確な値が必要な場合は分数のまま扱ってください。

## 比との関係

3/4 という分数は、3:4 という比と同じ関係を表しています。約分は、比を最も簡単な整数比に直す作業と同じです。

料理のレシピを人数に合わせて調整するとき、地図の縮尺を計算するとき、画面の縦横比を求めるときなど、比の形で考えたほうが分かりやすい場面も多くあります。
`,

  faq: [
    {
      q: "分数の割り算でなぜひっくり返して掛けるのですか？",
      a: "「4/5で割る」ことと「5/4を掛ける」ことが同じ意味だからです。ある数を4/5で割ると、その数の中に4/5がいくつ入るかを求めることになり、結果として5/4倍することと一致します。",
    },
    {
      q: "掛け算のときも通分が必要ですか？",
      a: "必要ありません。分子どうし、分母どうしをそのまま掛けます。通分が必要なのは足し算と引き算だけです。",
    },
    {
      q: "約分はどこまですればいいですか？",
      a: "分子と分母の最大公約数で割れば、一度で最も簡単な形になります。分子と分母に共通の約数が1しかない状態（既約分数）が最終形です。",
    },
    {
      q: "帯分数のまま計算してもいいですか？",
      a: "足し算・引き算は整数部分と分数部分を分けて計算できますが、掛け算・割り算では間違えやすくなります。いったん仮分数に直してから計算し、最後に帯分数へ戻すのが確実です。",
    },
    {
      q: "小数の表示が正確ではないのはなぜですか？",
      a: "1/3のような循環小数は無限に続くため、6桁で丸めて表示しています。正確な値が必要な場合は分数のまま扱ってください。分母が2と5だけでできている分数は割り切れます。",
    },
  ],
};
