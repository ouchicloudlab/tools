export default {
  category: "unit",
  updated: "2026-08-27",
  title: "容量の単位変換｜リットル・ガロン・合・カップを換算",
  h1: "容量・体積の単位変換ツール",
  description:
    "ミリリットル・リットル・ガロン・オンスに加え、米の合や升といった日本の単位も相互に変換します。海外のレシピや炊飯の分量を調べるときに使える無料ツールです。",
  cardText: "ml・L・ガロン・合・カップを相互に変換。",
  keywords: [
    "容量", "変換", "リットル", "ガロン", "オンス", "合", "升", "cc", "ml", "単位",
  ],
  yomi: "ようりょう りっとる ごう しょう",
  related: ["osaji-kosaji", "menseki-taiseki"],

  ui: `
<div class="row">
  <div class="field">
    <label for="value">数値</label>
    <input type="number" id="value" inputmode="decimal" value="1" step="0.01">
  </div>
  <div class="field">
    <label for="unit">単位</label>
    <select id="unit">
      <option value="0.001">ミリリットル (ml・cc)</option>
      <option value="0.01">デシリットル (dl)</option>
      <option value="1" selected>リットル (L)</option>
      <option value="0.2">計量カップ（日本 200ml）</option>
      <option value="0.24">カップ（米国 240ml）</option>
      <option value="0.015">大さじ（15ml）</option>
      <option value="0.005">小さじ（5ml）</option>
      <option value="0.18039">米1合（180.39ml）</option>
      <option value="1.8039">1升（1.8L）</option>
      <option value="18.039">1斗（18L）</option>
      <option value="3.785411784">ガロン（米・液量）</option>
      <option value="4.54609">ガロン（英）</option>
      <option value="0.0295735">液量オンス（米）</option>
      <option value="0.473176">パイント（米）</option>
      <option value="0.946353">クォート（米）</option>
      <option value="1000">立方メートル (㎥)</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">ミリリットル</div><div class="v" id="rMl">-</div></div>
    <div><div class="k">リットル</div><div class="v" id="rL">-</div></div>
    <div><div class="k">計量カップ（200ml）</div><div class="v" id="rCup">-</div></div>
    <div><div class="k">大さじ</div><div class="v" id="rTbsp">-</div></div>
    <div><div class="k">米（合）</div><div class="v" id="rGo">-</div></div>
    <div><div class="k">ガロン（米）</div><div class="v" id="rGal">-</div></div>
    <div><div class="k">液量オンス（米）</div><div class="v" id="rOz">-</div></div>
    <div><div class="k">水の重さ</div><div class="v" id="rWeight">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>米を炊くときの水加減</h3>
<div class="row">
  <div class="field">
    <label for="rice">米の量（合）</label>
    <input type="number" id="rice" inputmode="decimal" value="2" step="0.5">
  </div>
  <div class="field">
    <label for="riceType">炊き方</label>
    <select id="riceType">
      <option value="1.2" selected>普通（白米）</option>
      <option value="1.1">かため</option>
      <option value="1.3">やわらかめ</option>
      <option value="1.32">無洗米（1割増し）</option>
      <option value="2.0">おかゆ（全がゆ）</option>
    </select>
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">米の容量</div><div class="v" id="riceMl">-</div></div>
    <div><div class="k">米の重さ</div><div class="v" id="riceG">-</div></div>
    <div><div class="k">水の量</div><div class="v" id="waterMl">-</div></div>
    <div><div class="k">炊き上がりの重さ</div><div class="v" id="cookedG">-</div></div>
  </div>
  <p class="result-sub" id="riceDetail"></p>
</div>
`,

  script: `
(function () {
  var GO = 0.18039;   // 1合 = 180.39ml

  ST.live(function () {
    var v = ST.n(ST.$("value"));
    var factor = Number(ST.$("unit").value) || 1;
    var L = v * factor;          // すべてリットルに正規化する

    ST.set("rMl", ST.num(L * 1000, 2) + " ml");
    ST.set("rL", ST.num(L, 4) + " L");
    ST.set("rCup", ST.num(L / 0.2, 3) + " 杯");
    ST.set("rTbsp", ST.num(L / 0.015, 2) + " 杯");
    ST.set("rGo", ST.num(L / GO, 3) + " 合");
    ST.set("rGal", ST.num(L / 3.785411784, 4) + " gal");
    ST.set("rOz", ST.num(L / 0.0295735, 2) + " fl oz");
    ST.set("rWeight", ST.num(L, 3) + " kg（水の場合）");
    ST.set("detail", "1リットル = 1,000ml = 1,000cm³ で、水なら約1kgです。" +
      "米1合は180.39ml（正確には1升の10分の1）、計量カップは日本200ml・米国240mlと違います。");

    // 炊飯の水加減
    var go = Math.max(0, ST.n(ST.$("rice")));
    var ratio = Number(ST.$("riceType").value) || 1.2;
    var riceMl = go * GO * 1000;
    var riceG = riceMl * 0.85;        // 米の見かけ密度は約0.85g/ml
    var waterMl = riceMl * ratio;
    var cookedG = riceG * 2.2;        // 炊き上がりは約2.2倍

    ST.set("riceMl", ST.num(riceMl, 0) + " ml");
    ST.set("riceG", ST.num(riceG, 0) + " g");
    ST.set("waterMl", ST.num(waterMl, 0) + " ml");
    ST.set("cookedG", ST.num(cookedG, 0) + " g（茶碗 " +
      ST.num(cookedG / 150, 1) + " 杯分）");
    ST.set("riceDetail",
      "米 " + ST.num(go, 1) + "合（" + ST.num(riceMl, 0) + "ml）に対して、" +
      "水は容量の " + ratio + "倍 = " + ST.num(waterMl, 0) + "ml が目安です。" +
      "炊飯器の目盛りを使う場合はそちらが優先です。");
  });
})();
`,

  intro: `
ミリリットルやリットルに加え、**米の合や升、海外のガロン・オンス**も相互に変換します。下では米を炊くときの水加減も計算できます。
`,

  guide: `
## 基本の関係

> **1リットル = 1,000ml = 1,000cm³**
> **1ml = 1cc = 1cm³**

**mlとccは完全に同じ量** です。ccは cubic centimeter（立方センチメートル）の略で、医療や自動車の排気量では今も使われています。料理では ml が一般的です。

水の場合、1リットルがちょうど1kgになります。これはメートル法が「水1リットルの質量を1kg」として設計されたためです。

## 計量カップの違い

| 種類 | 容量 |
|---|---|
| 日本の計量カップ | **200ml** |
| 米国のカップ | **約240ml** |
| 米1合の計量カップ | **180.39ml** |
| 英国のカップ | 約284ml（現在はあまり使われない） |

**炊飯器に付属するカップは200mlではなく1合（180ml）** です。これで水や調味料を量ると、1割ほど少なくなります。

海外のレシピで「1 cup」とある場合は約240mlなので、日本の計量カップでは1.2杯ぶんになります。分量の多いお菓子作りでは、この2割の差が仕上がりに影響します。

## 尺貫法の容量

| 単位 | 容量 | 使われる場面 |
|---|---|---|
| 1勺（しゃく） | 約18ml | ほぼ使われない |
| 1合（ごう） | **180.39ml** | 米、日本酒 |
| 1升（しょう） | 約1.8L | 日本酒、醤油 |
| 1斗（と） | 約18L | 一斗缶 |
| 1石（こく） | 約180L | 江戸時代の米の生産高 |

10倍ずつ大きくなる、分かりやすい体系です。

**一斗缶** は18リットル入る缶のことで、今も業務用の食用油などに使われています。**加賀百万石** の「石」は米の量の単位で、100万石はおよそ18万キロリットル、金額に直すと現在の数百億円規模とされます。

## ガロンの落とし穴

**米国と英国でガロンの量が違います。**

| 種類 | 容量 |
|---|---|
| 米ガロン（液量） | **約3.785L** |
| 英ガロン | **約4.546L** |

その差は約2割です。海外の車の燃費表示「30 MPG（miles per gallon）」も、どちらのガロンかで意味が変わります。

- 米国式 30 MPG = 約12.8 km/L
- 英国式 30 MPG = 約10.6 km/L

同様に、液量オンス（fl oz）も米国約29.6ml、英国約28.4mlと異なります。海外通販や輸入品の表記を見るときは、どちらの規格かを確認してください。

なお、**重さのオンス（約28.35g）と液量オンス（約29.6ml）は別の単位** です。水の場合はたまたま近い数値になりますが、油や蜂蜜では一致しません。

## 米の水加減

米は炊くと水を吸って重くなります。

| 状態 | 1合あたり |
|---|---|
| 米（乾燥） | 180ml / 約150g |
| 加える水（普通） | 約216ml（容量の1.2倍） |
| 炊き上がり | 約330g（茶碗2.2杯分） |

水の量は「米の容量 × 1.2」が基本です。重さで測る場合は「米の重さ × 1.5」になります（乾燥米150gに対して水225ml）。

- **無洗米**: 表面のぬかが取れているぶん、同じ1合でも米粒が多く入ります。水を1割ほど多めにしてください
- **新米**: 水分を多く含むため、やや少なめに
- **古米**: 乾燥しているため、やや多めに

炊飯器の内釜に目盛りがある場合は、そちらに合わせるのが最も確実です。目盛りは無洗米用が別に用意されていることもあります。
`,

  faq: [
    {
      q: "mlとccは同じですか？",
      a: "同じです。1ml = 1cc = 1cm³で、まったく同量を指します。ccは立方センチメートルの略で、医療や自動車の排気量で使われる表記です。",
    },
    {
      q: "米1合は何mlですか？",
      a: "180.39mlです。計量カップ（200ml）とは違うため、炊飯器付属のカップで水や調味料を量ると1割ほど少なくなります。",
    },
    {
      q: "海外レシピの「1 cup」は何mlですか？",
      a: "米国のカップは約240mlです。日本の計量カップ（200ml）では1.2杯ぶんになります。2割の差があるため、お菓子作りでは換算が必要です。",
    },
    {
      q: "米ガロンと英ガロンはどう違いますか？",
      a: "米ガロンが約3.785L、英ガロンが約4.546Lで、約2割の差があります。燃費表示のMPGも、どちらのガロンかで意味が変わるため注意が必要です。",
    },
    {
      q: "米2合を炊くときの水の量は？",
      a: "米の容量360mlに対して約432ml（1.2倍）が目安です。無洗米は1割ほど多め、新米はやや少なめにしてください。炊飯器の目盛りがある場合はそちらが確実です。",
    },
  ],
};
