export default {
  category: "health",
  updated: "2026-08-19",
  title: "BMI計算ツール｜身長と体重から肥満度・適正体重を判定",
  h1: "BMI計算ツール",
  description:
    "身長と体重を入れるだけでBMI（体格指数）と日本肥満学会の判定区分、標準体重、目標体重までの差を表示します。基礎代謝の目安も同時に確認できる無料ツールです。",
  cardText: "BMI・判定区分・標準体重・基礎代謝の目安。",
  keywords: [
    "BMI", "計算", "肥満度", "標準体重", "適正体重", "体格指数", "痩せ", "肥満", "基礎代謝",
  ],
  yomi: "びーえむあい ひまんど",
  related: [],

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
</div>

<div class="row">
  <div class="field">
    <span class="field-label">性別（基礎代謝の目安に使います）</span>
    <div class="pills" id="sex">
      <label><input type="radio" name="sex" value="m" checked>男性</label>
      <label><input type="radio" name="sex" value="f">女性</label>
    </div>
  </div>
  <div class="field">
    <label for="age">年齢</label>
    <input type="number" id="age" inputmode="numeric" value="35">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">BMI</div>
  <div class="result-main" id="bmiVal">22.5</div>
  <div class="result-sub" id="judgeVal"></div>
  <div class="result-grid">
    <div><div class="k">標準体重（BMI22）</div><div class="v" id="idealVal">-</div></div>
    <div><div class="k">標準体重との差</div><div class="v" id="diffVal">-</div></div>
    <div><div class="k">普通体重の範囲</div><div class="v" id="rangeVal">-</div></div>
    <div><div class="k">基礎代謝の目安</div><div class="v" id="bmrVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  // 日本肥満学会の判定基準
  var LEVELS = [
    [18.5, "低体重（やせ型）"],
    [25, "普通体重"],
    [30, "肥満（1度）"],
    [35, "肥満（2度）"],
    [40, "肥満（3度）"],
    [Infinity, "肥満（4度）"]
  ];
  // 国立健康・栄養研究所の式に基づく基礎代謝の簡易推定
  function bmr(sex, w, h, age) {
    if (sex === "m") return 13.397 * w + 4.799 * h - 5.677 * age + 88.362;
    return 9.247 * w + 3.098 * h - 4.330 * age + 447.593;
  }

  function clear(msg) {
    ["bmiVal","idealVal","diffVal","rangeVal","bmrVal"].forEach(function (id) { ST.set(id, "-"); });
    ST.set("judgeVal", "");
    ST.set("detail", msg);
  }

  ST.live(function () {
    var h = ST.n(ST.$("height"));
    var w = ST.n(ST.$("weight"));
    var age = ST.n(ST.$("age"));
    if (h <= 0 || w <= 0) return clear("身長と体重を入力してください。");
    if (h > 300 || w > 700) return clear("入力値を確認してください。");

    var m = h / 100;
    var bmi = ST.fix(w / (m * m));
    var ideal = ST.fix(22 * m * m);
    var diff = ST.fix(w - ideal);
    var low = ST.fix(18.5 * m * m);
    var high = ST.fix(24.9 * m * m);

    var judge = "";
    for (var i = 0; i < LEVELS.length; i++) {
      if (bmi < LEVELS[i][0]) { judge = LEVELS[i][1]; break; }
    }

    ST.set("bmiVal", ST.num(bmi, 1));
    ST.set("judgeVal", "判定: " + judge + "（日本肥満学会の基準）");
    ST.set("idealVal", ST.num(ideal, 1) + "kg");
    ST.set("diffVal", (diff > 0 ? "+" : "") + ST.num(diff, 1) + "kg");
    ST.set("rangeVal", ST.num(low, 1) + "〜" + ST.num(high, 1) + "kg");
    ST.set("bmrVal", ST.num(Math.round(bmr(ST.pick("sex"), w, h, age)), 0) + "kcal/日");
    ST.set("detail", "計算式: " + ST.num(w, 1) + "kg ÷ (" + ST.num(m, 2) + "m)² = " +
      ST.num(bmi, 2) + "。この値は身長と体重だけから求めた指標で、体脂肪率や筋肉量は反映されません。");
  });
})();
`,

  intro: `
身長と体重を入力すると、BMIと判定区分、標準体重が表示されます。BMIは体格の目安を示す指標であり、健康状態を診断するものではありません。
`,

  guide: `
## BMIの計算式

> **BMI = 体重(kg) ÷ 身長(m) ÷ 身長(m)**

身長は **cmではなくm** を使う点に注意してください。170cmなら1.7mです。体重65kg・身長170cmなら、65 ÷ 1.7 ÷ 1.7 = 22.5 となります。

BMIはベルギーの数学者ケトレーが19世紀に考案した指標で、Body Mass Index（体格指数）の略です。身長に対する体重の割合を、身長の影響を除いた形で比較できるようにしたものです。

