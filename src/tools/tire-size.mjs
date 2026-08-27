export default {
  category: "unit",
  updated: "2026-08-27",
  title: "タイヤサイズの計算｜外径・インチアップの差を確認",
  h1: "タイヤサイズの計算ツール",
  description:
    "195/65R15のようなタイヤサイズから、外径・幅・円周を計算します。インチアップ時に外径がどれだけ変わるか、速度計の誤差も確認できる無料ツールです。",
  cardText: "タイヤの外径を計算し、インチアップの差を比較。",
  keywords: [
    "タイヤ", "サイズ", "外径", "インチアップ", "扁平率", "計算", "195/65R15", "速度計",
  ],
  related: ["inch-cm", "kuruma-ijihi"],

  ui: `
<h3 style="margin-top:0">現在のタイヤ</h3>
<div class="row">
  <div class="field">
    <label for="w1">幅（mm）</label>
    <input type="number" id="w1" inputmode="numeric" value="195" step="5">
  </div>
  <div class="field">
    <label for="f1">扁平率（%）</label>
    <input type="number" id="f1" inputmode="numeric" value="65" step="5">
  </div>
  <div class="field">
    <label for="r1">リム径（インチ）</label>
    <input type="number" id="r1" inputmode="numeric" value="15" step="1">
  </div>
</div>

<h3>比較するタイヤ</h3>
<div class="row">
  <div class="field">
    <label for="w2">幅（mm）</label>
    <input type="number" id="w2" inputmode="numeric" value="205" step="5">
  </div>
  <div class="field">
    <label for="f2">扁平率（%）</label>
    <input type="number" id="f2" inputmode="numeric" value="55" step="5">
  </div>
  <div class="field">
    <label for="r2">リム径（インチ）</label>
    <input type="number" id="r2" inputmode="numeric" value="16" step="1">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">外径の差</div>
  <div class="result-main" id="diffVal">-</div>
  <div class="result-grid">
    <div><div class="k">現在の外径</div><div class="v" id="d1Val">-</div></div>
    <div><div class="k">比較する外径</div><div class="v" id="d2Val">-</div></div>
    <div><div class="k">サイドウォールの高さ</div><div class="v" id="sideVal">-</div></div>
    <div><div class="k">円周</div><div class="v" id="circleVal">-</div></div>
    <div><div class="k">車高の変化</div><div class="v" id="heightVal">-</div></div>
    <div><div class="k">速度計60km/h時の実速度</div><div class="v" id="speedVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>1kmあたりの回転数</h3>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">現在のタイヤ</div><div class="v" id="rot1Val">-</div></div>
    <div><div class="k">比較するタイヤ</div><div class="v" id="rot2Val">-</div></div>
  </div>
  <p class="result-sub">回転数が変わると、速度計とオドメーター（走行距離計）の表示がずれます。</p>
</div>
`,

  script: `
(function () {
  var INCH = 25.4;

  // 外径 = リム径(mm) + サイドウォール高さ × 2
  // サイドウォール高さ = 幅 × 扁平率 ÷ 100
  function outer(w, f, r) {
    return r * INCH + (w * f / 100) * 2;
  }

  ST.live(function () {
    var w1 = ST.n(ST.$("w1")), f1 = ST.n(ST.$("f1")), r1 = ST.n(ST.$("r1"));
    var w2 = ST.n(ST.$("w2")), f2 = ST.n(ST.$("f2")), r2 = ST.n(ST.$("r2"));

    if (w1 <= 0 || f1 <= 0 || r1 <= 0 || w2 <= 0 || f2 <= 0 || r2 <= 0) {
      ["diffVal","d1Val","d2Val","sideVal","circleVal","heightVal","speedVal","rot1Val","rot2Val"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "すべての項目に0より大きい値を入力してください。");
      return;
    }

    var d1 = outer(w1, f1, r1);
    var d2 = outer(w2, f2, r2);
    var diff = d2 - d1;
    var pct = diff / d1 * 100;
    var side1 = w1 * f1 / 100;
    var side2 = w2 * f2 / 100;

    // 外径が大きくなると、同じ回転数でも進む距離が増える
    // → 速度計の表示より実速度が速くなる
    var realSpeed = 60 * d2 / d1;

    ST.set("diffVal", (diff >= 0 ? "+" : "") + ST.num(diff, 1) + " mm（" +
      (pct >= 0 ? "+" : "") + ST.num(pct, 2) + "%）");
    ST.set("d1Val", ST.num(d1, 1) + " mm");
    ST.set("d2Val", ST.num(d2, 1) + " mm");
    ST.set("sideVal", ST.num(side1, 1) + " → " + ST.num(side2, 1) + " mm");
    ST.set("circleVal", ST.num(d1 * Math.PI / 1000, 3) + " → " + ST.num(d2 * Math.PI / 1000, 3) + " m");
    ST.set("heightVal", (diff / 2 >= 0 ? "+" : "") + ST.num(diff / 2, 1) + " mm");
    ST.set("speedVal", ST.num(realSpeed, 1) + " km/h");
    ST.set("rot1Val", ST.num(1000 / (d1 * Math.PI / 1000), 0) + " 回転");
    ST.set("rot2Val", ST.num(1000 / (d2 * Math.PI / 1000), 0) + " 回転");

    var judge = Math.abs(pct) <= 1
      ? "外径の差は1%以内で、実用上ほぼ問題のない範囲です。"
      : (Math.abs(pct) <= 3
        ? "外径の差は3%以内です。速度計の誤差が許容範囲を外れる可能性があるため、車検時は確認が必要です。"
        : "外径の差が3%を超えています。速度計の誤差、車体との干渉、車検不適合の恐れがあります。");

    ST.set("detail",
      ST.num(w1, 0) + "/" + ST.num(f1, 0) + "R" + ST.num(r1, 0) + " の外径は " +
      ST.num(d1, 1) + "mm、" +
      ST.num(w2, 0) + "/" + ST.num(f2, 0) + "R" + ST.num(r2, 0) + " は " +
      ST.num(d2, 1) + "mm です。" + judge);
  });
})();
`,

  intro: `
「195/65R15」のようなタイヤサイズから外径を計算し、別のサイズとの差を比べられます。**インチアップしても外径をほぼ同じに保てているか**を確認するためのツールです。
`,

  guide: `
## タイヤサイズの読み方

側面に書かれている「**195/65R15 91H**」という表記は、次の意味です。

| 部分 | 意味 |
|---|---|
| 195 | タイヤの幅（mm） |
| 65 | 扁平率（%）＝ サイドウォールの高さが幅の何%か |
| R | ラジアル構造 |
| 15 | リム径（インチ）＝ ホイールの直径 |
| 91 | ロードインデックス（1本が支えられる荷重） |
| H | 速度記号（Hは210km/hまで） |

**幅はmm、リム径はインチ** という単位の混在が、この表記の分かりにくさの原因です。

## 外径の計算式

> **外径 = リム径 × 25.4 ＋ (幅 × 扁平率 ÷ 100) × 2**

195/65R15なら、

- サイドウォールの高さ: 195 × 0.65 = 126.75mm
- 外径: 15 × 25.4 ＋ 126.75 × 2 = 381 ＋ 253.5 = **634.5mm**

サイドウォールは上下に2つあるため、2倍する点に注意してください。

## インチアップの考え方

ホイールを大きくするとき、**外径を変えないようにする** のが基本です。外径が変わると、速度計の誤差、車体との干渉、乗り心地の変化が生じます。

外径を保つには、リム径を1インチ上げるごとに、

- **幅を10mm広げる**
- **扁平率を10%下げる**

という調整が目安になります。

| インチ | 例 | 外径 |
|---|---|---|
| 15インチ | 195/65R15 | 634.5mm |
| 16インチ | 205/55R16 | 631.9mm |
| 17インチ | 215/45R17 | 625.3mm |
| 18インチ | 225/40R18 | 637.2mm |

いずれも外径が630mm前後に収まっています。**差が1%以内**（この例なら±6mm程度）であれば、実用上ほとんど問題ありません。

## インチアップの効果と副作用

**良くなる点**

- ハンドルの応答が素早くなる（サイドウォールが薄くたわみにくいため）
- コーナリング時の安定性が上がる
- 見た目が引き締まる

**悪くなる点**

- **乗り心地が硬くなる**: 空気の量が減り、路面の凹凸を吸収しにくくなります
- **タイヤ代が上がる**: 扁平タイヤは1本あたりの価格が高くなります
- **重くなる**: ホイールが重くなると燃費と加速に影響します
- **ホイールを傷めやすい**: 縁石でサイドウォールが潰れきり、ホイールが直接当たります

## 速度計の誤差

外径が大きくなると、同じ回転数で進む距離が増えるため、**速度計の表示より実際の速度が速く** なります。逆に小さくすると遅くなります。

日本の保安基準では、速度計の表示について次の範囲が認められています（2007年以降の車）。

> **実速度が40km/hのとき、速度計は 30.9km/h 〜 42.55km/h の範囲**

メーカーは意図的に **やや高めに表示する** 設計にしています。実速度より速く表示されるぶんには安全側だからです。そのため、純正より外径の大きいタイヤを履くと、この余裕を食いつぶして基準を外れる可能性があります。

外径の差が **±3%を超えると** 、車検で速度計の検査に通らないことがあります。

## そのほかの注意点

- **ロードインデックス**: 純正と同等以上を選んでください。数値が下がると車検に通りません
- **速度記号**: こちらも純正以上が必要です
- **はみ出し**: タイヤがフェンダーから外側にはみ出すと車検不適合です（10mm未満の突出は条件付きで可）
- **スピードメーター誤差**: 冬タイヤは夏タイヤより外径が小さいことがあり、同じ表示でも実速度が変わります

サイズ変更を検討するときは、タイヤ販売店で車種ごとの適合を確認するのが確実です。

> 保安基準や車検の判断は、車種・年式・地域によって異なる場合があります。実際の装着前には専門店にご相談ください。
`,

  faq: [
    {
      q: "195/65R15の外径は何mmですか？",
      a: "634.5mmです。計算式は「リム径15インチ × 25.4 ＋ (195 × 65 ÷ 100) × 2」で、サイドウォールが上下2か所あるため2倍する点に注意してください。",
    },
    {
      q: "インチアップするとき、どうサイズを選べばいいですか？",
      a: "外径を変えないことが基本です。リム径を1インチ上げるごとに、幅を10mm広げて扁平率を10%下げる、という調整が目安になります。外径の差は1%以内に収めてください。",
    },
    {
      q: "外径が変わると何が問題になりますか？",
      a: "速度計とオドメーターの表示がずれます。外径が大きくなると実速度が表示より速くなり、差が±3%を超えると車検の速度計検査に通らないことがあります。車体との干渉も起きやすくなります。",
    },
    {
      q: "インチアップすると乗り心地はどうなりますか？",
      a: "硬くなります。扁平率が下がるとタイヤ内の空気量が減り、路面の凹凸を吸収しにくくなるためです。ハンドルの応答性は上がりますが、快適性は下がるというトレードオフになります。",
    },
    {
      q: "扁平率とは何ですか？",
      a: "タイヤの幅に対するサイドウォールの高さの割合です。195/65R15なら、高さが幅195mmの65%（約127mm）ということです。数字が小さいほど薄いタイヤになります。",
    },
  ],
};
