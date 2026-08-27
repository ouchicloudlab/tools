export default {
  category: "money",
  updated: "2026-08-27",
  title: "家賃の目安を計算｜年収・手取りから無理のない金額を出す",
  h1: "家賃の目安 計算ツール",
  description:
    "年収や手取りから、無理なく払える家賃の目安を計算します。管理費や更新料を含めた実質の負担額、引っ越しに必要な初期費用の総額も同時に確認できる無料ツールです。",
  cardText: "年収から家賃の目安と初期費用を試算。",
  keywords: [
    "家賃", "目安", "年収", "手取り", "3分の1", "初期費用", "計算", "賃貸", "引っ越し",
  ],
  related: ["jikyu-nensyu", "loan-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="income">月の手取り（円）</label>
    <input type="number" id="income" inputmode="decimal" value="250000" step="10000">
    <p class="hint">額面ではなく、実際に振り込まれる額です。</p>
  </div>
  <div class="field">
    <label for="ratio">家賃に充てる割合</label>
    <select id="ratio">
      <option value="0.25">25%（余裕を持ちたい）</option>
      <option value="0.3" selected>30%（一般的な目安）</option>
      <option value="0.33">33%（手取りの3分の1）</option>
      <option value="0.35">35%（やや高め）</option>
    </select>
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="kanri">管理費・共益費（円/月）</label>
    <input type="number" id="kanri" inputmode="decimal" value="8000" step="1000">
  </div>
  <div class="field">
    <label for="koushin">更新料（家賃の◯か月分）</label>
    <input type="number" id="koushin" inputmode="decimal" value="1" step="0.5">
    <p class="hint">2年ごとに1か月分が一般的。無い地域もあります。</p>
  </div>
  <div class="field">
    <label for="parking">駐車場（円/月）</label>
    <input type="number" id="parking" inputmode="decimal" value="0" step="1000">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">家賃の目安（管理費などを除いた金額）</div>
  <div class="result-main" id="yachinVal">-</div>
  <div class="result-grid">
    <div><div class="k">住居費の総額（月）</div><div class="v" id="totalVal">-</div></div>
    <div><div class="k">更新料を月割りすると</div><div class="v" id="koushinVal">-</div></div>
    <div><div class="k">手取りに占める割合</div><div class="v" id="ratioVal">-</div></div>
    <div><div class="k">年間の住居費</div><div class="v" id="yearVal">-</div></div>
    <div><div class="k">家賃以外に使える額</div><div class="v" id="restVal">-</div></div>
    <div><div class="k">年収の目安（額面）</div><div class="v" id="nensyuVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>引っ越しにかかる初期費用</h3>
<div class="row">
  <div class="field">
    <label for="targetRent">検討している物件の家賃（円）</label>
    <input type="number" id="targetRent" inputmode="decimal" value="75000" step="1000">
  </div>
  <div class="field">
    <label for="shikikin">敷金（か月分）</label>
    <input type="number" id="shikikin" inputmode="decimal" value="1" step="0.5">
  </div>
  <div class="field">
    <label for="reikin">礼金（か月分）</label>
    <input type="number" id="reikin" inputmode="decimal" value="1" step="0.5">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-label">初期費用の合計</div>
  <div class="result-main" id="initVal">-</div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>項目</th><th>金額</th><th>備考</th></tr></thead>
      <tbody id="initTable"></tbody>
    </table>
  </div>
</div>
`,

  script: `
(function () {
  ST.live(function () {
    var income = Math.max(0, ST.n(ST.$("income")));
    var ratio = Number(ST.$("ratio").value) || 0.3;
    var kanri = Math.max(0, ST.n(ST.$("kanri")));
    var parking = Math.max(0, ST.n(ST.$("parking")));
    var koushinMonths = Math.max(0, ST.n(ST.$("koushin")));

    if (income <= 0) {
      ["yachinVal","totalVal","koushinVal","ratioVal","yearVal","restVal","nensyuVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "月の手取りを入力してください。");
    } else {
      // 住居費の枠から、管理費・駐車場・更新料の月割りを引いた残りが家賃の上限
      var budget = income * ratio;
      // 更新料は2年に1回。家賃をxとすると月割りは x × 月数 ÷ 24
      // budget = x + kanri + parking + x × koushin ÷ 24 を解く
      var rent = (budget - kanri - parking) / (1 + koushinMonths / 24);
      if (rent < 0) rent = 0;
      var koushinMonthly = rent * koushinMonths / 24;
      var total = rent + kanri + parking + koushinMonthly;

      ST.set("yachinVal", ST.yen(Math.floor(rent / 1000) * 1000, 0));
      ST.set("totalVal", ST.yen(Math.round(total), 0));
      ST.set("koushinVal", ST.yen(Math.round(koushinMonthly), 0));
      ST.set("ratioVal", ST.num(total / income * 100, 1) + "%");
      ST.set("yearVal", ST.yen(Math.round(total * 12), 0));
      ST.set("restVal", ST.yen(Math.round(income - total), 0));
      // 手取りは額面のおよそ8割
      ST.set("nensyuVal", ST.yen(Math.round(income * 12 / 0.8 / 10000) * 10000, 0));
      ST.set("detail",
        "手取り " + ST.yen(income, 0) + " の " + Math.round(ratio * 100) + "% = " +
        ST.yen(Math.round(budget), 0) + " が住居費の枠です。" +
        "そこから管理費 " + ST.yen(kanri, 0) +
        (parking > 0 ? "、駐車場 " + ST.yen(parking, 0) : "") +
        "、更新料の月割り " + ST.yen(Math.round(koushinMonthly), 0) +
        " を引いた額が家賃の上限になります。");
    }

    // 初期費用
    var rent2 = Math.max(0, ST.n(ST.$("targetRent")));
    var shiki = ST.n(ST.$("shikikin"));
    var rei = ST.n(ST.$("reikin"));
    var rows = [
      ["前家賃（1か月分）", rent2, "入居月の家賃。日割りになることも"],
      ["敷金", rent2 * shiki, "退去時に原状回復費を引いて返還"],
      ["礼金", rent2 * rei, "返還されない。関西では不要な場合も"],
      ["仲介手数料", rent2 * 1.1, "家賃1か月分＋消費税が上限"],
      ["火災保険料", 20000, "2年契約。1.5〜2万円が目安"],
      ["鍵の交換費用", 18000, "1.5〜2.5万円。任意の場合もある"],
      ["保証会社の利用料", rent2 * 0.5, "家賃の50〜100%。連帯保証人がいれば不要な場合も"]
    ];
    var sum = rows.reduce(function (a, r) { return a + r[1]; }, 0);
    ST.set("initVal", ST.yen(Math.round(sum), 0) +
      "（家賃の約" + ST.num(sum / (rent2 || 1), 1) + "か月分）");
    ST.$("initTable").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + ST.yen(Math.round(r[1]), 0) +
        "</td><td>" + r[2] + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
月の手取りから、無理なく払える家賃の目安を計算します。**管理費・駐車場・更新料まで含めた総額**で判断できるようにしているので、「家賃は予算内なのに毎月苦しい」という状況を避けられます。
`,

  guide: `
## 「手取りの3分の1」の落とし穴

家賃の目安としてよく言われるのが「手取りの3分の1」です。手取り25万円なら約8.3万円ということになります。

ただしこの数字は **家賃だけ** を指していることが多く、実際に毎月出ていくお金はこれより大きくなります。

| 項目 | 手取り25万円・家賃8万円の場合 |
|---|---|
| 家賃 | 80,000円 |
| 管理費・共益費 | 8,000円 |
| 更新料の月割り（2年で1か月分） | 3,333円 |
| 駐車場（必要な場合） | 0〜15,000円 |
| **実質の住居費** | **91,333円〜** |

手取りの36%に達しており、「3分の1に収めたつもりが超えていた」という状態です。このツールは総額から逆算して家賃の上限を出すため、このずれが起きません。

## 割合の目安

| 割合 | どういう状態か |
|---|---|
| 25%以下 | 貯蓄や趣味にゆとりがある |
| 30% | 一般的な目安。標準的な生活ができる |
| 33% | 手取りの3分の1。やや余裕は少ない |
| 35%以上 | 固定費が重く、想定外の出費に対応しづらい |

収入が高いほど高い割合でも耐えられます。手取り50万円の35%（17.5万円）を払っても31.5万円残りますが、手取り20万円の35%（7万円）では13万円しか残りません。**残る金額の絶対値** で判断するほうが実態に近くなります。

## 初期費用は家賃の4〜6か月分

引っ越しには、まとまった初期費用がかかります。

| 項目 | 目安 | 内容 |
|---|---|---|
| 前家賃 | 1か月分 | 入居月の家賃。月の途中なら日割り |
| 敷金 | 0〜2か月分 | 預け金。退去時に原状回復費を引いて返還 |
| 礼金 | 0〜2か月分 | 貸主へのお礼。返還されない |
| 仲介手数料 | 家賃1か月分＋税 | 法律上の上限。半額の業者もある |
| 火災保険料 | 1.5〜2万円 | 2年契約が一般的 |
| 鍵交換費用 | 1.5〜2.5万円 | 任意にできる場合もある |
| 保証会社利用料 | 家賃の50〜100% | 連帯保証人を立てられない場合に必須 |

家賃8万円なら、合計で **35〜45万円** ほどになります。これに引っ越し業者の代金（単身で5〜10万円、繁忙期はさらに高い）と、家具・家電の購入費が加わります。

## 費用を抑える方法

- **1〜3月の繁忙期を避ける**: 引っ越し料金が2倍近くになる時期です。5〜6月や10〜11月は安くなります
- **礼金ゼロ・敷金ゼロの物件を探す**: 近年は増えています。ただし退去時のクリーニング代が別途固定額で設定されていることが多いので、契約書を確認してください
- **仲介手数料の交渉**: 法律上の上限は家賃1か月分＋消費税ですが、半額や無料の業者もあります
- **フリーレント物件**: 最初の1〜2か月の家賃が無料になる物件。ただし短期解約時に返金を求められる条件が付くことがあります

## 更新料について

2年ごとに家賃1〜2か月分を支払う慣習で、**関東・京都では一般的、関西の多くの地域や北海道・九州では存在しない** など、地域差が大きい費用です。

金額の妥当性を争った裁判では、更新料そのものは有効とされていますが、賃料や更新期間に照らして高額すぎる場合は無効となる余地があるとされています。

計算に入れ忘れやすい費用なので、契約前に「更新料の有無と金額」「更新事務手数料が別にかかるか」を確認してください。

> 家賃の目安は生活スタイルによって変わります。車の維持費、奨学金の返済、仕送りなど固定的な支出がある場合は、割合を下げて考えてください。
`,

  faq: [
    {
      q: "家賃は手取りの3分の1までが目安と聞きますが本当ですか？",
      a: "一つの目安ですが、管理費や更新料を含めると実質の負担はそれを超えます。総額で手取りの30%以内に収めると余裕が生まれます。収入が低いほど割合を下げるほうが安全です。",
    },
    {
      q: "初期費用は家賃の何か月分かかりますか？",
      a: "一般的に4〜6か月分です。家賃8万円なら35〜45万円が目安になります。これに引っ越し業者の代金と家具・家電の購入費が別途かかります。",
    },
    {
      q: "敷金は必ず返ってきますか？",
      a: "全額は戻らないことが多いです。通常の使用による劣化（経年劣化）の修繕は貸主の負担ですが、故意・過失による損傷やタバコのヤニなどは借主負担となり、敷金から差し引かれます。",
    },
    {
      q: "更新料はどこでも必要ですか？",
      a: "地域差があります。関東と京都では一般的ですが、大阪など関西の多くの地域や北海道・九州では慣習がありません。契約前に有無と金額を確認してください。",
    },
    {
      q: "年収から家賃を決めるにはどうすればいいですか？",
      a: "額面の年収ではなく、月の手取りを基準にしてください。手取りは額面のおよそ75〜85%です。年収400万円なら手取り月26万円前後で、家賃の目安は総額7〜8万円になります。",
    },
  ],
};
