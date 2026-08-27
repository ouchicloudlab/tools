export default {
  category: "unit",
  updated: "2026-08-18",
  title: "坪・平米・畳の変換ツール｜㎡と坪を相互に計算",
  h1: "坪・平米・畳 変換ツール",
  description:
    "坪と平米（㎡）と畳数を相互に変換します。地域による畳のサイズ差にも対応。間取り図の面積を確認したいときや、不動産の広告を読むときに使える無料ツールです。",
  cardText: "坪⇔㎡⇔畳を相互変換。畳の地域差にも対応。",
  keywords: [
    "坪", "平米", "㎡", "畳", "変換", "計算", "面積", "何畳", "坪数", "不動産",
  ],
  yomi: "つぼ へいべい じょう ちょう",
  related: ["inch-cm"],

  ui: `
<div class="row">
  <div class="field">
    <label for="tsubo">坪</label>
    <input type="number" id="tsubo" inputmode="decimal" value="20" step="0.01">
  </div>
  <div class="field">
    <label for="heibei">平米（㎡）</label>
    <input type="number" id="heibei" inputmode="decimal" value="66.12" step="0.01">
  </div>
  <div class="field">
    <label for="jo">畳（帖）</label>
    <input type="number" id="jo" inputmode="decimal" value="40" step="0.01">
  </div>
</div>
<p class="hint">どの欄に入力しても、残りの2つが自動で計算されます。</p>

<div class="field">
  <label for="jotype">畳のサイズ</label>
  <select id="jotype">
    <option value="1.62" selected>不動産広告の基準（1畳 = 1.62㎡）</option>
    <option value="1.82405">京間・本間（1畳 = 1.824㎡）</option>
    <option value="1.6562">中京間・三六間（1畳 = 1.6562㎡）</option>
    <option value="1.5488">江戸間・関東間（1畳 = 1.5488㎡）</option>
    <option value="1.445">団地間（1畳 = 1.445㎡）</option>
  </select>
  <p class="hint">不動産の広告では、1畳あたり1.62㎡以上と定められています。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">換算結果</div>
  <div class="result-grid" style="margin-top:8px">
    <div><div class="k">坪</div><div class="v" id="rTsubo">-</div></div>
    <div><div class="k">平米（㎡）</div><div class="v" id="rHeibei">-</div></div>
    <div><div class="k">畳（選択したサイズ）</div><div class="v" id="rJo">-</div></div>
    <div><div class="k">平方メートル→アール</div><div class="v" id="rAre">-</div></div>
    <div><div class="k">一辺が同じ長さの正方形</div><div class="v" id="rSide">-</div></div>
    <div><div class="k">畳（京間 1.824㎡）</div><div class="v" id="rJoStd">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var TSUBO_M2 = 400 / 121; // 1坪 = 3.305785…㎡（正確には400/121）
  var lock = false;

  function joSize() { return Number(ST.$("jotype").value) || 1.6562; }

  function render(m2, from) {
    lock = true;
    var tsubo = m2 / TSUBO_M2;
    var jo = m2 / joSize();
    if (from !== "tsubo") ST.$("tsubo").value = Math.round(tsubo * 10000) / 10000;
    if (from !== "heibei") ST.$("heibei").value = Math.round(m2 * 10000) / 10000;
    if (from !== "jo") ST.$("jo").value = Math.round(jo * 10000) / 10000;
    lock = false;

    ST.set("rTsubo", ST.num(tsubo, 3) + "坪");
    ST.set("rHeibei", ST.num(m2, 3) + "㎡");
    ST.set("rJo", ST.num(jo, 2) + "畳");
    ST.set("rAre", ST.num(m2 / 100, 4) + "アール");
    ST.set("rSide", ST.num(Math.sqrt(m2), 2) + "m 四方");
    ST.set("rJoStd", ST.num(m2 / 1.82405, 2) + "畳");
    ST.set("detail", "1坪 = 400 ÷ 121 = 約3.3058㎡（畳2枚ぶん）。" +
      "1㎡ = 約0.3025坪です。");
  }

  ["tsubo", "heibei", "jo"].forEach(function (id) {
    var el = ST.$(id);
    el.addEventListener("input", function () {
      if (lock) return;
      var v = ST.n(el);
      var m2 = id === "tsubo" ? v * TSUBO_M2 : (id === "jo" ? v * joSize() : v);
      render(m2, id);
    });
  });
  ST.$("jotype").addEventListener("change", function () {
    render(ST.n(ST.$("heibei")), "heibei");
  });

  render(ST.n(ST.$("tsubo")) * TSUBO_M2, "tsubo");
})();
`,

  intro: `
坪・平米（㎡）・畳のどれかに入力すると、残りが自動で計算されます。畳のサイズは地域によって違うため、種類を選べるようにしています。
`,

  guide: `
## 坪と平米の換算

> **1坪 = 400 ÷ 121 = 約3.3058㎡**
> **1㎡ = 約0.3025坪**

坪は日本古来の面積の単位で、1辺が6尺（約1.818m）の正方形にあたります。1.818 × 1.818 = 約3.306㎡です。畳2枚を並べた広さと考えると分かりやすくなります。

法律上、取引や証明に使える面積の単位は平方メートルのみです（計量法）。不動産の登記簿や契約書は㎡表記になっており、坪はあくまで慣習的な補助表記として使われています。

## 暗算で使える近似

正確な換算をしなくても、次の目安で大きくは外れません。

- **平米から坪**: **0.3を掛ける**（100㎡ → 約30坪、正確には30.25坪）
- **坪から平米**: **3.3を掛ける**（30坪 → 99㎡、正確には99.17㎡）
- もう少し正確にするなら、平米に0.3025、坪に3.3058を掛けます

100㎡前後の物件なら、この近似で1㎡以内の誤差に収まります。

## よくある広さの対応表

| 坪 | 平米 | 畳（1.62㎡） | 目安 |
|---|---|---|---|
| 1坪 | 3.31㎡ | 2.0畳 | 押入れ2つ分 |
| 5坪 | 16.53㎡ | 10.2畳 | ワンルームの居室 |
| 10坪 | 33.06㎡ | 20.4畳 | 1LDK |
| 15坪 | 49.59㎡ | 30.6畳 | 2LDK |
| 20坪 | 66.12㎡ | 40.8畳 | 3LDK（マンション） |
| 30坪 | 99.17㎡ | 61.2畳 | 一戸建ての平均的な延床面積 |
| 40坪 | 132.23㎡ | 81.6畳 | ゆとりのある戸建て |
| 50坪 | 165.29㎡ | 102.0畳 | 二世帯住宅 |

## 畳のサイズは地域で違う

「6畳」と書かれていても、地域によって実際の広さが変わります。

| 名称 | 主な地域 | 1畳のサイズ | 面積 |
|---|---|---|---|
| 京間（本間） | 関西・中国・四国・九州 | 191 × 95.5cm | 1.824㎡ |
| 中京間（三六間） | 東海・北陸・沖縄 | 182 × 91cm | 1.6562㎡ |
| 江戸間（関東間） | 関東・東北・北海道 | 176 × 87.8cm | 1.5488㎡ |
| 団地間（公団サイズ） | 集合住宅全般 | 170 × 85cm | 1.4459㎡ |

京間の6畳と団地間の6畳では、面積が約2.2㎡（1.3畳ぶん）も違います。同じ「6畳」の表示でも、実際に置ける家具の量が変わるということです。

## 不動産広告の「帖」表記

不動産の広告では、畳ではなく **帖** の字が使われることがあります。これは畳を敷いていないフローリングの洋室でも広さを表せるようにするためです。

不動産公正競争規約により、**1畳（帖）は1.62㎡以上** として計算することが定められています。これは中京間よりわずかに小さい値で、業界共通の最低ラインです。実際の部屋がこれより広い場合でも、切り捨てて表示することが認められています。

このため、広告の「6帖」は最低9.72㎡ということは保証されますが、それ以上かどうかは図面の寸法を見ないと分かりません。

## そのほかの面積の単位

| 単位 | 平米 | 備考 |
|---|---|---|
| 1畝（せ） | 約99.17㎡ | 30坪。農地で使う |
| 1反（たん） | 約991.7㎡ | 10畝＝300坪 |
| 1町（ちょう） | 約9917㎡ | 10反＝3000坪 |
| 1アール | 100㎡ | 10m四方 |
| 1ヘクタール | 10,000㎡ | 100m四方＝約3025坪 |

農地や山林の売買では、今でも反や町が使われることがあります。1反はおよそ1,000㎡、1ヘクタールはおよそ3,000坪と覚えておくと、規模感がつかめます。
`,

  faq: [
    {
      q: "1坪は何平米ですか？",
      a: "約3.3058㎡です。正確には400÷121で、1辺6尺（約1.818m）の正方形の面積にあたります。畳2枚ぶんとほぼ同じです。",
    },
    {
      q: "平米から坪を暗算するコツはありますか？",
      a: "0.3を掛けるとおおよその坪数になります。100㎡なら約30坪（正確には30.25坪）です。逆に坪から平米は3.3を掛けてください。",
    },
    {
      q: "同じ6畳なのに部屋の広さが違うのはなぜですか？",
      a: "畳のサイズが地域で異なるためです。京間の6畳は約10.9㎡、団地間の6畳は約8.7㎡で、2㎡以上の差があります。不動産広告では1畳を1.62㎡として計算するルールになっています。",
    },
    {
      q: "「畳」と「帖」に違いはありますか？",
      a: "広さの単位としては同じです。畳を敷いていない洋室にも使えるよう、不動産広告では「帖」の字が使われることが多くなっています。",
    },
    {
      q: "契約書に坪数を書いても有効ですか？",
      a: "計量法により、取引や証明に使える面積の単位は平方メートルと定められています。坪は参考表記として併記されるのが一般的です。",
    },
  ],
};
