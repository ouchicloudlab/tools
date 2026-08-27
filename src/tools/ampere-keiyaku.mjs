export default {
  category: "money",
  updated: "2026-08-27",
  title: "契約アンペアの目安｜ブレーカーが落ちない容量を計算",
  h1: "契約アンペアの計算ツール",
  description:
    "同時に使う家電から必要なアンペア数を計算します。契約アンペアを下げたときの基本料金の差も分かるので、電気代の見直しに使える無料ツールです。",
  cardText: "同時使用する家電から必要なアンペアを計算。",
  keywords: [
    "アンペア", "契約", "計算", "ブレーカー", "基本料金", "電気代", "40A", "30A", "見直し",
  ],
  related: ["denkidai-keisan", "yachin-meyasu"],

  ui: `
<div class="field">
  <span class="field-label">同時に使う家電を選ぶ（複数可）</span>
  <div class="pills" id="appliances"></div>
</div>

<div class="row">
  <div class="field">
    <label for="extra">その他の消費電力（W）</label>
    <input type="number" id="extra" inputmode="decimal" value="0" step="100">
  </div>
  <div class="field">
    <label for="voltage">電圧（V）</label>
    <select id="voltage">
      <option value="100" selected>100V（一般的な家電）</option>
      <option value="200">200V（エアコン・IHの一部）</option>
    </select>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">必要なアンペア数</div>
  <div class="result-main" id="ampVal">-</div>
  <div class="result-grid">
    <div><div class="k">同時使用の合計電力</div><div class="v" id="wattVal">-</div></div>
    <div><div class="k">おすすめの契約</div><div class="v" id="planVal">-</div></div>
    <div><div class="k">選んだ家電の数</div><div class="v" id="countVal">-</div></div>
    <div><div class="k">余裕</div><div class="v" id="marginVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>契約アンペアと基本料金</h3>
<div class="row">
  <div class="field">
    <label for="current">今の契約アンペア</label>
    <select id="current">
      <option value="10">10A</option>
      <option value="15">15A</option>
      <option value="20">20A</option>
      <option value="30">30A</option>
      <option value="40" selected>40A</option>
      <option value="50">50A</option>
      <option value="60">60A</option>
    </select>
  </div>
  <div class="field">
    <label for="target">変更後の契約アンペア</label>
    <select id="target">
      <option value="10">10A</option>
      <option value="15">15A</option>
      <option value="20">20A</option>
      <option value="30" selected>30A</option>
      <option value="40">40A</option>
      <option value="50">50A</option>
      <option value="60">60A</option>
    </select>
  </div>
</div>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">今の基本料金（月）</div><div class="v" id="nowFeeVal">-</div></div>
    <div><div class="k">変更後（月）</div><div class="v" id="newFeeVal">-</div></div>
    <div><div class="k">差額（年）</div><div class="v" id="diffVal">-</div></div>
  </div>
  <p class="result-sub">東京電力の従量電灯B（2026年時点の目安）で計算しています。電力会社やプランによって金額は変わります。</p>
</div>
`,

  script: `
(function () {
  // [名称, 消費電力W, 初期選択]
  var ITEMS = [
    ["エアコン（冷房・立ち上げ）", 1400, true],
    ["エアコン（安定時）", 200, false],
    ["電子レンジ", 1300, true],
    ["炊飯器（炊飯中）", 700, false],
    ["電気ケトル", 1300, false],
    ["ドライヤー", 1200, true],
    ["洗濯乾燥機（乾燥）", 800, false],
    ["食洗機", 1000, false],
    ["こたつ", 600, false],
    ["電気ストーブ", 800, false],
    ["掃除機", 1000, false],
    ["冷蔵庫", 250, true],
    ["テレビ", 150, true],
    ["照明（家全体）", 200, true],
    ["デスクトップPC", 150, false],
    ["トースター", 1000, false],
    ["IHクッキングヒーター（1口）", 1400, false],
    ["アイロン", 1200, false]
  ];
  // 東京電力 従量電灯B の基本料金（10Aあたり約311.75円）
  var FEE = { 10: 311.75, 15: 467.63, 20: 623.50, 30: 935.25,
              40: 1247.00, 50: 1558.75, 60: 1870.50 };
  var PLANS = [10, 15, 20, 30, 40, 50, 60];

  // チェックボックスを生成する
  var box = ST.$("appliances");
  ITEMS.forEach(function (it, i) {
    var label = document.createElement("label");
    label.innerHTML = '<input type="checkbox" data-w="' + it[1] + '" id="ap' + i + '"' +
      (it[2] ? " checked" : "") + ">" + it[0] + "（" + it[1] + "W）";
    box.appendChild(label);
  });

  ST.live(function () {
    var v = Number(ST.$("voltage").value) || 100;
    var total = 0, count = 0;
    Array.prototype.forEach.call(box.querySelectorAll("input"), function (el) {
      if (el.checked) {
        total += Number(el.getAttribute("data-w"));
        count++;
      }
    });
    total += Math.max(0, ST.n(ST.$("extra")));

    // アンペア = 電力(W) ÷ 電圧(V)
    var amp = total / v;
    var plan = PLANS.filter(function (p) { return p >= amp; })[0] || 60;

    ST.set("ampVal", ST.num(amp, 1) + " A");
    ST.set("wattVal", ST.num(total, 0) + " W");
    ST.set("planVal", plan + "A" + (amp > 60 ? "（60Aでも不足）" : ""));
    ST.set("countVal", count + " 台");
    ST.set("marginVal", ST.num(plan - amp, 1) + " A");
    ST.set("detail",
      "アンペア = 消費電力 ÷ 電圧 で計算します（" + ST.num(total, 0) + "W ÷ " + v + "V = " +
      ST.num(amp, 1) + "A）。" +
      "実際には、すべての家電を同時に使う場面は多くありません。" +
      "よく重なる組み合わせで見積もるのが現実的です。");

    // 基本料金の比較
    var cur = Number(ST.$("current").value);
    var tgt = Number(ST.$("target").value);
    var curFee = FEE[cur], newFee = FEE[tgt];
    ST.set("nowFeeVal", ST.yen(Math.round(curFee), 0));
    ST.set("newFeeVal", ST.yen(Math.round(newFee), 0));
    var diff = (curFee - newFee) * 12;
    ST.set("diffVal", diff > 0
      ? "年 " + ST.yen(Math.round(diff), 0) + " の節約"
      : (diff < 0 ? "年 " + ST.yen(Math.round(-diff), 0) + " の増加" : "変わりません"));
  });
})();
`,

  intro: `
同時に使う家電を選ぶと、必要なアンペア数が計算されます。**契約アンペアを下げたときの基本料金の差**も確認できるので、電気代の見直しに使えます。
`,

  guide: `
## アンペアの計算式

> **アンペア(A) = 消費電力(W) ÷ 電圧(V)**

家庭の一般的なコンセントは100Vなので、**消費電力を100で割ればアンペア数** になります。

- 電子レンジ 1300W → 13A
- ドライヤー 1200W → 12A
- エアコン（立ち上げ）1400W → 14A

この3つを同時に使うと39Aで、30A契約ならブレーカーが落ちます。

## ブレーカーが落ちる仕組み

分電盤には3種類のブレーカーがあります。

| 種類 | 役割 | 落ちたときの範囲 |
|---|---|---|
| **アンペアブレーカー** | 契約容量を超えたとき | 家全体 |
| 漏電ブレーカー | 漏電を検知したとき | 家全体 |
| 安全ブレーカー | 1つの回路で20Aを超えたとき | その部屋だけ |

**家全体が消えたらアンペア超過、1部屋だけならその回路の使いすぎ** です。後者の場合、契約を上げても解決しません。使う場所を分ける必要があります。

一般的な家庭では、1つの回路（部屋）あたり20Aが上限です。キッチンで電子レンジ（13A）とトースター（10A）を同時に使うと超えるため、コンセントの系統を分ける必要があります。

## 契約アンペアの目安

| 世帯 | 目安 |
|---|---|
| 一人暮らし（ワンルーム） | 20〜30A |
| 二人暮らし | 30〜40A |
| 3〜4人家族 | 40〜50A |
| 5人以上・オール電化 | 50〜60A |

エアコンの台数、IHかガスか、電気温水器の有無で大きく変わります。**オール電化住宅では60Aや、それ以上の契約が必要** になることが一般的です。

## 基本料金の差（東京電力 従量電灯B）

| 契約 | 基本料金（月） | 年間 |
|---|---|---|
| 10A | 約312円 | 約3,741円 |
| 15A | 約468円 | 約5,612円 |
| 20A | 約624円 | 約7,482円 |
| 30A | 約935円 | 約11,223円 |
| 40A | 約1,247円 | 約14,964円 |
| 50A | 約1,559円 | 約18,705円 |
| 60A | 約1,871円 | 約22,446円 |

**10A下げると月311円、年間約3,741円の節約** になります。使用量に応じた従量料金は変わらないため、この差がそのまま固定費の削減になります。

ただし、頻繁にブレーカーが落ちるようでは生活に支障が出ます。冷蔵庫やPCの電源が突然切れるのは機器にもよくありません。

## 契約変更の手順

1. 電力会社に連絡する（Webでも可能な場合が多い）
2. アンペアブレーカーの交換工事（**無料**）
3. 立ち会いが必要な場合がある

**変更後1年間は再変更できない** のが一般的なルールです。下げすぎて不便になっても戻せないため、慎重に判断してください。

なお、**関西電力・中国電力・四国電力・沖縄電力の管内には、アンペア制がありません**。基本料金が一律（最低料金制）のため、この見直しは効果がありません。お住まいの地域を確認してください。

## 契約を下げても大丈夫か確かめる方法

分電盤のアンペアブレーカーを見て、**普段どれくらいの余裕があるか** を確認します。最近のスマートメーターなら、電力会社のWebサービスで30分ごとの使用量が見られることもあります。

- 冬の夕方（暖房＋調理＋照明が重なる時間）が最も電気を使います
- この時間帯のピークが契約の8割以内に収まっていれば、1段階下げても問題は起きにくいでしょう

判断に迷う場合は、まず **使う時間をずらす** 工夫を試してください。ドライヤーと電子レンジを同時に使わない、洗濯乾燥は夜に回す、といった調整だけでピークは下がります。
`,

  faq: [
    {
      q: "必要なアンペア数はどう計算しますか？",
      a: "同時に使う家電の消費電力を合計し、100（V）で割ります。電子レンジ1300W・ドライヤー1200W・エアコン1400Wを同時に使うと39Aになり、30A契約ではブレーカーが落ちます。",
    },
    {
      q: "契約アンペアを下げるといくら安くなりますか？",
      a: "東京電力の従量電灯Bなら、10A下げるごとに月約311円、年間約3,741円の節約です。使用量に応じた従量料金は変わらないため、この差がそのまま固定費の削減になります。",
    },
    {
      q: "家全体ではなく1部屋だけ電気が消えました。",
      a: "その回路の安全ブレーカーが落ちています。1回路あたり20Aが上限で、契約アンペアとは別の問題です。契約を上げても解決しないため、使う機器を別の部屋のコンセントに分けてください。",
    },
    {
      q: "契約を変更するのに費用はかかりますか？",
      a: "ブレーカーの交換工事は無料です。ただし変更後1年間は再変更できないのが一般的なので、下げすぎないよう注意してください。",
    },
    {
      q: "関西に住んでいますが契約を下げられますか？",
      a: "関西・中国・四国・沖縄の各電力管内にはアンペア制がなく、基本料金が一律（最低料金制）です。そのため、この見直しによる節約はできません。",
    },
  ],
};
