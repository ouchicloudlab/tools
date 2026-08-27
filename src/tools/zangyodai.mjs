export default {
  category: "money",
  updated: "2026-08-27",
  title: "残業代の計算｜割増率を含めた正しい金額を出す",
  h1: "残業代の計算ツール",
  description:
    "月給と残業時間から、割増賃金を含めた残業代を計算します。深夜・休日の割増率、月60時間を超えた場合の割増にも対応した無料ツールです。",
  cardText: "月給と残業時間から割増込みの残業代を計算。",
  keywords: [
    "残業代", "計算", "割増賃金", "深夜手当", "休日出勤", "時間外", "1.25倍", "月給", "時給",
  ],
  yomi: "ざんぎょうだい わりましちんぎん",
  related: ["jikyu-nensyu", "jikan-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="salary">月給（基本給＋対象手当）</label>
    <input type="number" id="salary" inputmode="decimal" value="250000" step="10000">
    <p class="hint">通勤手当・家族手当などは除きます（下の解説を参照）。</p>
  </div>
  <div class="field">
    <label for="monthHours">1か月の所定労働時間</label>
    <input type="number" id="monthHours" inputmode="decimal" value="160" step="1">
    <p class="hint">年間所定労働時間 ÷ 12。分からなければ160前後。</p>
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="overtime">時間外労働（時間/月）</label>
    <input type="number" id="overtime" inputmode="decimal" value="30" step="1">
  </div>
  <div class="field">
    <label for="midnight">うち深夜（22時〜5時）</label>
    <input type="number" id="midnight" inputmode="decimal" value="0" step="1">
  </div>
  <div class="field">
    <label for="holiday">法定休日の労働（時間/月）</label>
    <input type="number" id="holiday" inputmode="decimal" value="0" step="1">
  </div>
</div>

<div class="field">
  <div class="pills">
    <label><input type="checkbox" id="over60" checked>月60時間超の割増（50%）を適用する</label>
  </div>
  <p class="hint">2023年4月から中小企業も対象になりました。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">残業代の合計</div>
  <div class="result-main" id="totalVal">-</div>
  <div class="result-grid">
    <div><div class="k">1時間あたりの基礎賃金</div><div class="v" id="baseVal">-</div></div>
    <div><div class="k">時間外（25%増）</div><div class="v" id="ot25Val">-</div></div>
    <div><div class="k">60時間超（50%増）</div><div class="v" id="ot50Val">-</div></div>
    <div><div class="k">深夜割増（＋25%）</div><div class="v" id="midVal">-</div></div>
    <div><div class="k">休日労働（35%増）</div><div class="v" id="holVal">-</div></div>
    <div><div class="k">月給と合わせた総支給</div><div class="v" id="grandVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>割増率の一覧</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>種類</th><th>条件</th><th>割増率</th><th>1時間あたり</th></tr></thead>
    <tbody id="rateTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  ST.live(function () {
    var salary = Math.max(0, ST.n(ST.$("salary")));
    var monthHours = ST.n(ST.$("monthHours"));
    var ot = Math.max(0, ST.n(ST.$("overtime")));
    var mid = Math.max(0, ST.n(ST.$("midnight")));
    var hol = Math.max(0, ST.n(ST.$("holiday")));
    var use60 = ST.$("over60").checked;

    if (salary <= 0 || monthHours <= 0) {
      ["totalVal","baseVal","ot25Val","ot50Val","midVal","holVal","grandVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "月給と所定労働時間を入力してください。");
      ST.$("rateTable").innerHTML = "";
      return;
    }

    // 1時間あたりの基礎賃金
    var base = salary / monthHours;

    // 時間外は月60時間までが25%増、超えた分は50%増
    var ot25Hours = use60 ? Math.min(ot, 60) : ot;
    var ot50Hours = use60 ? Math.max(0, ot - 60) : 0;

    var ot25 = base * 1.25 * ot25Hours;
    var ot50 = base * 1.5 * ot50Hours;
    // 深夜割増は時間外の割増に上乗せする（重複してカウントしない）
    var midPay = base * 0.25 * mid;
    var holPay = base * 1.35 * hol;
    var total = ot25 + ot50 + midPay + holPay;

    ST.set("totalVal", ST.yen(Math.round(total), 0));
    ST.set("baseVal", ST.yen(Math.round(base), 0));
    ST.set("ot25Val", ST.yen(Math.round(ot25), 0) + "（" + ST.num(ot25Hours, 1) + "h）");
    ST.set("ot50Val", ot50Hours > 0
      ? ST.yen(Math.round(ot50), 0) + "（" + ST.num(ot50Hours, 1) + "h）" : "—");
    ST.set("midVal", mid > 0 ? ST.yen(Math.round(midPay), 0) + "（" + ST.num(mid, 1) + "h）" : "—");
    ST.set("holVal", hol > 0 ? ST.yen(Math.round(holPay), 0) + "（" + ST.num(hol, 1) + "h）" : "—");
    ST.set("grandVal", ST.yen(Math.round(salary + total), 0));

    ST.set("detail",
      "1時間あたりの基礎賃金は「月給 " + ST.yen(salary, 0) + " ÷ 所定労働時間 " +
      ST.num(monthHours, 1) + "時間 = " + ST.yen(Math.round(base), 0) + "」です。" +
      "深夜割増は時間外の割増に上乗せする形で、25%分だけを別途加算しています。" +
      (ot > 45 ? "※ 月45時間を超える時間外労働は、原則として年6回までに制限されています。" : ""));

    var rows = [
      ["時間外労働", "法定労働時間（1日8時間・週40時間）を超えた分", "25%以上", base * 1.25],
      ["時間外（月60時間超）", "1か月の時間外が60時間を超えた分", "50%以上", base * 1.5],
      ["深夜労働", "22時〜翌5時の労働", "＋25%以上", base * 0.25],
      ["時間外＋深夜", "深夜の時間外労働", "50%以上", base * 1.5],
      ["法定休日労働", "週1日の法定休日に働いた分", "35%以上", base * 1.35],
      ["休日＋深夜", "法定休日の深夜労働", "60%以上", base * 1.6]
    ];
    ST.$("rateTable").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] +
        "</td><td>" + ST.yen(Math.round(r[3]), 0) + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
月給と残業時間から、割増賃金を含めた残業代を計算します。**深夜・休日・月60時間超**の割増にも対応しています。
`,

  guide: `
## 残業代の計算式

> **残業代 = 1時間あたりの基礎賃金 × 割増率 × 残業時間**

1時間あたりの基礎賃金は次のように求めます。

> **基礎賃金 = 月給 ÷ 1か月の平均所定労働時間**

月給25万円・所定160時間なら、250,000 ÷ 160 = **1,562.5円** です。この額に割増率を掛けたものが、残業1時間あたりの支払額になります。

## 割増率の一覧

| 種類 | 条件 | 割増率 |
|---|---|---|
| 時間外労働 | 1日8時間・週40時間を超えた分 | **25%以上** |
| 時間外（月60時間超） | 1か月の時間外が60時間を超えた分 | **50%以上** |
| 深夜労働 | 22時〜翌5時 | **＋25%以上** |
| 時間外＋深夜 | 深夜の時間外労働 | 50%以上 |
| 法定休日労働 | 週1日の法定休日 | **35%以上** |
| 休日＋深夜 | 法定休日の深夜 | 60%以上 |

**月60時間超の50%割増は、2023年4月から中小企業にも適用** されています。以前は大企業のみが対象でしたが、現在はすべての企業が対象です。

なお、休日労働には60時間超の割増は適用されません（休日労働は時間外労働に算入しないため）。

## 基礎賃金から除外できる手当

月給のすべてが計算のもとになるわけではありません。次の手当は、法律上除外できます。

| 除外できる | 除外できない |
|---|---|
| 通勤手当 | 役職手当 |
| 家族手当・扶養手当 | 資格手当 |
| 別居手当 | 皆勤手当 |
| 子女教育手当 | 精勤手当 |
| 住宅手当（※） | 固定残業代を除く一般の手当 |
| 臨時に支払われる賃金 | |
| 1か月を超える期間ごとの賞与 | |

**除外できるのはこの7種類だけ** で、これ以外の手当はすべて基礎賃金に含めなければなりません。

（※）住宅手当は「住宅費用に応じて変動する」場合のみ除外できます。一律定額で支給されている場合は除外できず、基礎賃金に含まれます。

また、**家族手当・通勤手当も、扶養人数や通勤距離に関係なく一律支給の場合は除外できません**。名称ではなく実態で判断されます。

## 法定休日と所定休日の違い

- **法定休日**: 労働基準法で定められた週1日（または4週4日）の休み。ここに働くと **35%増**
- **所定休日**: 会社が独自に定めた休み（週休2日の2日目など）。ここに働いても **時間外の25%増**

土日休みの会社で日曜が法定休日とされている場合、土曜に出勤しても35%ではなく25%です。就業規則で「法定休日は日曜」のように定められていることが多いので、確認してみてください。

## 1か月の所定労働時間の求め方

> **(365日 − 年間休日) × 1日の所定労働時間 ÷ 12**

年間休日120日・1日8時間なら、(365 − 120) × 8 ÷ 12 = **163.3時間** です。

この数値が大きいほど1時間あたりの単価が下がるため、残業代も少なくなります。就業規則に記載されているはずなので、実際の数値を確認してください。

## 固定残業代（みなし残業）

「月給30万円（固定残業代45時間分を含む）」のような契約です。

- **45時間を超えた分は別途支払われる必要があります**。超過分を払わないのは違法です
- 契約書や求人票に「何時間分でいくらか」が明示されていなければ、固定残業代として認められない可能性があります
- 固定残業代を除いた額が最低賃金を下回ってはいけません

固定残業代がある場合、この計算ツールでは「月給から固定残業代を引いた額」を月給欄に入れ、「実際の残業時間 − 固定残業時間」を残業時間欄に入れると、追加で受け取れる額の目安が出せます。

## 時間外労働の上限

働き方改革により、時間外労働には罰則つきの上限が設けられています。

| 期間 | 上限 |
|---|---|
| 原則 | 月45時間・年360時間 |
| 特別条項あり | 年720時間以内 |
| 単月 | 100時間未満（休日労働を含む） |
| 複数月平均 | 80時間以内（休日労働を含む） |
| 月45時間超 | **年6回まで** |

> 実際の支払額は就業規則や労使協定によって変わります。金額に疑問がある場合は、会社の担当部署か、労働基準監督署・労働組合にご相談ください。
`,

  faq: [
    {
      q: "残業代はどう計算しますか？",
      a: "「月給 ÷ 1か月の所定労働時間 × 割増率 × 残業時間」です。月給25万円・所定160時間なら1時間あたり1,562円、これに1.25を掛けた1,953円が残業1時間の単価になります。",
    },
    {
      q: "通勤手当も残業代の計算に含まれますか？",
      a: "原則として除外できます。ただし、通勤距離に関係なく一律定額で支給されている場合は除外できず、基礎賃金に含めなければなりません。名称ではなく実態で判断されます。",
    },
    {
      q: "月60時間を超えた残業の割増率は？",
      a: "50%以上です。2023年4月からは中小企業にも適用されており、現在はすべての企業が対象です。60時間までの部分は25%のままです。",
    },
    {
      q: "土曜出勤は休日割増（35%）になりますか？",
      a: "法定休日でなければ25%です。法定休日は週1日で、多くの会社では日曜に設定されています。土曜は所定休日にあたるため、時間外労働として25%増になります。就業規則で確認してください。",
    },
    {
      q: "固定残業代があると残業代は出ませんか？",
      a: "出ます。契約で定めた時間を超えた分は、別途支払われる必要があります。超過分を支払わないのは違法です。また、何時間分でいくらかが明示されていない固定残業代は、有効と認められない場合があります。",
    },
  ],
};
