export default {
  category: "money",
  updated: "2026-08-27",
  title: "割り勘計算ツール｜端数の処理と傾斜配分に対応",
  h1: "割り勘計算ツール",
  description:
    "飲み会の合計金額と人数から1人あたりの支払額を計算します。100円単位で切り上げて幹事が調整する方法や、上司と部下で金額を変える傾斜配分にも対応した無料ツールです。",
  cardText: "端数の丸め・傾斜配分ありの割り勘計算。",
  keywords: [
    "割り勘", "計算", "飲み会", "会費", "端数", "傾斜配分", "幹事", "何円", "支払い",
  ],
  yomi: "わりかん のみかい かいひ",
  related: ["shohizei-keisan", "percent-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="total">合計金額（円）</label>
    <input type="number" id="total" inputmode="decimal" value="43800">
  </div>
  <div class="field">
    <label for="people">人数</label>
    <input type="number" id="people" inputmode="numeric" value="7" min="1">
  </div>
  <div class="field">
    <label for="unit">丸める単位</label>
    <select id="unit">
      <option value="1">1円（端数まで正確に）</option>
      <option value="100" selected>100円</option>
      <option value="500">500円</option>
      <option value="1000">1000円</option>
    </select>
  </div>
</div>

<div class="field">
  <span class="field-label">端数の扱い</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="up" checked>切り上げて集める（余りは幹事が受け取る）</label>
    <label><input type="radio" name="mode" value="down">切り捨てて集める（不足は幹事が負担）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">1人あたり</div>
  <div class="result-main" id="perVal">-</div>
  <div class="result-grid">
    <div><div class="k">集まる金額</div><div class="v" id="sumVal">-</div></div>
    <div><div class="k">過不足</div><div class="v" id="diffVal">-</div></div>
    <div><div class="k">丸める前の正確な額</div><div class="v" id="exactVal">-</div></div>
    <div><div class="k">合計金額</div><div class="v" id="totalVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>傾斜配分（多く払う人がいる場合）</h3>
<div class="row">
  <div class="field">
    <label for="heavyCount">多めに払う人数</label>
    <input type="number" id="heavyCount" inputmode="numeric" value="2" min="0">
  </div>
  <div class="field">
    <label for="heavyRate">その人たちの負担（%）</label>
    <input type="number" id="heavyRate" inputmode="decimal" value="150" step="10">
    <p class="hint">150 なら通常の1.5倍を負担します。</p>
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">多めに払う人</div><div class="v" id="heavyVal">-</div></div>
    <div><div class="k">それ以外の人</div><div class="v" id="lightVal">-</div></div>
    <div><div class="k">集まる金額</div><div class="v" id="heavySumVal">-</div></div>
  </div>
  <p class="result-sub" id="heavyDetail"></p>
</div>
`,

  script: `
(function () {
  function roundTo(v, unit, mode) {
    if (unit <= 1) return Math.round(v);
    return mode === "down"
      ? Math.floor(v / unit) * unit
      : Math.ceil(v / unit) * unit;
  }

  function clear(msg) {
    ["perVal","sumVal","diffVal","exactVal","totalVal","heavyVal","lightVal","heavySumVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.set("heavyDetail", "");
  }

  ST.live(function () {
    var total = Math.max(0, ST.n(ST.$("total")));
    var people = Math.round(ST.n(ST.$("people")));
    var unit = Number(ST.$("unit").value) || 1;
    var mode = ST.pick("mode");

    if (total <= 0 || people < 1) return clear("合計金額と人数を入力してください。");

    var exact = total / people;
    var per = roundTo(exact, unit, mode);
    var sum = per * people;
    var diff = sum - total;

    ST.set("perVal", ST.yen(per, 0));
    ST.set("sumVal", ST.yen(sum, 0));
    ST.set("diffVal", (diff >= 0 ? "+" : "") + ST.yen(diff, 0));
    ST.set("exactVal", ST.yen(Math.round(exact * 100) / 100, 2));
    ST.set("totalVal", ST.yen(total, 0));
    ST.set("detail", diff > 0
      ? "全員から" + ST.yen(per, 0) + "ずつ集めると " + ST.yen(diff, 0) +
        " 多く集まります。幹事の取り分にするか、次回に繰り越してください。"
      : (diff < 0
        ? "全員から" + ST.yen(per, 0) + "ずつ集めると " + ST.yen(-diff, 0) +
          " 足りません。幹事がこの分を負担することになります。"
        : "ちょうど割り切れます。"));

    // 傾斜配分
    var hc = Math.round(ST.n(ST.$("heavyCount")));
    var hr = ST.n(ST.$("heavyRate")) / 100;
    if (hc <= 0 || hc >= people || hr <= 0) {
      ST.set("heavyVal", "-");
      ST.set("lightVal", "-");
      ST.set("heavySumVal", "-");
      ST.set("heavyDetail", hc >= people
        ? "多めに払う人数は、全体の人数より少なくしてください。"
        : "多めに払う人数と負担の割合を入れると計算します。");
      return;
    }

    // 「多い人 hr人分 + 少ない人 1人分」を単位として基準額を割り出す
    var units = hc * hr + (people - hc);
    var base = total / units;
    var heavy = roundTo(base * hr, unit, mode);
    var light = roundTo(base, unit, mode);
    var hsum = heavy * hc + light * (people - hc);

    ST.set("heavyVal", ST.yen(heavy, 0) + " × " + hc + "人");
    ST.set("lightVal", ST.yen(light, 0) + " × " + (people - hc) + "人");
    ST.set("heavySumVal", ST.yen(hsum, 0) + "（" +
      (hsum - total >= 0 ? "+" : "") + ST.yen(hsum - total, 0) + "）");
    ST.set("heavyDetail", hc + "人が " + ST.num(hr * 100, 0) + "% を負担する配分です。" +
      "差額は " + ST.yen(heavy - light, 0) + " になります。");
  });
})();
`,

  intro: `
合計金額と人数を入れると、1人あたりの金額が出ます。100円単位で切り上げて集める方式や、一部の人が多めに払う傾斜配分にも対応しています。
`,

  guide: `
## 端数をどう扱うか

7人で43,800円なら、1人あたり6,257.14…円です。この端数をどうするかで、いくつかのやり方があります。

| 方法 | 集める額 | 差額 |
|---|---|---|
| 1円単位（切り上げ） | 6,258円 | +6円（幹事に余る） |
| 100円単位（切り上げ） | 6,300円 | +300円 |
| 100円単位（切り捨て） | 6,200円 | −400円（幹事が負担） |
| 500円単位（切り上げ） | 6,500円 | +1,700円 |

実務では **100円単位で切り上げ** が最も多く使われます。小銭のやり取りが不要になり、余った分は幹事の手間賃や次回への繰り越しにできるためです。

ただし、切り上げの単位を大きくしすぎると余りが増えます。7人で500円単位に丸めると1,700円も余ってしまい、「取りすぎでは」という空気になりかねません。**余りが1人分の1割を超えるなら、単位を下げる** ことを目安にすると納得感が保てます。

## 傾斜配分の考え方

上司と部下、幹事と参加者などで金額を変える場合の計算です。

「多く払う人が1.5倍」とする場合、単純に基準額を1.5倍するのではなく、**全体の合計が変わらないように基準額そのものを調整する** 必要があります。

7人・43,800円で、2人が1.5倍を負担するケースでは、

1. 負担の単位を数える: 1.5 × 2人 + 1.0 × 5人 = **8単位**
2. 1単位あたりの金額: 43,800 ÷ 8 = 5,475円
3. 多く払う人: 5,475 × 1.5 = 8,212.5円 → 8,300円（100円切り上げ）
4. それ以外の人: 5,475円 → 5,500円（100円切り上げ）

このツールはこの計算を自動で行います。

## 傾斜の目安

明確な決まりはありませんが、よく使われる比率です。

| 場面 | 配分の例 |
|---|---|
| 上司と部下 | 上司1.5〜2.0倍、部下1.0倍 |
| 男女で分ける | 男性1.2〜1.5倍、女性1.0倍 |
| 飲む人・飲まない人 | 飲む人1.3倍、飲まない人0.7倍 |
| 幹事の労をねぎらう | 幹事0.8倍、他1.0倍 |

飲まない人の扱いは特に気を遣う部分です。「一律で割ったら不公平」という声が出やすい一方、細かく分けすぎると計算も説明も煩雑になります。**飲み放題プランの料金を明示して、飲まない人はその分を引く** という形にすると、根拠が分かりやすくなります。

## 幹事が事前に決めておくと揉めにくいこと

- **会費を先に告知する**: 「1人6,300円です」と事前に伝えておけば、当日の集金がスムーズです
- **余りの扱いを言っておく**: 「端数は次回に繰り越します」の一言があるだけで印象が変わります
- **支払い方法を統一する**: 現金と送金アプリが混在すると、誰が払ったか分からなくなります
- **領収書を保管する**: 経費で落とす場合や、金額に疑問が出た場合に必要になります

## 送金アプリを使う場合

近年は、幹事がまとめて支払い、後から送金アプリで回収する方法が一般的になっています。この場合は端数を丸める必要がないため、**1円単位で正確に割る** ほうが公平です。

このツールで「1円（端数まで正確に）」を選ぶと、その金額が出ます。ただし1円単位まで割り切れない場合、誰か1人が1円多く払う形になります。金額を告知するときは「6,257円（幹事のみ6,258円）」のように書いておくと親切です。
`,

  faq: [
    {
      q: "割り勘の端数はどう処理するのが一般的ですか？",
      a: "100円単位で切り上げて集め、余りは幹事の手間賃や次回への繰り越しにする方法が最も多く使われます。小銭のやり取りが不要になるためです。",
    },
    {
      q: "上司が多めに払う場合の計算方法は？",
      a: "負担の単位で数えます。1.5倍の人が2人、通常が5人なら合計8単位です。合計金額を8で割った額が基準になり、多く払う人はその1.5倍を負担します。単純に基準額を1.5倍すると合計が合わなくなります。",
    },
    {
      q: "飲まない人の会費はどう決めればいいですか？",
      a: "飲み放題プランの料金を根拠にするのが分かりやすい方法です。「飲み放題1,500円分を引く」のように明示すれば、金額の根拠が共有されて納得を得やすくなります。",
    },
    {
      q: "送金アプリで回収する場合も丸めたほうがいいですか？",
      a: "その必要はありません。小銭を扱わないため、1円単位で正確に割るほうが公平です。このツールで「1円（端数まで正確に）」を選んでください。",
    },
    {
      q: "余った分は幹事がもらっていいのですか？",
      a: "決まりはありませんが、事前に「端数は幹事の取り分にします」「次回に繰り越します」と伝えておくと後で問題になりません。金額が大きい場合は繰り越しにするほうが無難です。",
    },
  ],
};
