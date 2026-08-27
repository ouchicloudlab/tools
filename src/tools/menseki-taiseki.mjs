export default {
  category: "math",
  updated: "2026-08-27",
  title: "面積・体積の計算｜長方形・円・三角形から容量まで",
  h1: "面積・体積の計算ツール",
  description:
    "長方形・円・三角形・台形の面積と、直方体・円柱・球の体積を計算します。水槽が何リットル入るか、部屋が何畳かも同時に表示する無料ツールです。",
  cardText: "図形の面積と体積を計算。リットル換算つき。",
  keywords: [
    "面積", "体積", "計算", "円", "三角形", "台形", "円柱", "リットル", "容量", "平米",
  ],
  related: ["tsubo-heibei", "bunsu-keisan"],

  ui: `
<h3 style="margin-top:0">面積</h3>
<div class="field">
  <label for="shape">図形</label>
  <select id="shape">
    <option value="rect" selected>長方形・正方形</option>
    <option value="circle">円</option>
    <option value="triangle">三角形</option>
    <option value="trapezoid">台形</option>
    <option value="parallelogram">平行四辺形</option>
    <option value="ellipse">楕円</option>
  </select>
</div>
<div class="row">
  <div class="field" id="fA"><label for="a">A</label>
    <input type="number" id="a" inputmode="decimal" value="300" step="1"></div>
  <div class="field" id="fB"><label for="b">B</label>
    <input type="number" id="b" inputmode="decimal" value="200" step="1"></div>
  <div class="field" id="fC" hidden><label for="c">C</label>
    <input type="number" id="c" inputmode="decimal" value="100" step="1"></div>
  <div class="field">
    <label for="unit">単位</label>
    <select id="unit">
      <option value="0.1">mm</option>
      <option value="1" selected>cm</option>
      <option value="100">m</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">面積</div>
  <div class="result-main" id="areaVal">-</div>
  <div class="result-grid">
    <div><div class="k">平方メートル</div><div class="v" id="m2Val">-</div></div>
    <div><div class="k">坪</div><div class="v" id="tsuboVal">-</div></div>
    <div><div class="k">畳（1.62㎡）</div><div class="v" id="joVal">-</div></div>
    <div><div class="k">周囲の長さ</div><div class="v" id="periVal">-</div></div>
  </div>
  <p class="result-sub" id="areaDetail"></p>
</div>

<h3>体積・容量</h3>
<div class="field">
  <label for="solid">立体</label>
  <select id="solid">
    <option value="box" selected>直方体・立方体</option>
    <option value="cylinder">円柱</option>
    <option value="sphere">球</option>
    <option value="cone">円錐</option>
  </select>
</div>
<div class="row">
  <div class="field" id="gA"><label for="x">A</label>
    <input type="number" id="x" inputmode="decimal" value="60" step="1"></div>
  <div class="field" id="gB"><label for="y">B</label>
    <input type="number" id="y" inputmode="decimal" value="30" step="1"></div>
  <div class="field" id="gC"><label for="z">C</label>
    <input type="number" id="z" inputmode="decimal" value="36" step="1"></div>
  <div class="field">
    <label for="unit2">単位</label>
    <select id="unit2">
      <option value="0.1">mm</option>
      <option value="1" selected>cm</option>
      <option value="100">m</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">体積</div>
  <div class="result-main" id="volVal">-</div>
  <div class="result-grid">
    <div><div class="k">リットル</div><div class="v" id="literVal">-</div></div>
    <div><div class="k">立方メートル</div><div class="v" id="m3Val">-</div></div>
    <div><div class="k">水を入れた場合の重さ</div><div class="v" id="weightVal">-</div></div>
    <div><div class="k">表面積</div><div class="v" id="surfVal">-</div></div>
  </div>
  <p class="result-sub" id="volDetail"></p>
</div>
`,

  script: `
(function () {
  var PI = Math.PI;

  // 図形ごとの入力欄のラベル。null は非表示。
  var SHAPES = {
    rect: { labels: ["よこ", "たて", null], name: "長方形" },
    circle: { labels: ["半径", null, null], name: "円" },
    triangle: { labels: ["底辺", "高さ", null], name: "三角形" },
    trapezoid: { labels: ["上底", "下底", "高さ"], name: "台形" },
    parallelogram: { labels: ["底辺", "高さ", null], name: "平行四辺形" },
    ellipse: { labels: ["長半径", "短半径", null], name: "楕円" }
  };
  var SOLIDS = {
    box: { labels: ["よこ", "たて", "高さ"], name: "直方体" },
    cylinder: { labels: ["半径", "高さ", null], name: "円柱" },
    sphere: { labels: ["半径", null, null], name: "球" },
    cone: { labels: ["半径", "高さ", null], name: "円錐" }
  };

  function applyLabels(def, ids, fieldIds) {
    for (var i = 0; i < 3; i++) {
      var label = def.labels[i];
      var field = ST.$(fieldIds[i]);
      if (!label) { field.hidden = true; continue; }
      field.hidden = false;
      field.querySelector("label").textContent = label;
    }
  }

  ST.live(function () {
    // ---- 面積 ----
    var sh = SHAPES[ST.$("shape").value];
    applyLabels(sh, ["a", "b", "c"], ["fA", "fB", "fC"]);
    var u = Number(ST.$("unit").value) || 1;   // cm換算の係数
    var a = ST.n(ST.$("a")) * u;
    var b = ST.n(ST.$("b")) * u;
    var c = ST.n(ST.$("c")) * u;

    var area = 0, peri = 0, formula = "";
    var key = ST.$("shape").value;
    if (key === "rect") {
      area = a * b; peri = (a + b) * 2;
      formula = "よこ × たて";
    } else if (key === "circle") {
      area = PI * a * a; peri = 2 * PI * a;
      formula = "半径 × 半径 × 円周率";
    } else if (key === "triangle") {
      area = a * b / 2; peri = 0;
      formula = "底辺 × 高さ ÷ 2";
    } else if (key === "trapezoid") {
      area = (a + b) * c / 2; peri = 0;
      formula = "(上底 + 下底) × 高さ ÷ 2";
    } else if (key === "parallelogram") {
      area = a * b; peri = 0;
      formula = "底辺 × 高さ";
    } else {
      area = PI * a * b; peri = 0;
      formula = "長半径 × 短半径 × 円周率";
    }

    var m2 = area / 10000;
    ST.set("areaVal", ST.num(area, 2) + " cm²");
    ST.set("m2Val", ST.num(m2, 4) + " ㎡");
    ST.set("tsuboVal", ST.num(m2 / (400 / 121), 3) + " 坪");
    ST.set("joVal", ST.num(m2 / 1.62, 2) + " 畳");
    ST.set("periVal", peri > 0 ? ST.num(peri, 2) + " cm" : "—");
    ST.set("areaDetail", sh.name + "の面積 = " + formula + "。" +
      "入力はすべてcmに換算して計算しています。");

    // ---- 体積 ----
    var so = SOLIDS[ST.$("solid").value];
    applyLabels(so, ["x", "y", "z"], ["gA", "gB", "gC"]);
    var u2 = Number(ST.$("unit2").value) || 1;
    var x = ST.n(ST.$("x")) * u2;
    var y = ST.n(ST.$("y")) * u2;
    var z = ST.n(ST.$("z")) * u2;

    var vol = 0, surf = 0, f2 = "";
    var k2 = ST.$("solid").value;
    if (k2 === "box") {
      vol = x * y * z;
      surf = 2 * (x * y + y * z + z * x);
      f2 = "よこ × たて × 高さ";
    } else if (k2 === "cylinder") {
      vol = PI * x * x * y;
      surf = 2 * PI * x * x + 2 * PI * x * y;
      f2 = "半径 × 半径 × 円周率 × 高さ";
    } else if (k2 === "sphere") {
      vol = 4 / 3 * PI * x * x * x;
      surf = 4 * PI * x * x;
      f2 = "4 ÷ 3 × 円周率 × 半径³";
    } else {
      vol = PI * x * x * y / 3;
      var slant = Math.sqrt(x * x + y * y);
      surf = PI * x * x + PI * x * slant;
      f2 = "半径 × 半径 × 円周率 × 高さ ÷ 3";
    }

    ST.set("volVal", ST.num(vol, 2) + " cm³");
    ST.set("literVal", ST.num(vol / 1000, 3) + " L");
    ST.set("m3Val", ST.num(vol / 1000000, 6) + " ㎥");
    ST.set("weightVal", ST.num(vol / 1000, 2) + " kg");
    ST.set("surfVal", ST.num(surf, 2) + " cm²");
    ST.set("volDetail", so.name + "の体積 = " + f2 + "。" +
      "1000cm³ = 1リットルで、水なら1リットルが約1kgです。");
  });
})();
`,

  intro: `
図形を選んで寸法を入れると、面積や体積が計算されます。**リットル・坪・畳への換算**も同時に表示するので、水槽の容量や部屋の広さを調べるときにそのまま使えます。
`,

  guide: `
## 面積の公式

| 図形 | 公式 |
|---|---|
| 正方形・長方形 | よこ × たて |
| 三角形 | 底辺 × 高さ ÷ 2 |
| 平行四辺形 | 底辺 × 高さ |
| 台形 | (上底 + 下底) × 高さ ÷ 2 |
| 円 | 半径 × 半径 × 3.14 |
| 楕円 | 長半径 × 短半径 × 3.14 |

**三角形と平行四辺形の「高さ」は、斜辺の長さではありません。** 底辺に対して垂直に測った長さです。ここを取り違えると、実際より大きな面積が出ます。

台形の公式が「(上底＋下底)÷2 × 高さ」の形をしているのは、上底と下底の平均を「平均的な横幅」とみなして、高さを掛けているからです。同じ台形を2つ組み合わせると平行四辺形になる、という説明でも同じ結果が得られます。

## 体積の公式

| 立体 | 公式 |
|---|---|
| 直方体・立方体 | よこ × たて × 高さ |
| 円柱 | 半径² × 3.14 × 高さ |
| 球 | 4 ÷ 3 × 3.14 × 半径³ |
| 円錐 | 半径² × 3.14 × 高さ ÷ 3 |
| 角錐 | 底面積 × 高さ ÷ 3 |

**錐（すい）の体積は、同じ底面と高さを持つ柱の3分の1** になります。円錐は円柱の1/3、四角錐は直方体の1/3です。この関係を覚えておくと、公式を思い出しやすくなります。

## 単位の関係（ここが最も間違えやすい）

長さが10倍になると、面積は100倍、体積は1000倍になります。

| 長さ | 面積 | 体積 |
|---|---|---|
| 1cm = 10mm | 1cm² = 100mm² | 1cm³ = 1,000mm³ |
| 1m = 100cm | 1㎡ = 10,000cm² | 1㎥ = 1,000,000cm³ |

「1㎡は100cm²」と思ってしまうのがよくある誤りです。正しくは **10,000cm²** です。1辺が100cmの正方形なので、100 × 100 = 10,000 になります。

## 体積と容量

- **1,000cm³ = 1リットル**
- **1㎥ = 1,000リットル**
- **1cm³ = 1ml（cc）**

水の場合、**1リットルがちょうど1kg** です。これはメートル法が「水1リットルの質量を1kgとする」という考え方で設計されたためです。

この関係を知っていると、身の回りの容量をすぐに重さに変換できます。

- 2Lのペットボトル → 約2kg
- 60cm水槽（60×30×36cm）→ 64.8L → **約65kg**
- 家庭用の浴槽（200L）→ 約200kg

水槽やウォーターサーバーを置く場所を決めるときは、床の耐荷重を考える必要があります。一般的な木造住宅の床は1㎡あたり180kgを想定して設計されているため、大型水槽は設置場所を選びます。

## 円周率をどこまで使うか

小学校では3.14を使いますが、このツールは JavaScript の \`Math.PI\`（3.141592653589793）で計算しています。手計算で3.14を使った結果とは、わずかに差が出ます。

- 半径10cmの円: 3.14を使うと314cm²、正確な値では314.159cm²

実用上はほとんど影響しませんが、大きな円を扱うときは差が広がります。半径10mの円では、3.14で計算すると314㎡、正確には314.16㎡で、0.16㎡（約0.05坪）の差になります。

## 実際に使う場面

- **カーペットやクロスの必要量**: 部屋の面積を出し、ロスを見込んで1割増しで手配する
- **塗料の量**: 壁の面積 ÷ 塗料の塗布面積（1L あたり10㎡前後）
- **水槽の水量**: 内寸で計算し、砂利やレイアウト分として1割ほど引く
- **コンクリートの量**: 打設する範囲の体積を㎥で出す（生コンは㎥単位で注文します）
- **土や砂の量**: 花壇の体積を求め、袋のリットル表記と照らし合わせる

いずれも、**内寸と外寸を取り違えない** ことが大切です。水槽やプランターの容量は内寸で計算してください。
`,

  faq: [
    {
      q: "1平方メートルは何平方センチメートルですか？",
      a: "10,000cm²です。100cm²ではありません。1辺100cmの正方形なので、100×100=10,000になります。長さが100倍になると面積は10,000倍です。",
    },
    {
      q: "水槽の水量はどう計算しますか？",
      a: "内寸で「よこ×たて×高さ」を計算し、1000で割るとリットルになります。60×30×36cmなら64.8Lです。実際には砂利やレイアウトの分だけ減るため、1割ほど少なく見込んでください。",
    },
    {
      q: "1リットルの水は何キログラムですか？",
      a: "約1kgです。メートル法が水1リットルの質量を1kgとする考え方で設計されているためです。60cm水槽（約65L）なら水だけで65kgになります。",
    },
    {
      q: "三角形の「高さ」はどこを測りますか？",
      a: "底辺に対して垂直な線の長さです。斜辺の長さではありません。ここを取り違えると、実際より大きい面積が出てしまいます。",
    },
    {
      q: "円錐の体積が円柱の3分の1になるのはなぜですか？",
      a: "同じ底面積と高さを持つ錐と柱の体積比が1対3になるという関係があるためです。円錐に限らず、四角錐と直方体でも同じ関係が成り立ちます。",
    },
  ],
};
