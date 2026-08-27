export default {
  category: "health",
  updated: "2026-08-27",
  title: "水分摂取量の目安｜体重から1日に必要な量を計算",
  h1: "1日に必要な水分量の計算ツール",
  description:
    "体重・年齢・運動量から、1日に必要な水分の目安を計算します。食事から摂れる分を差し引いた「飲むべき量」と、こまめに飲む場合の1回分も表示する無料ツールです。",
  cardText: "体重から1日に飲むべき水分量を計算。",
  keywords: [
    "水分", "摂取量", "目安", "1日", "何リットル", "水", "脱水", "熱中症", "計算",
  ],
  related: ["calorie-hitsuyo", "bmi-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="weight">体重（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="60" step="0.5">
  </div>
  <div class="field">
    <label for="age">年齢</label>
    <input type="number" id="age" inputmode="numeric" value="35">
  </div>
  <div class="field">
    <label for="exercise">運動した時間（分/日）</label>
    <input type="number" id="exercise" inputmode="numeric" value="0" step="15">
  </div>
</div>

<div class="field">
  <span class="field-label">環境</span>
  <div class="pills" id="env">
    <label><input type="radio" name="env" value="normal" checked>通常</label>
    <label><input type="radio" name="env" value="hot">暑い（夏・屋外）</label>
    <label><input type="radio" name="env" value="dry">乾燥（冬・暖房）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">1日に飲む水分の目安</div>
  <div class="result-main" id="drinkVal">-</div>
  <div class="result-grid">
    <div><div class="k">体が必要とする総量</div><div class="v" id="totalVal">-</div></div>
    <div><div class="k">食事から摂れる分</div><div class="v" id="foodVal">-</div></div>
    <div><div class="k">体内で作られる水</div><div class="v" id="metaVal">-</div></div>
    <div><div class="k">コップ（200ml）で</div><div class="v" id="cupVal">-</div></div>
    <div><div class="k">1回あたり（6回に分けて）</div><div class="v" id="perVal">-</div></div>
    <div><div class="k">ペットボトル（500ml）で</div><div class="v" id="bottleVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>飲むタイミングの目安</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>タイミング</th><th>量の目安</th><th>理由</th></tr></thead>
    <tbody id="timingTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  ST.live(function () {
    var w = ST.n(ST.$("weight"));
    var age = ST.n(ST.$("age"));
    var ex = Math.max(0, ST.n(ST.$("exercise")));
    var env = ST.pick("env");

    if (w <= 0 || age <= 0) {
      ["drinkVal","totalVal","foodVal","metaVal","cupVal","perVal","bottleVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "体重と年齢を入力してください。");
      ST.$("timingTable").innerHTML = "";
      return;
    }

    // 年齢帯ごとの体重1kgあたりの必要量（ml）。
    // 体重60kgの成人でおよそ2,400ml（総量2,500mlの一般的な目安）になる係数。
    var perKg = age < 30 ? 45 : (age < 56 ? 40 : 35);
    var total = w * perKg;

    // 環境による追加
    if (env === "hot") total *= 1.15;
    else if (env === "dry") total *= 1.05;

    // 運動で失う分（発汗）。30分あたり約500ml
    var sweat = ex / 30 * 500;
    total += sweat;

    // 食事から約1000ml、代謝水として約300mlを得ている
    var food = 1000;
    var meta = 300;
    var drink = Math.max(0, total - food - meta);

    ST.set("drinkVal", ST.num(Math.round(drink / 10) * 10, 0) + " ml");
    ST.set("totalVal", ST.num(Math.round(total / 10) * 10, 0) + " ml");
    ST.set("foodVal", ST.num(food, 0) + " ml");
    ST.set("metaVal", ST.num(meta, 0) + " ml");
    ST.set("cupVal", ST.num(drink / 200, 1) + " 杯");
    ST.set("perVal", ST.num(Math.round(drink / 6 / 10) * 10, 0) + " ml");
    ST.set("bottleVal", ST.num(drink / 500, 1) + " 本");
    ST.set("detail",
      age + "歳では体重1kgあたり約" + perKg + "mlが目安です（" +
      ST.num(w, 1) + "kg × " + perKg + "ml = " + ST.num(Math.round(w * perKg), 0) + "ml）。" +
      (sweat > 0 ? "運動" + ex + "分ぶんとして約" + ST.num(Math.round(sweat), 0) + "mlを加算。" : "") +
      "ここから食事に含まれる水分と代謝水を差し引いた量が、実際に飲む目安になります。");

    var unit = Math.round(drink / 6 / 10) * 10;
    var rows = [
      ["起床時", unit + " ml", "睡眠中に失った水分を補う"],
      ["朝食時", "コップ1杯", "食事とあわせて"],
      ["午前中", unit + " ml", "こまめに分けて"],
      ["昼食時", "コップ1杯", "食事とあわせて"],
      ["午後", unit + " ml", "集中力の維持にも関係する"],
      ["入浴前後", "各 " + unit + " ml", "入浴で約800ml失われる"],
      ["就寝前", unit + " ml", "夜間の脱水を防ぐ"]
    ];
    if (ex > 0) {
      rows.splice(5, 0, ["運動の前後・途中", ST.num(Math.round(sweat), 0) + " ml", "15〜20分ごとに分けて飲む"]);
    }
    ST.$("timingTable").innerHTML = rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
体重・年齢・運動量から、1日に飲むべき水分の目安を計算します。**食事から摂れる水分を差し引いた「実際に飲む量」**を表示するので、そのまま行動に移せます。
`,

  guide: `
## 必要な水分量の考え方

体が1日に必要とする水分は、体重1kgあたり **35〜45ml** が目安とされています。年齢によって変わります。

| 年齢 | 体重1kgあたり |
|---|---|
| 30歳未満 | 45ml |
| 30〜55歳 | 40ml |
| 56歳以上 | 35ml |

体重60kg・35歳なら、60 × 40 = **2,400ml** です。加齢とともに体内の水分量が減り、必要量も少しずつ下がります。

ただし、この全量を飲み物で摂る必要はありません。

## 「1日2リットル」の誤解

よく言われる「1日2リットルの水を飲む」という目安は、**体が必要とする総量** であって、飲み物として摂る量ではありません。

私たちは飲む以外の経路でも水分を得ています。

| 経路 | 1日あたり |
|---|---|
| 飲み物 | 1,200ml |
| 食事に含まれる水分 | 1,000ml |
| 代謝水（栄養素の分解で生じる水） | 300ml |
| **合計** | **2,500ml** |

ご飯やみそ汁、野菜、果物には多くの水分が含まれています。**実際に飲むべき量は1.2リットル前後** というのが現実的な数字です。

一方、出ていく量も同じく2,500mlです。

| 経路 | 1日あたり |
|---|---|
| 尿 | 1,500ml |
| 便 | 100ml |
| 不感蒸泄（呼気・皮膚から自然に蒸発） | 900ml |

**不感蒸泄** は自覚のないまま失われる水分で、汗をかいていなくても1日900ml程度が蒸発しています。冬に脱水が起きるのはこのためです。

## 追加が必要になる場面

| 状況 | 追加の目安 |
|---|---|
| 運動（30分ごと） | 500ml |
| 入浴 | 800ml |
| 睡眠中 | 500ml（起床時に補給） |
| 飲酒 | 飲んだアルコールと同量の水 |
| 発熱（1度上昇ごと） | 体重1kgあたり10〜15ml |
| 高温環境での作業 | 1時間あたり500〜1,000ml |

アルコールには利尿作用があり、**ビール1リットルを飲むと1.1リットルの尿が出る** とされています。飲むほど脱水が進むため、間に水を挟むのが有効です。

## 飲み方のコツ

- **一度に大量に飲まない**: 体が一度に吸収できるのは200〜250ml程度です。それ以上は尿として排出されます
- **こまめに分ける**: 1〜2時間おきにコップ1杯が理想的です
- **喉が渇く前に飲む**: 喉の渇きを感じた時点で、すでに体重の2%程度の水分が失われています
- **常温がよい**: 冷たすぎる水は胃腸への負担になります。運動時は5〜15度が吸収しやすいとされます

## カフェインと水分

コーヒーや緑茶にも利尿作用がありますが、**適量なら水分補給として数えてよい** というのが近年の見解です。1日3〜4杯程度であれば、摂取した水分量が利尿で失われる量を上回ります。

ただし、水分補給の主役は水や麦茶にして、カフェイン飲料は補助と考えるほうが確実です。

## 飲みすぎにも注意

短時間に大量の水を飲むと、血液中のナトリウム濃度が下がり **水中毒（低ナトリウム血症）** を起こすことがあります。頭痛、吐き気、けいれんなどの症状が出ます。

腎臓が処理できるのは1時間あたり700〜1,000ml程度です。マラソンなどで大量に発汗した場合は、水だけでなく塩分もあわせて補給してください。

> 心臓や腎臓の疾患がある方は、水分の摂取量を制限されている場合があります。このツールの数値は健康な成人を想定した一般的な目安です。治療中の方は必ず主治医の指示に従ってください。
`,

  faq: [
    {
      q: "1日2リットルの水を飲む必要がありますか？",
      a: "2リットルは体が必要とする総量で、飲み物として摂る量ではありません。食事から約1,000ml、代謝水として約300mlを得ているため、実際に飲むのは1.2リットル前後が目安です。",
    },
    {
      q: "お茶やコーヒーも水分に数えていいですか？",
      a: "適量なら数えて構いません。カフェインには利尿作用がありますが、1日3〜4杯程度なら摂取量が失われる量を上回ります。ただし主役は水や麦茶にするほうが確実です。",
    },
    {
      q: "一度にたくさん飲んでもいいですか？",
      a: "体が一度に吸収できるのは200〜250ml程度で、それ以上は尿として排出されます。1〜2時間おきにコップ1杯ずつ、こまめに分けて飲むほうが効率的です。",
    },
    {
      q: "冬でも水分補給は必要ですか？",
      a: "必要です。汗をかかなくても、呼吸や皮膚から1日900ml程度が自然に蒸発しています（不感蒸泄）。暖房で乾燥する冬は、喉の渇きを感じにくいまま脱水が進むことがあります。",
    },
    {
      q: "水を飲みすぎるとどうなりますか？",
      a: "短時間に大量に飲むと血中のナトリウム濃度が下がり、水中毒（低ナトリウム血症）を起こすことがあります。腎臓が処理できるのは1時間あたり700〜1,000ml程度です。大量に発汗したときは塩分もあわせて補給してください。",
    },
  ],
};
