export default {
  category: "health",
  updated: "2026-08-27",
  title: "必要カロリー計算ツール｜1日の摂取目安とPFCバランス",
  h1: "1日に必要なカロリーの計算ツール",
  description:
    "身長・体重・年齢・活動量から、1日に必要なカロリーと基礎代謝を計算します。減量・維持・増量の目標別の摂取量と、タンパク質・脂質・炭水化物の配分も表示する無料ツールです。",
  cardText: "1日の必要カロリーとPFCバランスの目安。",
  keywords: [
    "必要カロリー", "基礎代謝", "計算", "PFC", "ダイエット", "摂取カロリー", "タンパク質", "maintenance",
  ],
  yomi: "かろりー きそたいしゃ",
  related: ["bmi-keisan", "undou-calorie"],

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
    <label for="age">年齢</label>
    <input type="number" id="age" inputmode="numeric" value="35">
  </div>
</div>

<div class="field">
  <span class="field-label">性別</span>
  <div class="pills" id="sex">
    <label><input type="radio" name="sex" value="m" checked>男性</label>
    <label><input type="radio" name="sex" value="f">女性</label>
  </div>
</div>

<div class="field">
  <label for="level">活動レベル</label>
  <select id="level">
    <option value="1.2">ほとんど運動しない（座り仕事中心）</option>
    <option value="1.375">軽い運動（週1〜3回）</option>
    <option value="1.55" selected>中程度（週3〜5回の運動、または立ち仕事）</option>
    <option value="1.725">活発（週6〜7回の運動、肉体労働）</option>
    <option value="1.9">非常に活発（毎日激しい運動、アスリート）</option>
  </select>
</div>

<div class="field">
  <span class="field-label">目標</span>
  <div class="pills" id="goal">
    <label><input type="radio" name="goal" value="cut">減量（月1kg減）</label>
    <label><input type="radio" name="goal" value="keep" checked>体重を維持</label>
    <label><input type="radio" name="goal" value="bulk">増量（月0.5kg増）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">1日の摂取カロリーの目安</div>
  <div class="result-main" id="targetVal">-</div>
  <div class="result-grid">
    <div><div class="k">基礎代謝</div><div class="v" id="bmrVal">-</div></div>
    <div><div class="k">1日の消費カロリー</div><div class="v" id="tdeeVal">-</div></div>
    <div><div class="k">目標との差</div><div class="v" id="diffVal">-</div></div>
    <div><div class="k">1食あたり（3食）</div><div class="v" id="mealVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>PFCバランス（三大栄養素の配分）</h3>
<div class="field">
  <label for="pfc">配分の考え方</label>
  <select id="pfc">
    <option value="15|25|60" selected>標準（P15 : F25 : C60）</option>
    <option value="30|20|50">高タンパク（P30 : F20 : C50）</option>
    <option value="25|20|55">筋トレ向け（P25 : F20 : C55）</option>
    <option value="20|30|50">ゆるい糖質制限（P20 : F30 : C50）</option>
    <option value="25|50|25">ケトジェニック（P25 : F50 : C25）</option>
  </select>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">タンパク質 (P)</div><div class="v" id="pVal">-</div></div>
    <div><div class="k">脂質 (F)</div><div class="v" id="fVal">-</div></div>
    <div><div class="k">炭水化物 (C)</div><div class="v" id="cVal">-</div></div>
    <div><div class="k">体重1kgあたりのP</div><div class="v" id="pPerKgVal">-</div></div>
  </div>
  <p class="result-sub" id="pfcDetail"></p>
</div>
`,

  script: `
(function () {
  // ハリス・ベネディクト方程式（改訂版）による基礎代謝の推定
  function bmr(sex, w, h, age) {
    if (sex === "m") return 13.397 * w + 4.799 * h - 5.677 * age + 88.362;
    return 9.247 * w + 3.098 * h - 4.330 * age + 447.593;
  }

  function clear(msg) {
    ["targetVal","bmrVal","tdeeVal","diffVal","mealVal","pVal","fVal","cVal","pPerKgVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.set("pfcDetail", "");
  }

  ST.live(function () {
    var h = ST.n(ST.$("height"));
    var w = ST.n(ST.$("weight"));
    var age = ST.n(ST.$("age"));
    if (h <= 0 || w <= 0 || age <= 0) return clear("身長・体重・年齢を入力してください。");
    if (h > 300 || w > 700 || age > 130) return clear("入力値を確認してください。");

    var base = bmr(ST.pick("sex"), w, h, age);
    var level = Number(ST.$("level").value) || 1.55;
    var tdee = base * level;

    // 体脂肪1kg = 約7200kcal。月1kg減なら1日あたり240kcalの赤字。
    var goal = ST.pick("goal");
    var adjust = goal === "cut" ? -7200 / 30 : (goal === "bulk" ? 3600 / 30 : 0);
    var target = tdee + adjust;

    // 基礎代謝を下回る設定は危険なので、その場合は警告を出す
    var warn = target < base
      ? "この設定では摂取カロリーが基礎代謝を下回ります。筋肉量の減少や体調不良につながるため、活動量を増やして差を作るほうが安全です。"
      : "";

    var labels = { cut: "減量ペース 月1kg減の目安", keep: "体重を維持する目安", bulk: "増量ペース 月0.5kg増の目安" };
    ST.$("mainLabel").textContent = labels[goal];
    ST.set("targetVal", ST.num(Math.round(target), 0) + " kcal");
    ST.set("bmrVal", ST.num(Math.round(base), 0) + " kcal");
    ST.set("tdeeVal", ST.num(Math.round(tdee), 0) + " kcal");
    ST.set("diffVal", (adjust === 0 ? "±0" : (adjust > 0 ? "+" : "") + ST.num(Math.round(adjust), 0)) + " kcal");
    ST.set("mealVal", ST.num(Math.round(target / 3), 0) + " kcal");
    ST.set("detail", "基礎代謝 " + ST.num(Math.round(base), 0) + "kcal × 活動レベル " +
      level + " = 1日の消費 " + ST.num(Math.round(tdee), 0) + "kcal。" + warn);

    // PFC
    var p = ST.$("pfc").value.split("|").map(Number);
    var pKcal = target * p[0] / 100;
    var fKcal = target * p[1] / 100;
    var cKcal = target * p[2] / 100;
    // タンパク質4kcal/g、脂質9kcal/g、炭水化物4kcal/g
    var pG = pKcal / 4, fG = fKcal / 9, cG = cKcal / 4;

    ST.set("pVal", ST.num(Math.round(pG), 0) + " g");
    ST.set("fVal", ST.num(Math.round(fG), 0) + " g");
    ST.set("cVal", ST.num(Math.round(cG), 0) + " g");
    ST.set("pPerKgVal", ST.num(pG / w, 2) + " g/kg");
    ST.set("pfcDetail", "タンパク質と炭水化物は1gあたり4kcal、脂質は9kcalで換算しています。" +
      "内訳は P " + ST.num(Math.round(pKcal), 0) + "kcal / F " + ST.num(Math.round(fKcal), 0) +
      "kcal / C " + ST.num(Math.round(cKcal), 0) + "kcal です。");
  });
})();
`,

  intro: `
身長・体重・年齢・活動量から、1日に必要なカロリーを計算します。減量・維持・増量の目標に応じた摂取量と、タンパク質・脂質・炭水化物の配分も同時に出ます。
`,

  guide: `
## 2つのカロリーの違い

| 用語 | 意味 |
|---|---|
| **基礎代謝（BMR）** | 何もせず横になっていても消費するエネルギー。呼吸・体温維持・内臓の活動 |
| **1日の消費カロリー（TDEE）** | 基礎代謝に日常の活動や運動を足した総量 |

体重を管理するときに基準にするのは **TDEE** のほうです。摂取カロリーがTDEEを下回れば体重は減り、上回れば増えます。

このツールはハリス・ベネディクトの式（改訂版）で基礎代謝を推定し、活動レベルの係数を掛けてTDEEを求めています。

## 活動レベルの選び方

| 係数 | 目安 |
|---|---|
| 1.2 | 座り仕事中心。運動の習慣がない |
| 1.375 | 週1〜3回の軽い運動 |
| 1.55 | 週3〜5回の運動、または立ち仕事 |
| 1.725 | 週6〜7回の運動、肉体労働 |
| 1.9 | 1日2回のトレーニング、アスリート |

**多くの人は自分の活動量を高く見積もりがち** です。デスクワーク中心で週2回ジムに行く程度なら1.375、通勤で毎日30分歩き週3回運動するなら1.55が実態に近い値です。計算より体重が減らない場合は、1段階下げて再計算してみてください。

## 減量のペース

体脂肪1kgは約7,200kcalに相当します。

- **月1kg減**: 1日あたり240kcalの赤字
- **月2kg減**: 1日あたり480kcalの赤字
- **月0.5kg減**: 1日あたり120kcalの赤字

急激な減量は筋肉量の減少を招き、基礎代謝が下がって元に戻りやすくなります。一般に **1か月に体重の3〜5%まで** が安全な範囲とされています。体重60kgなら月2〜3kgが上限です。

**摂取カロリーを基礎代謝より下げるのは避けてください。** 体は消費を抑えるモードに入り、筋肉を分解してエネルギーを作るようになります。差を作るなら、食事を減らすより活動量を増やすほうが安全です。

## PFCバランスとは

三大栄養素をどの割合で摂るかの配分です。それぞれの頭文字から PFC と呼ばれます。

| 栄養素 | 1gあたり | 主な働き |
|---|---|---|
| **P**rotein（タンパク質） | 4 kcal | 筋肉・臓器・髪・爪の材料 |
| **F**at（脂質） | 9 kcal | ホルモンの材料、脂溶性ビタミンの吸収 |
| **C**arbohydrate（炭水化物） | 4 kcal | 主なエネルギー源、脳の燃料 |

厚生労働省の「日本人の食事摂取基準」では、タンパク質13〜20%、脂質20〜30%、炭水化物50〜65%が目標範囲とされています。

### タンパク質の目安

体重1kgあたりの必要量は、活動量によって変わります。

| 状況 | 体重1kgあたり |
|---|---|
| 運動しない成人 | 0.8〜1.0g |
| 適度に運動する人 | 1.2〜1.4g |
| 筋力トレーニングをする人 | 1.6〜2.0g |
| 減量中（筋肉を守りたい） | 1.6〜2.2g |

体重60kgで筋トレをしている場合、1日96〜120gが目安です。これは鶏むね肉なら約500g、卵なら15個分に相当します。1食で吸収できる量には限りがあるため、3食に分けて摂るほうが効率的です。

### 脂質を減らしすぎない

カロリーが高いため最初に削られがちですが、脂質はホルモンの材料であり、不足すると体調を崩します。**総カロリーの20%は下回らない** ようにしてください。体重60kgで2,000kcalなら、最低でも44g程度は必要です。

## 数字だけで判断しないこと

計算式による推定値には、次のような限界があります。

- **個人差**: 同じ体格でも基礎代謝は10〜20%変わります
- **体組成を反映しない**: 筋肉量の多い人は実際の代謝がもっと高くなります
- **適応が起きる**: 減量を続けると体が省エネモードになり、消費が下がります

2週間ほど記録をつけて、体重の変化が計算どおりでなければ、摂取量を100〜200kcal単位で調整していくのが実践的です。

> このツールの数値は一般的な計算式による目安であり、診断や栄養指導ではありません。持病がある方や、大幅な食事の変更を考えている方は、医師や管理栄養士にご相談ください。
`,

  faq: [
    {
      q: "基礎代謝と1日の消費カロリーは何が違いますか？",
      a: "基礎代謝は何もせず横になっていても消費するエネルギーで、1日の消費カロリー（TDEE）はそれに日常の活動や運動を加えた総量です。体重管理の基準にするのはTDEEのほうです。",
    },
    {
      q: "活動レベルはどれを選べばいいですか？",
      a: "多くの人は高く見積もりがちです。デスクワーク中心で週2回運動する程度なら1.375、毎日通勤で歩き週3回運動するなら1.55が目安です。計算どおりに体重が変化しない場合は、1段階下げて試してください。",
    },
    {
      q: "1か月に何キロまで減らして大丈夫ですか？",
      a: "体重の3〜5%までが安全な範囲とされています。体重60kgなら月2〜3kgです。それ以上のペースでは筋肉量が減り、基礎代謝が下がってリバウンドしやすくなります。",
    },
    {
      q: "PFCバランスはどう決めればいいですか？",
      a: "厚生労働省の基準ではタンパク質13〜20%、脂質20〜30%、炭水化物50〜65%が目標です。筋トレをしている場合はタンパク質を体重1kgあたり1.6〜2.0gに増やし、その分を炭水化物から調整します。",
    },
    {
      q: "摂取カロリーを基礎代謝より低くしてもいいですか？",
      a: "避けてください。体が消費を抑えるモードに入り、筋肉を分解してエネルギーを作るようになります。減量の差を作るなら、食事を減らすより運動量を増やすほうが安全です。",
    },
  ],
};
