export default {
  category: "money",
  updated: "2026-08-27",
  title: "振込手数料の比較｜どの方法で送るのが安いか",
  h1: "振込手数料の計算・比較ツール",
  description:
    "振込金額と回数から、年間の手数料を計算します。ネット銀行と大手銀行の差や、無料回数を使い切った場合の負担も比較できる無料ツールです。",
  cardText: "振込手数料の年間負担を銀行の種類別に比較。",
  keywords: [
    "振込手数料", "比較", "計算", "ネット銀行", "無料回数", "ATM", "年間", "節約",
  ],
  yomi: "ふりこみてすうりょう ぎんこう",
  related: ["chokin-mokuhyo", "kawase-tesuryo"],

  ui: `
<div class="row">
  <div class="field">
    <label for="amount">1回の振込金額（円）</label>
    <input type="number" id="amount" inputmode="decimal" value="50000" step="10000">
    <p class="hint">3万円を境に手数料が変わる銀行があります。</p>
  </div>
  <div class="field">
    <label for="count">月の振込回数</label>
    <input type="number" id="count" inputmode="numeric" value="4" step="1">
  </div>
  <div class="field">
    <label for="free">無料になる回数（月）</label>
    <input type="number" id="free" inputmode="numeric" value="0" step="1">
    <p class="hint">口座の条件で0〜5回程度が無料になります。</p>
  </div>
</div>

<div class="field">
  <span class="field-label">振込先</span>
  <div class="pills" id="dest">
    <label><input type="radio" name="dest" value="other" checked>他行あて</label>
    <label><input type="radio" name="dest" value="same">同じ銀行あて</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">年間の手数料（いま使っている方法）</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">無料枠を超える回数（月）</div><div class="v" id="paidVal">-</div></div>
    <div><div class="k">最も安い方法との差（年）</div><div class="v" id="gapVal">-</div></div>
    <div><div class="k">振込額に対する割合</div><div class="v" id="rateVal">-</div></div>
    <div><div class="k">10年間では</div><div class="v" id="tenVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>方法別の比較</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>方法</th><th>1回あたり</th><th>月の手数料</th><th>年間</th></tr></thead>
    <tbody id="compareTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // [名称, 他行3万未満, 他行3万以上, 同行, 備考]
  var BANKS = [
    ["ネット銀行（ネットバンキング）", 145, 145, 0, "住信SBI・楽天銀行など"],
    ["大手銀行（ネットバンキング）", 150, 330, 0, "みずほ・三菱UFJ・三井住友など"],
    ["大手銀行（ATM・キャッシュカード）", 275, 440, 110, "窓口より安い"],
    ["大手銀行（ATM・現金）", 440, 660, 220, "現金は割高"],
    ["大手銀行（窓口）", 660, 880, 440, "最も高い"],
    ["ゆうちょ銀行（ゆうちょダイレクト）", 165, 165, 100, "他行あては一律"]
  ];

  ST.live(function () {
    var amount = Math.max(0, ST.n(ST.$("amount")));
    var count = Math.max(0, Math.round(ST.n(ST.$("count"))));
    var free = Math.max(0, Math.round(ST.n(ST.$("free"))));
    var isOther = ST.pick("dest") === "other";
    var paid = Math.max(0, count - free);

    // 金額によって手数料が変わる（3万円が境目）
    function feeOf(b) {
      if (!isOther) return b[3];
      return amount >= 30000 ? b[2] : b[1];
    }

    var fees = BANKS.map(function (b) {
      var per = feeOf(b);
      return { name: b[0], per: per, month: per * paid, year: per * paid * 12, note: b[4] };
    });

    var cheapest = fees.reduce(function (a, b) { return b.year < a.year ? b : a; }, fees[0]);
    // いま使っている方法は「大手銀行（ネットバンキング）」を既定とする
    var current = fees[1];

    ST.set("mainVal", ST.yen(Math.round(current.year), 0));
    ST.set("paidVal", paid + " 回" + (free > 0 ? "（" + free + "回は無料）" : ""));
    ST.set("gapVal", current.year > cheapest.year
      ? ST.yen(Math.round(current.year - cheapest.year), 0) + " 多い"
      : "最も安い方法です");
    ST.set("rateVal", amount > 0
      ? ST.num(current.per / amount * 100, 3) + "%（1回あたり）" : "—");
    ST.set("tenVal", ST.yen(Math.round(current.year * 10), 0));
    ST.set("detail",
      "「大手銀行のネットバンキング」を基準に表示しています。" +
      (isOther
        ? "他行あて" + (amount >= 30000 ? "・3万円以上" : "・3万円未満") + "の料金です。"
        : "同じ銀行の口座あては、多くの銀行で無料または低額です。") +
      (paid === 0 ? "無料回数の範囲に収まっているため、手数料はかかりません。" : "") +
      "実際の金額は銀行や口座の条件によって変わります。");

    ST.$("compareTable").innerHTML = fees.map(function (f) {
      var isBest = f.year === cheapest.year;
      return "<tr" + (isBest ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + f.name + "<br><span style=\\"font-size:11px;opacity:.7\\">" + f.note +
        "</span></td><td>" + ST.yen(f.per, 0) + "</td><td>" +
        ST.yen(Math.round(f.month), 0) + "</td><td>" +
        ST.yen(Math.round(f.year), 0) + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
振込金額と回数から、年間の手数料を計算して方法別に比較します。**同じ金額を送るのに、方法によって年間で数万円の差**が出ることを確認できます。
`,

  guide: `
## 手数料は「方法」で大きく変わる

同じ他行あて5万円の振込でも、手数料は次のように変わります。

| 方法 | 手数料 |
|---|---|
| ネット銀行のネットバンキング | 約145円 |
| 大手銀行のネットバンキング | 約330円 |
| 大手銀行のATM（カード） | 約440円 |
| 大手銀行のATM（現金） | 約660円 |
| 大手銀行の窓口 | 約880円 |

**窓口はネット銀行の6倍** です。月4回の振込なら、年間で約35,000円の差になります。

## 3万円が境目

多くの銀行では、**3万円以上と3万円未満で料金が変わります**。差は110〜220円程度です。

29,999円と30,000円で手数料が変わるため、金額を調整できる場合は意識する価値があります。ただし、無理に分けて2回振り込むと、かえって手数料が増えます。

一方、**ネット銀行の多くは金額に関係なく一律** です。楽天銀行や住信SBIネット銀行は、金額を問わず同じ料金体系になっています。

## 無料回数を活用する

多くの銀行に、条件を満たすと手数料が無料になる制度があります。

| 条件の例 | 無料回数 |
|---|---|
| 残高が一定額以上 | 月1〜5回 |
| 給与振込口座に指定 | 月3回程度 |
| 取引実績（ランク制度） | 月1〜20回 |
| 若年層向け優遇（29歳以下など） | 月1〜3回 |
| クレジットカードの引き落とし口座に指定 | 月1回 |

**給与振込口座に指定するだけで無料回数が増える** ケースが多くあります。銀行を変えられない場合でも、条件を確認して満たせるものがないか見直す価値があります。

## 意外と見落とされる出金手数料

振込だけでなく、ATMでの出金にも手数料がかかります。

| 状況 | 手数料の目安 |
|---|---|
| 自行ATM・平日日中 | 無料 |
| 自行ATM・時間外 | 110〜220円 |
| コンビニATM・日中 | 110〜220円 |
| コンビニATM・時間外 | 220〜330円 |

**週1回コンビニATMで220円払うと、年間で11,440円** です。手数料を払って自分のお金を引き出していることになります。

まとめて引き出す、無料回数のある口座を使う、キャッシュレス決済を増やすといった対策で、この費用はほぼゼロにできます。

## 見直しの手順

1. **通帳やアプリの明細で、1年間に払った手数料を数える** — 想像より多いことがほとんどです
2. **無料条件を確認する** — すでに満たしているのに使っていない場合があります
3. **給与振込・引き落としの口座を集約する** — 取引実績が集まり、優遇ランクが上がります
4. **振込用にネット銀行を1つ作る** — 大手銀行から一定額を移しておき、振込はそこから行う

固定費の見直しの中では、**手間が少ないわりに効果が続く** 部類です。一度設定してしまえば、以後は何もしなくても差が積み上がります。

## 振込と口座振替の違い

- **振込**: 自分が指示して送る。手数料は送る側の負担
- **口座振替（自動引き落とし）**: 相手が引き落とす。手数料は原則として相手（収納企業）の負担

家賃や習い事の月謝を毎月振り込んでいる場合、**口座振替に切り替えられないか相談する価値** があります。相手が対応していれば、こちらの手数料はゼロになります。

> 手数料の金額は各行・各プランによって異なり、改定されることもあります。実際の金額は取引先の金融機関でご確認ください。
`,

  faq: [
    {
      q: "振込手数料はどれくらい違いますか？",
      a: "他行あて5万円で、ネット銀行が約145円、大手銀行の窓口が約880円と6倍の差があります。月4回なら年間で約35,000円の違いになります。",
    },
    {
      q: "3万円を境に手数料が変わるのはなぜですか？",
      a: "銀行間の決済システムの料金体系がそうなっているためです。3万円以上で110〜220円ほど高くなります。ネット銀行の多くは金額に関係なく一律です。",
    },
    {
      q: "手数料を無料にする方法はありますか？",
      a: "多くの銀行に無料回数の制度があります。給与振込口座に指定する、一定の残高を維持する、取引実績を積むといった条件で月1〜20回が無料になります。すでに条件を満たしているのに気づいていない場合もあります。",
    },
    {
      q: "ATMの出金手数料も気にすべきですか？",
      a: "週1回コンビニATMで220円払うと年間11,440円です。まとめて引き出す、無料回数のある口座を使うといった対策で、ほぼゼロにできます。",
    },
    {
      q: "毎月の家賃振込を安くする方法は？",
      a: "口座振替（自動引き落とし）に切り替えられないか相手に相談してください。口座振替の手数料は原則として引き落とす側の負担なので、こちらの手数料はゼロになります。",
    },
  ],
};
