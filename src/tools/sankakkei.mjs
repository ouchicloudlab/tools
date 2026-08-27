export default {
  category: "math",
  updated: "2026-08-27",
  title: "三角形の計算｜3辺から面積・角度・斜辺を求める",
  h1: "三角形の計算ツール",
  description:
    "3辺の長さから面積と3つの角度を計算します。直角三角形の斜辺を求めるピタゴラスの定理、対角線の長さの計算にも対応した無料ツールです。",
  cardText: "3辺から面積と角度。斜辺の計算も。",
  keywords: [
    "三角形", "面積", "計算", "ヘロンの公式", "ピタゴラス", "斜辺", "角度", "直角三角形", "対角線",
  ],
  yomi: "さんかっけい ぴたごらす",
  related: ["menseki-taiseki", "bunsu-keisan"],

  ui: `
<h3 style="margin-top:0">3辺の長さから求める</h3>
<div class="row">
  <div class="field"><label for="a">辺a</label>
    <input type="number" id="a" inputmode="decimal" value="3" step="0.1"></div>
  <div class="field"><label for="b">辺b</label>
    <input type="number" id="b" inputmode="decimal" value="4" step="0.1"></div>
  <div class="field"><label for="c">辺c</label>
    <input type="number" id="c" inputmode="decimal" value="5" step="0.1"></div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">面積</div>
  <div class="result-main" id="areaVal">-</div>
  <div class="result-grid">
    <div><div class="k">辺aの対角A</div><div class="v" id="angA">-</div></div>
    <div><div class="k">辺bの対角B</div><div class="v" id="angB">-</div></div>
    <div><div class="k">辺cの対角C</div><div class="v" id="angC">-</div></div>
    <div><div class="k">周の長さ</div><div class="v" id="periVal">-</div></div>
    <div><div class="k">三角形の種類</div><div class="v" id="typeVal">-</div></div>
    <div><div class="k">外接円の半径</div><div class="v" id="circumVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>直角三角形（ピタゴラスの定理）</h3>
<div class="field">
  <span class="field-label">求めるもの</span>
  <div class="pills" id="pmode">
    <label><input type="radio" name="pmode" value="hyp" checked>斜辺</label>
    <label><input type="radio" name="pmode" value="leg">他の辺</label>
  </div>
</div>
<div class="row">
  <div class="field"><label for="p1" id="lbl1">辺1</label>
    <input type="number" id="p1" inputmode="decimal" value="90" step="1"></div>
  <div class="field"><label for="p2" id="lbl2">辺2</label>
    <input type="number" id="p2" inputmode="decimal" value="120" step="1"></div>
</div>
<div class="result" aria-live="polite">
  <div class="result-main" id="pVal" style="font-size:26px">-</div>
  <p class="result-sub" id="pDetail"></p>
</div>
`,

  script: `
(function () {
  var DEG = 180 / Math.PI;

  function clearTri(msg) {
    ["areaVal","angA","angB","angC","periVal","typeVal","circumVal"]
      .forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  ST.live(function () {
    // ---- 3辺から ----
    var a = ST.n(ST.$("a")), b = ST.n(ST.$("b")), c = ST.n(ST.$("c"));
    if (a <= 0 || b <= 0 || c <= 0) {
      clearTri("3辺すべてに0より大きい値を入力してください。");
    } else if (a + b <= c || b + c <= a || c + a <= b) {
      // 2辺の和が残りの1辺以下だと三角形にならない
      clearTri("この3辺では三角形を作れません。どれか2辺の和が、残りの1辺より長くなる必要があります。");
    } else {
      // ヘロンの公式
      var s = (a + b + c) / 2;
      var area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

      // 余弦定理で角度を求める
      function angle(op, x, y) {
        return Math.acos((x * x + y * y - op * op) / (2 * x * y)) * DEG;
      }
      var A = angle(a, b, c);
      var B = angle(b, c, a);
      var C = angle(c, a, b);
      var maxAng = Math.max(A, B, C);

      var type = [];
      if (Math.abs(a - b) < 1e-9 && Math.abs(b - c) < 1e-9) type.push("正三角形");
      else if (Math.abs(a - b) < 1e-9 || Math.abs(b - c) < 1e-9 || Math.abs(c - a) < 1e-9) type.push("二等辺三角形");
      if (Math.abs(maxAng - 90) < 1e-6) type.push("直角三角形");
      else if (maxAng > 90) type.push("鈍角三角形");
      else type.push("鋭角三角形");

      ST.set("areaVal", ST.num(area, 4));
      ST.set("angA", ST.num(A, 2) + "°");
      ST.set("angB", ST.num(B, 2) + "°");
      ST.set("angC", ST.num(C, 2) + "°");
      ST.set("periVal", ST.num(a + b + c, 3));
      ST.set("typeVal", type.join("・"));
      ST.set("circumVal", ST.num(a * b * c / (4 * area), 4));
      ST.set("detail",
        "ヘロンの公式で計算しています。s = (a+b+c)÷2 = " + ST.num(s, 3) +
        " として、面積 = √(s(s−a)(s−b)(s−c)) = " + ST.num(area, 4) +
        "。3つの角の和は " + ST.num(A + B + C, 1) + "° です。");
    }

    // ---- ピタゴラス ----
    var mode = ST.pick("pmode");
    var p1 = ST.n(ST.$("p1")), p2 = ST.n(ST.$("p2"));
    ST.$("lbl1").textContent = mode === "hyp" ? "直角をはさむ辺1" : "斜辺";
    ST.$("lbl2").textContent = mode === "hyp" ? "直角をはさむ辺2" : "分かっている辺";

    if (p1 <= 0 || p2 <= 0) {
      ST.set("pVal", "-");
      ST.set("pDetail", "2辺の長さを入力してください。");
    } else if (mode === "hyp") {
      var h = Math.sqrt(p1 * p1 + p2 * p2);
      ST.set("pVal", "斜辺 = " + ST.num(h, 4));
      ST.set("pDetail", "√(" + ST.num(p1, 2) + "² + " + ST.num(p2, 2) + "²) = √" +
        ST.num(p1 * p1 + p2 * p2, 2) + " = " + ST.num(h, 4) +
        "。長方形の対角線の長さも同じ式で求められます。");
    } else if (p1 <= p2) {
      ST.set("pVal", "-");
      ST.set("pDetail", "斜辺は他の辺より長くなければなりません。");
    } else {
      var leg = Math.sqrt(p1 * p1 - p2 * p2);
      ST.set("pVal", "残りの辺 = " + ST.num(leg, 4));
      ST.set("pDetail", "√(" + ST.num(p1, 2) + "² − " + ST.num(p2, 2) + "²) = " +
        ST.num(leg, 4) + "。");
    }
  });
})();
`,

  intro: `
3辺の長さを入れると、面積と3つの角度が求まります。下では直角三角形の斜辺（テレビの画面サイズや部屋の対角線の計算にも使えます）を計算できます。
`,

  guide: `
## ヘロンの公式

**高さが分からなくても、3辺の長さだけで面積が求まる** 公式です。

> s = (a + b + c) ÷ 2
> **面積 = √( s(s−a)(s−b)(s−c) )**

sは「半周長」といい、周の長さの半分です。

辺が3, 4, 5の三角形なら、

- s = (3 + 4 + 5) ÷ 2 = 6
- 面積 = √(6 × 3 × 2 × 1) = √36 = **6**

土地や部屋の形が長方形でないとき、3辺を測ればこの公式で面積が出せます。測量の現場では、複雑な形の土地を三角形に分割し、それぞれの面積を足し合わせる方法が使われます。

## 三角形が成立する条件

どんな3つの長さでも三角形になるわけではありません。

> **2辺の和 > 残りの1辺**

これが3通りすべてで成り立つ必要があります。たとえば1, 2, 5という長さでは、1 + 2 = 3 < 5 なので、辺が届かず三角形になりません。

## 余弦定理で角度を求める

3辺から角度を求めるときに使います。

> **cos A = (b² + c² − a²) ÷ (2bc)**

Aは辺aの向かい側にある角です。この値をアークコサイン（cos⁻¹）に入れると角度が出ます。

三平方の定理（ピタゴラスの定理）は、この余弦定理でAが90度のときの特別な場合です。cos 90° = 0 なので、b² + c² − a² = 0、つまり **a² = b² + c²** となります。

## ピタゴラスの定理

直角三角形で、直角をはさむ2辺と斜辺の関係を表します。

> **斜辺² = 辺1² + 辺2²**

身近な使い道が多い定理です。

- **テレビの画面サイズ**: 縦横の寸法から対角線（インチ数）を求める
- **部屋の対角線**: 大きな家具が通るか確認する
- **柱の垂直を出す**: 3:4:5の比で三角形を作ると直角になる（大工の「三四五（さしご）」）
- **配線・配管の長さ**: 斜めに渡す距離を計算する

### 覚えておくと便利な整数比

3辺がすべて整数になる直角三角形の組み合わせです（ピタゴラス数）。

| 比 | 例 |
|---|---|
| 3 : 4 : 5 | 30cm, 40cm, 50cm |
| 5 : 12 : 13 | 50cm, 120cm, 130cm |
| 8 : 15 : 17 | 80cm, 150cm, 170cm |
| 7 : 24 : 25 | 70cm, 240cm, 250cm |

**3:4:5は建築現場で今も使われています。** 巻尺だけで正確な直角を出せるためです。基準線に沿って3mの点を取り、そこから4mと5mの交点を探せば、そこが直角になります。

## 三角形の種類

| 角による分類 | 条件 |
|---|---|
| 鋭角三角形 | すべての角が90度未満 |
| 直角三角形 | 1つの角が90度 |
| 鈍角三角形 | 1つの角が90度より大きい |

| 辺による分類 | 条件 |
|---|---|
| 正三角形 | 3辺がすべて等しい（すべての角が60度） |
| 二等辺三角形 | 2辺が等しい |
| 不等辺三角形 | 3辺がすべて異なる |

## 外接円の半径

三角形の3つの頂点をすべて通る円の半径です。

> **外接円の半径 = abc ÷ (4 × 面積)**

円形のテーブルに3点を配置する、円弧状の部材を設計するといった場面で使われます。

## 角度の和は必ず180度

平面上の三角形では、3つの角の和は必ず180度になります。このツールで計算した3つの角度を足すと180になるはずで、そうならない場合は入力値に誤りがあります（計算上の丸め誤差で179.99のようになることはあります）。

なお、球面上（地球儀の上など）では、この性質は成り立ちません。球面三角形の内角の和は180度より大きくなります。
`,

  faq: [
    {
      q: "高さが分からなくても三角形の面積は出せますか？",
      a: "出せます。3辺の長さが分かればヘロンの公式で計算できます。s=(a+b+c)÷2 として、面積=√(s(s−a)(s−b)(s−c)) です。土地の面積を測るときによく使われます。",
    },
    {
      q: "「三角形を作れません」と表示されるのはなぜですか？",
      a: "2辺の和が残りの1辺以下になっているためです。三角形が成立するには、どの2辺の和も残りの1辺より長い必要があります。1, 2, 5のような組み合わせでは辺が届きません。",
    },
    {
      q: "現場で直角を出す方法はありますか？",
      a: "3:4:5の比を使います。基準線上に3mの点を取り、その端から4mと5mになる交点を探すと、そこが正確な直角になります。巻尺だけでできるため建築現場で今も使われています。",
    },
    {
      q: "テレビの画面サイズはどう計算しますか？",
      a: "対角線の長さがインチ数です。縦横の寸法が分かっていれば、ピタゴラスの定理で√(縦²+横²)を計算し、2.54で割るとインチになります。",
    },
    {
      q: "3つの角度の和が180度にならないのですが。",
      a: "計算上の丸め誤差で179.99のように表示されることはありますが、大きくずれる場合は入力値を確認してください。平面上の三角形では、内角の和は必ず180度になります。",
    },
  ],
};
