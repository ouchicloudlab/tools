export default {
  category: "unit",
  updated: "2026-08-27",
  title: "温度・重さの変換ツール｜華氏摂氏とポンドキロを同時に換算",
  h1: "温度・重さの変換ツール",
  description:
    "摂氏と華氏、ポンドとキログラムを相互に変換します。海外のレシピやオーブンの温度設定、海外通販の重量表記を日本の単位に直したいときに使える無料ツールです。",
  cardText: "℃⇔℉、ポンド・オンス⇔kg・gを換算。",
  keywords: [
    "華氏", "摂氏", "温度", "変換", "ポンド", "オンス", "kg", "重さ", "℉", "℃",
  ],
  related: ["inch-cm", "osaji-kosaji"],

  ui: `
<h3 style="margin-top:0">温度</h3>
<div class="row">
  <div class="field">
    <label for="celsius">摂氏（℃）</label>
    <input type="number" id="celsius" inputmode="decimal" value="180" step="0.1">
  </div>
  <div class="field">
    <label for="fahrenheit">華氏（℉）</label>
    <input type="number" id="fahrenheit" inputmode="decimal" value="356" step="0.1">
  </div>
  <div class="field">
    <label for="kelvin">ケルビン（K）</label>
    <input type="number" id="kelvin" inputmode="decimal" value="453.15" step="0.1">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="tempVal" style="font-size:24px">-</div>
  <p class="result-sub" id="tempDetail"></p>
</div>

<h3>重さ</h3>
<div class="row">
  <div class="field">
    <label for="kg">キログラム（kg）</label>
    <input type="number" id="kg" inputmode="decimal" value="1" step="0.001">
  </div>
  <div class="field">
    <label for="gram">グラム（g）</label>
    <input type="number" id="gram" inputmode="decimal" value="1000" step="1">
  </div>
</div>
<div class="row">
  <div class="field">
    <label for="pound">ポンド（lb）</label>
    <input type="number" id="pound" inputmode="decimal" value="2.20462" step="0.001">
  </div>
  <div class="field">
    <label for="ounce">オンス（oz）</label>
    <input type="number" id="ounce" inputmode="decimal" value="35.274" step="0.01">
  </div>
  <div class="field">
    <label for="kan">貫</label>
    <input type="number" id="kan" inputmode="decimal" value="0.2667" step="0.001">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">キログラム</div><div class="v" id="rKg">-</div></div>
    <div><div class="k">ポンド</div><div class="v" id="rLb">-</div></div>
    <div><div class="k">オンス</div><div class="v" id="rOz">-</div></div>
    <div><div class="k">斤（食パン）</div><div class="v" id="rKin">-</div></div>
  </div>
  <p class="result-sub" id="weightDetail"></p>
</div>
`,

  script: `
(function () {
  var lockT = false, lockW = false;

  // ---- 温度 ----
  function renderTemp(c, from) {
    var f = c * 9 / 5 + 32;
    var k = c + 273.15;
    lockT = true;
    if (from !== "celsius") ST.$("celsius").value = Math.round(c * 1000) / 1000;
    if (from !== "fahrenheit") ST.$("fahrenheit").value = Math.round(f * 1000) / 1000;
    if (from !== "kelvin") ST.$("kelvin").value = Math.round(k * 1000) / 1000;
    lockT = false;

    ST.set("tempVal", ST.num(c, 1) + " ℃ = " + ST.num(f, 1) + " ℉ = " + ST.num(k, 2) + " K");

    var note = "";
    if (c <= -273.15) note = "絶対零度（-273.15℃）より低い温度は存在しません。";
    else if (c <= 0) note = "水が凍る温度です。";
    else if (c >= 100) note = "水が沸騰する温度（1気圧）を超えています。";
    else if (c >= 36 && c <= 37.5) note = "人の平熱に近い温度です。";
    ST.set("tempDetail", "換算式: ℉ = ℃ × 9 ÷ 5 + 32、℃ = (℉ − 32) × 5 ÷ 9。" + note);
  }

  ST.$("celsius").addEventListener("input", function () {
    if (!lockT) renderTemp(ST.n(ST.$("celsius")), "celsius");
  });
  ST.$("fahrenheit").addEventListener("input", function () {
    if (!lockT) renderTemp((ST.n(ST.$("fahrenheit")) - 32) * 5 / 9, "fahrenheit");
  });
  ST.$("kelvin").addEventListener("input", function () {
    if (!lockT) renderTemp(ST.n(ST.$("kelvin")) - 273.15, "kelvin");
  });

  // ---- 重さ ----
  var LB = 0.45359237;      // 1ポンド = 0.45359237 kg（定義値）
  var OZ = LB / 16;         // 1オンス = 1/16 ポンド
  var KAN = 3.75;           // 1貫 = 3.75 kg
  var KIN = 0.34;           // 食パン1斤 = 340g（表示上の下限）

  function renderWeight(kg, from) {
    lockW = true;
    if (from !== "kg") ST.$("kg").value = Math.round(kg * 100000) / 100000;
    if (from !== "gram") ST.$("gram").value = Math.round(kg * 1000 * 1000) / 1000;
    if (from !== "pound") ST.$("pound").value = Math.round(kg / LB * 100000) / 100000;
    if (from !== "ounce") ST.$("ounce").value = Math.round(kg / OZ * 10000) / 10000;
    if (from !== "kan") ST.$("kan").value = Math.round(kg / KAN * 100000) / 100000;
    lockW = false;

    ST.set("rKg", ST.num(kg, 4) + " kg");
    ST.set("rLb", ST.num(kg / LB, 4) + " lb");
    ST.set("rOz", ST.num(kg / OZ, 3) + " oz");
    ST.set("rKin", ST.num(kg / KIN, 2) + " 斤");
    ST.set("weightDetail", "1ポンド = 0.45359237kg（定義値）、1オンス = 1/16ポンド ≒ 28.35g、" +
      "1貫 = 3.75kg です。");
  }

  var W = [["kg", 1], ["gram", 0.001], ["pound", LB], ["ounce", OZ], ["kan", KAN]];
  W.forEach(function (pair) {
    ST.$(pair[0]).addEventListener("input", function () {
      if (!lockW) renderWeight(ST.n(ST.$(pair[0])) * pair[1], pair[0]);
    });
  });

  renderTemp(ST.n(ST.$("celsius")), "celsius");
  renderWeight(ST.n(ST.$("kg")), "kg");
})();
`,

  intro: `
海外のレシピやオーブンの温度、海外通販の重量表記を日本の単位に直せます。どの欄に入力しても、ほかの単位が同時に計算されます。
`,

  guide: `
## 温度の換算式

> **℉ = ℃ × 9 ÷ 5 + 32**
> **℃ = (℉ − 32) × 5 ÷ 9**

華氏（ファーレンハイト）はアメリカで日常的に使われている温度の単位です。水が凍る温度を32℉、沸騰する温度を212℉としており、その間を180等分しています。摂氏では0℃から100℃までの100等分なので、**1℃の変化は1.8℉の変化** にあたります。

暗算の目安としては、**「℉から30を引いて半分にする」** と、おおよその℃が出ます。

- 70℉ → (70 − 30) ÷ 2 = 20℃（正確には21.1℃）
- 90℉ → (90 − 30) ÷ 2 = 30℃（正確には32.2℃）

日常の気温の範囲なら、この方法で2℃以内の誤差に収まります。

## 覚えておくと便利な温度

| 摂氏 | 華氏 | 何の温度か |
|---|---|---|
| -40℃ | -40℉ | 摂氏と華氏が一致する唯一の点 |
| 0℃ | 32℉ | 水が凍る |
| 20℃ | 68℉ | 快適な室温 |
| 37℃ | 98.6℉ | 人の平熱 |
| 100℃ | 212℉ | 水が沸騰する（1気圧） |
| 160℃ | 320℉ | 低温のオーブン |
| 180℃ | 356℉ | お菓子作りの標準 |
| 200℃ | 392℉ | 高温のオーブン |
| 230℃ | 446℉ | ピザを焼く温度 |

海外のレシピで「Bake at 350°F」とあれば、約177℃です。日本のオーブンは10℃刻みが多いので、180℃に設定すれば問題ありません。

## ケルビンについて

ケルビン（K）は熱力学温度の単位で、分子の運動が完全に止まる **絶対零度（-273.15℃）を0K** としています。目盛りの幅は摂氏と同じなので、変換は足し引きだけです。

> **K = ℃ + 273.15**

照明の「電球色2700K」「昼白色5000K」という表記もケルビンですが、こちらは色温度といって、温度そのものではなく光の色みを表しています。数字が小さいほど赤みがかった暖かい色、大きいほど青白い色になります。

## 重さの換算

> **1ポンド(lb) = 0.45359237 kg（定義値）**
> **1オンス(oz) = 1/16ポンド ≒ 28.35 g**

暗算では **ポンドに0.45を掛ける**、または **半分にして少し足す** と近い値になります。150ポンドなら約68kgです。

| ポンド | キログラム |
|---|---|
| 1 lb | 0.45 kg |
| 5 lb | 2.27 kg |
| 10 lb | 4.54 kg |
| 50 lb | 22.7 kg |
| 100 lb | 45.4 kg |
| 150 lb | 68.0 kg |
| 200 lb | 90.7 kg |

なお、貴金属や宝石に使われる「トロイオンス」は約31.1gで、通常のオンス（28.35g）とは別物です。金の価格が「1トロイオンスあたり」で表示されるのはこのためです。

## 日本の重さの単位

| 単位 | メートル法 | 使われる場面 |
|---|---|---|
| 1匁（もんめ） | 3.75 g | 真珠の取引 |
| 1斤（きん） | 600 g | 本来の尺貫法の単位 |
| 1貫（かん） | 3.75 kg | 1000匁。相撲や農業 |

食パンの「1斤」は尺貫法の斤（600g）とは異なり、**340g以上** と定められた業界基準です（公正競争規約）。輸入品のパンを1ポンド（約450g）で売っていた名残とされ、実際の製品は340〜400g程度が主流です。このツールでは340gを1斤として計算しています。
`,

  faq: [
    {
      q: "華氏から摂氏を暗算する方法はありますか？",
      a: "「30を引いて半分にする」と近い値になります。70℉なら (70−30)÷2 = 20℃（正確には21.1℃）です。日常の気温の範囲なら2℃以内の誤差に収まります。",
    },
    {
      q: "海外レシピの350°Fは何度ですか？",
      a: "約177℃です。日本のオーブンは10℃刻みが多いため、180℃に設定してください。400°Fなら約204℃で、200℃設定が目安になります。",
    },
    {
      q: "摂氏と華氏が同じ数字になることはありますか？",
      a: "-40度のときだけ一致します。-40℃ = -40℉です。これ以外の温度では必ず異なる数字になります。",
    },
    {
      q: "1ポンドは何キロですか？",
      a: "0.45359237kgです。おおよそ0.45kgと覚えておけば十分で、150ポンドなら約68kgになります。",
    },
    {
      q: "食パン1斤は何グラムですか？",
      a: "業界の基準では340g以上と定められており、実際の製品は340〜400g程度です。尺貫法の斤（600g）とは異なる基準なので注意してください。",
    },
  ],
};
