export default {
  category: "money",
  updated: "2026-08-27",
  title: "積立・複利計算ツール｜毎月いくら積むと何年でいくらになるか",
  h1: "積立・複利計算ツール",
  description:
    "毎月の積立額・想定利回り・期間から、将来の金額と運用益を計算します。目標額から逆算して必要な積立額を求めることもできる、つみたてNISA向けの無料シミュレーションです。",
  cardText: "毎月の積立が何年でいくらになるか。逆算も可能。",
  keywords: [
    "積立", "複利", "計算", "NISA", "資産運用", "利回り", "シミュレーション", "貯金", "投資信託",
  ],
  related: ["loan-keisan", "percent-keisan"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="future" checked>いくらになるか</label>
    <label><input type="radio" name="mode" value="need">毎月いくら必要か</label>
  </div>
</div>

<div class="row">
  <div class="field" id="fieldMonthly">
    <label for="monthly">毎月の積立額（円）</label>
    <input type="number" id="monthly" inputmode="decimal" value="30000" step="1000">
  </div>
  <div class="field" id="fieldGoal" hidden>
    <label for="goal">目標額（万円）</label>
    <input type="number" id="goal" inputmode="decimal" value="1000" step="100">
  </div>
  <div class="field">
    <label for="rate">想定利回り（年%）</label>
    <input type="number" id="rate" inputmode="decimal" value="5" step="0.1">
  </div>
  <div class="field">
    <label for="years">積立期間（年）</label>
    <input type="number" id="years" inputmode="decimal" value="20" step="1">
  </div>
</div>

<div class="field">
  <label for="initial">最初にまとめて入れる額（万円・任意）</label>
  <input type="number" id="initial" inputmode="decimal" value="0" step="10">
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">積立後の金額</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">元本（自分で入れた額）</div><div class="v" id="principalVal">-</div></div>
    <div><div class="k">運用益</div><div class="v" id="profitVal">-</div></div>
    <div><div class="k">元本に対する増加率</div><div class="v" id="growthVal">-</div></div>
    <div><div class="k">利回り0%だった場合</div><div class="v" id="zeroVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>年ごとの推移</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>経過</th><th>元本</th><th>評価額</th><th>運用益</th></tr></thead>
    <tbody id="yearTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var MAN = 10000;

  // 毎月積立の将来価値。月利で毎月複利がつく前提。
  //   積立分: m × ((1+r)^n − 1) ÷ r
  //   一括分: P × (1+r)^n
  function futureValue(monthly, initial, r, n) {
    var fromInitial = initial * Math.pow(1 + r, n);
    var fromMonthly = r === 0
      ? monthly * n
      : monthly * (Math.pow(1 + r, n) - 1) / r;
    return fromInitial + fromMonthly;
  }

  function clear(msg) {
    ["mainVal","principalVal","profitVal","growthVal","zeroVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.$("yearTable").innerHTML = "";
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("fieldMonthly").hidden = mode !== "future";
    ST.$("fieldGoal").hidden = mode !== "need";

    var annual = ST.n(ST.$("rate"));
    var years = ST.n(ST.$("years"));
    var n = Math.round(years * 12);
    var r = annual / 100 / 12;
    var initial = ST.n(ST.$("initial")) * MAN;

    if (n <= 0) return clear("積立期間を入力してください。");
    if (annual < 0) return clear("想定利回りには0以上の値を入力してください。");

    var monthly;
    if (mode === "future") {
      monthly = ST.n(ST.$("monthly"));
    } else {
      // 目標額から毎月の積立額を逆算する
      var goal = ST.n(ST.$("goal")) * MAN;
      var fromInitial = initial * Math.pow(1 + r, n);
      var rest = goal - fromInitial;
      if (rest <= 0) {
        ST.$("mainLabel").textContent = "毎月の積立額";
        ST.set("mainVal", "0円");
        ST.set("detail", "最初に入れる額だけで目標に届きます。");
        monthly = 0;
      } else {
        monthly = r === 0 ? rest / n : rest * r / (Math.pow(1 + r, n) - 1);
      }
    }

    var total = futureValue(monthly, initial, r, n);
    var principal = monthly * n + initial;
    var profit = total - principal;

    if (mode === "future") {
      ST.$("mainLabel").textContent = years + "年後の金額";
      ST.set("mainVal", ST.yen(Math.round(total), 0));
    } else {
      ST.$("mainLabel").textContent = "毎月の積立額";
      ST.set("mainVal", ST.yen(Math.round(monthly), 0));
    }

    ST.set("principalVal", ST.yen(Math.round(principal), 0));
    ST.set("profitVal", ST.yen(Math.round(profit), 0));
    ST.set("growthVal", principal > 0
      ? "+" + ST.num(profit / principal * 100, 1) + "%" : "-");
    ST.set("zeroVal", ST.yen(Math.round(principal), 0));
    ST.set("detail",
      "毎月" + ST.yen(Math.round(monthly), 0) + "を" + years + "年間（" + n +
      "回）積み立てると、元本は " + ST.yen(Math.round(principal), 0) +
      "。年利" + ST.num(annual, 2) + "%で運用できた場合、" +
      ST.yen(Math.round(total), 0) + " になる計算です。");

    // 年ごとの推移
    var rows = "";
    var step = years > 30 ? 5 : (years > 12 ? 2 : 1);
    for (var y = step; y <= years; y += step) {
      var m = Math.round(y * 12);
      var v = futureValue(monthly, initial, r, m);
      var p = monthly * m + initial;
      rows += "<tr><td>" + y + "年後</td><td>" + ST.yen(Math.round(p), 0) +
        "</td><td>" + ST.yen(Math.round(v), 0) + "</td><td>" +
        ST.yen(Math.round(v - p), 0) + "</td></tr>";
    }
    ST.$("yearTable").innerHTML = rows;
  });
})();
`,

  intro: `
