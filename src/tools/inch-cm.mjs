export default {
  category: "unit",
  updated: "2026-08-14",
  title: "長さの単位変換ツール｜インチ・cm・フィート・尺をまとめて換算",
  h1: "長さの単位変換ツール",
  description:
    "インチ・センチ・メートル・フィート・ヤード・尺など、長さの単位を相互に変換します。テレビやモニターの画面サイズを対角インチから幅・高さに直す計算にも対応した無料ツールです。",
  cardText: "インチ⇔cm⇔フィート⇔尺を一度に換算。",
  keywords: [
    "インチ", "cm", "センチ", "変換", "フィート", "ヤード", "尺", "長さ", "単位換算", "モニター",
  ],
  related: ["tsubo-heibei"],

  ui: `
<div class="field">
  <label for="value">数値</label>
  <input type="number" id="value" inputmode="decimal" value="24" step="0.001">
</div>

<div class="field">
  <label for="unit">入力した単位</label>
  <select id="unit">
    <option value="inch" selected>インチ (in)</option>
    <option value="cm">センチメートル (cm)</option>
    <option value="mm">ミリメートル (mm)</option>
    <option value="m">メートル (m)</option>
    <option value="feet">フィート (ft)</option>
    <option value="yard">ヤード (yd)</option>
    <option value="shaku">尺</option>
    <option value="sun">寸</option>
    <option value="ken">間（けん）</option>
    <option value="mile">マイル (mi)</option>
    <option value="km">キロメートル (km)</option>
  </select>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">ミリメートル</div><div class="v" id="rMm">-</div></div>
    <div><div class="k">センチメートル</div><div class="v" id="rCm">-</div></div>
    <div><div class="k">メートル</div><div class="v" id="rM">-</div></div>
    <div><div class="k">インチ</div><div class="v" id="rInch">-</div></div>
    <div><div class="k">フィート</div><div class="v" id="rFeet">-</div></div>
    <div><div class="k">ヤード</div><div class="v" id="rYard">-</div></div>
    <div><div class="k">尺</div><div class="v" id="rShaku">-</div></div>
    <div><div class="k">寸</div><div class="v" id="rSun">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>画面サイズの計算（対角インチ → 幅・高さ）</h3>
<div class="row">
  <div class="field">
    <label for="diag">対角の長さ（インチ）</label>
    <input type="number" id="diag" inputmode="decimal" value="24" step="0.1">
  </div>
  <div class="field">
    <label for="ratio">画面比率</label>
    <select id="ratio">
      <option value="16:9" selected>16:9（一般的なテレビ・モニター）</option>
      <option value="16:10">16:10（作業用モニター）</option>
      <option value="21:9">21:9（ウルトラワイド）</option>
      <option value="4:3">4:3（旧型テレビ・一部タブレット）</option>
      <option value="3:2">3:2（一部ノートPC）</option>
    </select>
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">画面の幅</div><div class="v" id="rW">-</div></div>
    <div><div class="k">画面の高さ</div><div class="v" id="rH">-</div></div>
    <div><div class="k">対角</div><div class="v" id="rD">-</div></div>
  </div>
  <p class="result-sub">本体の外枠（ベゼル）や台座は含まない、表示部分だけの寸法です。</p>
</div>
`,

  script: `
(function () {
  // すべてメートル基準の係数。1インチ=2.54cmは国際的な定義値。
  var TO_M = {
    inch: 0.0254,
    cm: 0.01,
    mm: 0.001,
    m: 1,
    feet: 0.3048,
    yard: 0.9144,
    shaku: 10 / 33,        // 1尺 = 10/33 m（約30.303cm）
    sun: 1 / 33,           // 1寸 = 1尺の1/10
    ken: 60 / 33,          // 1間 = 6尺
    mile: 1609.344,
    km: 1000
  };

  function convert() {
    var v = ST.n(ST.$("value"));
    var m = v * (TO_M[ST.$("unit").value] || 1);

    ST.set("rMm", ST.num(m / TO_M.mm, 3) + " mm");
    ST.set("rCm", ST.num(m / TO_M.cm, 4) + " cm");
    ST.set("rM", ST.num(m, 5) + " m");
    ST.set("rInch", ST.num(m / TO_M.inch, 4) + " in");
    ST.set("rFeet", ST.num(m / TO_M.feet, 4) + " ft");
    ST.set("rYard", ST.num(m / TO_M.yard, 4) + " yd");
    ST.set("rShaku", ST.num(m / TO_M.shaku, 4) + " 尺");
    ST.set("rSun", ST.num(m / TO_M.sun, 3) + " 寸");
    ST.set("detail", "1インチ = 2.54cm（定義値）、1尺 = 10/33 m ≒ 30.303cm、" +
      "1フィート = 12インチ = 30.48cm です。");
  }

  function screen() {
    var d = ST.n(ST.$("diag"));
    var parts = ST.$("ratio").value.split(":").map(Number);
    var rw = parts[0], rh = parts[1];
    var k = d / Math.sqrt(rw * rw + rh * rh);
    var w = k * rw, h = k * rh;
    ST.set("rW", ST.num(w * 2.54, 1) + " cm（" + ST.num(w, 1) + " in）");
    ST.set("rH", ST.num(h * 2.54, 1) + " cm（" + ST.num(h, 1) + " in）");
    ST.set("rD", ST.num(d * 2.54, 1) + " cm（" + ST.num(d, 1) + " in）");
  }

  ST.live(function () { convert(); screen(); });
})();
`,

  intro: `
数値と単位を選ぶと、主な長さの単位にまとめて換算します。下では、テレビやモニターの「◯インチ」から実際の幅・高さを求められます。
`,

  guide: `
## 基本の換算式

> **1インチ = 2.54cm（国際的な定義値）**
> **1フィート = 12インチ = 30.48cm**
> **1ヤード = 3フィート = 91.44cm**
> **1マイル = 1,760ヤード = 1.609344km**

1インチが2.54cmちょうどなのは、1959年の国際協定でそう定められたためです。それ以前は国によってわずかに違う値が使われていました。

暗算するときは、**インチ × 2.5** でおおよその値が出ます。24インチなら60cm（正確には60.96cm）で、誤差は2%以内です。

## 尺貫法の単位

日本の建築や着物の世界では、今も尺貫法が使われています。

| 単位 | メートル法 | 由来・使われ方 |
|---|---|---|
| 1寸 | 約3.03cm | 1尺の1/10 |
| 1尺 | 約30.3cm | 手を広げた長さが起源 |
| 1間（けん） | 約1.818m | 6尺。柱と柱の間隔 |
| 1丈 | 約3.03m | 10尺 |
| 1町 | 約109m | 60間 |
| 1里 | 約3.927km | 36町 |

1尺は「10/33メートル」と定義されています。この半端な数字は、明治時代にメートル法との対応を定めた際、それまで使われていた尺の長さに合わせたためです。

住宅の間取りで「一間（いっけん）」といえば約1.82mで、これは畳の長辺の長さでもあります。日本の住宅の柱の間隔が910mm刻みになっているのは、この半分（半間＝3尺）が基準になっているからです。

## テレビ・モニターのインチ数

画面サイズの「◯インチ」は、**画面の対角線の長さ** を表します。幅ではありません。

16:9の画面では、対角のインチ数から次のように幅と高さが求められます。

| 対角 | 幅 | 高さ |
|---|---|---|
| 24インチ | 約53.1cm | 約29.9cm |
| 27インチ | 約59.8cm | 約33.6cm |
| 32インチ | 約70.8cm | 約39.8cm |
| 43インチ | 約95.2cm | 約53.5cm |
| 55インチ | 約121.8cm | 約68.5cm |
| 65インチ | 約143.9cm | 約80.9cm |
| 75インチ | 約166.0cm | 約93.4cm |

購入前に設置場所を測るときは、**この寸法にベゼル（外枠）と台座の幅を足す** 必要があります。メーカーの仕様表にある「外形寸法」を確認してください。

また、同じインチ数でも画面比率が違うと寸法が変わります。ウルトラワイド（21:9）の34インチは、16:9の34インチより横に長く、縦に短くなります。

## 衣類・靴のインチ表記

- **ジーンズのウエスト**: 「W30」は30インチ＝約76cm。日本のサイズ表記より小さい数字になります
- **靴のサイズ**: US表記は独自の基準で、インチの直接換算ではありません。cm表記（実際の足長）が最も確実です
- **自転車のタイヤ**: 「26インチ」はホイールの外径。同じ表記でも規格により実寸が異なります

## 覚えておくと便利な近似値

| 変換 | 正確な値 | 暗算用 |
|---|---|---|
| インチ → cm | × 2.54 | × 2.5 |
| cm → インチ | ÷ 2.54 | × 0.4 |
| フィート → m | × 0.3048 | × 0.3 |
| m → フィート | × 3.2808 | × 3.3 |
| マイル → km | × 1.609 | × 1.6 |
| km → マイル | × 0.6214 | × 0.6 |

海外の道路標識で「60 mile」とあれば、およそ96km。飛行機の高度「35,000フィート」はおよそ10,500mです。
`,

  faq: [
    {
      q: "1インチは何cmですか？",
      a: "2.54cmちょうどです。1959年の国際協定で定義された値で、四捨五入した近似値ではありません。",
    },
    {
      q: "テレビの「50インチ」は横幅のことですか？",
      a: "対角線の長さです。16:9の50インチなら、幅は約110.7cm、高さは約62.3cmになります。設置場所を測るときは、これに外枠と台座の寸法を足してください。",
    },
    {
      q: "同じインチ数でも画面の大きさが違うのはなぜですか？",
      a: "画面比率が異なるためです。21:9のウルトラワイドと16:9では、同じ対角インチでも幅と高さが変わります。表示できる面積も比率によって変わります。",
    },
    {
      q: "1尺は何cmですか？",
      a: "約30.303cmです。正確には10/33メートルと定義されています。1寸はその1/10で約3.03cm、1間は6尺で約1.818mです。",
    },
    {
      q: "尺貫法は今も使えますか？",
      a: "計量法により、取引や証明には使用できません。ただし建築の現場や着物、工芸の分野では、慣習的な寸法の呼び方として今も使われています。",
    },
  ],
};
