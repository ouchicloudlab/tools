export default {
  category: "health",
  updated: "2026-08-27",
  title: "歩数から距離とカロリーを計算｜1万歩は何km？",
  h1: "歩数・距離・消費カロリーの計算ツール",
  description:
    "歩数から歩いた距離と消費カロリーを計算します。身長から歩幅を推定するので実測は不要です。1万歩が何kmにあたるか、歩く速さごとの違いも確認できる無料ツールです。",
  cardText: "歩数→距離・カロリー。1万歩が何kmか分かる。",
  keywords: [
    "歩数", "距離", "カロリー", "1万歩", "何km", "歩幅", "ウォーキング", "計算", "消費カロリー",
  ],
  related: ["undou-calorie", "sokudo-keisan"],

  ui: `
<div class="row">
  <div class="field">
    <label for="steps">歩数</label>
    <input type="number" id="steps" inputmode="numeric" value="10000" step="1000">
  </div>
  <div class="field">
    <label for="height">身長（cm）</label>
    <input type="number" id="height" inputmode="decimal" value="170" step="1">
  </div>
  <div class="field">
    <label for="weight">体重（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="60" step="1">
  </div>
</div>

<div class="row">
  <div class="field">
    <span class="field-label">歩き方</span>
    <div class="pills" id="pace">
      <label><input type="radio" name="pace" value="slow">ゆっくり（3km/h）</label>
      <label><input type="radio" name="pace" value="normal" checked>普通（4km/h）</label>
      <label><input type="radio" name="pace" value="fast">早歩き（6km/h）</label>
    </div>
  </div>
  <div class="field">
    <label for="stride">歩幅（cm・任意）</label>
    <input type="number" id="stride" inputmode="decimal" value="" placeholder="空欄なら身長から推定">
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">歩いた距離</div>
  <div class="result-main" id="distVal">-</div>
  <div class="result-grid">
    <div><div class="k">消費カロリー</div><div class="v" id="kcalVal">-</div></div>
    <div><div class="k">使った歩幅</div><div class="v" id="strideVal">-</div></div>
    <div><div class="k">かかる時間</div><div class="v" id="timeVal">-</div></div>
    <div><div class="k">ごはん換算</div><div class="v" id="riceVal">-</div></div>
    <div><div class="k">脂肪に換算すると</div><div class="v" id="fatVal">-</div></div>
    <div><div class="k">1か月続けたら</div><div class="v" id="monthVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>歩数ごとの目安</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>歩数</th><th>距離</th><th>時間</th><th>消費カロリー</th></tr></thead>
    <tbody id="stepTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var PACE = { slow: { kmh: 3, mets: 2.8 }, normal: { kmh: 4, mets: 3.5 }, fast: { kmh: 6, mets: 5.0 } };

  ST.live(function () {
    var steps = Math.max(0, ST.n(ST.$("steps")));
    var h = ST.n(ST.$("height"));
    var w = ST.n(ST.$("weight"));
    var p = PACE[ST.pick("pace")] || PACE.normal;
    var manual = ST.n(ST.$("stride"), 0);

    if (h <= 0 || w <= 0) {
      ["distVal","kcalVal","strideVal","timeVal","riceVal","fatVal","monthVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "身長と体重を入力してください。");
      ST.$("stepTable").innerHTML = "";
      return;
    }

    // 歩幅の推定: 身長 × 0.45（普通の歩行）。速く歩くほど歩幅は広がる
    var factor = ST.pick("pace") === "fast" ? 0.5
      : (ST.pick("pace") === "slow" ? 0.4 : 0.45);
    var stride = manual > 0 ? manual : h * factor;

    var meters = steps * stride / 100;
    var km = meters / 1000;
    var hours = km / p.kmh;
    // 消費カロリー = METs × 時間 × 体重 × 1.05
    var kcal = p.mets * hours * w * 1.05;

    ST.set("distVal", ST.num(km, 2) + " km");
    ST.set("kcalVal", ST.num(Math.round(kcal), 0) + " kcal");
    ST.set("strideVal", ST.num(stride, 1) + " cm" + (manual > 0 ? "（入力値）" : "（推定）"));
    ST.set("timeVal", hours < 1
      ? ST.num(hours * 60, 0) + " 分"
      : Math.floor(hours) + "時間" + Math.round((hours % 1) * 60) + "分");
    ST.set("riceVal", ST.num(kcal / 234, 2) + " 杯分");
    ST.set("fatVal", ST.num(kcal / 7.2, 0) + " g");
    ST.set("monthVal", ST.num(Math.round(kcal * 30), 0) + " kcal（脂肪 " +
      ST.num(kcal * 30 / 7200, 2) + " kg分）");
    ST.set("detail",
      "歩幅は身長の約" + Math.round(factor * 100) + "%（" + ST.num(stride, 1) +
      "cm）として計算しています。" + ST.num(steps, 0) + "歩 × " + ST.num(stride, 1) +
      "cm = " + ST.num(km, 2) + "km。消費カロリーは " + p.mets +
      " METs で算出した目安です。");

    var samples = [1000, 3000, 5000, 8000, 10000, 15000, 20000];
    ST.$("stepTable").innerHTML = samples.map(function (s) {
      var m2 = s * stride / 100 / 1000;
      var hh = m2 / p.kmh;
      var kc = p.mets * hh * w * 1.05;
      var hit = Math.abs(s - steps) < 500;
      return "<tr" + (hit ? ' style="font-weight:700"' : "") + "><td>" +
        ST.num(s, 0) + "歩</td><td>" + ST.num(m2, 2) + " km</td><td>" +
        ST.num(hh * 60, 0) + " 分</td><td>" + ST.num(Math.round(kc), 0) + " kcal</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
歩数を入れると、歩いた距離と消費カロリーが分かります。**歩幅は身長から自動で推定**するので、実測しなくても目安が出せます。
`,

  guide: `
## 歩数から距離を出す

> **距離(km) = 歩数 × 歩幅(cm) ÷ 100 ÷ 1000**

歩幅が分からない場合は、身長から推定できます。

> **歩幅(cm) ≒ 身長(cm) × 0.45**

身長170cmなら歩幅は約76.5cm。1万歩なら **約7.6km** です。よく言われる「1万歩＝約8km」はこの計算に基づいています。

歩幅は歩き方によって変わります。

| 歩き方 | 身長に対する割合 |
|---|---|
| ゆっくり歩く | 0.40 |
| 普通に歩く | 0.45 |
| 早歩き | 0.50 |
| 走る | 0.55〜0.70 |

## 歩幅を実測する方法

正確に知りたい場合は、次の方法が簡単です。

1. 10歩ぶん、いつものペースで歩く
2. 出発点から到着点までの距離を測る
3. その距離 ÷ 10 = 歩幅

10mの直線を歩いて歩数を数え、1000 ÷ 歩数（cm）で求める方法でも構いません。

## 1万歩の意味

「1日1万歩」という目標は、1960年代に日本で万歩計が発売された際のキャッチコピーが広まったものとされています。医学的な根拠から導かれた数字ではありませんでした。

近年の研究では、次のような結果が報告されています。

- **1日4,000歩程度から死亡リスクの低下が見られる**
- **7,000〜8,000歩あたりで効果が頭打ちになる**
- それ以上増やしても、リスク低下の度合いは緩やかになる

つまり、1万歩に届かなくても十分な効果があります。**今より1,000歩増やす** ほうが、達成できない目標を掲げるより現実的です。

厚生労働省の「健康づくりのための身体活動・運動ガイド2023」では、成人の目標を **1日8,000歩以上** としています。

## 消費カロリー

> **消費カロリー = METs × 時間 × 体重(kg) × 1.05**

歩行のMETsは速さによって変わります。

| 速さ | METs | 体重60kgで1時間 |
|---|---|---|
| 3km/h（ゆっくり） | 2.8 | 約176kcal |
| 4km/h（普通） | 3.5 | 約220kcal |
| 6km/h（早歩き） | 5.0 | 約315kcal |

体重60kgの人が普通の速さで1万歩（約7.6km、約1時間54分）歩くと、**約420kcal** の消費になります。ごはん約1.8杯分です。

## 早歩きのほうが効率がよい

同じ距離でも、速く歩くほうが多くのカロリーを消費します。

体重60kgで7.6kmを歩いた場合、

- ゆっくり（3km/h・2時間32分）→ 約446kcal
- 普通（4km/h・1時間54分）→ 約419kcal
- 早歩き（6km/h・1時間16分）→ 約399kcal

**同じ距離なら消費カロリーはほぼ同じ** です。ただし早歩きは短い時間で終わるため、**時間あたりの効率は約1.8倍** になります。忙しい人ほど早歩きが向いています。

また、早歩きには心肺機能の向上という別の効果があります。厚生労働省のガイドでも、「3メッツ以上の強度（歩行以上）」の身体活動が推奨されています。

## 歩数計の誤差

- **スマートフォン**: ポケットに入れていない時間はカウントされません。1〜2割少なく出る傾向があります
- **腕時計型**: 腕の振りで判定するため、カートを押す、荷物を持つといった場面で少なくなります
- **腰につける歩数計**: 上下動を検知するため最も正確とされます

いずれも数%〜2割程度の誤差があります。日ごとの比較には使えますが、絶対値は目安として扱ってください。

> 運動の習慣を始めるにあたって、持病がある方や長く運動していない方は、医師に相談してから始めてください。
`,

  faq: [
    {
      q: "1万歩は何キロメートルですか？",
      a: "歩幅によりますが、身長170cmの人でおよそ7.6kmです。歩幅は身長の約45%（170cmなら約76.5cm）が目安になります。身長が低い方はこれより短くなります。",
    },
    {
      q: "1万歩で何キロカロリー消費しますか？",
      a: "体重60kgの人が普通の速さで歩いた場合、約420kcalです。ごはん約1.8杯分にあたります。体重が重いほど消費カロリーは増えます。",
    },
    {
      q: "本当に1日1万歩必要ですか？",
      a: "必要ではありません。1万歩という数字は1960年代の万歩計のキャッチコピーが広まったもので、医学的根拠から導かれた値ではありません。研究では7,000〜8,000歩で効果が頭打ちになるとされ、厚生労働省の目標も1日8,000歩以上です。",
    },
    {
      q: "ゆっくり歩くのと早歩きではどちらが痩せますか？",
      a: "同じ距離なら消費カロリーはほぼ変わりません。ただし早歩きは短時間で終わるため、時間あたりの効率は約1.8倍になります。加えて心肺機能の向上という効果もあります。",
    },
    {
      q: "歩幅を正確に測る方法はありますか？",
      a: "いつものペースで10歩歩き、その距離を10で割ってください。10mの直線を歩いて歩数を数え、1000を歩数で割る方法でも求められます。",
    },
  ],
};