毎月の積立額・想定利回り・期間を入れると、将来いくらになるかが出ます。「1,000万円貯めるには毎月いくら必要か」という逆算もできます。
`,

  guide: `
## 複利とは

複利とは、**利息にもさらに利息がつく** 仕組みです。元本にだけ利息がつく単利と比べると、期間が長くなるほど差が開きます。

100万円を年5%で運用した場合の比較です。

| 期間 | 単利 | 複利 | 差 |
|---|---|---|---|
| 10年 | 150万円 | 163万円 | 13万円 |
| 20年 | 200万円 | 265万円 | 65万円 |
| 30年 | 250万円 | 432万円 | 182万円 |

30年で差は182万円、元本の1.8倍以上になります。「複利は時間が味方する」と言われるのはこのためです。

## 積立の計算式

毎月一定額を積み立てる場合の将来価値は、次の式で求まります。

> **将来価値 = 毎月の積立額 × ((1 + 月利)^回数 − 1) ÷ 月利**

月利は「年利 ÷ 12」です。年5%なら月利は約0.4167%（0.004167）になります。

毎月3万円を年5%で20年積み立てた場合、

- 元本: 3万円 × 240回 = **720万円**
- 将来価値: 約 **1,233万円**
- 運用益: 約513万円

元本の7割にあたる金額が運用益になります。

## 72の法則

**資産が2倍になるまでのおよその年数** は、72を年利で割ると求まります。

> **72 ÷ 年利(%) = 2倍になる年数**

| 年利 | 2倍になるまで |
|---|---|
| 1% | 72年 |
| 3% | 24年 |
| 5% | 14.4年 |
| 7% | 約10年 |
| 10% | 約7年 |

普通預金の金利（0.001%程度）だと7万年かかる計算になります。逆に、借金の側から見ると、リボ払いの年利15%は約5年で返済額が倍になるということでもあります。

## 想定利回りは何%で計算すべきか

過去の実績から、目安として使われる数字です。

| 対象 | 長期の年平均リターン（目安） |
|---|---|
| 全世界株式インデックス | 5〜7% |
| 米国株式（S&P500） | 6〜9% |
| 先進国債券 | 1〜3% |
| バランス型（株式50%） | 3〜5% |
| 定期預金 | 0.02〜0.3% |

**いずれも過去の実績であり、将来を保証するものではありません。** 保守的に見るなら3%、標準的なら5%で試算し、その差を確認しておくと計画に幅を持たせられます。

また、実際のリターンは毎年一定ではありません。年によっては大きく下落します。このツールの計算は「毎年同じ利回りが続いた場合」の理論値であり、途中経過は上下します。

## 手数料と税金の影響

上の計算には含まれていない要素です。

- **信託報酬**: 投資信託の運用にかかる費用。年0.1〜2%程度が毎日差し引かれます。想定利回りからこの分を引いて計算するほうが実態に近くなります
- **税金**: 運用益には通常20.315%の税金がかかります。1,000万円の利益なら約203万円です
- **NISA口座**: この税金がかかりません。2024年からの新NISAでは、つみたて投資枠で年120万円、成長投資枠で年240万円、生涯で1,800万円まで非課税で運用できます

信託報酬0.2%の商品を年5%の想定で買う場合、実質的な利回りは4.8%として計算するのが妥当です。**このツールの利回り欄には、信託報酬を引いた後の数字を入れる** と精度が上がります。

## 積立額の目安

手取り収入に対する貯蓄率の目安です。

| 世帯 | 貯蓄率の目安 |
|---|---|
| 単身・20代 | 手取りの20〜30% |
| 単身・30代以降 | 手取りの25〜35% |
| 夫婦のみ | 手取りの25〜30% |
| 子どもあり | 手取りの10〜20% |

無理な金額を設定して途中でやめてしまうより、続けられる金額で長く積み立てるほうが結果は大きくなります。上の表で20年積み立てた場合、毎月1万円でも約411万円（年5%）になります。

> 投資には元本割れのリスクがあります。このツールの計算は一定の利回りを仮定した試算であり、将来の運用成果を約束するものではありません。実際の商品選びや資金計画については、ご自身で判断するか専門家にご相談ください。
`,

  faq: [
    {
      q: "想定利回りは何%で計算すればいいですか？",
      a: "全世界株式インデックスの長期実績が年5〜7%程度とされており、5%で試算されることが多いです。保守的に見るなら3%も試して、幅を確認しておくと安心です。いずれも将来を保証する数字ではありません。",
    },
    {
      q: "「72の法則」とは何ですか？",
      a: "72を年利（%）で割ると、資産が2倍になるまでのおよその年数が分かる目安です。年5%なら約14.4年、年7%なら約10年で倍になります。",
    },
    {
      q: "信託報酬は計算に含まれていますか？",
      a: "含まれていません。想定利回りの欄に、信託報酬を引いた後の数字を入れてください。年5%を想定していて信託報酬が0.2%なら、4.8%と入力すると実態に近くなります。",
    },
    {
      q: "税金は考慮されていますか？",
      a: "されていません。通常の課税口座では運用益に20.315%の税金がかかります。NISA口座であれば非課税なので、この計算がそのまま使えます。",
    },
    {
      q: "毎月3万円を20年積み立てるといくらになりますか？",
      a: "年5%で運用できた場合、約1,233万円です。元本は720万円なので、運用益が約513万円になる計算です。ただし実際の運用成果は市場の動きによって変わります。",
    },
  ],
};
