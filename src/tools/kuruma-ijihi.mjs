export default {
  category: "money",
  updated: "2026-08-27",
  title: "車の維持費 計算ツール｜年間・月あたりの総額を試算",
  h1: "車の維持費 計算ツール",
  description:
    "税金・保険・車検・ガソリン代・駐車場代を合計して、車の年間維持費と月あたりの負担額を計算します。軽自動車と普通車の比較や、カーシェアとの損益分岐も確認できる無料ツールです。",
  cardText: "税金・車検・保険・燃料費の年間総額を試算。",
  keywords: [
    "車", "維持費", "計算", "年間", "自動車税", "車検", "任意保険", "軽自動車", "ガソリン代",
  ],
  yomi: "くるま いじひ じどうしゃぜい しゃけん",
  related: ["gasoline-dai", "loan-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="type">車種の区分</label>
    <select id="type">
      <option value="kei">軽自動車</option>
      <option value="1000">普通車（〜1000cc）</option>
      <option value="1500" selected>普通車（1000〜1500cc）</option>
      <option value="2000">普通車（1500〜2000cc）</option>
      <option value="2500">普通車（2000〜2500cc）</option>
      <option value="3000">普通車（2500〜3000cc）</option>
    </select>
  </div>
  <div class="field">
    <label for="age">初度登録からの年数</label>
    <input type="number" id="age" inputmode="numeric" value="5" step="1">
    <p class="hint">13年を超えると自動車税と重量税が上がります。</p>
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="distance">年間の走行距離（km）</label>
    <input type="number" id="distance" inputmode="decimal" value="8000" step="1000">
  </div>
  <div class="field">
    <label for="nenpi">燃費（km/L）</label>
    <input type="number" id="nenpi" inputmode="decimal" value="18" step="0.1">
  </div>
  <div class="field">
    <label for="fuelPrice">ガソリン単価（円/L）</label>
    <input type="number" id="fuelPrice" inputmode="decimal" value="175" step="1">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="parking">駐車場代（円/月）</label>
    <input type="number" id="parking" inputmode="decimal" value="10000" step="1000">
  </div>
  <div class="field">
    <label for="hoken">任意保険（円/年）</label>
    <input type="number" id="hoken" inputmode="decimal" value="60000" step="5000">
  </div>
  <div class="field">
    <label for="other">その他（円/年）</label>
    <input type="number" id="other" inputmode="decimal" value="30000" step="5000">
    <p class="hint">タイヤ・オイル交換・洗車など。</p>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">年間の維持費</div>
  <div class="result-main" id="yearVal">-</div>
  <div class="result-grid">
    <div><div class="k">月あたり</div><div class="v" id="monthVal">-</div></div>
    <div><div class="k">1kmあたり</div><div class="v" id="perKmVal">-</div></div>
    <div><div class="k">自動車税（年）</div><div class="v" id="taxVal">-</div></div>
    <div><div class="k">車検の年額換算</div><div class="v" id="shakenVal">-</div></div>
    <div><div class="k">ガソリン代（年）</div><div class="v" id="fuelVal">-</div></div>
    <div><div class="k">駐車場代（年）</div><div class="v" id="parkingVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>内訳</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>項目</th><th>年額</th><th>月換算</th></tr></thead>
    <tbody id="breakdown"></tbody>
  </table>
</div>

<h3>タクシー・カーシェアと比べる</h3>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">同じ費用でタクシーに乗れる距離</div><div class="v" id="taxiVal">-</div></div>
    <div><div class="k">カーシェア（1回3時間）に換算</div><div class="v" id="shareVal">-</div></div>
  </div>
  <p class="result-sub">タクシーは初乗り500円＋1kmあたり400円、カーシェアは3時間で約2,600円として計算しています。</p>
</div>
`,

  script: `
(function () {
  // 自動車税（2019年10月以降の新税率）と重量税の目安
  var TAX = {
    kei: 10800, "1000": 25000, "1500": 30500,
    "2000": 36000, "2500": 43500, "3000": 50000
  };
  // 車検時の重量税（2年分）の目安
  var WEIGHT_TAX = {
    kei: 6600, "1000": 16400, "1500": 24600,
    "2000": 24600, "2500": 32800, "3000": 32800
  };
  // 自賠責保険（24か月）
  var JIBAI = { kei: 17540, other: 17650 };

  ST.live(function () {
    var type = ST.$("type").value;
    var isKei = type === "kei";
    var age = Math.max(0, ST.n(ST.$("age")));

    // 13年超で自動車税は約15%増、重量税も上がる
    var taxRate = age > 13 ? 1.15 : 1;
    var weightRate = age > 18 ? 1.54 : (age > 13 ? 1.39 : 1);

    var tax = Math.round(TAX[type] * taxRate);
    var weight = Math.round(WEIGHT_TAX[type] * weightRate);
    var jibai = isKei ? JIBAI.kei : JIBAI.other;

    // 車検は2年ごと。基本料と整備費を含めて概算する
    var shakenBase = isKei ? 45000 : 60000;
    var shakenTotal = weight + jibai + shakenBase + 1800; // 印紙代
    var shakenPerYear = shakenTotal / 2;

    var dist = Math.max(0, ST.n(ST.$("distance")));
    var nenpi = ST.n(ST.$("nenpi"));
    var fuelPrice = Math.max(0, ST.n(ST.$("fuelPrice")));
    var fuel = nenpi > 0 ? dist / nenpi * fuelPrice : 0;

    var parking = Math.max(0, ST.n(ST.$("parking"))) * 12;
    var hoken = Math.max(0, ST.n(ST.$("hoken")));
    var other = Math.max(0, ST.n(ST.$("other")));

    var rows = [
      ["自動車税（種別割）", tax],
      ["任意保険", hoken],
      ["車検（2年分を年割り）", shakenPerYear],
      ["ガソリン代", fuel],
      ["駐車場代", parking],
      ["タイヤ・オイル・洗車など", other]
    ];
    var total = rows.reduce(function (a, r) { return a + r[1]; }, 0);

    ST.set("yearVal", ST.yen(Math.round(total), 0));
    ST.set("monthVal", ST.yen(Math.round(total / 12), 0));
    ST.set("perKmVal", dist > 0 ? ST.yen(Math.round(total / dist * 10) / 10, 1) : "-");
    ST.set("taxVal", ST.yen(tax, 0));
    ST.set("shakenVal", ST.yen(Math.round(shakenPerYear), 0));
    ST.set("fuelVal", ST.yen(Math.round(fuel), 0));
    ST.set("parkingVal", ST.yen(parking, 0));
    ST.set("detail",
      "車検は2年ごとに約" + ST.yen(Math.round(shakenTotal), 0) + "（重量税 " +
      ST.yen(weight, 0) + " ＋ 自賠責 " + ST.yen(jibai, 0) + " ＋ 基本料・整備費 " +
      ST.yen(shakenBase + 1800, 0) + "）を、年割りで計上しています。" +
      (age > 13 ? "初度登録から13年を超えているため、自動車税と重量税が重くなっています。" : ""));

    ST.$("breakdown").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + ST.yen(Math.round(r[1]), 0) +
        "</td><td>" + ST.yen(Math.round(r[1] / 12), 0) + "</td></tr>";
    }).join("") +
      "<tr><td><b>合計</b></td><td><b>" + ST.yen(Math.round(total), 0) +
      "</b></td><td><b>" + ST.yen(Math.round(total / 12), 0) + "</b></td></tr>";

    // タクシー・カーシェアとの比較
    var taxiKm = (total - 500) / 400;
    ST.set("taxiVal", taxiKm > 0 ? ST.num(Math.round(taxiKm), 0) + " km" : "-");
    ST.set("shareVal", ST.num(Math.floor(total / 2600), 0) + " 回");
  });
})();
`,

  intro: `
