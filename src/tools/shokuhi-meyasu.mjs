export default {
  category: "money",
  updated: "2026-08-27",
  title: "食費の目安を計算｜1食あたり・1日あたりの予算がわかる",
  h1: "食費の予算 計算ツール",
  description:
    "月の食費予算から、1日・1食あたりに使える金額を計算します。外食の回数を差し引いた自炊の予算や、世帯人数ごとの平均との比較もできる無料ツールです。",
  cardText: "月の食費から1日・1食の予算を逆算。",
  keywords: [
    "食費", "目安", "計算", "1か月", "予算", "1食", "自炊", "外食", "平均", "節約",
  ],
  related: ["yachin-meyasu", "chokin-mokuhyo"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="fromBudget" checked>予算から1食分を出す</label>
    <label><input type="radio" name="mode" value="fromIncome">手取りから予算を出す</label>
  </div>
</div>

<div class="row">
  <div class="field" id="fBudget">
    <label for="budget">1か月の食費予算（円）</label>
    <input type="number" id="budget" inputmode="decimal" value="40000" step="1000">
  </div>
  <div class="field" id="fIncome" hidden>
    <label for="income">月の手取り（円）</label>
    <input type="number" id="income" inputmode="decimal" value="250000" step="10000">
  </div>
  <div class="field">
    <label for="people">世帯人数</label>
    <input type="number" id="people" inputmode="numeric" value="1" min="1">
  </div>
  <div class="field">
    <label for="days">計算する日数</label>
    <input type="number" id="days" inputmode="numeric" value="30" step="1">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="eatOut">外食の回数（月）</label>
    <input type="number" id="eatOut" inputmode="numeric" value="8" step="1">
  </div>
  <div class="field">
    <label for="eatOutPrice">外食1回の平均額（円）</label>
    <input type="number" id="eatOutPrice" inputmode="decimal" value="1200" step="100">
  </div>
  <div class="field">
    <label for="drink">飲み会・カフェ（月）</label>
    <input type="number" id="drink" inputmode="decimal" value="0" step="1000">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">1食あたりに使える額</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">1日あたり</div><div class="v" id="dailyVal">-</div></div>
    <div><div class="k">外食の合計</div><div class="v" id="eatOutVal">-</div></div>
    <div><div class="k">自炊に使える額</div><div class="v" id="cookVal">-</div></div>
    <div><div class="k">自炊1食あたり</div><div class="v" id="perCookVal">-</div></div>
    <div><div class="k">1人あたり（月）</div><div class="v" id="perPersonVal">-</div></div>
    <div><div class="k">エンゲル係数の目安</div><div class="v" id="engelVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>世帯人数ごとの平均食費（総務省 家計調査の水準）</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>世帯</th><th>食費の平均（月）</th><th>うち外食</th><th>あなたの予算との差</th></tr></thead>
    <tbody id="avgTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // 総務省・家計調査のおおよその水準（1か月）
  var AVG = [
    [1, 42000, 13000],
    [2, 69000, 12000],
    [3, 83000, 14000],
    [4, 90000, 15000],
    [5, 99000, 16000]
  ];

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("fBudget").hidden = mode !== "fromBudget";
    ST.$("fIncome").hidden = mode !== "fromIncome";

    var people = Math.max(1, Math.round(ST.n(ST.$("people"), 1)));
    var days = Math.max(1, Math.round(ST.n(ST.$("days"), 30)));
    var outCount = Math.max(0, ST.n(ST.$("eatOut")));
    var outPrice = Math.max(0, ST.n(ST.$("eatOutPrice")));
    var drink = Math.max(0, ST.n(ST.$("drink")));

    var budget, income = 0;
    if (mode === "fromBudget") {
      budget = Math.max(0, ST.n(ST.$("budget")));
    } else {
      income = Math.max(0, ST.n(ST.$("income")));
      // 手取りに対する食費の目安は15〜18%。ここでは16%で計算する
      budget = income * 0.16;
    }

    if (budget <= 0) {
      ["mainVal","dailyVal","eatOutVal","cookVal","perCookVal","perPersonVal","engelVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "予算または手取りを入力してください。");
      ST.$("avgTable").innerHTML = "";
      return;
    }

    var meals = days * 3 * people;         // 期間中の総食数
    var outTotal = outCount * outPrice + drink;
    var cookBudget = Math.max(0, budget - outTotal);
    var cookMeals = Math.max(1, meals - outCount);

    ST.$("mainLabel").textContent = mode === "fromBudget"
      ? "1食あたりに使える額" : "食費の目安（月）";
    ST.set("mainVal", mode === "fromBudget"
      ? ST.yen(Math.round(budget / meals), 0)
      : ST.yen(Math.round(budget / 1000) * 1000, 0));
    ST.set("dailyVal", ST.yen(Math.round(budget / days), 0));
    ST.set("eatOutVal", ST.yen(Math.round(outTotal), 0));
    ST.set("cookVal", ST.yen(Math.round(cookBudget), 0));
    ST.set("perCookVal", ST.yen(Math.round(cookBudget / cookMeals), 0));
    ST.set("perPersonVal", ST.yen(Math.round(budget / people), 0));
    ST.set("engelVal", income > 0 ? ST.num(budget / income * 100, 1) + "%" : "—");

    ST.set("detail",
      (mode === "fromIncome"
        ? "手取りの16%を食費の目安としています（一般に15〜18%が適正とされます）。"
        : "") +
      days + "日 × 3食 × " + people + "人 = " + meals + "食で割っています。" +
      (outTotal > 0
        ? "外食・飲み会の " + ST.yen(Math.round(outTotal), 0) +
          " を差し引くと、自炊に使えるのは " + ST.yen(Math.round(cookBudget), 0) +
          "（1食 " + ST.yen(Math.round(cookBudget / cookMeals), 0) + "）です。"
        : ""));

    ST.$("avgTable").innerHTML = AVG.map(function (r) {
      var diff = budget - r[1];
      var hit = r[0] === people;
      return "<tr" + (hit ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + r[0] + "人世帯</td><td>" + ST.yen(r[1], 0) + "</td><td>" +
        ST.yen(r[2], 0) + "</td><td>" +
        (hit ? (diff >= 0 ? "+" : "") + ST.yen(Math.round(diff), 0) : "—") +
        "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
月の食費予算から、1日・1食あたりに使える金額を計算します。**外食のぶんを差し引いた自炊の予算**も出るので、実際に買い物をするときの基準になります。
`,

  guide: `
## 食費の目安

手取りに対する割合で考えると、目安が立てやすくなります。

| 世帯 | 手取りに占める割合の目安 |
|---|---|
| 単身 | 15〜18% |
| 2人世帯 | 14〜16% |
| 3〜4人世帯 | 15〜18% |

手取り25万円の単身なら、**月3.7〜4.5万円** が一つの水準です。

## エンゲル係数

消費支出（生活費全体）に占める食費の割合を **エンゲル係数** といいます。

一般に、収入が高いほどこの数値は下がります。食費には下限があり、収入が増えても食べる量はそれほど変わらないためです。19世紀の統計学者エンゲルが見出した法則で、生活水準を測る指標として使われてきました。

日本の平均は近年 **26〜29%** 前後で推移しています。かつては20%台前半まで下がっていましたが、食品価格の上昇により再び上がっています。

ただし現代では、外食や中食（惣菜・弁当）の利用が増えたこと、共働きで時間を買う支出が増えたことなどから、**エンゲル係数が高い＝生活が苦しい、とは単純に言えなくなっています**。

## 世帯人数と食費の関係

食費は人数に比例して増えるわけではありません。

| 世帯 | 食費の平均（月） | 1人あたり |
|---|---|---|
| 1人 | 約42,000円 | 42,000円 |
| 2人 | 約69,000円 | 34,500円 |
| 3人 | 約83,000円 | 27,700円 |
| 4人 | 約90,000円 | 22,500円 |

**人数が増えるほど1人あたりは安くなります。** まとめ買いができる、調味料や光熱費を分け合える、食材を使い切れるといった理由からです。単身世帯の食費が割高になるのは、少量パックの単価が高く、食材を余らせやすいためです。

## 1食あたりの目安

月4万円の単身世帯（30日 × 3食 = 90食）なら、1食あたり約444円です。

ここから外食を差し引くと、自炊の予算がはっきりします。

- 外食が月8回・1回1,200円 → 9,600円
- 残り30,400円 ÷ 82食 = **1食約370円**

「1食370円」という数字が見えると、スーパーでの判断がしやすくなります。1回の買い物で3日分（9食）を賄うなら、予算は約3,300円ということです。

## 食費を抑える方法

効果の大きい順に並べると次のようになります。

1. **買い物の回数を減らす**: 週2回程度にまとめると、ついで買いが減ります。行くたびに1,000円の余分な買い物をしていれば、週3回減らすだけで月12,000円の差です
2. **在庫を把握してから買い物に行く**: 同じ調味料を何本も買う、食材を腐らせる、といった無駄が減ります
3. **主菜を先に決める**: 献立が決まっていないと、余計なものを買いがちです
4. **飲み物を持参する**: 1日150円のペットボトルでも月4,500円
5. **業務用スーパー・冷凍食品の活用**: 保存が利くため廃棄が減ります

一方、**「安い食材だけを買う」という方向は続きにくく、栄養も偏りがち** です。捨てる量を減らすほうが、我慢を伴わないぶん長続きします。

日本の食品ロスは1人あたり年間約42kgと推計されており、金額にすると数万円規模になります。

## 外食との付き合い方

外食を完全にやめる必要はありません。頻度と単価を決めておくと、罪悪感なく使えます。

| 使い方 | 月の目安 |
|---|---|
| ランチ（500〜800円）を週2回 | 4,000〜6,400円 |
| 夕食（1,000〜1,500円）を週1回 | 4,000〜6,000円 |
| 飲み会（4,000円）を月2回 | 8,000円 |

このツールでは外食のぶんを別枠で入力できるので、「外食を1回減らすと自炊の1食予算がいくら増えるか」を試せます。
`,

  faq: [
    {
      q: "1人暮らしの食費は月いくらが目安ですか？",
      a: "手取りの15〜18%が目安です。手取り25万円なら月3.7〜4.5万円になります。総務省の家計調査では単身世帯の平均が月4万円前後で、うち外食が1.3万円ほどを占めています。",
    },
    {
      q: "エンゲル係数はどれくらいが普通ですか？",
      a: "日本の平均は近年26〜29%前後です。ただし外食や惣菜の利用が増えた現代では、この数値が高いことが必ずしも生活の苦しさを示すとは限りません。",
    },
    {
      q: "家族が増えると食費は人数分になりますか？",
      a: "なりません。まとめ買いができ、調味料を分け合えるため、1人あたりの食費は下がります。単身42,000円に対し、4人世帯では1人あたり22,500円程度です。",
    },
    {
      q: "食費を減らすには何から始めればいいですか？",
      a: "買い物の回数を減らすことが最も効果的です。行くたびに余分な買い物が発生するためで、週3回を週2回にするだけで月数千円変わります。安い食材に切り替えるより長続きします。",
    },
    {
      q: "1食あたりいくらで作れますか？",
      a: "自炊なら1食300〜400円が一つの目安です。月4万円の予算で外食8回（9,600円）を除くと、残り30,400円を82食で割って約370円になります。",
    },
  ],
};
