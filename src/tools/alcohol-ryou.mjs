export default {
  category: "health",
  updated: "2026-08-27",
  title: "純アルコール量の計算｜お酒が分解されるまでの時間",
  h1: "純アルコール量・分解時間の計算ツール",
  description:
    "お酒の量と度数から純アルコール量（グラム）を計算し、体内で分解されるまでのおおよその時間を表示します。適正量との比較もできる無料ツールです。",
  cardText: "お酒の純アルコール量と分解にかかる時間を計算。",
  keywords: [
    "アルコール", "純アルコール", "計算", "分解", "時間", "度数", "適正量", "飲酒", "二日酔い",
  ],
  yomi: "あるこーる おさけ にどよい",
  related: ["calorie-hitsuyo", "suibun-hosuu"],

  ui: `
<div class="field">
  <label for="preset">お酒の種類</label>
  <select id="preset">
    <option value="">自分で入力する</option>
    <option value="350|5" selected>ビール 缶1本（350ml・5%）</option>
    <option value="500|5">ビール 缶1本（500ml・5%）</option>
    <option value="633|5">ビール 中瓶1本（633ml・5%）</option>
    <option value="435|5">生ビール 中ジョッキ（435ml・5%）</option>
    <option value="180|15">日本酒 1合（180ml・15%）</option>
    <option value="180|25">焼酎 1合（180ml・25%）</option>
    <option value="90|25">焼酎 水割り1杯（90ml・25%）</option>
    <option value="120|12">ワイン グラス1杯（120ml・12%）</option>
    <option value="750|12">ワイン ボトル1本（750ml・12%）</option>
    <option value="30|43">ウイスキー シングル（30ml・43%）</option>
    <option value="60|43">ウイスキー ダブル（60ml・43%）</option>
    <option value="350|7">チューハイ 缶1本（350ml・7%）</option>
    <option value="500|9">ストロング系 缶1本（500ml・9%）</option>
    <option value="60|20">梅酒 1杯（60ml・20%）</option>
  </select>
</div>

<div class="row">
  <div class="field">
    <label for="volume">量（ml）</label>
    <input type="number" id="volume" inputmode="decimal" value="350" step="10">
  </div>
  <div class="field">
    <label for="abv">度数（%）</label>
    <input type="number" id="abv" inputmode="decimal" value="5" step="0.5">
  </div>
  <div class="field">
    <label for="count">杯数・本数</label>
    <input type="number" id="count" inputmode="decimal" value="1" step="1">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="weight">体重（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="60" step="1">
    <p class="hint">分解時間の計算に使います。</p>
  </div>
  <div class="field">
    <span class="field-label">お酒の強さ（自己申告）</span>
    <div class="pills" id="speed">
      <label><input type="radio" name="speed" value="0.075">弱い</label>
      <label><input type="radio" name="speed" value="0.1" checked>普通</label>
      <label><input type="radio" name="speed" value="0.125">強い</label>
    </div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">純アルコール量</div>
  <div class="result-main" id="gramVal">-</div>
  <div class="result-grid">
    <div><div class="k">分解にかかる時間</div><div class="v" id="hourVal">-</div></div>
    <div><div class="k">飲み終わってから抜けるまで</div><div class="v" id="clearVal">-</div></div>
    <div><div class="k">1日の適正量（20g）比</div><div class="v" id="ratioVal">-</div></div>
    <div><div class="k">アルコール由来のカロリー</div><div class="v" id="kcalVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>同じ純アルコール量になる目安</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>お酒</th><th>量</th><th>純アルコール</th></tr></thead>
    <tbody id="compareTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var COMPARE = [
    ["ビール（5%）", 500, 5],
    ["日本酒（15%）", 180, 15],
    ["焼酎（25%）", 110, 25],
    ["ワイン（12%）", 200, 12],
    ["ウイスキー（43%）", 60, 43],
    ["チューハイ（7%）", 350, 7],
    ["ストロング系（9%）", 350, 9]
  ];

  // 純アルコール量(g) = 量(ml) × 度数(%) ÷ 100 × 0.8（アルコールの比重）
  function pureAlcohol(ml, abv) {
    return ml * abv / 100 * 0.8;
  }

  var preset = ST.$("preset");
  preset.addEventListener("change", function () {
    if (!preset.value) return;
    var p = preset.value.split("|");
    ST.$("volume").value = p[0];
    ST.$("abv").value = p[1];
  });

  ST.live(function () {
    var ml = Math.max(0, ST.n(ST.$("volume")));
    var abv = Math.max(0, ST.n(ST.$("abv")));
    var count = Math.max(0, ST.n(ST.$("count")));
    var w = ST.n(ST.$("weight"));
    var rate = Number(ST.pick("speed")) || 0.1;

    var g = pureAlcohol(ml, abv) * count;

    if (w <= 0) {
      ["gramVal","hourVal","clearVal","ratioVal","kcalVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "体重を入力してください。");
    } else {
      // 1時間に分解できる量 = 体重(kg) × 係数(g/kg/時)
      var perHour = w * rate;
      var hours = g / perHour;

      ST.set("gramVal", ST.num(g, 1) + " g");
      ST.set("hourVal", ST.num(hours, 1) + " 時間");
      ST.set("clearVal", hours < 1
        ? ST.num(hours * 60, 0) + " 分"
        : Math.floor(hours) + "時間" + Math.round((hours % 1) * 60) + "分");
      ST.set("ratioVal", ST.num(g / 20 * 100, 0) + "%");
      ST.set("kcalVal", ST.num(g * 7.1, 0) + " kcal");

      var judge = g <= 20
        ? "「節度ある適度な飲酒」とされる1日20g以内です。"
        : (g <= 40
          ? "1日20gの目安を超えています。生活習慣病のリスクが高まる量に近づいています。"
          : (g <= 60
            ? "生活習慣病のリスクを高める量（男性40g・女性20g以上）を超えています。"
            : "多量飲酒（1日60g以上）にあたります。休肝日を設けることをおすすめします。"));

      ST.set("detail",
        "計算式: " + ST.num(ml, 0) + "ml × " + ST.num(abv, 1) + "% ÷ 100 × 0.8 = " +
        ST.num(pureAlcohol(ml, abv), 1) + "g（1杯あたり）。" + judge +
        "分解速度には大きな個人差があり、表示は目安です。");
    }

    // 比較表
    ST.$("compareTable").innerHTML = COMPARE.map(function (r) {
      var pg = pureAlcohol(r[1], r[2]);
      return "<tr><td>" + r[0] + "</td><td>" + r[1] + " ml</td><td>" +
        ST.num(pg, 1) + " g</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
お酒の量と度数から、純アルコール量（グラム）と、体内で分解されるまでのおおよその時間を計算します。**飲む量を「杯数」ではなくグラムで把握する**ためのツールです。
`,

  guide: `
## 純アルコール量の計算式

> **純アルコール量(g) = 量(ml) × 度数(%) ÷ 100 × 0.8**

最後の0.8は、アルコールの比重（1mlあたり約0.8g）です。

ビール500ml（5%）なら、500 × 0.05 × 0.8 = **20g** になります。

## 「1単位」＝ 純アルコール20g

日本では、純アルコール20gを **1単位** と呼びます。次の量がだいたい1単位です。

| お酒 | 1単位の量 |
|---|---|
| ビール（5%） | 500ml（中瓶1本） |
| 日本酒（15%） | 180ml（1合） |
| 焼酎（25%） | 110ml（0.6合） |
| ワイン（12%） | 200ml（グラス2杯弱） |
| ウイスキー（43%） | 60ml（ダブル1杯） |
| チューハイ（7%） | 350ml（缶1本） |
| ストロング系（9%） | 275ml（缶の半分強） |

**ストロング系チューハイの500ml缶は、それだけで純アルコール36g** に達します。ビール中瓶1.8本分にあたり、「缶1本だから」という感覚で飲むと、想定よりはるかに多く摂取することになります。

## 適正な飲酒量

厚生労働省の「健康日本21」では、**節度ある適度な飲酒を1日平均20g程度** としています。

| 区分 | 1日の純アルコール量 |
|---|---|
| 適度な飲酒 | 20g程度 |
| 生活習慣病のリスクを高める量 | 男性40g以上 / **女性20g以上** |
| 多量飲酒 | 60g以上 |

**女性は男性より少ない量でリスクが高まります。** 体格の差に加え、アルコールを分解する酵素の働きや、体内の水分割合の違いが理由です。高齢者も同様に、若い頃より少ない量で影響を受けやすくなります。

2024年に公表された「健康に配慮した飲酒に関するガイドライン」では、**飲酒量（純アルコール量）そのものに着目する** 考え方が示されました。お酒の種類ではなくグラム数で把握することが推奨されています。

## 分解にかかる時間

1時間に分解できる純アルコール量は、おおよそ **体重1kgあたり0.1g** とされています。

- 体重60kgの人 → 1時間に約6g
- ビール500ml（20g）→ 分解に **約3.3時間**

これはあくまで平均で、個人差が非常に大きい部分です。アルコールを分解する酵素（ALDH2）の働きには遺伝的な違いがあり、日本人の約40%は分解能力が低い型を持っています。顔が赤くなる人はこの型である可能性が高く、平均より時間がかかります。

### 翌朝の運転に注意

夜11時にビール1リットル（純アルコール40g）を飲んだ場合、体重60kgの人が分解し終えるのは **約6.7時間後、翌朝6時前後** です。

- 睡眠中も分解速度は変わりません（むしろ遅くなるという報告もあります）
- 「寝れば抜ける」は誤りです
- 迎え酒、風呂、水を飲むことで分解が早まる効果はありません

翌朝に運転の予定があるなら、前夜の飲酒量から逆算してください。呼気中アルコール濃度0.15mg/L以上で酒気帯び運転になります。

## アルコールのカロリー

アルコール1gあたり **約7.1kcal** です。糖質・タンパク質（4kcal）より高く、脂質（9kcal）に近い値です。

- ビール500ml → アルコールだけで約142kcal（糖質を含めると約200kcal）
- 日本酒1合 → 約190kcal

「エンプティカロリー（栄養のないカロリー）」と呼ばれますが、**カロリーがないという意味ではありません。** 体はアルコールの分解を優先するため、その間は脂肪の分解が後回しになります。

## 休肝日について

週に2日以上の休肝日を設けることが推奨されています。連続飲酒を避けることで、肝臓が回復する時間を確保できます。

ただし、「週2日休むから他の日は多く飲んでよい」というものではありません。**1週間の合計量** で考えてください。

> 飲酒に関する健康影響には個人差が大きく、このツールの数値は一般的な目安です。妊娠中の方、服薬中の方、肝機能に不安のある方は医師にご相談ください。飲酒後の運転は、時間の経過にかかわらず絶対に避けてください。
`,

  faq: [
    {
      q: "純アルコール量はどう計算しますか？",
      a: "「量(ml) × 度数(%) ÷ 100 × 0.8」です。0.8はアルコールの比重です。ビール500ml（5%）なら 500 × 0.05 × 0.8 = 20g になります。",
    },
    {
      q: "1日にどれくらいまでなら飲んでいいですか？",
      a: "厚生労働省は純アルコール20g程度を目安としています。ビール500ml、日本酒1合、ウイスキーダブル1杯がそれぞれ約20gです。女性や高齢者はより少ない量でリスクが高まります。",
    },
    {
      q: "お酒が抜けるまでどれくらいかかりますか？",
      a: "1時間に分解できるのは体重1kgあたり約0.1gです。体重60kgならビール500ml（20g）で約3.3時間かかります。ただし個人差が非常に大きく、日本人の約40%は分解能力が低い型を持っています。",
    },
    {
      q: "寝れば早く抜けますか？",
      a: "抜けません。睡眠中の分解速度は起きているときと変わらず、むしろ遅くなるという報告もあります。翌朝の運転予定があるなら、前夜の飲酒量から逆算して時間を確保してください。",
    },
    {
      q: "ストロング系チューハイはどれくらいの量ですか？",
      a: "9%の500ml缶で純アルコール36gです。ビール中瓶1.8本分にあたり、1本で1日の目安（20g）を大きく超えます。「缶1本」という感覚と実際の量が最も乖離しやすいお酒です。",
    },
  ],
};
