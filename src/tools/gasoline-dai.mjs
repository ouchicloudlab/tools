export default {
  category: "money",
  updated: "2026-08-15",
  title: "ガソリン代計算ツール｜走行距離と燃費から高速代込みの費用を出す",
  h1: "ガソリン代計算ツール",
  description:
    "走行距離・燃費・ガソリン単価を入れると、片道と往復のガソリン代を計算します。高速料金を足した総額や、人数で割った1人あたりの負担額も同時に表示する無料ツールです。",
  cardText: "距離と燃費からガソリン代・割り勘額を計算。",
  keywords: [
    "ガソリン代", "計算", "燃費", "走行距離", "リッター", "旅費", "割り勘", "交通費", "ドライブ",
  ],
  yomi: "がそりんだい ねんぴ",
  related: ["denkidai-keisan", "waribiki-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="distance">走行距離（km・片道）</label>
    <input type="number" id="distance" inputmode="decimal" value="120">
  </div>
  <div class="field">
    <label for="nenpi">燃費（km/L）</label>
    <input type="number" id="nenpi" inputmode="decimal" value="15" step="0.1">
    <p class="hint">車検証やカタログのWLTCモード値が目安です。</p>
  </div>
  <div class="field">
    <label for="price">ガソリン単価（円/L）</label>
    <input type="number" id="price" inputmode="decimal" value="175">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="highway">高速料金（円・片道）</label>
    <input type="number" id="highway" inputmode="decimal" value="0">
  </div>
  <div class="field">
    <label for="people">乗車人数（割り勘用）</label>
    <input type="number" id="people" inputmode="numeric" value="1" min="1">
  </div>
  <div class="field">
    <span class="field-label">計算する区間</span>
    <div class="pills" id="trip">
      <label><input type="radio" name="trip" value="1" checked>片道</label>
      <label><input type="radio" name="trip" value="2">往復</label>
    </div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">ガソリン代（片道）</div>
  <div class="result-main" id="mainVal">1,400円</div>
  <div class="result-grid">
    <div><div class="k">使用するガソリン</div><div class="v" id="literVal">-</div></div>
    <div><div class="k">高速料金</div><div class="v" id="hwVal">-</div></div>
    <div><div class="k">交通費の合計</div><div class="v" id="totalVal">-</div></div>
    <div><div class="k">1人あたり</div><div class="v" id="perVal">-</div></div>
    <div><div class="k">1kmあたりの燃料費</div><div class="v" id="perKmVal">-</div></div>
    <div><div class="k">満タン(50L)で走れる距離</div><div class="v" id="rangeVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
ST.live(function () {
  var dist = Math.max(0, ST.n(ST.$("distance")));
  var nenpi = ST.n(ST.$("nenpi"));
  var price = Math.max(0, ST.n(ST.$("price")));
  var hw = Math.max(0, ST.n(ST.$("highway")));
  var people = Math.max(1, Math.round(ST.n(ST.$("people"), 1)));
  var trip = Number(ST.pick("trip")) || 1;

  if (nenpi <= 0) {
    ["mainVal","literVal","hwVal","totalVal","perVal","perKmVal","rangeVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", "燃費に0より大きい値を入力してください。");
    return;
  }

  var totalDist = dist * trip;
  var liter = ST.fix(totalDist / nenpi);
  var fuel = ST.fix(liter * price);
  var hwTotal = ST.fix(hw * trip);
  var total = ST.fix(fuel + hwTotal);

  ST.$("mainLabel").textContent = "ガソリン代（" + (trip === 2 ? "往復" : "片道") + "）";
  ST.set("mainVal", ST.yen(Math.round(fuel), 0));
  ST.set("literVal", ST.num(liter, 2) + "L");
  ST.set("hwVal", ST.yen(Math.round(hwTotal), 0));
  ST.set("totalVal", ST.yen(Math.round(total), 0));
  ST.set("perVal", ST.yen(Math.round(total / people), 0));
  ST.set("perKmVal", ST.yen(Math.round(price / nenpi * 100) / 100, 2));
  ST.set("rangeVal", ST.num(Math.round(nenpi * 50), 0) + "km");
  ST.set("detail",
    "計算式: " + ST.num(totalDist, 1) + "km ÷ " + ST.num(nenpi, 1) + "km/L = " +
    ST.num(liter, 2) + "L、× " + ST.num(price, 0) + "円 = " + ST.yen(Math.round(fuel), 0) +
    (hwTotal > 0 ? "。高速料金 " + ST.yen(Math.round(hwTotal), 0) + " を加えて " + ST.yen(Math.round(total), 0) : "") +
    "。");
});
`,

  intro: `
走行距離・燃費・ガソリン単価を入れると、ガソリン代が計算されます。高速料金を入力すれば交通費の総額が出て、人数を指定すれば割り勘の金額も同時に表示されます。
`,

  guide: `
## ガソリン代の計算式

> **ガソリン代 = 走行距離(km) ÷ 燃費(km/L) × ガソリン単価(円/L)**

たとえば120kmを燃費15km/Lの車で走り、ガソリンが175円/Lの場合は次のようになります。

- 120 ÷ 15 = 8L
- 8L × 175円 = **1,400円**

往復ならこの2倍です。距離を先に2倍しても、金額を2倍しても結果は同じです。

## 燃費の数値はどこを見る？

車の燃費には複数の種類があり、どれを使うかで結果が変わります。

| 種類 | 内容 | 実燃費との差 |
|---|---|---|
| WLTCモード | 2018年以降の基準。市街地・郊外・高速の3条件を総合 | 実燃費に近い |
| JC08モード | 2018年以前の基準 | 実燃費より1〜2割よい |
| 10・15モード | さらに古い基準 | 実燃費より2〜3割よい |
| 実燃費 | 満タン法などで実測した値 | — |

**満タン法**を使えば自分の車の実燃費が分かります。給油時に満タンにしてトリップメーターを0にし、次の給油でまた満タンにしたときの「走った距離 ÷ 入れた量」が実燃費です。

エアコンの使用、渋滞、荷物の重さ、タイヤの空気圧によって、実燃費はカタログ値の7〜8割程度になることが一般的です。旅費を見積もるときは、カタログ値より少し悪い数字を入れておくと予算が足りなくなりません。

## 車種別の燃費の目安（WLTCモード）

| 車種 | 燃費の目安 |
|---|---|
| 軽自動車 | 20〜25km/L |
| コンパクトカー（ガソリン） | 18〜22km/L |
| コンパクトカー（ハイブリッド） | 25〜35km/L |
| ミニバン | 13〜16km/L |
| SUV | 12〜18km/L |
| 大型セダン | 10〜14km/L |

## ガソリン代を下げる走り方

- **急発進・急加速を避ける**: 発進時にゆっくりアクセルを踏むだけで、燃費が1割前後変わるとされています。
- **エアコンの使い方**: 冷房は燃費を1割程度悪化させます。暖房はエンジンの排熱を使うため影響が小さめです。
- **タイヤの空気圧**: 適正値より不足していると、転がり抵抗が増えて燃費が悪化します。月1回の点検が推奨されています。
- **不要な荷物を降ろす**: 100kgの荷物で燃費が3%程度悪化するとされています。
- **アイドリングストップ**: 10分間のアイドリングで、およそ0.1〜0.15Lを消費します。

## 高速道路を使うかどうかの判断

高速料金を払うかどうかは、単純な金額比較では決まりません。

- **高速のほうが燃費はよい**: 一定速度で走れるため、市街地より1〜2割燃費が向上します
- **距離は伸びることが多い**: インターまでの移動があり、総走行距離は増えがちです
- **時間の価値**: 2時間短縮できるなら、その時間をどう評価するかで判断が変わります

ETC割引（深夜割引・休日割引）を使えば、料金が3割程度下がる時間帯もあります。出発時刻をずらせる場合は確認する価値があります。

## 会社の交通費精算での単価

自家用車を業務で使った場合のガソリン代の精算では、次のような方法が使われます。

- **距離単価方式**: 1kmあたり15円、20円など、あらかじめ決めた単価で計算する（最も一般的）
- **実費方式**: 領収書に基づいて実際の給油代を精算する
- **燃費計算方式**: 走行距離 ÷ 車の燃費 × 実際の単価で計算する

このツールの「1kmあたりの燃料費」は、3番目の方式にあたります。会社の規程がどの方式かによって精算額が変わるため、事前に確認しておくと差額の説明が不要になります。
`,

  faq: [
    {
      q: "燃費はカタログの値をそのまま使っていいですか？",
      a: "実燃費はカタログ値の7〜8割程度になることが多いため、予算の見積もりにはやや悪めの数字を入れるほうが安全です。正確に知りたい場合は満タン法で実測してください。",
    },
    {
      q: "満タン法とはどのような測り方ですか？",
      a: "給油時に満タンにしてトリップメーターを0にし、次に満タン給油したときの「走行距離 ÷ 給油量」が実燃費です。数回繰り返して平均を取ると精度が上がります。",
    },
    {
      q: "エアコンを使うとどれくらい燃費が悪くなりますか？",
      a: "冷房で1割前後悪化するとされています。暖房はエンジンの排熱を利用するため影響は小さいですが、デフロスター使用時はエアコンが作動するため燃費が落ちます。",
    },
    {
      q: "割り勘の金額はどう計算されますか？",
      a: "ガソリン代と高速料金を合わせた総額を、入力した乗車人数で割っています。運転手の負担を軽くするために人数から1人分を引くなど、実際の配分はご相談ください。",
    },
    {
      q: "高速料金はどこで調べられますか？",
      a: "NEXCOの料金検索やカーナビのルート計算で確認できます。ETC割引の適用時間帯によって金額が変わるため、出発時刻を含めて調べると正確です。",
    },
  ],
};
