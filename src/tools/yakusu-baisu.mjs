export default {
  category: "math",
  updated: "2026-08-27",
  title: "約数・素因数分解・最小公倍数の計算ツール",
  h1: "約数・倍数の計算ツール",
  description:
    "数を入れると約数の一覧と素因数分解の結果を表示します。2つの数の最大公約数と最小公倍数も同時に計算できる無料ツールです。",
  cardText: "約数・素因数分解・最大公約数・最小公倍数。",
  keywords: [
    "約数", "素因数分解", "最大公約数", "最小公倍数", "素数", "計算", "公約数", "倍数", "GCD",
  ],
  related: ["bunsu-keisan", "menseki-taiseki"],

  ui: `
<div class="field">
  <label for="num">数（1〜1兆）</label>
  <input type="number" id="num" inputmode="numeric" value="360">
</div>

<div class="result" aria-live="polite">
  <div class="result-label">素因数分解</div>
  <div class="result-main" id="primeVal" style="font-size:24px">-</div>
  <div class="result-grid">
    <div><div class="k">素数かどうか</div><div class="v" id="isPrimeVal">-</div></div>
    <div><div class="k">約数の個数</div><div class="v" id="countVal">-</div></div>
    <div><div class="k">約数の合計</div><div class="v" id="sumVal">-</div></div>
    <div><div class="k">偶数・奇数</div><div class="v" id="parityVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>約数の一覧</h3>
<div id="divisorList" class="note" style="word-break:break-all">-</div>

<h3>2つの数の公約数・公倍数</h3>
<div class="row">
  <div class="field">
    <label for="a">数A</label>
    <input type="number" id="a" inputmode="numeric" value="12">
  </div>
  <div class="field">
    <label for="b">数B</label>
    <input type="number" id="b" inputmode="numeric" value="18">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">最大公約数（GCD）</div><div class="v" id="gcdVal">-</div></div>
    <div><div class="k">最小公倍数（LCM）</div><div class="v" id="lcmVal">-</div></div>
    <div><div class="k">共通する約数</div><div class="v" id="commonVal">-</div></div>
    <div><div class="k">互いに素か</div><div class="v" id="coprimeVal">-</div></div>
  </div>
  <p class="result-sub" id="gcdDetail"></p>
</div>
`,

  script: `
(function () {
  var LIMIT = 1e12;

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  // 素因数分解。√n まで割っていく。
  function factorize(n) {
    var res = [];
    var m = n;
    for (var p = 2; p * p <= m; p += (p === 2 ? 1 : 2)) {
      var e = 0;
      while (m % p === 0) { m /= p; e++; }
      if (e > 0) res.push([p, e]);
    }
    if (m > 1) res.push([m, 1]);
    return res;
  }

  function fmtFactors(f) {
    return f.map(function (p) {
      return p[1] === 1 ? String(p[0]) : p[0] + "^" + p[1];
    }).join(" × ");
  }

  // 約数は素因数の組み合わせから作る（総当たりより速い）
  function divisorsFrom(f) {
    var list = [1];
    f.forEach(function (pair) {
      var add = [];
      var pow = 1;
      for (var e = 1; e <= pair[1]; e++) {
        pow *= pair[0];
        for (var i = 0; i < list.length; i++) add.push(list[i] * pow);
      }
      list = list.concat(add);
    });
    return list.sort(function (x, y) { return x - y; });
  }

  ST.live(function () {
    var n = Math.floor(ST.n(ST.$("num")));

    if (!(n >= 1) || n > LIMIT) {
      ["primeVal","isPrimeVal","countVal","sumVal","parityVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "1以上1兆以下の整数を入力してください。");
      ST.$("divisorList").textContent = "-";
    } else if (n === 1) {
      ST.set("primeVal", "1（素因数を持たない）");
      ST.set("isPrimeVal", "素数ではない");
      ST.set("countVal", "1個");
      ST.set("sumVal", "1");
      ST.set("parityVal", "奇数");
      ST.set("detail", "1は素数にも合成数にも分類されません。約数は1だけです。");
      ST.$("divisorList").textContent = "1";
    } else {
      var f = factorize(n);
      var isPrime = f.length === 1 && f[0][1] === 1;
      var divs = divisorsFrom(f);
      var sum = divs.reduce(function (a, b) { return a + b; }, 0);

      ST.set("primeVal", n + " = " + fmtFactors(f));
      ST.set("isPrimeVal", isPrime ? "素数です" : "合成数");
      ST.set("countVal", ST.num(divs.length, 0) + "個");
      ST.set("sumVal", ST.num(sum, 0));
      ST.set("parityVal", n % 2 === 0 ? "偶数" : "奇数");

      var perfect = sum - n === n ? "完全数です。" :
        (sum - n > n ? "自分自身を除く約数の和が元の数より大きい（過剰数）。" :
          "自分自身を除く約数の和が元の数より小さい（不足数）。");
      ST.set("detail", (isPrime
        ? "1と自分自身以外に約数を持ちません。"
        : "約数の個数は、素因数の指数に1を足して掛け合わせた値（" +
          f.map(function (p) { return "(" + p[1] + "+1)"; }).join("×") + " = " + divs.length + "）です。") +
        perfect);

      ST.$("divisorList").textContent = divs.length > 500
        ? divs.slice(0, 500).join(", ") + " …（以下省略）"
        : divs.join(", ");
    }

    // ---- 2つの数 ----
    var a = Math.floor(ST.n(ST.$("a")));
    var b = Math.floor(ST.n(ST.$("b")));
    if (!(a >= 1) || !(b >= 1) || a > LIMIT || b > LIMIT) {
      ["gcdVal","lcmVal","commonVal","coprimeVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("gcdDetail", "1以上の整数を2つ入力してください。");
      return;
    }
    var g = gcd(a, b);
    var l = a / g * b;
    var common = divisorsFrom(factorize(g));

    ST.set("gcdVal", ST.num(g, 0));
    ST.set("lcmVal", ST.num(l, 0));
    ST.set("commonVal", common.join(", "));
    ST.set("coprimeVal", g === 1 ? "互いに素" : "共通の約数あり");
    ST.set("gcdDetail",
      "最小公倍数は「A × B ÷ 最大公約数」で求まります: " +
      ST.num(a, 0) + " × " + ST.num(b, 0) + " ÷ " + g + " = " + ST.num(l, 0) +
      "。共通する約数は、最大公約数の約数と一致します。");
  });
})();
`,

  intro: `
数を入れると、素因数分解の結果と約数の一覧が表示されます。下では2つの数の最大公約数・最小公倍数も計算できます。
`,

  guide: `
## 素因数分解とは

すべての整数は、素数の掛け算の形にただ一通りに分解できます（素因数分解の一意性）。

- 360 = 2³ × 3² × 5
- 100 = 2² × 5²
- 97 = 97（素数なのでこれ以上分解できない）

素数とは、1と自分自身以外に約数を持たない2以上の整数です。2, 3, 5, 7, 11, 13, 17, 19, 23... と続きます。**1は素数に含めません。** 含めてしまうと素因数分解の一意性が崩れる（1を何個掛けても同じ数になる）ためです。

## 約数の個数を計算で求める

約数を1つずつ数えなくても、素因数分解の結果から個数が分かります。

> **約数の個数 = (指数₁ + 1) × (指数₂ + 1) × …**

360 = 2³ × 3² × 5¹ の場合、

- (3+1) × (2+1) × (1+1) = 4 × 3 × 2 = **24個**

なぜこうなるかというと、約数は「2を0〜3個、3を0〜2個、5を0〜1個」から選んで掛け合わせたものすべてだからです。それぞれの選び方の数を掛け合わせれば、組み合わせの総数になります。

## 最大公約数と最小公倍数

- **最大公約数（GCD）**: 2つの数に共通する約数のうち最大のもの
- **最小公倍数（LCM）**: 2つの数に共通する倍数のうち最小のもの

12と18を例にすると、

- 12の約数: 1, 2, 3, 4, 6, 12
- 18の約数: 1, 2, 3, 6, 9, 18
- 共通する約数: 1, 2, 3, 6 → **最大公約数は6**

そして、次の関係が常に成り立ちます。

> **A × B = 最大公約数 × 最小公倍数**

12 × 18 = 216、6 × 36 = 216 で一致します。この式から、最小公倍数は「A × B ÷ 最大公約数」で求められます。片方を求めればもう片方も分かる、という関係です。

## ユークリッドの互除法

最大公約数を効率よく求める方法です。紀元前300年ごろの『原論』に記された、現在も使われている最古のアルゴリズムのひとつです。

1071と462で試すと、

1. 1071 ÷ 462 = 2 余り **147**
2. 462 ÷ 147 = 3 余り **21**
3. 147 ÷ 21 = 7 余り **0**
4. 余りが0になったときの割る数 **21** が最大公約数

大きな数でも数回の割り算で終わります。約数を全部書き出す方法と比べて圧倒的に速く、このツールもこの手順を使っています。

## 互いに素

最大公約数が1である2つの数を「互いに素」といいます。

- 8と15 → 共通の約数は1だけ → 互いに素
- 分数 8/15 はこれ以上約分できない

分数が既約かどうかは、分子と分母が互いに素かどうかで決まります。

## 完全数

自分自身を除く約数の和が、元の数と等しくなる数です。

- **6** = 1 + 2 + 3
- **28** = 1 + 2 + 4 + 7 + 14
- **496**、**8128** と続きます

古代ギリシャから知られている数で、現在見つかっているものはすべて偶数です。奇数の完全数が存在するかどうかは、2000年以上未解決のままです。

## 日常での使い道

- **分数の約分**: 分子と分母の最大公約数で割る
- **タイルや床材を敷き詰める**: 部屋の縦横の最大公約数が、最も大きな正方形タイルの一辺になる
- **周期が重なる日を求める**: 3日ごとと5日ごとの予定が重なるのは最小公倍数の15日ごと
- **歯車の設計**: 歯数が互いに素だと、同じ歯どうしが噛み合う頻度が下がり、摩耗が均等になる
`,

  faq: [
    {
      q: "1は素数ですか？",
      a: "素数ではありません。素数は「1と自分自身以外に約数を持たない2以上の整数」と定義されています。1を素数に含めると、素因数分解が一通りに定まらなくなるためです。",
    },
    {
      q: "約数の個数を早く数える方法はありますか？",
      a: "素因数分解の指数それぞれに1を足して掛け合わせます。360 = 2³×3²×5¹ なら (3+1)×(2+1)×(1+1) = 24個です。約数を書き出さなくても求められます。",
    },
    {
      q: "最小公倍数を簡単に求めるには？",
      a: "「A × B ÷ 最大公約数」で計算できます。12と18なら 12×18÷6 = 36です。最大公約数はユークリッドの互除法で数回の割り算から求まります。",
    },
    {
      q: "「互いに素」とはどういう意味ですか？",
      a: "2つの数の最大公約数が1である状態です。8と15のように共通の約数が1しかない場合を指します。分数の分子と分母が互いに素なら、その分数はこれ以上約分できません。",
    },
    {
      q: "大きな数でも計算できますか？",
      a: "1兆までの整数に対応しています。ただし素因数が大きい数（大きな素数どうしの積など）は計算に時間がかかることがあります。約数が500個を超える場合は先頭500個までの表示になります。",
    },
  ],
};
