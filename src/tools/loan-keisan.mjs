export default {
  category: "money",
  updated: "2026-08-27",
  title: "ローン返済シミュレーション｜毎月の返済額と総利息を計算",
  h1: "ローン返済シミュレーション",
  description:
    "借入額・金利・返済期間から毎月の返済額と利息の総額を計算します。元利均等と元金均等の比較、繰り上げ返済の効果も確認できる無料のシミュレーションツールです。",
  cardText: "毎月の返済額・総利息・繰り上げ返済の効果を試算。",
  keywords: [
    "ローン", "返済", "計算", "住宅ローン", "金利", "元利均等", "元金均等", "繰り上げ返済", "シミュレーション",
  ],
  yomi: "ろーん へんさい じゅうたくろーん",
  related: ["percent-keisan", "jikyu-nensyu"],

  ui: `
<div class="row">
  <div class="field">
    <label for="principal">借入額（万円）</label>
    <input type="number" id="principal" inputmode="decimal" value="3000" step="10">
  </div>
  <div class="field">
    <label for="rate">年利（%）</label>
    <input type="number" id="rate" inputmode="decimal" value="1.5" step="0.01">
  </div>
  <div class="field">
    <label for="years">返済期間（年）</label>
    <input type="number" id="years" inputmode="decimal" value="35" step="1">
  </div>
</div>

<div class="field">
  <span class="field-label">返済方式</span>
  <div class="pills" id="method">
    <label><input type="radio" name="method" value="ganri" checked>元利均等（毎月同額）</label>
    <label><input type="radio" name="method" value="gankin">元金均等（元金が同額）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">毎月の返済額</div>
  <div class="result-main" id="monthVal">-</div>
  <div class="result-grid">
    <div><div class="k">返済総額</div><div class="v" id="totalVal">-</div></div>
    <div><div class="k">利息の総額</div><div class="v" id="interestVal">-</div></div>
    <div><div class="k">利息が元金に占める割合</div><div class="v" id="ratioVal">-</div></div>
    <div><div class="k">返済回数</div><div class="v" id="countVal">-</div></div>
    <div><div class="k">初回の利息分</div><div class="v" id="firstIntVal">-</div></div>
    <div><div class="k">初回の元金分</div><div class="v" id="firstPriVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>繰り上げ返済の効果</h3>
<div class="row">
  <div class="field">
    <label for="extra">繰り上げ返済額（万円）</label>
    <input type="number" id="extra" inputmode="decimal" value="100" step="10">
  </div>
  <div class="field">
    <label for="extraAt">実行する時期（返済開始から◯年後）</label>
    <input type="number" id="extraAt" inputmode="decimal" value="5" step="1">
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">短縮される期間</div><div class="v" id="cutTermVal">-</div></div>
    <div><div class="k">減る利息</div><div class="v" id="cutIntVal">-</div></div>
  </div>
  <p class="result-sub">期間短縮型（毎月の返済額は変えず、返済期間を縮める方式）で計算しています。</p>
</div>
`,

  script: `
(function () {
  var MAN = 10000;

  // 元利均等返済の毎月返済額
  //   P × r × (1+r)^n ÷ ((1+r)^n − 1)
  function monthlyPayment(P, r, n) {
    if (n <= 0) return 0;
    if (r === 0) return P / n;
    var q = Math.pow(1 + r, n);
    return P * r * q / (q - 1);
  }

  // 毎月の返済を1回ずつ回し、残高が尽きるまでの利息と回数を出す。
  // extra を指定した回で一括返済（期間短縮型）を差し引く。
  function simulate(P, r, n, pay, extraAmount, extraMonth) {
    var bal = P, interest = 0, count = 0;
    for (var i = 1; i <= n * 2 + 12; i++) {
      if (bal <= 0) break;
      var int1 = bal * r;
      var pri = pay - int1;
      if (pri <= 0) return null; // 金利に対して返済額が足りない
      if (pri > bal) pri = bal;
      interest += int1;
      bal -= pri;
      count++;
      if (extraAmount > 0 && i === extraMonth) {
        bal -= extraAmount;
        if (bal < 0) bal = 0;
      }
    }
    return { interest: interest, count: count };
  }

  function clear(msg) {
    ["monthVal","totalVal","interestVal","ratioVal","countVal","firstIntVal",
     "firstPriVal","cutTermVal","cutIntVal"].forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    var P = ST.n(ST.$("principal")) * MAN;
    var annual = ST.n(ST.$("rate"));
    var years = ST.n(ST.$("years"));
    var n = Math.round(years * 12);
    var r = annual / 100 / 12;

    if (P <= 0 || n <= 0) return clear("借入額と返済期間を入力してください。");
    if (annual < 0) return clear("年利には0以上の値を入力してください。");

    var method = ST.pick("method");
    var firstInt = P * r;

    if (method === "ganri") {
      var pay = monthlyPayment(P, r, n);
      var total = pay * n;
      var interest = total - P;

      ST.$("mainLabel").textContent = "毎月の返済額";
      ST.set("monthVal", ST.yen(Math.round(pay), 0));
      ST.set("totalVal", ST.yen(Math.round(total), 0));
      ST.set("interestVal", ST.yen(Math.round(interest), 0));
      ST.set("ratioVal", ST.num(interest / P * 100, 1) + "%");
      ST.set("countVal", n + "回");
      ST.set("firstIntVal", ST.yen(Math.round(firstInt), 0));
      ST.set("firstPriVal", ST.yen(Math.round(pay - firstInt), 0));
      ST.set("detail", "毎月" + ST.yen(Math.round(pay), 0) + "を" + n + "回。" +
        "初回は返済額の" + ST.num(firstInt / pay * 100, 0) + "%が利息にあたります。");

      // 繰り上げ返済（期間短縮型）
      var extra = ST.n(ST.$("extra")) * MAN;
      var extraMonth = Math.round(ST.n(ST.$("extraAt")) * 12);
      if (extra > 0 && extraMonth > 0 && extraMonth < n) {
        var base = simulate(P, r, n, pay, 0, 0);
        var after = simulate(P, r, n, pay, extra, extraMonth);
        if (base && after) {
          var cutM = base.count - after.count;
          ST.set("cutTermVal", Math.floor(cutM / 12) + "年" + (cutM % 12) + "か月");
          ST.set("cutIntVal", ST.yen(Math.round(base.interest - after.interest), 0));
        } else {
          ST.set("cutTermVal", "-");
          ST.set("cutIntVal", "-");
        }
      } else {
        ST.set("cutTermVal", "-");
        ST.set("cutIntVal", "-");
      }
    } else {
      // 元金均等: 元金は毎回一定、利息は残高に応じて減る
      var pri = P / n;
      var firstPay = pri + firstInt;
      var lastPay = pri + pri * r;
      // 利息の総額 = 元金 × 月利 × (n+1) / 2
      var interest2 = pri * r * n * (n + 1) / 2;
      var total2 = P + interest2;

      ST.$("mainLabel").textContent = "初回の返済額（以後、毎月減っていきます）";
      ST.set("monthVal", ST.yen(Math.round(firstPay), 0));
      ST.set("totalVal", ST.yen(Math.round(total2), 0));
      ST.set("interestVal", ST.yen(Math.round(interest2), 0));
      ST.set("ratioVal", ST.num(interest2 / P * 100, 1) + "%");
      ST.set("countVal", n + "回");
      ST.set("firstIntVal", ST.yen(Math.round(firstInt), 0));
      ST.set("firstPriVal", ST.yen(Math.round(pri), 0));
      ST.set("detail", "初回" + ST.yen(Math.round(firstPay), 0) + "から始まり、" +
        "最終回は" + ST.yen(Math.round(lastPay), 0) + "まで下がります。" +
        "元金部分は毎回" + ST.yen(Math.round(pri), 0) + "で一定です。");
      ST.set("cutTermVal", "元利均等で計算されます");
      ST.set("cutIntVal", "-");
    }
  });
})();
`,

  intro: `
借入額・年利・返済期間を入れると、毎月の返済額と利息の総額が出ます。下では繰り上げ返済をしたときに、期間がどれだけ縮み、利息がいくら減るかも確認できます。
`,

  guide: `
## 元利均等返済の計算式

住宅ローンで最も多く使われる方式です。毎月の返済額が一定になるよう、元金と利息の内訳を調整します。

> **毎月返済額 = 借入額 × 月利 × (1 + 月利)^回数 ÷ ((1 + 月利)^回数 − 1)**

月利は「年利 ÷ 12 ÷ 100」です。年利1.5%なら月利は0.00125になります。

手計算はほぼ不可能な式ですが、考え方は単純です。**残高に対して毎月利息がつき、返済額から利息を引いた残りが元金の返済に回る**、というのを繰り返しているだけです。

## 元利均等と元金均等の違い

| | 元利均等 | 元金均等 |
|---|---|---|
| 毎月の返済額 | 一定 | 最初が多く、だんだん減る |
| 元金の減り方 | 最初は遅い | 一定のペース |
| 利息の総額 | **多い** | **少ない** |
| 借入時の審査 | 通りやすい | 初回返済額が大きく厳しめ |
| 家計管理 | しやすい | 変動するので計画が必要 |

3,000万円・年利1.5%・35年で比べると、総利息は元利均等が約857万円、元金均等が約790万円で、**70万円ほどの差**が出ます。

元金均等のほうが得ではありますが、初回の返済額が元利均等より2割ほど高くなります。返済開始直後がいちばん苦しい時期でもあるため、多くの人が元利均等を選んでいます。

## 最初の数年はほとんど利息を払っている

元利均等でいちばん実感しにくいのがこの点です。

3,000万円・年利1.5%・35年の場合、毎月の返済額は約91,855円ですが、その内訳は次のようになります。

| 時期 | 利息 | 元金 |
|---|---|---|
| 1回目 | 37,500円 | 54,355円 |
| 10年後 | 27,000円前後 | 65,000円前後 |
| 20年後 | 16,000円前後 | 76,000円前後 |
| 最終回 | 100円程度 | 91,700円程度 |

返済開始直後は、支払った額の4割が利息に消えます。**繰り上げ返済が早いほど効果が大きい** のは、この構造のためです。

## 繰り上げ返済の2つの型

- **期間短縮型**: 毎月の返済額はそのままで、返済期間を縮める。利息の削減効果が大きい
- **返済額軽減型**: 期間はそのままで、毎月の返済額を下げる。月々の負担が軽くなる

利息を減らしたいなら期間短縮型です。同じ100万円を繰り上げ返済しても、期間短縮型のほうが削減できる利息は2倍以上になることがあります。このツールは期間短縮型で計算しています。

ただし、住宅ローン控除を受けている期間は注意が必要です。控除は年末のローン残高に応じて計算されるため、繰り上げ返済で残高を減らすと控除額も減ります。控除期間が終わってから繰り上げるほうが有利になるケースがあります。

## 金利が1%違うとどうなるか

3,000万円・35年で借りた場合の総返済額の比較です。

| 年利 | 毎月返済額 | 総返済額 | 利息 |
|---|---|---|---|
| 0.5% | 約77,875円 | 約3,271万円 | 約271万円 |
| 1.0% | 約84,685円 | 約3,557万円 | 約557万円 |
| 1.5% | 約91,855円 | 約3,858万円 | 約858万円 |
| 2.0% | 約99,378円 | 約4,174万円 | 約1,174万円 |
| 3.0% | 約115,455円 | 約4,849万円 | 約1,849万円 |

金利が0.5%上がるだけで、総額が300万円前後変わります。借入額を100万円減らすより、金利を0.1%下げるほうが効果が大きいこともあるため、複数の金融機関を比較する価値があります。

## このツールで扱っていないもの

実際の住宅ローンには、以下の費用が別途かかります。返済額の試算にはこれらを足して考えてください。

- **保証料**: 借入額の2%前後、または金利に0.2%上乗せ
- **事務手数料**: 定額（3〜5万円）または借入額の2.2%
- **団体信用生命保険**: 金利に含まれることが多い
- **火災保険料**: 数十万円（一括払いの場合）
- **登記費用・印紙税**

また、変動金利を選んだ場合、このツールの計算はあくまで「その金利が最後まで続いた場合」の数字です。金利の見直しは通常年2回行われ、返済額の変更は5年ごとというルール（5年ルール）を採用している金融機関が多くあります。

> このツールの結果は一般的な計算式による目安です。実際の借入条件や返済計画は、金融機関にご確認ください。
`,

  faq: [
    {
      q: "元利均等と元金均等はどちらを選ぶべきですか？",
      a: "利息の総額は元金均等のほうが少なくなります。3,000万円・1.5%・35年で約70万円の差です。ただし元金均等は初回の返済額が2割ほど高くなるため、返済開始直後の負担を抑えたい場合は元利均等が選ばれます。",
    },
    {
      q: "繰り上げ返済はいつすると効果が大きいですか？",
      a: "早いほど効果が大きくなります。元利均等では返済開始直後ほど利息の割合が高く、そこで元金を減らすと、その後に発生するはずだった利息がまとめて消えるためです。",
    },
    {
      q: "期間短縮型と返済額軽減型はどちらが得ですか？",
      a: "利息の削減額では期間短縮型が有利で、同額を繰り上げた場合に2倍以上の差がつくこともあります。毎月の負担を軽くしたい場合は返済額軽減型を選びます。",
    },
    {
      q: "住宅ローン控除があっても繰り上げ返済したほうがいいですか？",
      a: "控除は年末のローン残高に応じて計算されるため、残高を減らすと控除額も減ります。控除率より借入金利が低い場合は、控除期間が終わってから繰り上げるほうが有利になることがあります。",
    },
    {
      q: "変動金利でも使えますか？",
      a: "入力した金利が最後まで続いた場合の試算として使えます。実際の変動金利は年2回見直されるため、金利が上がったときにいくらになるかを、金利を変えて何度か試算しておくと備えになります。",
    },
  ],
};
