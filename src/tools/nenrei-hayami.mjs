export default {
  category: "datetime",
  updated: "2026-08-27",
  title: "年齢早見表｜西暦・和暦・干支・入学卒業年がわかる一覧",
  h1: "年齢早見表",
  description:
    "生まれ年ごとの年齢・和暦・干支をまとめた一覧表です。小学校の入学年や大学の卒業年も表示するので、履歴書の学歴欄を書くときに使える無料ツールです。",
  cardText: "生まれ年ごとの年齢・和暦・干支・入学卒業年の一覧。",
  keywords: [
    "年齢早見表", "西暦", "和暦", "干支", "一覧", "履歴書", "入学", "卒業", "学歴",
  ],
  related: ["nenrei-keisan", "wareki-seireki"],

  ui: `
<div class="row">
  <div class="field">
    <label for="baseYear">基準の年（この年時点の年齢）</label>
    <input type="number" id="baseYear" inputmode="numeric" value="2026">
  </div>
  <div class="field">
    <label for="focus">生まれ年（強調表示）</label>
    <input type="number" id="focus" inputmode="numeric" value="1990">
  </div>
  <div class="field">
    <span class="field-label">表示する範囲</span>
    <div class="pills" id="range">
      <label><input type="radio" name="range" value="30" checked>前後30年</label>
      <label><input type="radio" name="range" value="60">前後60年</label>
      <label><input type="radio" name="range" value="100">100年分</label>
    </div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">選んだ生まれ年</div>
  <div class="result-main" id="mainVal" style="font-size:24px">-</div>
  <div class="result-grid">
    <div><div class="k">満年齢（誕生日後）</div><div class="v" id="ageVal">-</div></div>
    <div><div class="k">干支</div><div class="v" id="etoVal">-</div></div>
    <div><div class="k">小学校入学</div><div class="v" id="enterVal">-</div></div>
    <div><div class="k">高校卒業</div><div class="v" id="hsVal">-</div></div>
    <div><div class="k">大学卒業（4年制）</div><div class="v" id="uniVal">-</div></div>
    <div><div class="k">還暦（満60歳）</div><div class="v" id="kanrekiVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>一覧表</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>生まれ年</th><th>和暦</th><th>干支</th><th>年齢</th><th>小学校入学</th><th>高校卒業</th></tr></thead>
    <tbody id="tableBody"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var ETO = ["申","酉","戌","亥","子","丑","寅","卯","辰","巳","午","未"];
  var ETO_YOMI = { "子":"ね","丑":"うし","寅":"とら","卯":"う","辰":"たつ","巳":"み",
    "午":"うま","未":"ひつじ","申":"さる","酉":"とり","戌":"いぬ","亥":"い" };
  var ERAS = [
    { name: "令和", start: 2019, first: 5 },
    { name: "平成", start: 1989, first: 1 },
    { name: "昭和", start: 1926, first: 12 },
    { name: "大正", start: 1912, first: 7 },
    { name: "明治", start: 1868, first: 1 }
  ];

  // 改元があった年は2つの元号が並ぶため、両方を書く
  function wareki(y) {
    for (var i = 0; i < ERAS.length; i++) {
      var e = ERAS[i];
      if (y > e.start) {
        return e.name + (y - e.start + 1);
      }
      if (y === e.start) {
        var prev = ERAS[i + 1];
        var n = 1;
        var label = e.name + "元";
        if (prev) {
          return prev.name + (y - prev.start + 1) + " / " + label;
        }
        return label;
      }
    }
    return "—";
  }

  function eto(y) {
    var k = ETO[((y % 12) + 12) % 12];
    return k + "（" + ETO_YOMI[k] + "）";
  }

  ST.live(function () {
    var base = Math.round(ST.n(ST.$("baseYear")));
    var focus = Math.round(ST.n(ST.$("focus")));
    var span = Number(ST.pick("range")) || 30;

    if (!(base > 1800) || !(focus > 1800) || base > 2200 || focus > 2200) {
      ["mainVal","ageVal","etoVal","enterVal","hsVal","uniVal","kanrekiVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "1801〜2200年の範囲で入力してください。");
      ST.$("tableBody").innerHTML = "";
      return;
    }

    var age = base - focus;
    // 4月2日〜翌4月1日生まれが同学年。ここでは4月2日以降生まれを基準にする
    var enter = focus + 6;
    var hs = focus + 18;
    var uni = focus + 22;

    ST.set("mainVal", focus + "年生まれ（" + wareki(focus) + "年）");
    ST.set("ageVal", age + "歳");
    ST.set("etoVal", eto(focus));
    ST.set("enterVal", enter + "年（" + wareki(enter) + "）4月");
    ST.set("hsVal", hs + "年（" + wareki(hs) + "）3月");
    ST.set("uniVal", uni + "年（" + wareki(uni) + "）3月");
    ST.set("kanrekiVal", (focus + 60) + "年");
    ST.set("detail",
      "学年の年は、4月2日〜翌年4月1日生まれを同学年とする日本の制度に基づく目安です。" +
      "早生まれ（1月1日〜4月1日生まれ）の方は、表の1つ上の行が該当します。" +
      "年齢は" + base + "年の誕生日を迎えた後の満年齢です。");

    var rows = "";
    var from = span === 100 ? base - 100 : focus - span;
    var to = span === 100 ? base : focus + span;
    for (var y = to; y >= from; y--) {
      if (y < 1868 || y > base) continue;
      var hit = y === focus;
      rows += "<tr" + (hit ? ' style="font-weight:700;background:var(--accent-weak)"' : "") +
        "><td>" + y + "</td><td>" + wareki(y) + "</td><td>" + eto(y) +
        "</td><td>" + (base - y) + "歳</td><td>" + (y + 6) + "年</td><td>" +
        (y + 18) + "年</td></tr>";
    }
    ST.$("tableBody").innerHTML = rows;
  });
})();
`,

  intro: `
生まれ年ごとの年齢・和暦・干支をまとめた一覧です。**小学校の入学年と高校の卒業年**も表示するので、履歴書の学歴欄を埋めるときにそのまま使えます。
`,

  guide: `
## 履歴書の学歴欄の書き方

学歴は **中学校卒業から書く** のが一般的です。高校や大学から書き始める形式もありますが、中学卒業から書けば経歴に空白が生じません。

日本の学校制度では、**4月2日から翌年4月1日までに生まれた人が同じ学年** になります。そのため、生まれ年から次のように計算できます。

| 出来事 | 生まれ年からの年数 |
|---|---|
| 小学校 入学 | ＋6年（4月） |
| 小学校 卒業 / 中学校 入学 | ＋12年 |
| 中学校 卒業 / 高校 入学 | ＋15年 |
| 高校 卒業 | ＋18年（3月） |
| 大学 卒業（4年制） | ＋22年（3月） |
| 短大・専門 卒業（2年制） | ＋20年（3月） |

**早生まれ（1月1日〜4月1日生まれ）の方は、この計算より1年早く進学します。** たとえば1990年3月生まれの人は、1996年ではなく1996年4月に小学校へ入学し、2008年3月に高校を卒業します。表では1つ上の行（1989年生まれ）を見てください。

## 和暦と西暦の使い分け

履歴書では **どちらかに統一する** ことが大切です。混在していると読み手が計算し直す必要があります。

近年は西暦での記入が増えています。勤続年数やブランク期間をそのまま引き算で計算でき、伝わりやすいためです。ただし、応募先から指定があればそれに従ってください。

住民票や卒業証明書などの公的書類は和暦で発行されることが多いため、転記の際は変換ミスに注意してください。

## 改元があった年

同じ西暦年に2つの元号が存在する年があります。この表では両方を併記しています。

| 西暦 | 元号 |
|---|---|
| 2019年 | 4月30日まで平成31年 / 5月1日から令和元年 |
| 1989年 | 1月7日まで昭和64年 / 1月8日から平成元年 |
| 1926年 | 12月24日まで大正15年 / 12月25日から昭和元年 |
| 1912年 | 7月29日まで明治45年 / 7月30日から大正元年 |

生年月日を書くときは、月日まで確認して元号を選んでください。

## 年祝いの年齢

| 名称 | 年齢 | 数え方 |
|---|---|---|
| 還暦 | 満60歳 | 干支が一巡して生まれ年に戻る |
| 古希 | 数え70歳 | 杜甫の詩に由来 |
| 喜寿 | 数え77歳 | 「喜」の草書体が七十七に見える |
| 傘寿 | 数え80歳 | 「傘」の略字が八十に見える |
| 米寿 | 数え88歳 | 「米」の字が八十八に分解できる |
| 卒寿 | 数え90歳 | 「卒」の略字が九十に見える |
| 白寿 | 数え99歳 | 「百」から「一」を取ると「白」 |

**還暦だけは満年齢で祝う** のが一般的です。生まれ年の干支が60年で一巡して戻ってくることに由来するためで、数え年で数える他の年祝いとは考え方が異なります。

## 干支の求め方

西暦を12で割った余りで決まります。

| 余り | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 干支 | 申 | 酉 | 戌 | 亥 | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 |

1990年なら 1990 ÷ 12 = 165 余り10 で「午（うま）年」です。同じ干支の人とは、12歳・24歳・36歳...と12の倍数だけ年が離れていることになります。
`,

  faq: [
    {
      q: "履歴書の学歴は何年に入学したと書けばいいですか？",
      a: "生まれ年に6を足した年の4月が小学校入学です。ただし早生まれ（1月1日〜4月1日生まれ）の方は1年早くなるため、生まれ年に5を足した年の4月が入学年になります。",
    },
    {
      q: "早生まれの場合、表のどこを見ればいいですか？",
      a: "1つ上の行（前年生まれ）を見てください。1990年3月生まれの方は、1989年生まれの行の入学・卒業年が該当します。",
    },
    {
      q: "履歴書は和暦と西暦のどちらで書くべきですか？",
      a: "どちらでも構いませんが、書類全体で統一してください。近年は勤続年数の計算がしやすい西暦が増えています。応募先から指定がある場合はそれに従います。",
    },
    {
      q: "還暦は満年齢と数え年のどちらですか？",
      a: "満60歳で祝うのが一般的です。生まれ年の干支が60年で一巡することに由来するためで、数え年で祝う古希や米寿とは考え方が異なります。",
    },
    {
      q: "2019年生まれは平成ですか令和ですか？",
      a: "どちらもあります。2019年4月30日までが平成31年、5月1日からが令和元年です。表では両方を併記しています。",
    },
  ],
};
