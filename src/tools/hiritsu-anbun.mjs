export default {
  category: "math",
  updated: "2026-08-27",
  title: "比率・按分の計算｜金額や数量を決めた比で分ける",
  h1: "比率・按分の計算ツール",
  description:
    "合計金額を3:2:1のような比で分けたり、比例配分で数量を求めたりできます。レシピの分量を人数に合わせて変えるときや、費用を負担割合で分けるときに使える無料ツールです。",
  cardText: "合計を決めた比で分ける。比例式も解ける。",
  keywords: [
    "比率", "按分", "計算", "比例配分", "割合", "分ける", "3対2", "レシピ", "負担割合",
  ],
  related: ["bunsu-keisan", "percent-keisan", "warikan"],

  ui: `
<h3 style="margin-top:0">合計を比で分ける</h3>
<div class="row">
  <div class="field">
    <label for="total">分けたい合計</label>
    <input type="number" id="total" inputmode="decimal" value="12000" step="100">
  </div>
  <div class="field">
    <label for="ratio">比（コロン、カンマ、スペース区切り）</label>
    <input type="text" id="ratio" value="3:2:1">
  </div>
  <div class="field">
    <label for="round">端数の処理</label>
    <select id="round">
      <option value="none" selected>そのまま</option>
      <option value="floor">切り捨て</option>
      <option value="round">四捨五入</option>
      <option value="ceil">切り上げ</option>
      <option value="100">100単位に切り上げ</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">配分の結果</div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>項目</th><th>比</th><th>割合</th><th>配分</th></tr></thead>
      <tbody id="splitTable"></tbody>
    </table>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>比例式を解く（A : B = C : X）</h3>
<div class="row">
  <div class="field"><label for="pa">A</label>
    <input type="number" id="pa" inputmode="decimal" value="3"></div>
  <div class="field"><label for="pb">B</label>
    <input type="number" id="pb" inputmode="decimal" value="4"></div>
  <div class="field"><label for="pc">C</label>
    <input type="number" id="pc" inputmode="decimal" value="12"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="pVal" style="font-size:26px">-</div>
  <p class="result-sub" id="pDetail"></p>
</div>

<h3>レシピの分量を変える</h3>
<div class="row">
  <div class="field"><label for="baseServe">元のレシピの人数</label>
    <input type="number" id="baseServe" inputmode="decimal" value="4" step="1"></div>
  <div class="field"><label for="newServe">作りたい人数</label>
    <input type="number" id="newServe" inputmode="decimal" value="3" step="1"></div>
  <div class="field"><label for="amount">材料の分量</label>
    <input type="number" id="amount" inputmode="decimal" value="200" step="10"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="recipeVal" style="font-size:26px">-</div>
  <p class="result-sub" id="recipeDetail"></p>
</div>
`,

  script: `
(function () {
  function parseRatio(s) {
    return String(s).split(/[:：,、\\s]+/)
      .map(function (x) { return Number(x); })
      .filter(function (x) { return isFinite(x) && x > 0; });
  }

  function applyRound(v, mode) {
    if (mode === "floor") return Math.floor(v);
    if (mode === "ceil") return Math.ceil(v);
    if (mode === "round") return Math.round(v);
    if (mode === "100") return Math.ceil(v / 100) * 100;
    return Math.round(v * 100) / 100;
  }

  ST.live(function () {
    // ---- 按分 ----
    var total = ST.n(ST.$("total"));
    var parts = parseRatio(ST.$("ratio").value);
    var mode = ST.$("round").value;

    if (!parts.length) {
      ST.$("splitTable").innerHTML = "";
      ST.set("detail", "比を「3:2:1」のように入力してください。");
    } else {
      var sum = parts.reduce(function (a, b) { return a + b; }, 0);
      var values = parts.map(function (p) { return applyRound(total * p / sum, mode); });
      var assigned = values.reduce(function (a, b) { return a + b; }, 0);
      var gap = Math.round((total - assigned) * 100) / 100;

      ST.$("splitTable").innerHTML = parts.map(function (p, i) {
        return "<tr><td>" + (i + 1) + "番目</td><td>" + ST.num(p, 3) + "</td><td>" +
          ST.num(p / sum * 100, 2) + "%</td><td><b>" + ST.num(values[i], 2) +
          "</b></td></tr>";
      }).join("") +
        "<tr><td><b>合計</b></td><td><b>" + ST.num(sum, 3) + "</b></td><td><b>100%</b></td><td><b>" +
        ST.num(assigned, 2) + "</b></td></tr>";

      ST.set("detail",
        "比の合計 " + ST.num(sum, 3) + " で割り、それぞれの比を掛けています。" +
        (Math.abs(gap) > 0.005
          ? "端数処理により合計と " + ST.num(gap, 2) +
            " のずれが出ています。差額はどれか1つの項目で調整してください。"
          : "配分の合計は元の数と一致しています。"));
    }

    // ---- 比例式 ----
    var a = ST.n(ST.$("pa")), b = ST.n(ST.$("pb")), c = ST.n(ST.$("pc"));
    if (a === 0) {
      ST.set("pVal", "-");
      ST.set("pDetail", "Aに0は使えません。");
    } else {
      var x = b * c / a;
      ST.set("pVal", "X = " + ST.num(x, 4));
      ST.set("pDetail",
        ST.num(a, 3) + " : " + ST.num(b, 3) + " = " + ST.num(c, 3) + " : X のとき、" +
        "内側どうしと外側どうしの積が等しくなるので、X = B × C ÷ A = " +
        ST.num(b, 3) + " × " + ST.num(c, 3) + " ÷ " + ST.num(a, 3) + " = " + ST.num(x, 4) + " です。");
    }

    // ---- レシピ ----
    var base = ST.n(ST.$("baseServe"));
    var want = ST.n(ST.$("newServe"));
    var amount = ST.n(ST.$("amount"));
    if (base <= 0) {
      ST.set("recipeVal", "-");
      ST.set("recipeDetail", "元のレシピの人数に0より大きい値を入力してください。");
    } else {
      var scaled = amount * want / base;
      ST.set("recipeVal", ST.num(scaled, 2));
      ST.set("recipeDetail",
        ST.num(base, 1) + "人分の " + ST.num(amount, 2) + " を " + ST.num(want, 1) +
        "人分にすると " + ST.num(scaled, 2) + " です（" +
        ST.num(want / base, 3) + "倍）。大さじ・小さじの分量は" +
        ST.num(want / base, 3) + "を掛けてから、きりのよい数に丸めてください。");
    }
  });
})();
`,

  intro: `
合計金額を「3:2:1」のような比で分けられます。**比例式を解く欄**と、**レシピの分量を人数に合わせて変える欄**も用意しています。
`,

  guide: `
## 按分の計算

決めた比率で全体を分けることを **按分（あんぶん）** といいます。

> **各項目の額 = 合計 × その項目の比 ÷ 比の合計**

12,000円を 3:2:1 で分ける場合、

- 比の合計: 3 + 2 + 1 = 6
- 1番目: 12,000 × 3 ÷ 6 = **6,000円**
- 2番目: 12,000 × 2 ÷ 6 = **4,000円**
- 3番目: 12,000 × 1 ÷ 6 = **2,000円**

## 端数が出たときの扱い

按分でよく問題になるのが端数です。10,000円を 3:3:3 で分けると、1つあたり3,333.33...円となり、切り捨てると合計が9,999円になって1円足りません。

実務では次のいずれかで処理します。

- **最後の1件で調整する**: 3,333 + 3,333 + 3,334
- **最も金額の大きい項目で調整する**: 差額の影響が相対的に小さい
- **端数を持つ順に1円ずつ配る（最大剰余法）**: 選挙の議席配分などで使われる方式

このツールは端数処理後の合計と元の数の差を表示します。差が出た場合は、どれか1つの項目で調整してください。

## 使う場面

| 場面 | 比の例 |
|---|---|
| 共同購入の費用分担 | 使う量の比 |
| 部署ごとの経費配賦 | 人数比、売上比、床面積比 |
| 相続の法定相続分 | 配偶者1/2、子で残りを等分 |
| 出資比率に応じた配当 | 出資額の比 |
| 家賃の按分（在宅勤務の経費） | 仕事に使う面積・時間の比 |

在宅勤務で家賃や光熱費を経費にする場合、**仕事に使う床面積の割合や、業務時間の割合**で按分するのが一般的です。根拠を説明できる基準を選び、記録を残しておいてください。

## 比例式の解き方

**A : B = C : X** の形は「内側どうしの積と外側どうしの積が等しい」という性質を使って解きます。

> A × X = B × C
> **X = B × C ÷ A**

3 : 4 = 12 : X なら、X = 4 × 12 ÷ 3 = **16** です。

小学校で「内項の積 = 外項の積」と習う関係です。単位の換算、地図の縮尺、拡大縮小のコピー倍率など、応用範囲の広い考え方です。

## レシピの分量を変える

> **新しい分量 = 元の分量 × 作りたい人数 ÷ 元の人数**

4人分のレシピを3人分にするなら 0.75倍、6人分にするなら 1.5倍です。

ただし、そのまま比例させないほうがよいものもあります。

- **調味料**: 素直に比例させて構いません
- **水分**: 煮込み料理では、鍋の表面積が変わらないと蒸発量も変わらないため、比例させると水っぽくなることがあります
- **加熱時間**: 量が倍でも時間は倍になりません。1.2〜1.5倍程度が目安です
- **膨張剤（ベーキングパウダー）**: 生地の量と単純比例しないことがあります

半端な数になったときは、大さじ・小さじの刻み（0.5杯単位）に丸めて構いません。塩は控えめに丸めるほうが、後から足せるぶん安全です。

## 比を最も簡単にする

3つ以上の数の比も、最大公約数で割れば簡単になります。

- 12 : 18 : 24 → すべて6で割って **2 : 3 : 4**

比を簡単にしても配分の結果は変わりません。読み取りやすくなるだけです。小数を含む比（1.5 : 2.5）は、両方を2倍して **3 : 5** のように整数化すると扱いやすくなります。
`,

  faq: [
    {
      q: "按分はどう計算しますか？",
      a: "「合計 × その項目の比 ÷ 比の合計」です。12,000円を3:2:1で分けるなら、比の合計6で割り、それぞれ3・2・1を掛けて6,000円・4,000円・2,000円になります。",
    },
    {
      q: "端数が出て合計が合いません。",
      a: "端数処理をすると合計がずれるのは避けられません。実務では、最後の1件または最も金額の大きい項目で差額を調整します。このツールはずれの額を表示するので、どこで調整するか決めてください。",
    },
    {
      q: "A : B = C : X の形はどう解きますか？",
      a: "内側どうしの積と外側どうしの積が等しくなるため、X = B × C ÷ A で求まります。3 : 4 = 12 : X なら X = 16です。",
    },
    {
      q: "4人分のレシピを3人分にするには？",
      a: "すべての材料に0.75（3÷4）を掛けます。ただし煮込み料理の水分や加熱時間は単純比例しないため、水分はやや少なめ、加熱時間は短めから様子を見てください。",
    },
    {
      q: "在宅勤務の家賃はどう按分すればいいですか？",
      a: "仕事に使う床面積の割合、または業務時間の割合で按分するのが一般的です。どちらの基準でも構いませんが、説明できる根拠を持ち、記録を残しておいてください。",
    },
  ],
};
