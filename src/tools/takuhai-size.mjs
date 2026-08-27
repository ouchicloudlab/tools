export default {
  category: "unit",
  updated: "2026-08-27",
  title: "宅配便のサイズ計算｜3辺合計から区分がわかる",
  h1: "宅配便のサイズ計算ツール",
  description:
    "荷物の縦横高さから3辺の合計を計算し、宅配便のどのサイズ区分にあたるかを判定します。ゆうパックやレターパックなど、小さい荷物の送り方も比較できる無料ツールです。",
  cardText: "3辺合計から宅配便のサイズ区分を判定。",
  keywords: [
    "宅配便", "サイズ", "3辺合計", "60サイズ", "計算", "ゆうパック", "梱包", "送料", "規格",
  ],
  yomi: "たくはいびん にもつ さんぺんごうけい",
  related: ["menseki-taiseki", "inch-cm"],

  ui: `
<div class="row">
  <div class="field"><label for="w">縦（cm）</label>
    <input type="number" id="w" inputmode="decimal" value="30" step="1"></div>
  <div class="field"><label for="d">横（cm）</label>
    <input type="number" id="d" inputmode="decimal" value="20" step="1"></div>
  <div class="field"><label for="h">高さ（cm）</label>
    <input type="number" id="h" inputmode="decimal" value="15" step="1"></div>
  <div class="field"><label for="weight">重さ（kg）</label>
    <input type="number" id="weight" inputmode="decimal" value="2" step="0.5"></div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">3辺の合計</div>
  <div class="result-main" id="sumVal">-</div>
  <div class="result-grid">
    <div><div class="k">宅配便のサイズ区分</div><div class="v" id="sizeVal">-</div></div>
    <div><div class="k">重さによる制限</div><div class="v" id="weightVal">-</div></div>
    <div><div class="k">いちばん長い辺</div><div class="v" id="longVal">-</div></div>
    <div><div class="k">容積</div><div class="v" id="volVal">-</div></div>
    <div><div class="k">次の区分まで</div><div class="v" id="nextVal">-</div></div>
    <div><div class="k">ゆうパック</div><div class="v" id="yuVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>薄い荷物の送り方（厚さで決まるもの）</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>方法</th><th>サイズ</th><th>厚さ</th><th>重さ</th><th>判定</th></tr></thead>
    <tbody id="thinTable"></tbody>
  </table>
</div>

<h3>サイズ区分の一覧</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>区分</th><th>3辺合計</th><th>重さの上限</th></tr></thead>
    <tbody id="sizeTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // [区分名, 3辺合計の上限cm, 重さの上限kg]
  var SIZES = [
    ["60サイズ", 60, 2],
    ["80サイズ", 80, 5],
    ["100サイズ", 100, 10],
    ["120サイズ", 120, 15],
    ["140サイズ", 140, 20],
    ["160サイズ", 160, 25],
    ["180サイズ", 180, 30],
    ["200サイズ", 200, 30]
  ];
  // ゆうパックは 25kg まで（170サイズが上限）
  var YU = [
    ["60サイズ", 60], ["80サイズ", 80], ["100サイズ", 100],
    ["120サイズ", 120], ["140サイズ", 140], ["160サイズ", 160], ["170サイズ", 170]
  ];
  // 厚さで決まる薄物の規格 [名称, 長辺, 短辺, 厚さ, 重さg]
  var THIN = [
    ["定形郵便", 23.5, 12, 1, 50],
    ["定形外（規格内）", 34, 25, 3, 1000],
    ["スマートレター", 25, 17, 2, 1000],
    ["レターパックライト", 34, 24.8, 3, 4000],
    ["レターパックプラス", 34, 24.8, 99, 4000],
    ["クリックポスト", 34, 25, 3, 1000],
    ["ゆうパケット", 34, 25, 3, 1000],
    ["ネコポス", 31.2, 22.8, 3, 1000]
  ];

  ST.live(function () {
    var a = Math.max(0, ST.n(ST.$("w")));
    var b = Math.max(0, ST.n(ST.$("d")));
    var c = Math.max(0, ST.n(ST.$("h")));
    var kg = Math.max(0, ST.n(ST.$("weight")));
    var sum = a + b + c;
    var longest = Math.max(a, b, c);

    if (sum <= 0) {
      ["sumVal","sizeVal","weightVal","longVal","volVal","nextVal","yuVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "3辺の長さを入力してください。");
      ST.$("thinTable").innerHTML = "";
      ST.$("sizeTable").innerHTML = "";
      return;
    }

    // 3辺合計と重さの両方を満たす最小の区分を探す
    var hit = null;
    for (var i = 0; i < SIZES.length; i++) {
      if (sum <= SIZES[i][1]) { hit = SIZES[i]; break; }
    }
    var weightOk = hit && kg <= hit[2];
    // 重さが上限を超える場合、重さで上の区分になる
    var byWeight = null;
    if (hit && !weightOk) {
      for (var j = 0; j < SIZES.length; j++) {
        if (kg <= SIZES[j][2]) { byWeight = SIZES[j]; break; }
      }
    }

    var yuHit = null;
    for (var k = 0; k < YU.length; k++) {
      if (sum <= YU[k][1]) { yuHit = YU[k]; break; }
    }

    ST.set("sumVal", ST.num(sum, 1) + " cm");
    ST.set("sizeVal", hit
      ? (byWeight ? byWeight[0] + "（重さで判定）" : hit[0])
      : "規格外（200cm超）");
    ST.set("weightVal", hit
      ? (weightOk ? "上限 " + hit[2] + "kg 以内" : hit[0] + "の上限 " + hit[2] + "kg を超過")
      : "—");
    ST.set("longVal", ST.num(longest, 1) + " cm");
    ST.set("volVal", ST.num(a * b * c / 1000, 1) + " L");
    ST.set("nextVal", hit ? "あと " + ST.num(hit[1] - sum, 1) + " cm で上がる" : "—");
    ST.set("yuVal", yuHit
      ? yuHit[0] + (kg > 25 ? "（重さ25kg超は不可）" : "")
      : "規格外（170cm超）");

    ST.set("detail",
      "3辺合計 = " + ST.num(a, 1) + " + " + ST.num(b, 1) + " + " + ST.num(c, 1) +
      " = " + ST.num(sum, 1) + "cm。" +
      (longest > 100 ? "いちばん長い辺が100cmを超えています。運送会社によっては別の制限がかかります。" : "") +
      "実際の運賃は運送会社と距離によって変わります。");

    // 薄物の判定
    var sorted = [a, b, c].sort(function (x, y) { return y - x; });
    var L = sorted[0], W = sorted[1], T = sorted[2];
    ST.$("thinTable").innerHTML = THIN.map(function (r) {
      var ok = L <= r[1] && W <= r[2] && T <= r[3] && kg * 1000 <= r[4];
      return "<tr" + (ok ? ' style="font-weight:700"' : ' style="opacity:.55"') +
        "><td>" + r[0] + "</td><td>" + r[1] + "×" + r[2] + "cm</td><td>" +
        (r[3] >= 99 ? "制限なし" : r[3] + "cm") + "</td><td>" +
        (r[4] >= 1000 ? r[4] / 1000 + "kg" : r[4] + "g") + "</td><td>" +
        (ok ? "送れる" : "不可") + "</td></tr>";
    }).join("");

    // サイズ区分の一覧
    var prev = 0;
    ST.$("sizeTable").innerHTML = SIZES.map(function (r) {
      var mark = hit && r[0] === hit[0];
      var label = prev === 0 ? r[1] + "cm 以内" : (prev + 0.1).toFixed(0) + "〜" + r[1] + "cm";
      prev = r[1];
      return "<tr" + (mark ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + r[0] + "</td><td>" + label + "</td><td>" + r[2] + "kg</td></tr>";
    }).join("");
  });
})();
`,

  intro: `
荷物の縦・横・高さから3辺の合計を計算し、宅配便のサイズ区分を判定します。**薄い荷物なら、より安い送り方が使えるか**も同時に確認できます。
`,

  guide: `
## 宅配便のサイズは3辺の合計で決まる

> **サイズ = 縦 + 横 + 高さ（cm）**

この合計値が区分の名前になっています。「60サイズ」は3辺の合計が60cm以内という意味です。

| 区分 | 3辺合計 | 重さの上限 |
|---|---|---|
| 60サイズ | 60cm以内 | 2kg |
| 80サイズ | 80cm以内 | 5kg |
| 100サイズ | 100cm以内 | 10kg |
| 120サイズ | 120cm以内 | 15kg |
| 140サイズ | 140cm以内 | 20kg |
| 160サイズ | 160cm以内 | 25kg |
| 180サイズ | 180cm以内 | 30kg |
| 200サイズ | 200cm以内 | 30kg |

**サイズと重さの両方が条件を満たす必要があります。** 3辺合計が60cm以内でも、重さが3kgあれば80サイズの扱いになります。本や飲料など重いものを小さな箱に詰めると、この判定に引っかかります。

なお、ゆうパックは **170サイズまで**（重さは25kgまで）で、180・200サイズの扱いがありません。大きな荷物はヤマト運輸や佐川急便を検討してください。

## 測り方のコツ

- **箱の外寸を測る**: 内寸ではありません
- **膨らみを含める**: ガムテープで留めた部分が膨らんでいれば、その状態で測ります
- **1cm単位で切り上げ**: 端数は切り上げて判定されるのが一般的です
- **取っ手やフタの出っ張りも含む**: 最も外側までが対象です

**あと1cmでサイズが下がる場合は、緩衝材を減らす、箱を一回り小さくするといった工夫が効きます。** 60サイズと80サイズでは、運賃が200〜300円変わります。

## 薄い荷物は「厚さ」で決まる

小さくて薄いものは、宅配便より安い方法があります。これらは3辺合計ではなく **長辺・短辺・厚さ** で規格が決まっています。

| 方法 | サイズ | 厚さ | 重さ |
|---|---|---|---|
| 定形郵便 | 23.5×12cm | 1cm | 50g |
| スマートレター | 25×17cm | 2cm | 1kg |
| クリックポスト | 34×25cm | 3cm | 1kg |
| ゆうパケット | 34×25cm | 3cm | 1kg |
| ネコポス | 31.2×22.8cm | 3cm | 1kg |
| レターパックライト | 34×24.8cm | 3cm | 4kg |
| レターパックプラス | 34×24.8cm | **制限なし** | 4kg |

**厚さ3cmが大きな分かれ目** です。これを超えると宅配便の扱いになり、料金が数倍に上がります。衣類やタオルなど圧縮できるものは、厚さを抑える工夫をする価値があります。

レターパックプラスは厚さの制限がなく、封筒が閉まれば送れます。対面での配達になるため、追跡と受け取り確認が必要な場合にも使えます。

## 料金を抑える方法

- **持ち込み割引**: 営業所やコンビニに持ち込むと100〜150円引き
- **フリマアプリの配送サービス**: 匿名配送で、通常より安い専用料金が使えます
- **同一あて先割引・複数口割引**: 同じ宛先へ複数送る場合に適用
- **箱を小さくする**: 隙間が多い荷物は、詰め直すだけで1区分下がることがあります

料金は距離によっても変わります（同一地域内か、遠方か）。正確な金額は各社の料金検索でご確認ください。

## 規格外になる場合

- **3辺合計が200cmを超える**: 通常の宅配便では送れません。ヤマト便に相当する大型サービスや、家財宅配便を使います
- **1辺が長すぎる**: 3辺合計が範囲内でも、長辺が170cmを超えると別扱いになることがあります
- **重さが30kgを超える**: 個人向けの宅配便では基本的に受け付けられません

長尺物（ゴルフバッグ、スキー板、絵画など）は専用のサービスが用意されていることが多いため、事前に問い合わせてください。

> サイズ区分と重さの上限は、運送会社やサービスによって細部が異なる場合があります。実際の発送前に各社の最新情報をご確認ください。
`,

  faq: [
    {
      q: "宅配便の「60サイズ」とは何ですか？",
      a: "縦・横・高さの合計が60cm以内の荷物を指します。重さも2kg以内である必要があり、どちらか一方でも超えると上の区分になります。",
    },
    {
      q: "サイズは小さいのに重い場合はどうなりますか？",
      a: "重さのほうで判定されます。3辺合計が60cm以内でも重さが3kgあれば、80サイズ（5kgまで）の扱いになります。本や飲料を小さな箱に詰めるとこうなりやすいです。",
    },
    {
      q: "厚さ3cmを少し超えてしまいます。",
      a: "クリックポストやネコポスなどが使えなくなり、宅配便の扱いになるため料金が数倍に上がります。衣類やタオルなら圧縮する、緩衝材を薄いものに替えるなどで3cm以内に収める価値があります。",
    },
    {
      q: "ゆうパックに180サイズはありますか？",
      a: "ありません。ゆうパックは170サイズ・25kgまでです。それを超える荷物は、ヤマト運輸や佐川急便の大型サービスを検討してください。",
    },
    {
      q: "箱の寸法は内寸と外寸のどちらで測りますか？",
      a: "外寸です。ガムテープで留めた部分の膨らみや、フタの出っ張りも含めた最も外側までを測ります。端数は切り上げて判定されるのが一般的です。",
    },
  ],
};
