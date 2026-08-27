export default {
  category: "unit",
  updated: "2026-08-27",
  title: "靴のサイズ変換｜日本・US・UK・EUの対応表",
  h1: "靴のサイズ変換ツール",
  description:
    "日本のcm表記と、US・UK・EUのサイズを相互に変換します。メンズとレディースで基準が違う点や、足長の測り方も解説した無料ツールです。",
  cardText: "日本cm⇔US・UK・EUの靴サイズを変換。",
  keywords: [
    "靴", "サイズ", "変換", "US", "UK", "EU", "cm", "スニーカー", "海外", "対応表",
  ],
  related: ["inch-cm", "tsubo-heibei"],

  ui: `
<div class="row">
  <div class="field">
    <span class="field-label">区分</span>
    <div class="pills" id="sex">
      <label><input type="radio" name="sex" value="m" checked>メンズ</label>
      <label><input type="radio" name="sex" value="w">レディース</label>
    </div>
  </div>
</div>

<div class="row">
  <div class="field">
    <label for="jp">日本（cm）</label>
    <input type="number" id="jp" inputmode="decimal" value="26" step="0.5">
  </div>
  <div class="field">
    <label for="us">US</label>
    <input type="number" id="us" inputmode="decimal" value="8" step="0.5">
  </div>
  <div class="field">
    <label for="uk">UK</label>
    <input type="number" id="uk" inputmode="decimal" value="7" step="0.5">
  </div>
  <div class="field">
    <label for="eu">EU</label>
    <input type="number" id="eu" inputmode="decimal" value="41" step="0.5">
  </div>
</div>
<p class="hint">どの欄に入力しても、ほかが自動で計算されます。</p>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">日本</div><div class="v" id="rJp">-</div></div>
    <div><div class="k">US</div><div class="v" id="rUs">-</div></div>
    <div><div class="k">UK</div><div class="v" id="rUk">-</div></div>
    <div><div class="k">EU（フランス式）</div><div class="v" id="rEu">-</div></div>
    <div><div class="k">インチ</div><div class="v" id="rInch">-</div></div>
    <div><div class="k">モンドポイント</div><div class="v" id="rMondo">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>対応表</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>日本(cm)</th><th>US</th><th>UK</th><th>EU</th></tr></thead>
    <tbody id="sizeTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var lock = false;

  // 各規格は「足長(cm)」を基準に近似式で換算する。
  // メーカーごとの差が大きいため、あくまで目安。
  var RULES = {
    m: { us: function (cm) { return cm - 18; },
         cmFromUs: function (us) { return us + 18; },
         uk: function (cm) { return cm - 19; },
         cmFromUk: function (uk) { return uk + 19; },
         eu: function (cm) { return cm * 1.5 + 2; },
         cmFromEu: function (eu) { return (eu - 2) / 1.5; },
         label: "メンズ" },
    w: { us: function (cm) { return cm - 17; },
         cmFromUs: function (us) { return us + 17; },
         uk: function (cm) { return cm - 18.5; },
         cmFromUk: function (uk) { return uk + 18.5; },
         eu: function (cm) { return cm * 1.5 + 2; },
         cmFromEu: function (eu) { return (eu - 2) / 1.5; },
         label: "レディース" }
  };

  function rule() { return RULES[ST.pick("sex")] || RULES.m; }
  function half(n) { return Math.round(n * 2) / 2; }

  function render(cm, from) {
    var r = rule();
    lock = true;
    if (from !== "jp") ST.$("jp").value = half(cm);
    if (from !== "us") ST.$("us").value = half(r.us(cm));
    if (from !== "uk") ST.$("uk").value = half(r.uk(cm));
    if (from !== "eu") ST.$("eu").value = half(r.eu(cm));
    lock = false;

    ST.set("rJp", ST.num(cm, 1) + " cm");
    ST.set("rUs", ST.num(r.us(cm), 1));
    ST.set("rUk", ST.num(r.uk(cm), 1));
    ST.set("rEu", ST.num(r.eu(cm), 1));
    ST.set("rInch", ST.num(cm / 2.54, 2) + " インチ");
    ST.set("rMondo", ST.num(Math.round(cm * 10), 0));
    ST.set("detail", r.label + "の基準で換算しています。" +
      "メーカーや靴の種類によって1サイズ前後の差があるため、" +
      "実際に購入するときは、その商品のサイズ表を確認してください。");

    // 対応表（前後6段）
    var base = Math.round(cm * 2) / 2;
    var rows = "";
    for (var i = -4; i <= 4; i++) {
      var c = base + i * 0.5;
      if (c < 10 || c > 35) continue;
      var hit = Math.abs(c - cm) < 0.25;
      rows += "<tr" + (hit ? ' style="font-weight:700"' : "") + "><td>" +
        ST.num(c, 1) + "</td><td>" + ST.num(half(r.us(c)), 1) + "</td><td>" +
        ST.num(half(r.uk(c)), 1) + "</td><td>" + ST.num(half(r.eu(c)), 1) + "</td></tr>";
    }
    ST.$("sizeTable").innerHTML = rows;
  }

  ST.$("jp").addEventListener("input", function () {
    if (!lock) render(ST.n(ST.$("jp")), "jp");
  });
  ST.$("us").addEventListener("input", function () {
    if (!lock) render(rule().cmFromUs(ST.n(ST.$("us"))), "us");
  });
  ST.$("uk").addEventListener("input", function () {
    if (!lock) render(rule().cmFromUk(ST.n(ST.$("uk"))), "uk");
  });
  ST.$("eu").addEventListener("input", function () {
    if (!lock) render(rule().cmFromEu(ST.n(ST.$("eu"))), "eu");
  });
  document.querySelectorAll('input[name="sex"]').forEach(function (el) {
    el.addEventListener("change", function () { render(ST.n(ST.$("jp")), "jp"); });
  });

  render(ST.n(ST.$("jp")), "jp");
})();
`,

  intro: `
日本のcm表記と、US・UK・EUのサイズを相互に変換します。**メンズとレディースで基準が違う**ため、区分を選んでから使ってください。
`,

  guide: `
## 規格ごとの考え方の違い

靴のサイズは国によって基準が異なります。同じ「8」でも、USとUKでは指すサイズが違います。

| 規格 | 基準 | 特徴 |
|---|---|---|
| **日本（JIS）** | 足の実寸（足長cm） | 最も分かりやすい。0.5cm刻み |
| **US** | 靴の内寸（インチ由来） | メンズとレディースで基準が違う |
| **UK** | 靴の内寸（バーレイコーン） | USより約1小さい数字 |
| **EU（パリポイント）** | 靴の全長（1ポイント=2/3cm） | 数字が大きく、刻みが粗い |

日本のサイズだけが **足そのものの長さ** を表しています。海外の規格は靴の内側や外側の長さを基準にしているため、同じ足でも表記が変わります。

## 主な対応（メンズ）

| 日本(cm) | US | UK | EU |
|---|---|---|---|
| 24.0 | 6 | 5 | 38 |
| 25.0 | 7 | 6 | 39.5 |
| 26.0 | 8 | 7 | 41 |
| 27.0 | 9 | 8 | 42.5 |
| 28.0 | 10 | 9 | 44 |
| 29.0 | 11 | 10 | 45.5 |

## 主な対応（レディース）

| 日本(cm) | US | UK | EU |
|---|---|---|---|
| 22.0 | 5 | 3.5 | 35 |
| 23.0 | 6 | 4.5 | 36.5 |
| 24.0 | 7 | 5.5 | 38 |
| 25.0 | 8 | 6.5 | 39.5 |

**USサイズはメンズとレディースで約1.5の差** があります。同じ足長でも、レディースのほうが数字が大きくなる点に注意してください。海外通販でユニセックスのスニーカーを買う場合、どちらの基準で表記されているかを確認しないと、1.5サイズずれることになります。

## 足長の測り方

正確なサイズを知るには、実際に足を測るのが確実です。

1. 紙を床に置き、かかとを壁につけて立つ
2. 体重を両足に均等にかける（座って測ると小さく出ます）
3. いちばん長い指の先に印をつける
4. 壁から印までの距離を測る

**夕方に測る** のがおすすめです。足は日中の活動でむくみ、朝より0.5〜1cm大きくなります。夕方の足に合わせておくと、1日を通して快適に履けます。

左右で長さが違うのは普通のことです。**大きいほうの足に合わせて** 選んでください。

## 足囲（ワイズ）も重要

日本の靴には、足長のほかに **足囲（ワイズ）** の表記があります。親指と小指の付け根を通る周囲の長さです。

- **A、B、C、D、E、EE、EEE、EEEE、F、G** の順に太くなる
- 日本人男性の標準は **EE**、女性は **E** 前後とされます
- 海外ブランドは日本の標準より細めに作られていることが多い

「長さは合っているのにきつい」という場合、足長ではなく足囲が原因です。海外ブランドの靴で幅が窮屈に感じるときは、0.5cm大きいサイズを選ぶより、ワイズ展開のあるモデルを探すほうが失敗しません。

## メーカーによる差

同じ26.0cm表記でも、ブランドによって実際の大きさは変わります。

- **スニーカー**: 大きめに作られていることが多く、実寸に近いサイズでよい
- **革靴**: つま先の形状によって変わる。ポインテッドトゥは0.5cm大きめを選ぶことが多い
- **ランニングシューズ**: つま先に1cm程度の余裕（捨て寸）を持たせるのが一般的
- **ブーツ**: 厚手の靴下を想定して0.5cm大きめ

同じブランドでもモデルによって差があるため、**そのモデルのサイズ表を確認する** のが最も確実です。海外通販ではレビューに「ワンサイズ小さめ」といった情報が書かれていることも多く、参考になります。

## 子ども靴のサイズについて

このツールは大人向けの換算です。**子ども靴のUSサイズは扱っていません。**

US表記の子ども靴は、足の成長に合わせて次の3段階に分かれており、境目で数字が1に戻ります。

- **Toddler（幼児）**: US 1〜13.5
- **Little Kid（幼児〜小学校低学年）**: US 10〜3
- **Big Kid（小学校高学年）**: US 1〜7

19cmがUS13、20cmがUS1というように **途中で数字がリセットされる** ため、単純な計算式で換算できません。子ども靴を海外から買う場合は、必ずそのブランドのサイズ表で足長（cm または mm）から確認してください。

なお、子どもの足は半年で0.5〜1cm伸びます。大きすぎる靴は歩き方に影響するため、つま先に5〜10mm程度の余裕にとどめ、こまめに足の実寸を測り直すことが推奨されています。

## モンドポイント

登山靴やスキーブーツで使われる表記で、**足長をミリメートルで表した数値** です。26.0cmなら260になります。最も直感的な規格ですが、一般の靴ではあまり使われていません。
`,

  faq: [
    {
      q: "US8は日本では何cmですか？",
      a: "メンズなら26.0cm、レディースなら約24.5cmです。USサイズはメンズとレディースで約1.5の差があるため、どちらの基準かを確認してください。",
    },
    {
      q: "USとUKのサイズはどう違いますか？",
      a: "同じ足長でも、UKのほうが数字が約1小さくなります。US8はUK7に相当します。どちらもインチ由来の基準ですが、起点が異なるためです。",
    },
    {
      q: "足のサイズはいつ測るのがよいですか？",
      a: "夕方がおすすめです。足は日中の活動でむくみ、朝より0.5〜1cm大きくなります。また立った状態で測ってください。座って測ると体重がかからず小さく出ます。",
    },
    {
      q: "長さは合っているのにきついのはなぜですか？",
      a: "足囲（ワイズ）が合っていない可能性が高いです。日本人男性の標準はEE、女性はE前後ですが、海外ブランドは細めに作られていることが多くなっています。サイズを上げるより、ワイズ展開のあるモデルを選ぶほうが確実です。",
    },
    {
      q: "この換算表どおりに買えば失敗しませんか？",
      a: "あくまで目安です。メーカーや靴の種類によって1サイズ前後の差があります。特に革靴とスニーカーでは基準が違うため、購入前にそのモデルのサイズ表を確認してください。",
    },
  ],
};