## 日本肥満学会の判定基準

| BMI | 判定 |
|---|---|
| 18.5未満 | 低体重（やせ型） |
| 18.5以上 25未満 | 普通体重 |
| 25以上 30未満 | 肥満（1度） |
| 30以上 35未満 | 肥満（2度） |
| 35以上 40未満 | 肥満（3度） |
| 40以上 | 肥満（4度） |

WHOの国際基準では肥満の境界を30としていますが、日本を含む東アジアでは、BMIが低い段階から糖尿病や高血圧のリスクが上がることが分かっており、**25以上を肥満** とする基準が使われています。

なお、日本肥満学会では、肥満のうち健康障害を伴うか内臓脂肪の蓄積があるものを「肥満症」と呼び、治療の対象としています。BMIが25を超えたことだけをもって病気とみなすわけではありません。

## 標準体重（BMI22）の根拠

BMI22が標準とされているのは、大規模な健康診断のデータで、この付近が最も有病率が低かったためです。

> **標準体重(kg) = 22 × 身長(m) × 身長(m)**

170cmなら 22 × 1.7 × 1.7 = 63.6kg です。ただしこれは統計上の値であり、「この体重でなければならない」という意味ではありません。普通体重の範囲（BMI18.5〜25未満）に収まっていれば、統計的なリスクは大きく変わらないとされています。

## BMIで分からないこと

BMIは身長と体重しか使わないため、次の点を区別できません。

- **筋肉と脂肪の区別がつかない**: 筋肉は脂肪より重いため、筋肉量の多い人はBMIが高く出ます。アスリートが「肥満」と判定されることは珍しくありません。
- **脂肪のつく場所が分からない**: 内臓脂肪型（腹部に集中）と皮下脂肪型では健康リスクが異なりますが、BMIは同じ値になります。
- **高齢者では当てはまりにくい**: 加齢により身長が縮み、筋肉量が減るため、同じBMIでも体組成が変わります。高齢者ではやや高め（BMI21.5〜24.9）が目標とされています。

腹囲（へそ回り）が男性85cm・女性90cm以上の場合は、BMIが正常でも内臓脂肪の蓄積が疑われます。健診でメタボリックシンドロームの判定に使われるのはこちらの数値です。

## 年齢別の目標BMI（厚生労働省）

「日本人の食事摂取基準」では、総死亡率が最も低かった範囲をもとに、年齢別の目標BMIが示されています。

| 年齢 | 目標とするBMI |
|---|---|
| 18〜49歳 | 18.5 〜 24.9 |
| 50〜64歳 | 20.0 〜 24.9 |
| 65歳以上 | 21.5 〜 24.9 |

高齢になるほど下限が上がります。高齢者では、やせているほうが低栄養やフレイル（虚弱）のリスクが高まるためです。

## 基礎代謝の目安について

このツールが表示する基礎代謝は、身長・体重・年齢・性別から推定した概算値です。実際の基礎代謝は、筋肉量・体温・ホルモンの状態・環境温度によって個人差があり、同じ体格でも10〜20%程度の幅があります。

1日に消費するエネルギーの総量は、基礎代謝に活動量の係数（デスクワーク中心なら1.5倍、立ち仕事なら1.75倍程度）を掛けたものが目安になります。

> 体重や食事の管理について具体的な判断が必要な場合は、医師や管理栄養士にご相談ください。このツールの数値は一般的な計算式による目安であり、診断ではありません。
`,

  faq: [
    {
      q: "BMIはいくつを目指せばいいですか？",
      a: "18.5以上25未満が普通体重の範囲です。統計上、有病率が最も低いのはBMI22付近とされています。ただし50歳以上では下限がやや高く設定されており、65歳以上では21.5〜24.9が目標とされています。",
    },
    {
      q: "筋肉質でもBMIは高く出ますか？",
      a: "出ます。BMIは身長と体重だけで計算するため、筋肉と脂肪を区別できません。筋肉量の多い方は「肥満」と判定されることがありますが、体脂肪率が低ければ健康上の問題を示すものではありません。",
    },
    {
      q: "海外の基準と判定が違うのはなぜですか？",
      a: "WHOの国際基準では肥満の境界を30としていますが、東アジアの人はBMIが低い段階から生活習慣病のリスクが上がるため、日本では25以上を肥満としています。",
    },
    {
      q: "子どものBMIも同じ基準で判定できますか？",
      a: "できません。成長期は身長と体重の関係が年齢によって大きく変わるため、子どもには年齢・性別ごとの成長曲線やローレル指数、肥満度が使われます。このツールの判定は成人向けです。",
    },
    {
      q: "基礎代謝の数値はどこまで正確ですか？",
      a: "推定式による概算です。実際の基礎代謝は筋肉量や体質によって10〜20%程度の個人差があります。正確に知りたい場合は、専用の測定機器による計測が必要です。",
    },
  ],
};
