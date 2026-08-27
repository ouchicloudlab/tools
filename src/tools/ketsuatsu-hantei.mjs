export default {
  category: "health",
  updated: "2026-08-27",
  title: "血圧の判定ツール｜日本高血圧学会の基準で分類を確認",
  h1: "血圧の判定ツール",
  description:
    "上と下の血圧を入れると、日本高血圧学会の基準による分類を表示します。診察室血圧と家庭血圧の基準の違い、脈圧や平均血圧も同時に確認できる無料ツールです。",
  cardText: "血圧の分類を学会基準で判定。家庭血圧にも対応。",
  keywords: [
    "血圧", "判定", "正常値", "高血圧", "基準", "上", "下", "家庭血圧", "収縮期", "拡張期",
  ],
  yomi: "けつあつ こうけつあつ",
  related: ["bmi-keisan", "calorie-hitsuyo"],

  ui: `
<div class="row">
  <div class="field">
    <label for="sys">上の血圧・収縮期（mmHg）</label>
    <input type="number" id="sys" inputmode="numeric" value="125">
  </div>
  <div class="field">
    <label for="dia">下の血圧・拡張期（mmHg）</label>
    <input type="number" id="dia" inputmode="numeric" value="80">
  </div>
  <div class="field">
    <label for="pulse">脈拍（回/分・任意）</label>
    <input type="number" id="pulse" inputmode="numeric" value="70">
  </div>
</div>

<div class="field">
  <span class="field-label">測定した場所</span>
  <div class="pills" id="place">
    <label><input type="radio" name="place" value="home" checked>家庭で測定</label>
    <label><input type="radio" name="place" value="clinic">診察室で測定</label>
  </div>
  <p class="hint">家庭血圧のほうが5mmHg低い基準で判定します。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">分類（日本高血圧学会の基準）</div>
  <div class="result-main" id="judgeVal" style="font-size:26px">-</div>
  <div class="result-grid">
    <div><div class="k">脈圧（上−下）</div><div class="v" id="pulsePressVal">-</div></div>
    <div><div class="k">平均血圧</div><div class="v" id="meanVal">-</div></div>
    <div><div class="k">正常高値までの差</div><div class="v" id="gapVal">-</div></div>
    <div><div class="k">脈拍の評価</div><div class="v" id="pulseVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>分類の一覧</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>分類</th><th>上（収縮期）</th><th></th><th>下（拡張期）</th></tr></thead>
    <tbody id="tableBody"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  // [分類名, 収縮期の上限, 拡張期の上限, かつ/または]
  // 診察室血圧の基準。家庭血圧はここから5mmHg引く（II度・III度は基準が異なる）
  var CLINIC = [
    ["正常血圧", 120, 80, "and"],
    ["正常高値血圧", 130, 80, "and"],
    ["高値血圧", 140, 90, "and"],
    ["I度高血圧", 160, 100, "and"],
    ["II度高血圧", 180, 110, "and"],
    ["III度高血圧", Infinity, Infinity, "and"]
  ];
  var HOME = [
    ["正常血圧", 115, 75, "and"],
    ["正常高値血圧", 125, 75, "and"],
    ["高値血圧", 135, 85, "and"],
    ["I度高血圧", 145, 90, "and"],
    ["II度高血圧", 160, 100, "and"],
    ["III度高血圧", Infinity, Infinity, "and"]
  ];

  function table() {
    return ST.pick("place") === "home" ? HOME : CLINIC;
  }

  function classify(sys, dia) {
    var t = table();
    for (var i = 0; i < t.length; i++) {
      // 上か下のどちらかが範囲を超えていれば、上位の分類になる
      if (sys < t[i][1] && dia < t[i][2]) return t[i][0];
    }
    return t[t.length - 1][0];
  }

  function renderTable() {
    var t = table();
    var prevS = 0, prevD = 0;
    ST.$("tableBody").innerHTML = t.map(function (r, i) {
      // 上限が前の行と同じ段（正常高値の拡張期など）は範囲ではなく「◯未満」と書く。
      // そうしないと "75〜74" のような逆転した表記になる。
      var s = r[1] === Infinity ? prevS + "以上"
        : (i === 0 || r[1] === prevS ? r[1] + "未満" : prevS + "〜" + (r[1] - 1));
      var d = r[2] === Infinity ? prevD + "以上"
        : (i === 0 || r[2] === prevD ? r[2] + "未満" : prevD + "〜" + (r[2] - 1));
      prevS = r[1]; prevD = r[2];
      // 高値血圧より上は、上下どちらか一方が該当すればその分類になる
      var joint = i <= 1 ? "かつ" : "かつ/または";
      return "<tr><td>" + r[0] + "</td><td>" + s + "</td><td>" + joint + "</td><td>" + d + "</td></tr>";
    }).join("");
  }

  ST.live(function () {
    var sys = ST.n(ST.$("sys"));
    var dia = ST.n(ST.$("dia"));
    var pulse = ST.n(ST.$("pulse"));
    renderTable();

    if (sys <= 0 || dia <= 0) {
      ["judgeVal","pulsePressVal","meanVal","gapVal","pulseVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "上と下の血圧を入力してください。");
      return;
    }
    if (sys <= dia) {
      ["judgeVal","pulsePressVal","meanVal","gapVal","pulseVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "上の血圧が下の血圧以下になっています。入力を確認してください。");
      return;
    }

    var judge = classify(sys, dia);
    var pp = sys - dia;
    var mean = dia + pp / 3;
    var t = table();
    var normalHigh = t[1]; // 正常高値の上限

    ST.set("judgeVal", judge);
    ST.set("pulsePressVal", ST.num(pp, 0) + " mmHg");
    ST.set("meanVal", ST.num(mean, 1) + " mmHg");
    ST.set("gapVal",
      (sys >= normalHigh[1] || dia >= normalHigh[2])
        ? "上 " + Math.max(0, sys - normalHigh[1] + 1) + " / 下 " + Math.max(0, dia - normalHigh[2] + 1) + " 超過"
        : "上 " + (normalHigh[1] - sys) + " / 下 " + (normalHigh[2] - dia) + " の余裕");
    ST.set("pulseVal", pulse <= 0 ? "-"
      : (pulse < 50 ? "徐脈ぎみ" : (pulse <= 100 ? "正常範囲" : "頻脈ぎみ")));

    var note = "";
    if (pp >= 60) note = "脈圧が60mmHg以上あります。血管の硬さと関係するとされる指標です。";
    else if (pp < 30) note = "脈圧が30mmHg未満です。測定条件を確認してください。";

    ST.set("detail",
      (ST.pick("place") === "home" ? "家庭血圧" : "診察室血圧") +
      "の基準で判定しています。脈圧は上と下の差、平均血圧は「下 ＋ 脈圧÷3」で計算した値です。" + note);
  });
})();
`,

  intro: `
上と下の血圧を入れると、日本高血圧学会の基準による分類が表示されます。**家庭で測った値と診察室で測った値では基準が違う**ため、測定場所を選べるようにしています。
`,

  guide: `
## 家庭血圧と診察室血圧は基準が違う

同じ血圧でも、測った場所によって判定の基準が変わります。診察室では緊張して高めに出るため、**家庭血圧のほうが5mmHg低い基準** が設定されています。

| 分類 | 診察室血圧 | 家庭血圧 |
|---|---|---|
| 正常血圧 | 120/80 未満 | 115/75 未満 |
| 正常高値血圧 | 120-129 かつ 80未満 | 115-124 かつ 75未満 |
| 高値血圧 | 130-139 / 80-89 | 125-134 / 75-84 |
| I度高血圧 | 140-159 / 90-99 | 135-144 / 85-89 |
| II度高血圧 | 160-179 / 100-109 | 145-159 / 90-99 |
| III度高血圧 | 180以上 / 110以上 | 160以上 / 100以上 |

上と下のどちらか一方でも上の基準を超えていれば、その分類として扱われます。上が135で下が80の場合、上の値のほうが重い分類にあたるため「I度高血圧（家庭血圧）」となります。

**治療の判断には家庭血圧が優先されます。** 診察室での1回の測定より、毎日同じ条件で測った家庭血圧のほうが、体の実態をよく表すためです。

## 白衣高血圧と仮面高血圧

測定場所による差が大きい場合、次の2つが疑われます。

- **白衣高血圧**: 診察室では高いが、家庭では正常。緊張が原因。すぐに治療が必要とは限りませんが、将来の高血圧のリスクは高めです
- **仮面高血圧**: 診察室では正常だが、家庭や職場では高い。**見逃されやすく、リスクが高い** 状態です。早朝高血圧、職場高血圧、夜間高血圧などがあります

どちらも家庭で測らなければ気づけません。健診で問題がなくても、家庭での測定に意味があるのはこのためです。

## 正しい測り方

血圧は測り方で10〜20mmHg変わります。次の条件を揃えてください。

- **朝**: 起床後1時間以内、排尿後、朝食と服薬の前、座って1〜2分安静にしてから
- **夜**: 就寝前、入浴や飲酒の直後は避ける
- **姿勢**: 背もたれのある椅子に座り、足を組まない。**カフ（腕帯）を心臓の高さに合わせる**
- **回数**: 1機会に2回測り、平均をとる
- **記録**: 高い値だけでなく、すべて記録する

腕の位置が心臓より10cm下がると、血圧は約8mmHg高く出ます。テーブルに腕を置いて測るのが確実です。

また、測定前の喫煙・カフェイン・運動は避けてください。会話をしながら測るだけでも上がります。

## 脈圧と平均血圧

- **脈圧 = 上 − 下**: 心臓が1回で押し出す血液量と、血管の硬さを反映します。**60mmHg以上** は動脈硬化が進んでいる可能性を示す指標とされます
- **平均血圧 = 下 ＋ 脈圧 ÷ 3**: 心臓が1周期の間に血管へかける平均的な圧力。末梢の血管抵抗を反映します

高齢になると、血管が硬くなって上だけが高くなり、脈圧が広がる傾向があります。若い人で下だけが高い場合は、末梢血管の抵抗が上がっている状態です。

## 血圧を下げる生活習慣

日本高血圧学会が挙げている、効果が確認されている項目です。

| 項目 | 目安 | 期待できる低下 |
|---|---|---|
| 減塩 | 1日6g未満 | 上が4〜5mmHg |
| 減量 | BMI 25未満 | 1kgにつき1mmHg |
| 運動 | 有酸素運動を毎日30分 | 上が3〜5mmHg |
| 節酒 | 日本酒1合/日以下 | 上が3mmHg |
| 野菜・果物 | カリウムを増やす | 上が2〜3mmHg |
| 禁煙 | — | 血管へのダメージを防ぐ |

日本人の食塩摂取量は1日平均10g前後で、目標の6gに対して大きく超えています。汁物を1日1杯減らす、麺類の汁を残す、といった変更でも1〜2gは減らせます。

> このツールは一般的な基準による分類を表示するもので、診断ではありません。数値が気になる場合や、継続して高い値が出る場合は、必ず医療機関にご相談ください。自己判断で薬を中断しないでください。
`,

  faq: [
    {
      q: "家庭血圧と診察室血圧はどちらを信じればいいですか？",
      a: "家庭血圧が優先されます。診察室では緊張で高く出るため、基準も5mmHg低く設定されています。毎日同じ条件で測った値のほうが、体の実態を反映します。",
    },
    {
      q: "上が正常で下だけ高い場合はどうなりますか？",
      a: "上と下のどちらか一方でも基準を超えていれば、その分類として扱われます。下だけが高い状態は、末梢血管の抵抗が上がっているサインで、若い世代に多く見られます。",
    },
    {
      q: "血圧はいつ測るのがよいですか？",
      a: "朝は起床後1時間以内・排尿後・朝食と服薬の前、夜は就寝前です。それぞれ2回測って平均をとり、毎日同じ時間帯に記録すると変化が分かりやすくなります。",
    },
    {
      q: "測るたびに値が違うのはなぜですか？",
      a: "血圧は常に変動しており、姿勢・会話・カフの高さ・測定前の行動で10〜20mmHg変わります。腕を心臓の高さに合わせ、1〜2分安静にしてから測ってください。1回の値ではなく、継続した記録の傾向で判断します。",
    },
    {
      q: "脈圧が60mmHg以上あると問題ですか？",
      a: "動脈硬化が進んでいる可能性を示す指標とされています。ただし脈圧だけで判断されるものではないため、血圧の値とあわせて医療機関にご相談ください。",
    },
  ],
};