車種・走行距離・駐車場代などを入れると、年間と月あたりの維持費が計算されます。**車検を年割りで計上する**ので、2年に1度の大きな支出も含めた実感に近い金額が出ます。
`,

  guide: `
## 維持費の内訳

車にかかる費用は、購入代金とは別に毎年発生します。

| 項目 | 頻度 | 目安（普通車1500cc） |
|---|---|---|
| 自動車税（種別割） | 毎年5月 | 30,500円 |
| 任意保険 | 毎年 | 4〜10万円 |
| 車検 | 2年ごと | 8〜12万円 |
| ガソリン代 | 随時 | 年8,000km・18km/Lで約78,000円 |
| 駐車場代 | 毎月 | 都市部で1〜3万円/月 |
| タイヤ・オイル・洗車 | 随時 | 年2〜5万円 |

合計すると、**普通車で年間40〜60万円、月あたり3.5〜5万円** が一般的な水準です。駐車場代が高い都市部では、これがさらに上がります。

## 自動車税の税額（2019年10月以降の登録車）

| 排気量 | 年税額 |
|---|---|
| 軽自動車 | 10,800円 |
| 〜1000cc | 25,000円 |
| 1000〜1500cc | 30,500円 |
| 1500〜2000cc | 36,000円 |
| 2000〜2500cc | 43,500円 |
| 2500〜3000cc | 50,000円 |

