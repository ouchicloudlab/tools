export default {
  category: "health",
  updated: "2026-08-27",
  title: "体型指標の計算｜体脂肪率・ウエスト身長比で判定",
  h1: "体型指標の計算ツール",
  description:
    "ウエスト身長比や体脂肪率から体型を判定します。BMIでは分からない内臓脂肪の目安や、除脂肪体重・適正なウエストの計算にも対応した無料ツールです。",
  cardText: "ウエスト身長比・体脂肪率から体型を判定。",
  keywords: [
    "体脂肪率", "ウエスト", "計算", "内臓脂肪", "メタボ", "体型", "除脂肪体重", "判定", "腹囲",
  ],
  related: ["bmi-keisan", "calorie-hitsuyo"],

  ui: `
<div class="row">
  <div class="field">
    <label for="height">身長（cm）</label>
    <input type="number" id="height" inputmode="decimal" value="170" step="0.1">
  </div>
  <div class="field">
    <label for="weight">体重（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="65" step="0.1">
  </div>
  <div class="field">
    <label for="waist">ウエスト・へそ回り（cm）</label>
    <input type="number" id="waist" inputmode="decimal" value="80" step="0.5">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="fat">体脂肪率（%・分かれば）</label>
    <input type="number" id="fat" inputmode="decimal" value="20" step="0.1">
  </div>
  <div class="field">
    <span class="field-label">性別</span>
    <div class="pills" id="sex">
      <label><input type="radio" name="sex" value="m" checked>男性</label>
      <label><input type="radio" name="sex" value="f">女性</label>
    </div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">ウエスト身長比（WHtR）</div>
  <div class="result-main" id="whtrVal">-</div>
  <div class="result-grid">
    <div><div class="k">判定</div><div class="v" id="whtrJudge">-</div></div>
    <div><div class="k">メタボの腹囲基準</div><div class="v" id="metaboVal">-</div></div>
    <div><div class="k">目標のウエスト</div><div class="v" id="targetWaistVal">-</div></div>
    <div><div class="k">BMI</div><div class="v" id="bmiVal">-</div></div>
    <div><div class="k">体脂肪の重さ</div><div class="v" id="fatKgVal">-</div></div>
    <div><div class="k">除脂肪体重（筋肉・骨など）</div><div class="v" id="leanVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>体脂肪率の判定</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>区分</th><th>男性</th><th>女性</th><th>判定</th></tr></thead>
    <tbody id="fatTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // [区分, 男性の上限, 女性の上限]
  var FAT = [
    ["やせ", 10, 20],
    ["標準（−）", 16, 25],
    ["標準（＋）", 20, 30],
    ["軽度肥満", 25, 35],
    ["肥満", Infinity, Infinity]
  ];

  ST.live(function () {
    var h = ST.n(ST.$("height"));
    var w = ST.n(ST.$("weight"));
    var waist = ST.n(ST.$("waist"));
    var fat = ST.n(ST.$("fat"));
    var isMale = ST.pick("sex") === "m";

    if (h <= 0 || w <= 0) {
      ["whtrVal","whtrJudge","metaboVal","targetWaistVal","bmiVal","fatKgVal","leanVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "身長と体重を入力してください。");
      ST.$("fatTable").innerHTML = "";
      return;
    }

    var m = h / 100;
    var bmi = w / (m * m);

    // ウエスト身長比。0.5未満が目安とされる
    var whtr = waist > 0 ? waist / h : 0;
    var whtrJudge = whtr === 0 ? "—"
      : (whtr < 0.4 ? "低い（やせすぎの可能性）"
        : whtr < 0.5 ? "適正"
          : whtr < 0.6 ? "やや高い（要注意）" : "高い（改善が望ましい）");

    // メタボリックシンドロームの腹囲基準
    var metaboLimit = isMale ? 85 : 90;
    var metaboJudge = waist <= 0 ? "—"
      : (waist >= metaboLimit
        ? "基準（" + metaboLimit + "cm）以上"
        : "基準内（あと " + ST.num(metaboLimit - waist, 1) + "cm の余裕）");

    var fatKg = fat > 0 ? w * fat / 100 : 0;
    var lean = fat > 0 ? w - fatKg : 0;

    ST.set("whtrVal", whtr > 0 ? ST.num(whtr, 3) : "—");
    ST.set("whtrJudge", whtrJudge);
    ST.set("metaboVal", metaboJudge);
    ST.set("targetWaistVal", ST.num(h * 0.5, 1) + " cm 未満");
    ST.set("bmiVal", ST.num(bmi, 1));
    ST.set("fatKgVal", fat > 0 ? ST.num(fatKg, 1) + " kg" : "—");
    ST.set("leanVal", fat > 0 ? ST.num(lean, 1) + " kg" : "—");

    ST.set("detail",
      (whtr > 0
        ? "ウエスト " + ST.num(waist, 1) + "cm ÷ 身長 " + ST.num(h, 1) + "cm = " +
          ST.num(whtr, 3) + "。0.5未満が目安とされています。"
        : "ウエストを入力すると、内臓脂肪の目安が分かります。") +
      "BMIは身長と体重だけの指標なので、体型の判断にはウエスト身長比とあわせて見てください。");

    // 体脂肪率の表
    var prevM = 0, prevF = 0;
    ST.$("fatTable").innerHTML = FAT.map(function (r) {
      var mLabel = r[1] === Infinity ? prevM + "% 以上" :
        (prevM === 0 ? r[1] + "% 未満" : prevM + "〜" + r[1] + "%");
      var fLabel = r[2] === Infinity ? prevF + "% 以上" :
        (prevF === 0 ? r[2] + "% 未満" : prevF + "〜" + r[2] + "%");
      var limit = isMale ? r[1] : r[2];
      var prev = isMale ? prevM : prevF;
      var hit = fat > 0 && fat >= prev && fat < limit;
      prevM = r[1]; prevF = r[2];
      return "<tr" + (hit ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + r[0] + "</td><td>" + mLabel + "</td><td>" + fLabel + "</td><td>" +
        (hit ? "← あなた" : "") + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
BMIだけでは分からない体型の指標を計算します。**ウエスト身長比（WHtR）** は内臓脂肪との関係が強く、BMIより健康リスクを反映しやすいとされる指標です。
`,

  guide: `
## ウエスト身長比（WHtR）

> **WHtR = ウエスト(cm) ÷ 身長(cm)**

**0.5未満** が目安とされています。言い換えると、**ウエストが身長の半分未満に収まっていればよい** ということです。身長170cmなら85cm未満が目標になります。

BMIと違い、脂肪がどこについているかを反映します。同じBMIでも、腹部に脂肪が集中している人（内臓脂肪型）のほうが、生活習慣病のリスクが高いことが知られています。

| WHtR | 判定 |
|---|---|
| 0.4未満 | 低い（やせすぎの可能性） |
| 0.4〜0.5 | **適正** |
| 0.5〜0.6 | やや高い |
| 0.6以上 | 高い |

覚えやすく、子どもから高齢者まで同じ基準で使えるのが利点です。近年は「BMIより有用」とする研究も増えています。

## メタボリックシンドロームの腹囲基準

日本の特定健診では、次の腹囲が基準になっています。

| 性別 | 基準 |
|---|---|
| 男性 | **85cm以上** |
| 女性 | **90cm以上** |

女性のほうが基準が緩いのは、皮下脂肪の割合が高く、同じ腹囲でも内臓脂肪面積が小さい傾向があるためです。この数値は、内臓脂肪面積100cm²に相当する腹囲として設定されました。

**腹囲だけでメタボと判定されるわけではありません。** この基準を超えたうえで、次の3項目のうち2つ以上に該当する場合に該当します。

- 血圧: 収縮期130mmHg以上 または 拡張期85mmHg以上
- 血糖: 空腹時血糖110mg/dL以上
- 脂質: 中性脂肪150mg/dL以上 または HDLコレステロール40mg/dL未満

## 腹囲の測り方

- **へその高さで水平に測る**（ウエストの最も細い部分ではありません）
- **息を軽く吐いた状態** で測る
- 立った姿勢で、メジャーが床と平行になるようにする
- 食後や飲酒後は避ける

服の上から測ると2〜3cm大きく出ます。ズボンのサイズ表記（W32など）とは測る位置が違うため、そのまま使えません。

## 体脂肪率の目安

| 区分 | 男性 | 女性 |
|---|---|---|
| やせ | 10%未満 | 20%未満 |
| 標準（−） | 10〜16% | 20〜25% |
| 標準（＋） | 16〜20% | 25〜30% |
| 軽度肥満 | 20〜25% | 30〜35% |
| 肥満 | 25%以上 | 35%以上 |

女性の基準が高いのは、生理機能の維持に一定量の体脂肪が必要なためです。女性が体脂肪率を15%以下まで落とすと、月経が止まるなどの影響が出ることがあります。

## 家庭用の体組成計の精度

家庭用の機器は、体に微弱な電流を流して抵抗値から体脂肪率を推定しています（生体電気インピーダンス法）。手軽ですが、**体内の水分量に大きく左右されます**。

- 起床直後: 脱水気味で体脂肪率が高く出る
- 入浴後: 水分の分布が変わり低く出る
- 運動後・飲酒後: 数値が乱れる

そのため、**絶対値より変化の傾向を見る** ほうが有用です。測定条件を揃えて（毎日同じ時間・同じ状態）記録すれば、増減の方向は信頼できます。

## 除脂肪体重（LBM）

> **除脂肪体重 = 体重 − 体脂肪の重さ**

筋肉・骨・内臓・水分の合計です。ダイエット中にこの数値が減っている場合、脂肪だけでなく筋肉も落ちていることを意味します。

体重だけを追うと、筋肉が減っただけの「減量成功」を喜んでしまいます。体重と体脂肪率の両方を記録し、**除脂肪体重を維持したまま体重を落とす** のが理想的な減量です。

そのためには、十分なタンパク質（体重1kgあたり1.6〜2.0g）と、筋力トレーニングを組み合わせることが有効とされています。

> このツールの数値は一般的な基準による目安であり、診断ではありません。健診の結果や体調について不安がある場合は、医療機関にご相談ください。
`,

  faq: [
    {
      q: "ウエスト身長比はいくつが目安ですか？",
      a: "0.5未満です。ウエストが身長の半分未満に収まっていればよい、という覚えやすい基準で、身長170cmなら85cm未満が目標になります。",
    },
    {
      q: "BMIとウエスト身長比はどちらが正確ですか？",
      a: "内臓脂肪のリスクを見るならウエスト身長比のほうが反映しやすいとされています。BMIは身長と体重だけの指標で、脂肪がどこにあるかを区別できません。両方あわせて見るのが確実です。",
    },
    {
      q: "腹囲はどこで測りますか？",
      a: "へその高さで水平に測ります。ウエストの最も細い部分ではありません。息を軽く吐いた状態で、立ったまま測ってください。服の上から測ると2〜3cm大きく出ます。",
    },
    {
      q: "腹囲が基準を超えたらメタボですか？",
      a: "腹囲だけでは判定されません。基準（男性85cm・女性90cm）を超えたうえで、血圧・血糖・脂質のうち2つ以上が基準値を外れた場合に該当します。",
    },
    {
      q: "体組成計の体脂肪率はどこまで信用できますか？",
      a: "体内の水分量に左右されるため、絶対値の精度は高くありません。起床直後は高く、入浴後は低く出ます。毎日同じ時間・同じ条件で測り、変化の傾向を見るのが有用な使い方です。",
    },
  ],
};
