export default {
  category: "math",
  updated: "2026-08-27",
  title: "平均・中央値・標準偏差の計算｜数値を貼り付けるだけ",
  h1: "平均・標準偏差の計算ツール",
  description:
    "数値を貼り付けると、平均・中央値・最大最小・標準偏差をまとめて計算します。偏差値の算出や、データのばらつきを確認したいときに使える無料ツールです。",
  cardText: "数値リストから平均・中央値・標準偏差を計算。",
  keywords: [
    "平均", "中央値", "標準偏差", "計算", "偏差値", "分散", "統計", "ばらつき", "最頻値",
  ],
  related: ["percent-keisan", "hiritsu-anbun"],

  ui: `
<div class="field">
  <label for="src">数値（改行・カンマ・スペース区切り）</label>
  <textarea id="src" style="min-height:120px">72
85
64
90
78
55
88
70</textarea>
  <p class="hint">Excelの列をそのまま貼り付けられます。</p>
</div>

<div class="field">
  <span class="field-label">標準偏差の種類</span>
  <div class="pills" id="type">
    <label><input type="radio" name="type" value="population" checked>母標準偏差（全体のデータ）</label>
    <label><input type="radio" name="type" value="sample">標本標準偏差（抜き取り調査）</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">平均値</div>
  <div class="result-main" id="meanVal">-</div>
  <div class="result-grid">
    <div><div class="k">データの個数</div><div class="v" id="countVal">-</div></div>
    <div><div class="k">合計</div><div class="v" id="sumVal">-</div></div>
    <div><div class="k">中央値</div><div class="v" id="medianVal">-</div></div>
    <div><div class="k">最頻値</div><div class="v" id="modeVal">-</div></div>
    <div><div class="k">最大値</div><div class="v" id="maxVal">-</div></div>
    <div><div class="k">最小値</div><div class="v" id="minVal">-</div></div>
    <div><div class="k">標準偏差</div><div class="v" id="sdVal">-</div></div>
    <div><div class="k">分散</div><div class="v" id="varVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>ある値の偏差値を調べる</h3>
<div class="field">
  <label for="target">対象の数値</label>
  <input type="number" id="target" inputmode="decimal" value="85" step="1">
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="hensachiVal" style="font-size:26px">-</div>
  <p class="result-sub" id="hensachiDetail"></p>
</div>

<h3>データの分布</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>範囲</th><th>個数</th><th>割合</th><th>グラフ</th></tr></thead>
    <tbody id="histTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  function parseNums(s) {
    return String(s).split(/[\\s,、]+/)
      // 空文字を先に落とす。Number("") は 0 になるため、
      // 未入力が「0というデータ1件」として数えられてしまう。
      .filter(function (x) { return x !== ""; })
      .map(function (x) { return Number(x); })
      .filter(function (x) { return isFinite(x); });
  }

  function clear(msg) {
    ["meanVal","countVal","sumVal","medianVal","modeVal","maxVal","minVal","sdVal","varVal",
     "hensachiVal"].forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
    ST.set("hensachiDetail", "");
    ST.$("histTable").innerHTML = "";
  }

  ST.live(function () {
    var nums = parseNums(ST.$("src").value);
    if (!nums.length) return clear("数値を入力してください。");

    var n = nums.length;
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    var mean = sum / n;

    var sorted = nums.slice().sort(function (a, b) { return a - b; });
    var median = n % 2
      ? sorted[(n - 1) / 2]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

    // 最頻値。同数のものが複数あればすべて並べる
    var freq = {};
    nums.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; });
    var maxFreq = Math.max.apply(null, Object.keys(freq).map(function (k) { return freq[k]; }));
    var modes = Object.keys(freq).filter(function (k) { return freq[k] === maxFreq; })
      .map(Number).sort(function (a, b) { return a - b; });

    // 分散。標本の場合は n-1 で割る（不偏分散）
    var isSample = ST.pick("type") === "sample";
    var divisor = isSample ? Math.max(1, n - 1) : n;
    var variance = nums.reduce(function (a, v) {
      return a + Math.pow(v - mean, 2);
    }, 0) / divisor;
    var sd = Math.sqrt(variance);

    ST.set("meanVal", ST.num(mean, 4));
    ST.set("countVal", ST.num(n, 0) + " 個");
    ST.set("sumVal", ST.num(sum, 4));
    ST.set("medianVal", ST.num(median, 4));
    ST.set("modeVal", maxFreq === 1 ? "なし（すべて1回）"
      : modes.slice(0, 5).map(function (m) { return ST.num(m, 3); }).join(", ") +
        "（" + maxFreq + "回）");
    ST.set("maxVal", ST.num(sorted[n - 1], 4));
    ST.set("minVal", ST.num(sorted[0], 4));
    ST.set("sdVal", ST.num(sd, 4));
    ST.set("varVal", ST.num(variance, 4));
    ST.set("detail",
      (isSample
        ? "標本標準偏差（n−1で割る）で計算しています。母集団から抜き取った一部のデータを扱う場合はこちらです。"
        : "母標準偏差（nで割る）で計算しています。対象の全データが揃っている場合はこちらです。") +
      "平均から標準偏差1つ分の範囲（" + ST.num(mean - sd, 2) + " 〜 " +
      ST.num(mean + sd, 2) + "）に、正規分布ならおよそ68%が入ります。");

    // 偏差値
    var t = ST.n(ST.$("target"));
    if (sd === 0) {
      ST.set("hensachiVal", "-");
      ST.set("hensachiDetail", "すべての値が同じため、偏差値は計算できません。");
    } else {
      var hensachi = (t - mean) / sd * 10 + 50;
      var above = nums.filter(function (v) { return v > t; }).length;
      ST.set("hensachiVal", "偏差値 " + ST.num(hensachi, 2));
      ST.set("hensachiDetail",
        "計算式: (" + ST.num(t, 3) + " − 平均 " + ST.num(mean, 3) + ") ÷ 標準偏差 " +
        ST.num(sd, 3) + " × 10 + 50 = " + ST.num(hensachi, 2) +
        "。このデータの中では上から " + (above + 1) + " 番目（" + n + "件中）です。");
    }

    // 度数分布（10区分）
    var lo = sorted[0], hi = sorted[n - 1];
    if (hi === lo) {
      ST.$("histTable").innerHTML = "<tr><td>" + ST.num(lo, 3) +
        "</td><td>" + n + "</td><td>100%</td><td>████████</td></tr>";
      return;
    }
    var bins = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(n))));
    var width = (hi - lo) / bins;
    var counts = new Array(bins).fill(0);
    nums.forEach(function (v) {
      var idx = Math.min(bins - 1, Math.floor((v - lo) / width));
      counts[idx]++;
    });
    var maxCount = Math.max.apply(null, counts);
    ST.$("histTable").innerHTML = counts.map(function (c, i) {
      var from = lo + width * i;
      var to = i === bins - 1 ? hi : lo + width * (i + 1);
      var bar = "█".repeat(Math.round(c / maxCount * 20));
      return "<tr><td>" + ST.num(from, 2) + " 〜 " + ST.num(to, 2) +
        "</td><td>" + c + "</td><td>" + ST.num(c / n * 100, 1) +
        "%</td><td style=\\"letter-spacing:-1px;color:var(--accent)\\">" + bar + "</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
数値を貼り付けると、平均・中央値・標準偏差などをまとめて計算します。**Excelの列をそのままコピーして貼れます。** 下では特定の値の偏差値も調べられます。
`,

  guide: `
## 平均値と中央値の違い

| 指標 | 求め方 | 特徴 |
|---|---|---|
| **平均値** | 合計 ÷ 個数 | 全データを反映するが、極端な値に引っ張られる |
| **中央値** | 小さい順に並べた真ん中の値 | 極端な値の影響を受けにくい |
| **最頻値** | 最も多く現れる値 | 分布の山がどこにあるかを示す |

年収のように **一部に極端に大きい値がある** データでは、平均値と中央値が大きく離れます。

日本の世帯年収を例にすると、平均は約540万円ですが、中央値は約420万円です。100万円超の高所得世帯が平均を押し上げているためで、**「平均的な世帯」の実感に近いのは中央値** です。

「平均年収」という言葉を見たときは、それが平均なのか中央値なのかを確認する価値があります。

## 標準偏差とは

データが平均からどれくらい散らばっているかを表す数値です。

> **標準偏差 = √( (各データ − 平均)² の合計 ÷ 個数 )**

同じ平均60点でも、

- 全員が58〜62点 → 標準偏差は小さい（2点程度）
- 30点の人も90点の人もいる → 標準偏差は大きい（20点程度）

という違いを数値で表せます。

データが正規分布に近い場合、次の目安が成り立ちます。

| 範囲 | 含まれる割合 |
|---|---|
| 平均 ± 標準偏差1つ分 | 約68% |
| 平均 ± 標準偏差2つ分 | 約95% |
| 平均 ± 標準偏差3つ分 | 約99.7% |

平均60点・標準偏差10点のテストなら、50〜70点に約7割の受験者が収まる、ということです。

## 母標準偏差と標本標準偏差

割る数が違います。

- **母標準偏差（nで割る）**: 対象となる全データが揃っている場合。クラス全員の点数など
- **標本標準偏差（n−1で割る）**: 全体の一部を抜き取って調べた場合。アンケート調査など

なぜ標本では n−1 で割るかというと、標本から計算した平均は母集団の平均とわずかにずれており、そのままだとばらつきを小さく見積もってしまうためです。n−1 で割ることでこの偏りが補正されます（不偏分散）。

Excelでは **STDEV.P** が母標準偏差、**STDEV.S** が標本標準偏差にあたります。

## 偏差値の計算

> **偏差値 = (自分の点数 − 平均点) ÷ 標準偏差 × 10 + 50**

平均点をとった人が偏差値50、標準偏差1つ分だけ上なら偏差値60になります。

| 偏差値 | 上位からの割合（正規分布の場合） |
|---|---|
| 70 | 約2.3% |
| 65 | 約6.7% |
| 60 | 約15.9% |
| 55 | 約30.9% |
| 50 | 50%（ちょうど真ん中） |
| 40 | 約84.1% |

**偏差値は集団の中での位置を示す指標** です。同じ点数でも、受験者のレベルが変われば偏差値は変わります。難しいテストで平均点が下がれば、同じ点数でも偏差値は上がります。

なお、正規分布から外れた集団では、偏差値が100を超えたり0を下回ったりすることもあります。

## 分散との関係

**分散 = 標準偏差の2乗** です。

計算の途中では分散を使いますが、単位が元のデータの2乗（点数なら「点²」）になってしまい直感的でないため、最後に平方根をとって標準偏差に戻します。標準偏差なら元のデータと同じ単位で比較できます。

## 使いどころ

- **品質管理**: 製品の寸法のばらつきを監視する
- **投資**: 価格変動の大きさ（ボラティリティ）を測る
- **テストの評価**: 平均点だけでなく、点差の開き具合を見る
- **売上分析**: 月ごとの変動が大きいか小さいかを判断する

平均値だけを見て判断すると、ばらつきの大きさを見落とします。**平均と標準偏差はセットで見る** のが基本です。
`,

  faq: [
    {
      q: "平均値と中央値はどちらを使うべきですか？",
      a: "極端に大きい（小さい）値が含まれるデータでは中央値のほうが実感に近くなります。年収や資産のように一部に大きな値があるデータでは、平均値は上に引っ張られます。",
    },
    {
      q: "標準偏差は何を表していますか？",
      a: "データが平均からどれくらい散らばっているかです。正規分布なら、平均±標準偏差1つ分の範囲に約68%、2つ分で約95%のデータが収まります。",
    },
    {
      q: "母標準偏差と標本標準偏差はどう使い分けますか？",
      a: "対象の全データが揃っているなら母標準偏差（nで割る）、一部を抜き取った調査なら標本標準偏差（n−1で割る）です。ExcelではSTDEV.PとSTDEV.Sに対応します。",
    },
    {
      q: "偏差値はどう計算しますか？",
      a: "(自分の点数 − 平均点) ÷ 標準偏差 × 10 + 50 です。平均点なら50、標準偏差1つ分上なら60になります。集団の中での位置を示す指標なので、受験者のレベルによって同じ点数でも変わります。",
    },
    {
      q: "分散と標準偏差の違いは何ですか？",
      a: "標準偏差は分散の平方根です。分散は単位が元データの2乗になり直感的でないため、平方根をとって元と同じ単位に戻したものが標準偏差です。",
    },
  ],
};
