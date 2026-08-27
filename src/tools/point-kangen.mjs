export default {
  category: "money",
  updated: "2026-08-27",
  title: "ポイント還元率の計算ツール｜「○%還元」は実質何%引きか",
  h1: "ポイント還元・実質割引率の計算ツール",
  description:
    "ポイント還元が実質何%引きにあたるかを計算します。「20%還元」と「20%OFF」のどちらが得か、複数のポイントを重ねた場合の合計還元率も確認できる無料ツールです。",
  cardText: "○%還元は実質何%引きか。値引きとの比較も。",
  keywords: [
    "ポイント還元", "還元率", "実質", "割引", "計算", "ポイント", "何%引き", "クレジットカード", "還元",
  ],
  yomi: "ぽいんとかんげん かんげんりつ",
  related: ["waribiki-keisan", "percent-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="price">支払金額（円）</label>
    <input type="number" id="price" inputmode="decimal" value="10000">
  </div>
  <div class="field">
    <label for="rate">ポイント還元率（%）</label>
    <input type="number" id="rate" inputmode="decimal" value="10" step="0.1">
  </div>
</div>

<div class="field">
  <span class="field-label">ポイントを追加で重ねる（任意）</span>
  <div class="row">
    <div class="field"><label for="rate2">2つめの還元率（%）</label>
      <input type="number" id="rate2" inputmode="decimal" value="0" step="0.1"></div>
    <div class="field"><label for="rate3">3つめの還元率（%）</label>
      <input type="number" id="rate3" inputmode="decimal" value="0" step="0.1"></div>
  </div>
  <p class="hint">カード還元＋アプリ決済＋店舗ポイントのように重ねる場合に使います。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">実質の割引率</div>
  <div class="result-main" id="realVal">-</div>
  <div class="result-grid">
    <div><div class="k">合計の還元率</div><div class="v" id="sumRateVal">-</div></div>
    <div><div class="k">もらえるポイント</div><div class="v" id="pointVal">-</div></div>
    <div><div class="k">商品を得る実質コスト</div><div class="v" id="netVal">-</div></div>
    <div><div class="k">同じ得になる値引き額</div><div class="v" id="equalVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>「○%引き」と比べる</h3>
<div class="field">
  <label for="discount">比較したい値引き率（%）</label>
  <input type="number" id="discount" inputmode="decimal" value="10" step="0.1">
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="cmpVal" style="font-size:22px">-</div>
  <p class="result-sub" id="cmpDetail"></p>
</div>
`,

  script: `
ST.live(function () {
  var price = Math.max(0, ST.n(ST.$("price")));
  var r1 = ST.n(ST.$("rate"));
  var r2 = ST.n(ST.$("rate2"));
  var r3 = ST.n(ST.$("rate3"));
  var sum = r1 + r2 + r3;

  if (price <= 0) {
    ["realVal","sumRateVal","pointVal","netVal","equalVal","cmpVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", "支払金額を入力してください。");
    ST.set("cmpDetail", "");
    return;
  }

  var point = ST.fix(price * sum / 100);
  // 実質割引率 = 還元率 ÷ (100 + 還元率) × 100
  // 支払った額に対してではなく「得た価値の合計」に対する割合で見る
  var real = ST.fix(sum / (100 + sum) * 100);
  // 実質負担は「支払額 − ポイント」ではない。
  // それだと100%還元が0円になり、50%引きと同じはずの条件で差が出てしまう。
  // 商品そのものを手に入れるための実質コストで見る。
  var net = ST.fix(price * 100 / (100 + sum));

  ST.set("realVal", ST.num(real, 2) + "% 引き相当");
  ST.set("sumRateVal", ST.num(sum, 2) + "%");
  ST.set("pointVal", ST.num(Math.floor(point), 0) + "ポイント");
  ST.set("netVal", ST.yen(Math.round(net), 0));
  ST.set("equalVal", ST.yen(Math.round(price - net), 0));
  ST.set("detail",
    ST.yen(price, 0) + "を支払って" + ST.num(Math.floor(point), 0) +
    "ポイントを受け取ると、合計 " + ST.yen(ST.fix(price + point), 0) +
    " 分の価値を " + ST.yen(price, 0) + " で得たことになります。" +
    "これは " + ST.num(real, 2) + "% 引きと同じ計算です。");

  // 値引きとの比較
  var d = ST.n(ST.$("discount"));
  var payDiscount = ST.fix(price * (1 - d / 100));
  var diff = ST.fix(payDiscount - net);
  if (Math.abs(diff) < 0.5) {
    ST.set("cmpVal", "ほぼ同じ");
    ST.set("cmpDetail", "どちらも実質の負担は " + ST.yen(Math.round(net), 0) + " 前後です。");
  } else if (diff > 0) {
    ST.set("cmpVal", "ポイント還元のほうが " + ST.yen(Math.round(diff), 0) + " お得");
    ST.set("cmpDetail", "値引きなら " + ST.yen(Math.round(payDiscount), 0) +
      " の支払い、還元なら実質 " + ST.yen(Math.round(net), 0) + " の負担です。" +
      "ただしポイントは使い切って初めて価値になります。");
  } else {
    ST.set("cmpVal", ST.num(d, 1) + "%引きのほうが " + ST.yen(Math.round(-diff), 0) + " お得");
    ST.set("cmpDetail", "値引きなら " + ST.yen(Math.round(payDiscount), 0) +
      " の支払いで、その場で現金が減りません。還元は実質 " + ST.yen(Math.round(net), 0) + " 相当です。");
  }
});
`,

  intro: `
「10%ポイント還元」は10%引きではありません。実際に何%引きに相当するのかを計算し、値引きと直接比べられるようにしています。
`,

  guide: `
## 還元率と割引率は同じではない

10,000円の買い物で **10%ポイント還元** を受けた場合を考えます。

- 支払う金額: **10,000円**（減りません）
- 受け取るポイント: 1,000ポイント
- 得た価値の合計: 11,000円分

つまり、**11,000円分の価値を10,000円で手に入れた** ことになります。これを割引率に直すと次のようになります。

> 1,000 ÷ 11,000 × 100 = **9.09%引き**

一方、10%OFFなら支払いは9,000円で、割引率はそのまま10%です。**同じ数字が並んでいても、値引きのほうが有利** です。

## 実質割引率の計算式

> **実質割引率(%) = 還元率 ÷ (100 + 還元率) × 100**

主な還元率を換算すると次のとおりです。

| ポイント還元率 | 実質の割引率 |
|---|---|
| 1% | 0.99% |
| 5% | 4.76% |
| 10% | 9.09% |
| 20% | 16.67% |
| 30% | 23.08% |
| 50% | 33.33% |
| 100% | 50.00% |

還元率が大きいほど、割引率とのズレも大きくなります。「100%還元（全額ポイントバック）」は、実質50%引きです。

## ポイントの価値を下げる要因

上の計算は「1ポイント = 1円として、確実に使い切れる」という前提です。実際には次の理由で価値が目減りします。

- **有効期限**: 期間限定ポイントは1〜2か月で失効するものがあります
- **使える店の制限**: 特定のサービス内でしか使えないポイントは、欲しいものがなければ価値がありません
- **交換レート**: 1ポイント = 0.5円のように、換金時に目減りするものがあります
- **使い忘れ**: 統計的に、発行されたポイントの1〜2割は使われずに失効するとされています

期間限定ポイントを「無理に何かを買って消化する」形で使ってしまうと、本来必要のない支出をしたことになり、得どころか損になります。

## 還元率の重ねがけ

還元は複数を重ねられることが多く、こちらは **単純な足し算** で計算できます。割引の重ねがけ（掛け算になる）とは違う点に注意してください。

たとえば10,000円の買い物で、

- クレジットカード還元: 1%（100ポイント）
- コード決済の還元: 0.5%（50ポイント）
- 店舗のポイントカード: 1%（100ポイント）

合計2.5%で250ポイントです。それぞれの還元は **すべて元の支払額10,000円に対して** 計算されるため、足し算で合います。

ただし、キャンペーンによっては「税抜価格が対象」「他のポイントとの併用は対象外」といった条件が付くことがあります。上限（例: 最大1,000ポイントまで）が設定されているケースも多く、高額な買い物では表示どおりの還元率にならないことがあります。

## 判断の目安

| 状況 | 選ぶべきもの |
|---|---|
| 同じ数字（10%還元 vs 10%OFF） | **値引き** |
| 還元率が割引率より2割以上高い | 還元も検討の価値あり |
| ポイントの使い道が決まっていない | 値引き |
| 期間限定ポイント | 使い切れる見込みがあるときだけ |
| 日常的に使うサービスのポイント | 還元でも実質的な差は小さい |

「20%還元」と「15%OFF」なら、実質16.67%引き対15%引きで還元がわずかに有利です。ただし、その差は1.67ポイントぶんしかありません。ポイントの使いにくさを考えると、確実に支払額が減る値引きを選ぶほうが手堅い、という判断も十分に合理的です。
`,

  faq: [
    {
      q: "10%ポイント還元は10%引きと同じですか？",
      a: "同じではありません。実質9.09%引きに相当します。支払額は減らず、11,000円分の価値を10,000円で得る形になるためです。還元率が高いほど割引率とのズレは大きくなります。",
    },
    {
      q: "実質割引率はどう計算しますか？",
      a: "還元率 ÷ (100 + 還元率) × 100 です。20%還元なら 20 ÷ 120 × 100 = 16.67%引きに相当します。",
    },
    {
      q: "複数のポイント還元は足し算でいいですか？",
      a: "はい。割引の重ねがけと違い、還元はそれぞれが元の支払額に対して計算されるため単純に足せます。ただしキャンペーンの上限や併用不可の条件に注意してください。",
    },
    {
      q: "「100%還元」は全部タダになりますか？",
      a: "なりません。実質50%引きです。10,000円を支払って10,000ポイントを受け取るので、20,000円分の価値を10,000円で得た計算になります。",
    },
    {
      q: "ポイントと値引き、結局どちらを選ぶべきですか？",
      a: "数字が同じなら値引きです。ポイントは有効期限や使える店の制限で価値が目減りするため、還元率が割引率を2割以上上回っているときに初めて検討する、という基準が扱いやすいです。",
    },
  ],
};
