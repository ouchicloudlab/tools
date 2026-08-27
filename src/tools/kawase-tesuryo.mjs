export default {
  category: "money",
  updated: "2026-08-27",
  title: "為替の計算｜両替の手数料込みで実際いくらか出す",
  h1: "為替・両替手数料の計算ツール",
  description:
    "為替レートを入れて外貨と円を換算します。両替やクレジットカードの手数料を含めた実質のレートも計算できるので、どの方法が安いか比べられる無料ツールです。",
  cardText: "為替換算と、手数料込みの実質レートを計算。",
  keywords: [
    "為替", "計算", "両替", "手数料", "レート", "ドル", "円", "スプレッド", "海外",
  ],
  related: ["percent-keisan", "shohizei-keisan"],

  ui: `
<div class="note">
  為替レートは常に変動します。<b>最新のレートはご自身で確認して入力してください。</b>
  このツールはレートを取得せず、入力された値だけで計算します。
</div>

<div class="row">
  <div class="field">
    <label for="rate">為替レート（1外貨あたりの円）</label>
    <input type="number" id="rate" inputmode="decimal" value="150" step="0.01">
  </div>
  <div class="field">
    <label for="currency">通貨の名称（表示用）</label>
    <input type="text" id="currency" value="ドル">
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="foreign">外貨の金額</label>
    <input type="number" id="foreign" inputmode="decimal" value="100" step="1">
  </div>
  <div class="field">
    <label for="yen">円の金額</label>
    <input type="number" id="yen" inputmode="decimal" value="15000" step="100">
  </div>
</div>
<p class="hint">どちらかに入力すると、もう一方が計算されます。</p>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果（手数料なし）</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">1円あたり</div><div class="v" id="perYenVal">-</div></div>
    <div><div class="k">10外貨</div><div class="v" id="ten">-</div></div>
    <div><div class="k">100外貨</div><div class="v" id="hundred">-</div></div>
    <div><div class="k">1000外貨</div><div class="v" id="thousand">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>手数料を含めた実質レート</h3>
<div class="row">
  <div class="field">
    <label for="fee">手数料（%）</label>
    <input type="number" id="fee" inputmode="decimal" value="1.6" step="0.1">
  </div>
  <div class="field">
    <label for="feeFixed">固定手数料（円）</label>
    <input type="number" id="feeFixed" inputmode="decimal" value="0" step="100">
  </div>
  <div class="field">
    <label for="method">よくある手数料の目安</label>
    <select id="method">
      <option value="">自分で入力</option>
      <option value="1.6" selected>クレジットカード（1.6%前後）</option>
      <option value="2.2">クレジットカード（2.2%）</option>
      <option value="3">海外ATM引き出し（3%前後）</option>
      <option value="0.5">ネット銀行の外貨預金（0.5%前後）</option>
      <option value="6">空港・街中の両替所（6%前後）</option>
      <option value="10">ホテルでの両替（10%前後）</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">手数料を含めた実質レート</div>
  <div class="result-main" id="realRateVal">-</div>
  <div class="result-grid">
    <div><div class="k">支払う円</div><div class="v" id="payVal">-</div></div>
    <div><div class="k">手数料の額</div><div class="v" id="feeVal">-</div></div>
    <div><div class="k">基準レートとの差</div><div class="v" id="gapVal">-</div></div>
    <div><div class="k">10万円あたりの手数料</div><div class="v" id="fee100kVal">-</div></div>
  </div>
  <p class="result-sub" id="feeDetail"></p>
</div>

<h3>手数料の方法別の比較（同じ金額を用意した場合）</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>方法</th><th>手数料</th><th>支払う円</th><th>差額</th></tr></thead>
    <tbody id="compareTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var METHODS = [
    ["ネット銀行の外貨預金", 0.5],
    ["クレジットカード（1.6%）", 1.6],
    ["クレジットカード（2.2%）", 2.2],
    ["海外ATMでの引き出し", 3],
    ["空港・街中の両替所", 6],
    ["ホテルでの両替", 10]
  ];
  var lock = false;

  ST.live(function () {
    var rate = ST.n(ST.$("rate"));
    var cur = ST.$("currency").value || "外貨";

    if (rate <= 0) {
      ["mainVal","perYenVal","ten","hundred","thousand","realRateVal","payVal","feeVal","gapVal","fee100kVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "為替レートに0より大きい値を入力してください。");
      ST.$("compareTable").innerHTML = "";
      return;
    }

    var fx = ST.n(ST.$("foreign"));
    ST.set("mainVal", ST.num(fx, 2) + " " + cur + " = " + ST.yen(Math.round(fx * rate), 0));
    ST.set("perYenVal", ST.num(1 / rate, 5) + " " + cur);
    ST.set("ten", ST.yen(Math.round(10 * rate), 0));
    ST.set("hundred", ST.yen(Math.round(100 * rate), 0));
    ST.set("thousand", ST.yen(Math.round(1000 * rate), 0));
    ST.set("detail", "1" + cur + " = " + ST.num(rate, 2) + "円 として計算しています。" +
      "レートが1円動くと、100" + cur + "あたり100円の差になります。");

    // 手数料
    var feePct = ST.n(ST.$("fee"));
    var feeFixed = ST.n(ST.$("feeFixed"));
    var baseYen = fx * rate;
    var pay = baseYen * (1 + feePct / 100) + feeFixed;
    var feeAmount = pay - baseYen;
    var realRate = fx > 0 ? pay / fx : rate;

    ST.set("realRateVal", "1" + cur + " = " + ST.num(realRate, 2) + " 円");
    ST.set("payVal", ST.yen(Math.round(pay), 0));
    ST.set("feeVal", ST.yen(Math.round(feeAmount), 0));
    ST.set("gapVal", "+" + ST.num(realRate - rate, 2) + " 円");
    ST.set("fee100kVal", ST.yen(Math.round(100000 * feePct / 100), 0));
    ST.set("feeDetail",
      "基準レート " + ST.num(rate, 2) + "円に手数料 " + ST.num(feePct, 2) + "%" +
      (feeFixed > 0 ? " ＋ " + ST.yen(feeFixed, 0) : "") +
      " を加えると、実質 " + ST.num(realRate, 2) + "円になります。" +
      "両替所の掲示レートには、この手数料が最初から含まれていることが多い点に注意してください。");

    // 方法別の比較
    var best = baseYen * (1 + METHODS[0][1] / 100);
    ST.$("compareTable").innerHTML = METHODS.map(function (m) {
      var p = baseYen * (1 + m[1] / 100);
      var hit = Math.abs(m[1] - feePct) < 0.05;
      return "<tr" + (hit ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + m[0] + "</td><td>" + m[1] + "%</td><td>" +
        ST.yen(Math.round(p), 0) + "</td><td>" +
        (p - best < 1 ? "—" : "+" + ST.yen(Math.round(p - best), 0)) + "</td></tr>";
    }).join("");
  });

  // 外貨と円の相互入力
  ST.$("foreign").addEventListener("input", function () {
    if (lock) return;
    var rate = ST.n(ST.$("rate"));
    if (rate > 0) {
      lock = true;
      ST.$("yen").value = Math.round(ST.n(ST.$("foreign")) * rate);
      lock = false;
    }
  });
  ST.$("yen").addEventListener("input", function () {
    if (lock) return;
    var rate = ST.n(ST.$("rate"));
    if (rate > 0) {
      lock = true;
      ST.$("foreign").value = Math.round(ST.n(ST.$("yen")) / rate * 100) / 100;
      lock = false;
      ST.$("foreign").dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  ST.$("method").addEventListener("change", function () {
    var v = ST.$("method").value;
    if (v) ST.$("fee").value = v;
  });
})();
`,

  intro: `
為替レートを入れて外貨と円を換算します。**両替やカード決済の手数料を含めた実質レート**も計算するので、どの方法で支払うのが安いか比べられます。レートの取得は行わないため、最新の値をご自身で入力してください。
`,

  guide: `
## 表示されているレートには手数料が含まれている

ニュースで見る「1ドル150円」は **仲値（TTM）** と呼ばれる基準レートです。実際に両替するときは、これに手数料が上乗せされます。

| レートの種類 | 意味 |
|---|---|
| TTM（仲値） | 基準となるレート。ニュースで報じられる値 |
| TTS | 円を外貨に替えるときのレート（仲値＋手数料） |
| TTB | 外貨を円に戻すときのレート（仲値−手数料） |

銀行で1ドル150円のときにドルを買うと151円、売ると149円、というように差がつきます。この差を **スプレッド** といい、これが実質的な手数料です。

**往復で両替すると、レートが動かなくても目減りします。** 上の例では、1ドル買って売り戻すだけで2円（約1.3%）減ります。

## 方法ごとの手数料の目安

| 方法 | 手数料の目安 |
|---|---|
| ネット銀行の外貨預金 | 0.1〜0.5% |
| クレジットカード（海外利用） | 1.6〜2.5% |
| デビットカード | 2〜3% |
| 海外ATMでの現地通貨引き出し | 2〜4%＋定額手数料 |
| 空港の両替所 | 3〜10% |
| ホテル・観光地の両替所 | 8〜15% |

**海外での支払いは、現金両替よりクレジットカードのほうが安く済むことがほとんど** です。カード会社の手数料は1.6〜2.5%程度で、両替所より有利なことが多いためです。

## 「DCC」に注意

海外でカードを使うとき、店員に「日本円で決済しますか？」と聞かれることがあります。これは **DCC（Dynamic Currency Conversion）** という仕組みです。

- 一見親切に見えますが、**店側が独自のレートを設定** します
- 上乗せは3〜8%に達することもあり、カード会社の手数料より高くつきます
- 決済端末の画面で「JPY」が選ばれていたら、**現地通貨（USD、EURなど）に変更** してください

「日本円で確定するので分かりやすい」という利点はありますが、その安心料としては割高です。

## 為替が1円動くとどうなるか

100ドルの買い物なら、1円の変動で100円の差です。金額が大きくなるほど影響も比例します。

| 買い物の額 | 1円の変動による差 |
|---|---|
| 100ドル | 100円 |
| 1,000ドル | 1,000円 |
| 10,000ドル | 10,000円 |

**円安が進むと、同じ商品でも円建ての価格が上がります。** 1ドル110円のときに110円だったものが、150円になれば150円です。海外通販や旅行の予算を立てるときは、想定より数円悪いレートで見積もっておくと安全です。

## 手数料を抑える方法

- **カード払いを基本にする**: 手数料が明示されており、両替所より安いことが多い
- **DCCを断る**: 必ず現地通貨で決済する
- **ATMは1回の引き出し額を大きく**: 定額手数料がかかる場合、回数を減らすほうが有利
- **空港での両替は最小限に**: 到着直後の交通費ぶんだけにする
- **手数料無料のカードを選ぶ**: 海外事務手数料が低いカードもあります

なお、**現地通貨の現金が全く不要というわけではありません。** 小さな店、チップ、公共交通機関などで必要になる場面があります。渡航先のキャッシュレス普及度を調べて、必要最小限を持っていくのが現実的です。

> このツールは為替レートを取得しません。入力された値のみで計算するため、実際の取引前には金融機関やカード会社の最新レートをご確認ください。
`,

  faq: [
    {
      q: "ニュースのレートと両替所のレートが違うのはなぜですか？",
      a: "ニュースで報じられるのは仲値（TTM）という基準レートで、実際の両替にはここに手数料が上乗せされます。円から外貨に替えるレート（TTS）と、外貨を円に戻すレート（TTB）の差が実質的な手数料です。",
    },
    {
      q: "海外では現金とクレジットカードのどちらが得ですか？",
      a: "多くの場合クレジットカードです。カード会社の手数料は1.6〜2.5%程度で、空港や街中の両替所（3〜10%）より有利です。ただし小さな店やチップ用に、少額の現金は用意しておくと安心です。",
    },
    {
      q: "「日本円で決済しますか」と聞かれたらどうすればいいですか？",
      a: "現地通貨を選んでください。日本円決済（DCC）は店側が独自のレートを設定するため、3〜8%上乗せされることがあります。カード会社のレートのほうが有利です。",
    },
    {
      q: "為替が1円動くとどれくらい影響しますか？",
      a: "外貨の金額と同じだけ円が動きます。100ドルの買い物なら100円、1,000ドルなら1,000円の差です。海外通販では、想定より数円悪いレートで見積もっておくと安全です。",
    },
    {
      q: "このツールは最新のレートを表示しますか？",
      a: "しません。レートの取得は行わず、入力された値だけで計算します。最新のレートは金融機関やカード会社のサイトでご確認のうえ、入力してください。",
    },
  ],
};
