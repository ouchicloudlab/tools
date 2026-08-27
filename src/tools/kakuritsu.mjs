export default {
  category: "math",
  updated: "2026-08-27",
  title: "確率の計算｜何回引けば当たるか・組み合わせの数",
  h1: "確率・組み合わせの計算ツール",
  description:
    "当選確率から「n回引いて1回以上当たる確率」を計算します。目標の確率に達するまでの必要回数や、順列・組み合わせの数も求められる無料ツールです。",
  cardText: "n回引いて当たる確率と、必要な回数を計算。",
  keywords: [
    "確率", "計算", "ガチャ", "抽選", "何回", "組み合わせ", "順列", "期待値", "宝くじ",
  ],
  yomi: "かくりつ がちゃ くみあわせ",
  related: ["percent-keisan", "yakusu-baisu"],

  ui: `
<h3 style="margin-top:0">n回引いて1回以上当たる確率</h3>
<div class="row">
  <div class="field">
    <label for="rate">1回あたりの当選確率（%）</label>
    <input type="number" id="rate" inputmode="decimal" value="3" step="0.1">
  </div>
  <div class="field">
    <label for="times">引く回数</label>
    <input type="number" id="times" inputmode="numeric" value="30" step="1">
  </div>
  <div class="field">
    <label for="cost">1回あたりの費用（円）</label>
    <input type="number" id="cost" inputmode="decimal" value="300" step="100">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">1回以上当たる確率</div>
  <div class="result-main" id="atLeastVal">-</div>
  <div class="result-grid">
    <div><div class="k">1回も当たらない確率</div><div class="v" id="noneVal">-</div></div>
    <div><div class="k">当たる回数の期待値</div><div class="v" id="expectVal">-</div></div>
    <div><div class="k">かかる費用</div><div class="v" id="costVal">-</div></div>
    <div><div class="k">1回当てるまでの平均回数</div><div class="v" id="avgVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>目標の確率に達する回数</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>目標</th><th>必要な回数</th><th>費用</th></tr></thead>
    <tbody id="targetTable"></tbody>
  </table>
</div>

<h3>順列・組み合わせ</h3>
<div class="row">
  <div class="field">
    <label for="n">全体の数（n）</label>
    <input type="number" id="n" inputmode="numeric" value="43" step="1">
  </div>
  <div class="field">
    <label for="r">選ぶ数（r）</label>
    <input type="number" id="r" inputmode="numeric" value="6" step="1">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">組み合わせ nCr（順序なし）</div><div class="v" id="combVal">-</div></div>
    <div><div class="k">順列 nPr（順序あり）</div><div class="v" id="permVal">-</div></div>
    <div><div class="k">1通りを当てる確率</div><div class="v" id="oneVal">-</div></div>
  </div>
  <p class="result-sub" id="combDetail"></p>
</div>
`,

  script: `
(function () {
  function comb(n, r) {
    if (r < 0 || r > n) return 0;
    r = Math.min(r, n - r);
    var res = 1;
    for (var i = 0; i < r; i++) {
      res = res * (n - i) / (i + 1);
    }
    return Math.round(res);
  }
  function perm(n, r) {
    if (r < 0 || r > n) return 0;
    var res = 1;
    for (var i = 0; i < r; i++) res *= (n - i);
    return res;
  }
  function big(n) {
    if (!isFinite(n)) return "大きすぎます";
    if (n >= 1e16) return n.toExponential(3);
    return ST.num(n, 0);
  }

  ST.live(function () {
    var p = ST.n(ST.$("rate")) / 100;
    var times = Math.max(0, Math.round(ST.n(ST.$("times"))));
    var cost = Math.max(0, ST.n(ST.$("cost")));

    if (p <= 0 || p > 1) {
      ["atLeastVal","noneVal","expectVal","costVal","avgVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "当選確率は0より大きく100以下で入力してください。");
      ST.$("targetTable").innerHTML = "";
    } else {
      // 1回以上当たる確率 = 1 −（外れ続ける確率）
      var none = Math.pow(1 - p, times);
      var atLeast = 1 - none;

      ST.set("atLeastVal", ST.num(atLeast * 100, 2) + " %");
      ST.set("noneVal", ST.num(none * 100, 2) + " %");
      ST.set("expectVal", ST.num(p * times, 2) + " 回");
      ST.set("costVal", ST.yen(Math.round(cost * times), 0));
      ST.set("avgVal", ST.num(1 / p, 1) + " 回（" +
        ST.yen(Math.round(cost / p), 0) + "）");
      ST.set("detail",
        "「1回以上当たる確率」は、1から「" + times + "回すべて外れる確率」を引いて求めます: " +
        "1 − (1 − " + ST.num(p, 4) + ")^" + times + " = " + ST.num(atLeast * 100, 2) + "%。" +
        "確率" + ST.num(p * 100, 2) + "%を" + ST.num(1 / p, 0) +
        "回引いても、当たる確率は約63%にしかなりません。");

      var targets = [50, 63.2, 80, 90, 95, 99, 99.9];
      ST.$("targetTable").innerHTML = targets.map(function (t) {
        // n = log(1 − 目標) / log(1 − p)
        var n = Math.ceil(Math.log(1 - t / 100) / Math.log(1 - p));
        return "<tr><td>" + t + "% 以上</td><td>" + ST.num(n, 0) +
          " 回</td><td>" + ST.yen(Math.round(n * cost), 0) + "</td></tr>";
      }).join("");
    }

    // 組み合わせ
    var n = Math.max(0, Math.round(ST.n(ST.$("n"))));
    var r = Math.max(0, Math.round(ST.n(ST.$("r"))));
    if (n > 1000 || r > n) {
      ST.set("combVal", r > n ? "選ぶ数が多すぎます" : "nは1000以下で");
      ST.set("permVal", "-");
      ST.set("oneVal", "-");
      ST.set("combDetail", "");
    } else {
      var c = comb(n, r);
      var pm = perm(n, r);
      ST.set("combVal", big(c) + " 通り");
      ST.set("permVal", big(pm) + " 通り");
      ST.set("oneVal", c > 0 ? "1 / " + big(c) + "（" + ST.num(1 / c * 100, 8) + "%）" : "-");
      ST.set("combDetail",
        n + "個から" + r + "個を選ぶとき、順序を区別しない組み合わせは " + big(c) +
        " 通り、順序を区別する順列は " + big(pm) + " 通りです。" +
        (n === 43 && r === 6 ? "これはロト6（1〜43から6個）の全通り数です。" : ""));
    }
  });
})();
`,

  intro: `
1回あたりの当選確率から、**n回引いて1回以上当たる確率**を計算します。目標の確率に達するまでに必要な回数と費用も分かります。
`,

  guide: `
## 「1回以上当たる確率」の計算

直感に反しやすい部分です。確率3%のくじを30回引いても、当たる確率は90%になりません。

正しくは **「1回も当たらない確率」を先に求め、それを1から引きます**。

> **1回以上当たる確率 = 1 − (1 − p)ⁿ**

確率3%（p = 0.03）を30回なら、

- 1回も当たらない確率: 0.97³⁰ = 0.401（40.1%）
- 1回以上当たる確率: 1 − 0.401 = **59.9%**

3% × 30回 = 90%、という計算は誤りです。同じ抽選を繰り返しても、確率は足し算になりません。

## 「確率の逆数」回引いても63%

**確率1/nのくじをn回引いても、当たる確率は約63.2%** にしかなりません。

| 確率 | 引く回数 | 1回以上当たる確率 |
|---|---|---|
| 10% | 10回 | 65.1% |
| 3% | 33回 | 63.3% |
| 1% | 100回 | 63.4% |
| 0.1% | 1000回 | 63.2% |

これは数学定数 e（自然対数の底、約2.718）に由来する性質で、回数が増えるほど **1 − 1/e = 63.2%** に近づきます。

「確率1%なら100回で当たるはず」と考えるのは誤りで、**3回に1回以上は外れる** ということです。

## 目標の確率に必要な回数

> **必要な回数 = log(1 − 目標確率) ÷ log(1 − 1回の確率)**

確率3%の場合、

| 目標 | 必要な回数 |
|---|---|
| 50% | 23回 |
| 90% | 76回 |
| 99% | 152回 |
| 99.9% | 227回 |

**99%を目指すと、50%の6.6倍の回数** が必要です。確率を上げるほど、必要な試行回数は急激に増えます。

## 天井（保証）がある場合

多くのソーシャルゲームには「◯回引けば必ず当たる」という上限が設定されています。これがある場合、上の計算とは別に、**最悪でもその回数で入手できる** と考えられます。

天井までの費用を計算し、それを「上限額」として判断するのが現実的です。期待値ではなく最悪値で予算を決めるほうが、後悔が少なくなります。

## 独立試行という前提

上の計算は、**毎回の確率が変わらない（独立している）** ことが前提です。次のような場合は当てはまりません。

- 当たりを引いたら箱から取り除かれる（くじ引き、非復元抽出）
- 外れるたびに確率が上がる（一部のゲームの救済処置）
- 前回の結果が次に影響する

なお、**過去に外れ続けたからといって、次に当たりやすくなることはありません**。これを誤解することを「ギャンブラーの誤謬」といいます。コインを10回投げて全部表でも、11回目が裏になる確率は変わらず50%です。

## 組み合わせと順列

| 種類 | 記号 | 意味 |
|---|---|---|
| 組み合わせ | nCr | n個からr個を選ぶ（**順序を区別しない**） |
| 順列 | nPr | n個からr個を選んで並べる（**順序を区別する**） |

> **nCr = n! ÷ (r! × (n−r)!)**
> **nPr = n! ÷ (n−r)!**

「1・2・3」と「3・2・1」を同じとみなすのが組み合わせ、別とみなすのが順列です。

### 宝くじの当選確率

| くじ | 選び方 | 全通り | 1等の確率 |
|---|---|---|---|
| ロト6 | 43個から6個 | 6,096,454 | 約610万分の1 |
| ロト7 | 37個から7個 | 10,295,472 | 約1,030万分の1 |
| ミニロト | 31個から5個 | 169,911 | 約17万分の1 |

**ロト6の1等は約610万分の1** です。これは、日本で1年間に交通事故で亡くなる確率（約4万分の1）よりはるかに低い数字です。

## 同じ誕生日の人がいる確率

23人集まると、同じ誕生日の人がいる確率は **50%を超えます**。これは「誕生日のパラドックス」として知られています。

- 23人 → 50.7%
- 30人 → 70.6%
- 50人 → 97.0%
- 70人 → 99.9%

直感では「365日あるのだから、23人では低いはず」と感じますが、**比べる組み合わせが 23C2 = 253通りもある** ためです。1人ずつではなく、ペアの数で考えると納得できます。
`,

  faq: [
    {
      q: "確率3%のくじを30回引けば90%当たりますか？",
      a: "当たりません。約60%です。確率は足し算にならず、「1 −(1 − 0.03)の30乗」で計算します。3%を30回引いても、4割は1回も当たらない計算になります。",
    },
    {
      q: "確率1%なら100回で当たりますか？",
      a: "100回引いても当たる確率は約63%です。3回に1回以上は外れます。確率の逆数だけ試行しても63.2%にしかならないのは、数学定数eに由来する性質です。",
    },
    {
      q: "99%の確率で当てるには何回必要ですか？",
      a: "確率3%なら152回です。50%に必要な23回の6.6倍にあたります。確率を上げるほど、必要な回数は急激に増えます。",
    },
    {
      q: "外れ続けたら次は当たりやすくなりますか？",
      a: "なりません。毎回の抽選が独立している限り、過去の結果は次に影響しません。これを誤解することを「ギャンブラーの誤謬」といいます。ただし救済処置のある仕組みは例外です。",
    },
    {
      q: "組み合わせと順列の違いは何ですか？",
      a: "順序を区別するかどうかです。「1・2・3」と「3・2・1」を同じとみなすのが組み合わせ（nCr）、別とみなすのが順列（nPr）です。宝くじの当選確率は組み合わせで計算します。",
    },
  ],
};