2019年9月以前に登録された車は旧税率で、1500〜2000ccなら39,500円です。

**初度登録から13年を超える** ガソリン車は、自動車税が約15%重くなります（グリーン化特例の重課）。ディーゼル車は11年超が対象です。古い車を維持するときは、この増税を計算に入れてください。

## 車検の費用

車検の費用は「法定費用」と「点検・整備費用」に分かれます。

**法定費用（どこで受けても同じ）**

- 自動車重量税: 車の重さと経過年数で決まる。1.5t以下の普通車で24,600円（2年分）
- 自賠責保険料: 24か月で17,650円（普通車）
- 印紙代: 1,800円前後

**点検・整備費用（業者によって異なる）**

- ディーラー: 6〜10万円
- 整備工場: 4〜7万円
- カー用品店・車検専門店: 3〜6万円

法定費用だけで4.4万円前後かかるため、「車検が3万円」という広告は点検料のみを指しています。総額で比較してください。

## 軽自動車と普通車の差

| 項目 | 軽自動車 | 普通車（1500cc） | 差 |
|---|---|---|---|
| 自動車税 | 10,800円 | 30,500円 | 19,700円 |
| 重量税（2年） | 6,600円 | 24,600円 | 18,000円 |
| 自賠責（2年） | 17,540円 | 17,650円 | 110円 |
| 任意保険 | やや安い | — | 1〜2万円 |
| 燃費 | 良い | — | 走行距離による |

税金だけで年間3万円前後の差があり、燃費と保険料を含めると **年間5〜8万円** ほど軽自動車のほうが安くなります。ただし高速道路を長距離走る機会が多い場合は、車体の安定性や乗り心地の差も考慮が必要です。

## 車を持たない選択との比較

年間維持費が50万円の場合、同じ金額で次のことができます。

- **タクシー**: 約1,250km分（初乗り500円＋1kmあたり400円として）
- **カーシェア**: 約190回（3時間2,600円として）
- **レンタカー**: 週末に約70日分（1日7,000円として）

週に1〜2回しか乗らないのであれば、カーシェアのほうが安く済む計算です。一方、通勤で毎日使う、公共交通機関が少ない地域に住んでいる、小さな子どもがいる、といった場合は所有のほうが合理的です。

判断の目安として、**月の利用が10回（または走行距離500km）を超えるかどうか** が一つの分岐点になります。

## 見落としやすい費用

- **減価償却**: 車体価格の目減り。300万円の車を10年乗って30万円で売れば、年27万円が実質的なコストです。これを含めると維持費は倍近くになります
- **ローンの利息**: 残価設定型クレジットは月々の支払いが安く見えますが、金利は3〜7%と高めです
- **タイヤ交換**: 4本で5〜15万円。3〜5年ごとに必要です
- **バッテリー交換**: 1〜3万円。3〜5年ごと
- **雪国の場合**: スタッドレスタイヤ（4本6〜12万円）とホイールの追加費用
`,

  faq: [
    {
      q: "車の維持費は年間いくらかかりますか？",
      a: "普通車で年間40〜60万円、軽自動車で30〜45万円が目安です。駐車場代が月2万円を超える都市部では、これより10〜20万円高くなります。月あたりでは普通車で3.5〜5万円です。",
    },
    {
      q: "13年超の車は税金がどれくらい上がりますか？",
      a: "自動車税が約15%重くなります。1500ccなら30,500円が35,000円程度になります。重量税も上がり、13年超で約39%、18年超で約54%の増額です。",
    },
    {
      q: "軽自動車と普通車ではどれくらい維持費が違いますか？",
      a: "税金だけで年間3万円前後、燃費と保険料を含めると年間5〜8万円ほど軽自動車のほうが安くなります。",
    },
    {
      q: "カーシェアと所有はどちらが得ですか？",
      a: "月の利用が10回、または走行距離500kmを超えるかが目安です。それ以下ならカーシェアのほうが安くなります。ただし急な用事や荷物の多い移動が多い場合は、所有の利便性が上回ります。",
    },
    {
      q: "車検はどこで受けても同じ費用ですか？",
      a: "違います。重量税・自賠責・印紙代の法定費用（普通車で約4.4万円）はどこでも同じですが、点検整備費はディーラーで6〜10万円、車検専門店で3〜6万円と幅があります。",
    },
  ],
};
