export default {
  category: "money",
  updated: "2026-08-26",
  title: "消費税計算ツール｜税込・税抜を1秒で変換（10%・8%対応）",
  h1: "消費税計算ツール",
  description:
    "金額を入れるだけで、税抜・税込・消費税額をまとめて表示します。10%と軽減税率8%、端数の切り捨て・四捨五入・切り上げに対応した無料の計算ツールです。",
  cardText: "税抜↔税込を相互変換。端数処理も選べます。",
  keywords: [
    "消費税", "計算", "税込", "税抜", "内税", "外税", "10%", "8%", "軽減税率", "逆算",
  ],
  related: ["waribiki-keisan", "percent-keisan"],

  ui: `
<div class="field">
  <label for="amount">金額</label>
  <input type="number" id="amount" inputmode="decimal" placeholder="1000" value="1000">
  <p class="hint">半角数字で入力してください。小数も使えます。</p>
</div>

<div class="field">
  <span class="field-label">入力した金額は</span>
  <div class="pills" id="dir">
    <label><input type="radio" name="dir" value="ex" checked>税抜（本体価格）</label>
    <label><input type="radio" name="dir" value="in">税込（支払総額）</label>
  </div>
</div>

<div class="row">
  <div class="field">
    <span class="field-label">税率</span>
    <div class="pills" id="rate">
      <label><input type="radio" name="rate" value="10" checked>10%</label>
      <label><input type="radio" name="rate" value="8">8%（軽減）</label>
      <label><input type="radio" name="rate" value="custom">その他</label>
    </div>
    <input type="number" id="customRate" placeholder="税率(%)" value="5" hidden style="margin-top:8px">
  </div>
  <div class="field">
    <label for="round">1円未満の端数</label>
    <select id="round">
      <option value="floor">切り捨て</option>
      <option value="round">四捨五入</option>
      <option value="ceil">切り上げ</option>
      <option value="none">端数を残す</option>
    </select>
  </div>
</div>

<div class="result" id="out" aria-live="polite">
  <div class="result-label">税込金額</div>
  <div class="result-main" id="mainVal">1,100円</div>
  <div class="result-grid">
    <div><div class="k">税抜（本体）</div><div class="v" id="exVal">1,000円</div></div>
    <div><div class="k">消費税額</div><div class="v" id="taxVal">100円</div></div>
    <div><div class="k">税込</div><div class="v" id="inVal">1,100円</div></div>
  </div>
  <p class="result-sub" id="formula"></p>
</div>
`,

  script: `
ST.live(function () {
  var rateKey = ST.pick("rate");
  ST.$("customRate").hidden = rateKey !== "custom";
  var rate = rateKey === "custom" ? ST.n(ST.$("customRate")) : Number(rateKey);
  if (rate < 0) rate = 0;

  var v = ST.n(ST.$("amount"));
  var mode = ST.$("round").value;
  var mainLabel = document.querySelector("#out .result-label");
  var ex, inc, tax;

  if (ST.pick("dir") === "ex") {
    // 税抜 → 税込。端数処理は消費税額に対して行う。
    ex = v;
    tax = ST.round(v * rate / 100, mode);
    inc = ST.fix(ex + tax);
    mainLabel.textContent = "税込金額";
    ST.set("mainVal", ST.yen(inc));
    ST.set("formula", "計算式: " + ST.yen(ex) + " × " + rate + "% = 消費税 " + ST.yen(tax));
  } else {
    // 税込 → 税抜。1.1 で割る（10%を引くのではない）。
    inc = v;
    ex = ST.round(v / (1 + rate / 100), mode);
    tax = ST.fix(inc - ex);
    mainLabel.textContent = "税抜金額（本体価格）";
    ST.set("mainVal", ST.yen(ex));
    ST.set("formula", "計算式: " + ST.yen(inc) + " ÷ " + (1 + rate / 100).toFixed(2) + " = 税抜 " + ST.yen(ex));
  }

  ST.set("exVal", ST.yen(ex));
  ST.set("taxVal", ST.yen(tax));
  ST.set("inVal", ST.yen(inc));
});
`,

  intro: `
金額を入れると、その場で税抜・税込・消費税額の3つを同時に表示します。「税込価格しか分からないので本体価格を知りたい」という**逆算**にも対応しています。
`,

  guide: `
## 消費税の計算式

消費税の計算そのものは、掛け算と割り算だけです。

| 求めたいもの | 計算式（税率10%の場合） |
|---|---|
| 税込金額 | 税抜金額 × 1.1 |
| 消費税額 | 税抜金額 × 0.1 |
| 税抜金額（逆算） | 税込金額 ÷ 1.1 |
| 税込から消費税額 | 税込金額 − 税込金額 ÷ 1.1 |

間違えやすいのは逆算のほうです。税込1,100円の本体価格を求めるとき、1,100円から10%を引いて990円としてしまう誤りがよくあります。正しくは 1,100 ÷ 1.1 = 1,000円です。**引くのではなく割る**、と覚えておくと確実です。

## 8%と10%の使い分け

2019年10月の税率引き上げ以降、日本の消費税には標準税率10%と軽減税率8%の2種類があります。

- **8%（軽減税率）**: 酒類・外食を除く飲食料品、週2回以上発行される新聞の定期購読
- **10%（標準税率）**: 上記以外のすべて

判断に迷いやすいのが飲食料品です。同じ商品でも、持ち帰れば8%、店内で食べれば10%になります。ミネラルウォーターは8%ですが、水道水は生活用水と区別できないため10%です。栄養ドリンクは、医薬部外品に該当するものが10%、清涼飲料水扱いのものが8%と分かれます。

## 端数処理は事業者が決められる

1円未満の端数をどう扱うかについて、法律で「必ず切り捨てにしなさい」という決まりはありません。切り捨て・四捨五入・切り上げのいずれかを事業者が選び、継続して同じ方法を使うことになっています。

このため、同じ商品を同じ税率で計算しても、店によって1円ずれることがあります。レシートの金額とこのツールの結果が1円違う場合は、端数処理の選択を変えて試してみてください。

## インボイス制度での注意点

2023年10月に始まったインボイス制度（適格請求書等保存方式）では、**1つの請求書につき、税率ごとに1回だけ端数処理をする**というルールが加わりました。

つまり、明細1行ずつに消費税を計算して端数処理し、それを合計する方法は認められません。まず8%対象の合計と10%対象の合計をそれぞれ出し、その合計額に対して消費税を計算します。行ごとに処理していると、合計で数円ずれることがあります。

## 総額表示の義務

2021年4月から、消費者向けの価格表示は税込価格を示すことが義務づけられています。「1,000円（税別）」のような表示は原則として認められず、「1,100円」または「1,100円（税抜1,000円）」のように、支払う総額が一目で分かる形にする必要があります。事業者間の取引は対象外です。
`,

  faq: [
    {
      q: "税込価格から税抜価格を出すには、どう計算しますか？",
      a: "税込価格を1.1で割ります（税率10%の場合）。8%なら1.08で割ります。税込価格から10%を引くのは誤りで、答えが小さくなりすぎます。このツールで「税込」を選べば自動で逆算されます。",
    },
    {
      q: "レシートの金額と1円ずれるのはなぜですか？",
      a: "1円未満の端数処理の方法が違うためです。切り捨て・四捨五入・切り上げのどれを使うかは事業者が選べます。端数処理の設定を変えて再計算すると一致することが多いです。",
    },
    {
      q: "軽減税率8%の対象かどうか、どう見分ければいいですか？",
      a: "酒類と外食を除く飲食料品、および週2回以上発行される新聞の定期購読が対象です。同じ商品でも、持ち帰りは8%、店内飲食は10%になります。",
    },
    {
      q: "入力した金額はどこかに送信されますか？",
      a: "送信されません。計算はすべてブラウザの中で完結しており、サーバーに金額を送る処理は含まれていません。",
    },
    {
      q: "税率5%や3%でも計算できますか？",
      a: "できます。税率の「その他」を選ぶと任意の数値を入力できます。過去の取引をさかのぼって確認するときに使えます。",
    },
  ],
};
