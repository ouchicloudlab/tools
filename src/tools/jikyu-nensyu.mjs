export default {
  category: "money",
  updated: "2026-08-16",
  title: "時給・月給・年収の換算ツール｜働き方を変えたときの収入を比較",
  h1: "時給・月給・年収 換算ツール",
  description:
    "時給・日給・月給・年収のどれかを入れると、残りがすべて計算されます。勤務日数や1日の労働時間を変えて、働き方を変えたときの収入を比べられる無料ツールです。",
  cardText: "時給⇔日給⇔月給⇔年収を相互換算。",
  keywords: [
    "時給", "月給", "年収", "換算", "計算", "日給", "手取り", "パート", "アルバイト", "収入",
  ],
  related: ["shohizei-keisan", "percent-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="hoursPerDay">1日の労働時間（時間）</label>
    <input type="number" id="hoursPerDay" inputmode="decimal" value="8" step="0.25">
  </div>
  <div class="field">
    <label for="daysPerMonth">1か月の勤務日数（日）</label>
    <input type="number" id="daysPerMonth" inputmode="decimal" value="20" step="0.5">
  </div>
  <div class="field">
    <label for="bonus">賞与（年間の月数分）</label>
    <input type="number" id="bonus" inputmode="decimal" value="0" step="0.1">
    <p class="hint">年2回・各2か月分なら「4」。無しなら0。</p>
  </div>
</div>

<hr>

<div class="row">
  <div class="field">
    <label for="hourly">時給（円）</label>
    <input type="number" id="hourly" inputmode="decimal" value="1200">
  </div>
  <div class="field">
    <label for="daily">日給（円）</label>
    <input type="number" id="daily" inputmode="decimal" value="9600">
  </div>
</div>
<div class="row">
  <div class="field">
    <label for="monthly">月給（円）</label>
    <input type="number" id="monthly" inputmode="decimal" value="192000">
  </div>
  <div class="field">
    <label for="yearly">年収（円）</label>
    <input type="number" id="yearly" inputmode="decimal" value="2304000">
  </div>
</div>
<p class="hint">どの欄に入力しても、ほかの3つが自動で計算されます。</p>

<div class="result" aria-live="polite">
  <div class="result-label">年収</div>
  <div class="result-main" id="yearVal">-</div>
  <div class="result-grid">
    <div><div class="k">時給</div><div class="v" id="rHour">-</div></div>
    <div><div class="k">日給</div><div class="v" id="rDay">-</div></div>
    <div><div class="k">月給</div><div class="v" id="rMonth">-</div></div>
    <div><div class="k">年間の労働時間</div><div class="v" id="rHours">-</div></div>
    <div><div class="k">手取りの目安（年）</div><div class="v" id="rNet">-</div></div>
    <div><div class="k">手取りの目安（月）</div><div class="v" id="rNetM">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var lock = false;

  function params() {
    return {
      h: Math.max(0, ST.n(ST.$("hoursPerDay"))),
      d: Math.max(0, ST.n(ST.$("daysPerMonth"))),
      b: Math.max(0, ST.n(ST.$("bonus")))
    };
  }

  // 額面年収から手取りの概算を出す。
  // 社会保険料を約15%、所得税・住民税を課税所得に応じた概算で引く。
  function netIncome(gross) {
    if (gross <= 0) return 0;
    var social = gross * 0.15;
    // 給与所得控除（2020年以降の区分）
    var deduction;
    if (gross <= 1625000) deduction = 550000;
    else if (gross <= 1800000) deduction = gross * 0.4 - 100000;
    else if (gross <= 3600000) deduction = gross * 0.3 + 80000;
    else if (gross <= 6600000) deduction = gross * 0.2 + 440000;
    else if (gross <= 8500000) deduction = gross * 0.1 + 1100000;
    else deduction = 1950000;
    var taxable = Math.max(0, gross - deduction - social - 480000); // 基礎控除48万
    var incomeTax;
    if (taxable <= 1950000) incomeTax = taxable * 0.05;
    else if (taxable <= 3300000) incomeTax = taxable * 0.1 - 97500;
    else if (taxable <= 6950000) incomeTax = taxable * 0.2 - 427500;
    else if (taxable <= 9000000) incomeTax = taxable * 0.23 - 636000;
    else incomeTax = taxable * 0.33 - 1536000;
    incomeTax = Math.max(0, incomeTax) * 1.021; // 復興特別所得税
    var residentTax = Math.max(0, taxable * 0.1 + 5000);
    return Math.max(0, gross - social - incomeTax - residentTax);
  }

  function clear(msg) {
    ["yearVal","rHour","rDay","rMonth","rHours","rNet","rNetM"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  function render(hourly, from) {
    var p = params();
    if (p.h <= 0 || p.d <= 0) {
      return clear("1日の労働時間と1か月の勤務日数に、0より大きい値を入力してください。");
    }
    var daily = hourly * p.h;
    var monthly = daily * p.d;
    var yearly = monthly * (12 + p.b);
    var yearHours = p.h * p.d * 12;

    lock = true;
    if (from !== "hourly") ST.$("hourly").value = Math.round(hourly * 100) / 100;
    if (from !== "daily") ST.$("daily").value = Math.round(daily);
    if (from !== "monthly") ST.$("monthly").value = Math.round(monthly);
    if (from !== "yearly") ST.$("yearly").value = Math.round(yearly);
    lock = false;

    var net = netIncome(yearly);
    ST.set("yearVal", ST.yen(Math.round(yearly), 0));
    ST.set("rHour", ST.yen(Math.round(hourly), 0));
    ST.set("rDay", ST.yen(Math.round(daily), 0));
    ST.set("rMonth", ST.yen(Math.round(monthly), 0));
    ST.set("rHours", ST.num(yearHours, 0) + "時間");
    ST.set("rNet", ST.yen(Math.round(net), 0));
    ST.set("rNetM", ST.yen(Math.round(net / 12), 0));
    ST.set("detail", "前提: 1日" + ST.num(p.h, 2) + "時間 × 月" + ST.num(p.d, 1) +
      "日 × " + ST.num(12 + p.b, 1) + "か月分。手取りは社会保険料・所得税・住民税を" +
      "概算で差し引いた目安で、扶養や各種控除は考慮していません。");
  }

  function fromField(id) {
    var p = params();
    var v = ST.n(ST.$(id));
    if (id === "hourly") return v;
    if (id === "daily") return p.h > 0 ? v / p.h : 0;
    if (id === "monthly") return (p.h * p.d) > 0 ? v / (p.h * p.d) : 0;
    return (p.h * p.d * (12 + p.b)) > 0 ? v / (p.h * p.d * (12 + p.b)) : 0;
  }

  ["hourly", "daily", "monthly", "yearly"].forEach(function (id) {
    ST.$(id).addEventListener("input", function () {
      if (lock) return;
      render(fromField(id), id);
    });
  });
  ["hoursPerDay", "daysPerMonth", "bonus"].forEach(function (id) {
    ST.$(id).addEventListener("input", function () {
      render(ST.n(ST.$("hourly")), "hourly");
    });
  });

  render(ST.n(ST.$("hourly")), "hourly");
})();
`,

  intro: `
時給・日給・月給・年収のどれかを入れると、残りが自動で計算されます。勤務条件（1日の労働時間・月の勤務日数・賞与）を変えると、働き方を変えたときの収入を比べられます。
`,

  guide: `
## 換算の考え方

| 求めたいもの | 計算式 |
|---|---|
| 日給 | 時給 × 1日の労働時間 |
| 月給 | 日給 × 月の勤務日数 |
| 年収 | 月給 × (12 + 賞与の月数) |
| 時給（年収から） | 年収 ÷ 年間の総労働時間 |

年収から時給を求めると、雇用形態が違う仕事どうしを同じ土俵で比べられます。「月給25万円だが残業が月40時間ある仕事」と「時給1,500円で残業なしの仕事」のどちらが割に合うかは、時給に直すとはっきりします。

## 年間の勤務日数の目安

月の勤務日数を決めるときの参考値です。

| 働き方 | 年間勤務日数 | 月あたり |
|---|---|---|
| 完全週休2日・祝日休み | 約240日 | 20日 |
| 完全週休2日・祝日出勤 | 約260日 | 21.7日 |
| 週休1日 | 約313日 | 26日 |
| 週4日勤務 | 約208日 | 17.3日 |
| 週3日勤務 | 約156日 | 13日 |

厚生労働省の統計では、年間休日の平均は110日前後、つまり年間勤務日数は約255日です。求人票に「年間休日120日」とあれば、勤務日数は245日（月20.4日）ということになります。

## 額面と手取りの違い

給与明細に書かれた総支給額（額面）から、次のものが差し引かれて手取りになります。

| 項目 | おおよその率 | 備考 |
|---|---|---|
| 健康保険料 | 約5% | 労使折半。40歳以上は介護保険料が加算 |
| 厚生年金保険料 | 9.15% | 労使折半。上限あり |
| 雇用保険料 | 0.6%前後 | 業種による |
| 所得税 | 5〜45% | 課税所得に応じた累進 |
| 住民税 | 約10% | 前年の所得に対して課税 |

合計すると、**手取りは額面の75〜85%** になるのが一般的です。年収が高いほど税率が上がるため、手取りの割合は下がります。

このツールが表示する手取りは、標準的なケースを想定した概算です。扶養家族の有無、生命保険料控除、住宅ローン控除、iDeCoの掛金などによって実際の金額は変わります。

## 住民税は1年遅れてくる

見落としやすいのが住民税です。住民税は **前年の所得** に対して課税され、6月から翌年5月にかけて徴収されます。

このため、

- **新社会人の1年目**: 前年の所得がないため住民税がゼロ。手取りが多く感じられる
- **2年目の6月から**: 1年目の所得に対する住民税が引かれ始め、手取りが減る
- **退職した翌年**: 収入がなくても前年分の住民税を納める必要がある

転職や退職を考えるときは、この時間差を計算に入れておくと資金計画が立てやすくなります。

## 「年収の壁」の目安

配偶者の扶養に入りながら働く場合、収入がある金額を超えると税や社会保険の負担が発生します。

| 金額 | 何が起きるか |
|---|---|
| 100万円 | 住民税がかかり始める（自治体により93〜100万円） |
| 103万円 | 所得税がかかり始める |
| 106万円 | 一定規模の勤務先では社会保険への加入義務が生じる |
| 130万円 | 扶養から外れ、自分で社会保険に加入する |
| 150万円 | 配偶者特別控除が段階的に減り始める |

特に130万円を超えると社会保険料の負担が発生するため、手取りが一時的に減る区間があります。時給が上がったときは、年間の勤務時間を調整するかどうかを検討する材料になります。

> 制度の詳細や金額は改正されることがあります。実際の判断は、勤務先の担当部署や税務署にご確認ください。
`,

  faq: [
    {
      q: "月給から時給を計算するにはどうすればいいですか？",
      a: "月給を「1日の労働時間 × 月の勤務日数」で割ります。月給20万円で1日8時間・月20日勤務なら、200,000 ÷ 160 = 1,250円です。残業代が含まれている場合は、実際の労働時間で割ってください。",
    },
    {
      q: "手取りは額面の何割くらいですか？",
      a: "一般的に75〜85%です。年収が高いほど税率が上がるため割合は下がります。年収300万円なら約80%、年収800万円なら約75%が目安です。",
    },
    {
      q: "賞与の入力欄にはどう記入しますか？",
      a: "年間の賞与を月給の何か月分にあたるかで入力します。夏・冬に各2か月分なら「4」です。賞与がない場合や、金額が固定の場合は0にして、年収の欄に直接入力してください。",
    },
    {
      q: "手取りの計算はどこまで正確ですか？",
      a: "標準的なケースの概算です。扶養家族、生命保険料控除、住宅ローン控除、iDeCoなどは考慮していません。正確な金額は給与明細か源泉徴収票をご確認ください。",
    },
    {
      q: "残業代はどう計算に入れればいいですか？",
      a: "「1日の労働時間」に残業を含めた実労働時間を入れてください。ただし法定時間外労働には25%以上の割増賃金がつくため、正確に出すには基本の時給と割増分を分けて計算する必要があります。",
    },
  ],
};
