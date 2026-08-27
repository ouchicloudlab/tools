export default {
  category: "money",
  updated: "2026-08-25",
  title: "割引計算ツール｜○%OFFの支払額・割引率の逆算ができる",
  h1: "割引計算ツール",
  description:
    "定価と割引率を入れるだけで、支払額と割引額を表示します。「20%OFFの後にさらに10%OFF」の重ねがけや、値引き後の価格から割引率を逆算する計算にも対応した無料ツールです。",
  cardText: "○%OFFの支払額、重ねがけ、割引率の逆算まで。",
  keywords: [
    "割引", "計算", "値引き", "OFF", "セール", "何割引", "割引率", "逆算", "半額",
  ],
  related: ["shohizei-keisan", "percent-keisan"],

  ui: `
<div class="field">
  <span class="field-label">計算したいこと</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="off" checked>割引後の支払額を出す</label>
    <label><input type="radio" name="mode" value="rate">割引率を逆算する</label>
  </div>
</div>

<div id="paneOff">
  <div class="row">
    <div class="field">
      <label for="price">定価（税込・税抜どちらでも）</label>
      <input type="number" id="price" inputmode="decimal" value="3000">
    </div>
    <div class="field">
      <label for="off1">割引</label>
      <input type="number" id="off1" inputmode="decimal" value="20">
    </div>
    <div class="field">
      <label for="unit1">単位</label>
      <select id="unit1">
        <option value="pct">% OFF</option>
        <option value="yen">円引き</option>
      </select>
    </div>
  </div>

  <div class="field">
    <label>
      <input type="checkbox" id="useSecond"> さらに割引を重ねる（レジでさらに◯%OFF など）
    </label>
  </div>

  <div class="row" id="secondRow" hidden>
    <div class="field">
      <label for="off2">2段目の割引</label>
      <input type="number" id="off2" inputmode="decimal" value="10">
    </div>
    <div class="field">
      <label for="unit2">単位</label>
      <select id="unit2">
        <option value="pct">% OFF</option>
        <option value="yen">円引き</option>
      </select>
    </div>
  </div>
</div>

<div id="paneRate" hidden>
  <div class="row">
    <div class="field">
      <label for="before">値引き前の価格</label>
      <input type="number" id="before" inputmode="decimal" value="3000">
    </div>
    <div class="field">
      <label for="after">値引き後の価格</label>
      <input type="number" id="after" inputmode="decimal" value="2400">
    </div>
  </div>
</div>

<div class="field">
  <label for="round">1円未満の端数</label>
  <select id="round">
    <option value="floor">切り捨て</option>
    <option value="round">四捨五入</option>
    <option value="ceil">切り上げ</option>
  </select>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">支払額</div>
  <div class="result-main" id="mainVal">2,400円</div>
  <div class="result-grid">
    <div><div class="k">割引額（合計）</div><div class="v" id="offVal">600円</div></div>
    <div><div class="k">実質の割引率</div><div class="v" id="rateVal">20%</div></div>
    <div><div class="k">定価</div><div class="v" id="priceVal">3,000円</div></div>
  </div>
  <p class="result-sub" id="formula"></p>
</div>
`,

  script: `
ST.live(function () {
  var mode = ST.pick("mode");
  ST.$("paneOff").hidden = mode !== "off";
  ST.$("paneRate").hidden = mode !== "rate";
  var rm = ST.$("round").value;

  if (mode === "off") {
    var price = ST.n(ST.$("price"));
    var use2 = ST.$("useSecond").checked;
    ST.$("secondRow").hidden = !use2;

    function applyStep(base, amount, unit) {
      if (unit === "yen") return Math.max(0, ST.fix(base - amount));
      return ST.round(base * (1 - amount / 100), rm);
    }

    var step1 = applyStep(price, ST.n(ST.$("off1")), ST.$("unit1").value);
    var paid = use2 ? applyStep(step1, ST.n(ST.$("off2")), ST.$("unit2").value) : step1;
    paid = Math.max(0, paid);

    var cut = ST.fix(price - paid);
    var rate = price > 0 ? ST.fix(cut / price * 100) : 0;

    ST.$("mainLabel").textContent = "支払額";
    ST.set("mainVal", ST.yen(paid));
    ST.set("offVal", ST.yen(cut));
    ST.set("rateVal", ST.num(rate, 1) + "%");
    ST.set("priceVal", ST.yen(price));
    ST.set("formula", use2
      ? "計算式: " + ST.yen(price) + " → 1段目 " + ST.yen(step1) + " → 2段目 " + ST.yen(paid) + "（合計 " + ST.num(rate, 1) + "% OFF 相当）"
      : "計算式: " + ST.yen(price) + " − " + ST.yen(cut) + " = " + ST.yen(paid));
  } else {
    var before = ST.n(ST.$("before"));
    var after = ST.n(ST.$("after"));
    var cut2 = ST.fix(before - after);
    var rate2 = before > 0 ? ST.fix(cut2 / before * 100) : 0;

    ST.$("mainLabel").textContent = "割引率";
    ST.set("mainVal", ST.num(rate2, 1) + "% OFF");
    ST.set("offVal", ST.yen(cut2));
    ST.set("rateVal", ST.num(rate2, 1) + "%");
    ST.set("priceVal", ST.yen(before));
    ST.set("formula", "計算式: (" + ST.yen(before) + " − " + ST.yen(after) + ") ÷ " + ST.yen(before) + " × 100 = " + ST.num(rate2, 1) + "%");
  }
});
`,

  intro: `
定価と割引率を入れると、支払額・割引額・実質の割引率が同時に出ます。「クーポンとセールを重ねたら結局いくらか」「もとの値段からいくら下がったのか」を、その場で確認できます。
`,

  guide: `
## 割引の計算式

| 求めたいもの | 計算式 |
|---|---|
| 割引後の支払額 | 定価 × (100 − 割引率) ÷ 100 |
| 割引額 | 定価 × 割引率 ÷ 100 |
| 割引率（逆算） | (定価 − 支払額) ÷ 定価 × 100 |

たとえば3,000円の20%OFFは、3,000 × 0.8 = 2,400円です。割引額のほうを先に出して 3,000 − 600 = 2,400円と計算しても同じ答えになります。

## 「◯割引」を%に読み替える

日本語の値札では「3割引」のような表記も使われます。1割は10%なので、単純に10倍すれば%になります。

| 表記 | 割引率 | 支払う割合 |
|---|---|---|
| 1割引 | 10% OFF | 定価の90% |
| 2割引 | 20% OFF | 定価の80% |
| 3割引 | 30% OFF | 定価の70% |
| 半額 | 50% OFF | 定価の50% |
| 7掛け | 30% OFF | 定価の70% |

紛らわしいのが「7掛け」です。これは「7割引」ではなく「定価の70%で買える」という意味で、30%OFFと同じです。卸値や業者間の取引でよく使われる言い方です。

## 割引の重ねがけは足し算にならない

**ここが一番間違えやすいところです。** 「20%OFFのセール品が、レジでさらに10%OFF」の場合、合計は30%OFFにはなりません。

- 定価10,000円 → 20%OFF → 8,000円
- 8,000円 → さらに10%OFF → **7,200円**

30%OFFなら7,000円ですから、200円分の差があります。2段目の割引は、値下げ後の8,000円に対してかかるためです。

このときの実質の割引率は 28% です。一般に、a%とb%を重ねた場合の実質割引率は次の式で求まります。

- 実質割引率 = 100 − (100 − a) × (100 − b) ÷ 100

このツールで「さらに割引を重ねる」にチェックを入れると、この計算を自動で行い、実質の割引率も表示します。

## ポイント還元は割引ではない

「20%ポイント還元」と「20%OFF」は、支払う金額が違います。

10,000円の商品の場合、20%OFFなら支払いは8,000円です。一方、20%ポイント還元では10,000円を支払い、2,000ポイントを受け取ります。手元から出ていくお金は10,000円のままです。

さらに、ポイント還元を割引率に換算すると、20%還元は「実質16.7%OFF」に相当します。12,000円分の価値（商品10,000円＋ポイント2,000円）を10,000円で得た、と考えるためです。

- ポイント還元の実質割引率 = 還元率 ÷ (100 + 還元率) × 100

ポイントに有効期限があったり、使える店が限られていたりする場合は、実質の価値はさらに下がります。同じ数字が並んでいても、値引きのほうが有利になることが多い、と覚えておくと判断しやすくなります。

## 消費税とセールの順番

割引と消費税は、どちらを先に計算しても最終的な支払額は変わりません。10,000円（税抜）の20%OFFなら、次のどちらでも8,800円です。

- 10,000 × 0.8 = 8,000 → 税込 8,800円
- 10,000 × 1.1 = 11,000 → 20%OFF → 8,800円

ただし端数が出る場合は、処理のタイミングによって1円ずれることがあります。税額の計算は[消費税計算ツール](/shohizei-keisan/)もあわせてご利用ください。
`,

  faq: [
    {
      q: "20%OFFの後にさらに10%OFFだと、合計何%引きですか？",
      a: "28%OFFです。30%にはなりません。2段目の割引は、1回目の値引き後の金額に対してかかるためです。ツールの「さらに割引を重ねる」を使うと実質の割引率が表示されます。",
    },
    {
      q: "「7掛け」とは何%引きのことですか？",
      a: "30%OFFです。定価の70%の価格で買える、という意味で、7割引（70%OFF）ではありません。",
    },
    {
      q: "値引き後の価格から、何%引きだったか調べられますか？",
      a: "できます。「割引率を逆算する」を選び、値引き前と値引き後の価格を入力してください。(値引き前 − 値引き後) ÷ 値引き前 × 100 で割引率が出ます。",
    },
    {
      q: "20%ポイント還元と20%OFFはどちらが得ですか？",
      a: "20%OFFのほうが得です。ポイント還元では支払額は減らず、受け取るポイントは実質16.7%OFF相当にとどまります。ポイントに有効期限や利用制限があると、さらに価値は下がります。",
    },
    {
      q: "端数はどう処理されますか？",
      a: "切り捨て・四捨五入・切り上げから選べます。店舗によって扱いが異なるため、レシートと合わない場合は設定を変えてお試しください。",
    },
  ],
};
