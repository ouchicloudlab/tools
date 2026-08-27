export default {
  category: "datetime",
  updated: "2026-08-17",
  title: "和暦・西暦変換ツール｜令和・平成・昭和・大正・明治を相互変換",
  h1: "和暦・西暦変換ツール",
  description:
    "西暦と和暦を相互に変換します。元号が切り替わった年も月日まで指定して正確に判定。履歴書や公的書類の記入で年号を確認したいときに使える無料ツールです。",
  cardText: "西暦⇔和暦を相互変換。改元年も月日で正確に判定。",
  keywords: [
    "和暦", "西暦", "変換", "令和", "平成", "昭和", "大正", "明治", "元号", "年号", "履歴書",
  ],
  yomi: "われき せいれき げんごう",
  related: ["nenrei-keisan", "hidzuke-keisan"],

  ui: `
<div class="field">
  <span class="field-label">変換の向き</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="s2w" checked>西暦 → 和暦</label>
    <label><input type="radio" name="mode" value="w2s">和暦 → 西暦</label>
  </div>
</div>

<div id="paneS2W">
  <div class="field">
    <label for="sdate">西暦の日付</label>
    <input type="date" id="sdate" value="2026-08-26">
    <p class="hint">年だけ知りたい場合も、月日は適当なままで構いません。</p>
  </div>
</div>

<div id="paneW2S" hidden>
  <div class="row">
    <div class="field">
      <label for="gengo">元号</label>
      <select id="gengo">
        <option value="reiwa" selected>令和</option>
        <option value="heisei">平成</option>
        <option value="showa">昭和</option>
        <option value="taisho">大正</option>
        <option value="meiji">明治</option>
      </select>
    </div>
    <div class="field"><label for="wyear">年</label>
      <input type="number" id="wyear" inputmode="numeric" value="8"></div>
    <div class="field"><label for="wmonth">月</label>
      <input type="number" id="wmonth" inputmode="numeric" value="8" min="1" max="12"></div>
    <div class="field"><label for="wday">日</label>
      <input type="number" id="wday" inputmode="numeric" value="26" min="1" max="31"></div>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label" id="mainLabel">和暦</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">西暦</div><div class="v" id="seirekiVal">-</div></div>
    <div><div class="k">和暦</div><div class="v" id="warekiVal">-</div></div>
    <div><div class="k">短縮表記</div><div class="v" id="shortVal">-</div></div>
    <div><div class="k">干支</div><div class="v" id="etoVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  // 各元号の開始日（改元日）
  var ERAS = [
    { key: "reiwa",  name: "令和", abbr: "R", start: [2019, 5, 1] },
    { key: "heisei", name: "平成", abbr: "H", start: [1989, 1, 8] },
    { key: "showa",  name: "昭和", abbr: "S", start: [1926, 12, 25] },
    { key: "taisho", name: "大正", abbr: "T", start: [1912, 7, 30] },
    { key: "meiji",  name: "明治", abbr: "M", start: [1868, 1, 25] }
  ];
  var ETO = ["申","酉","戌","亥","子","丑","寅","卯","辰","巳","午","未"];
  var ETO_YOMI = { "子":"ね","丑":"うし","寅":"とら","卯":"う","辰":"たつ","巳":"み",
    "午":"うま","未":"ひつじ","申":"さる","酉":"とり","戌":"いぬ","亥":"い" };

  function cmp(a, b) {
    for (var i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] - b[i]; }
    return 0;
  }

  function toWareki(y, m, d) {
    for (var i = 0; i < ERAS.length; i++) {
      if (cmp([y, m, d], ERAS[i].start) >= 0) {
        var era = ERAS[i];
        var n = y - era.start[0] + 1;
        return { era: era, year: n, label: era.name + (n === 1 ? "元" : n) + "年" };
      }
    }
    return null;
  }

  function clear(msg) {
    ["mainVal","seirekiVal","warekiVal","shortVal","etoVal"].forEach(function (id) { ST.set(id, "-"); });
    ST.set("detail", msg);
  }

  function show(y, m, d, w) {
    var eto = ETO[y % 12];
    ST.set("seirekiVal", y + "年" + m + "月" + d + "日");
    ST.set("warekiVal", w.label + m + "月" + d + "日");
    ST.set("shortVal", w.era.abbr + String(w.year).padStart(2, "0") + "." +
      String(m).padStart(2, "0") + "." + String(d).padStart(2, "0"));
    ST.set("etoVal", eto + "（" + ETO_YOMI[eto] + "）年");

    // 改元があった年は、同じ西暦年に2つの元号が存在する
    var note = "";
    ERAS.forEach(function (e) {
      if (e.start[0] === y) {
        note = y + "年は" + e.start[1] + "月" + e.start[2] + "日に" + e.name +
          "へ改元された年です。この日より前は前の元号になります。";
      }
    });
    ST.set("detail", note || (w.era.name + "元年は西暦" + w.era.start[0] + "年（" +
      w.era.start[1] + "月" + w.era.start[2] + "日〜）です。"));
  }

  ST.live(function () {
    var mode = ST.pick("mode");
    ST.$("paneS2W").hidden = mode !== "s2w";
    ST.$("paneW2S").hidden = mode !== "w2s";

    if (mode === "s2w") {
      var v = ST.$("sdate").value;
      if (!v) return clear("日付を入力してください。");
      var p = v.split("-").map(Number);
      var w = toWareki(p[0], p[1], p[2]);
      if (!w) return clear("明治元年（1868年1月25日）より前は対応していません。");
      ST.$("mainLabel").textContent = "和暦";
      ST.set("mainVal", w.label);
      show(p[0], p[1], p[2], w);
    } else {
      var key = ST.$("gengo").value;
      var era = ERAS.filter(function (e) { return e.key === key; })[0];
      var n = Math.round(ST.n(ST.$("wyear")));
      var m = Math.round(ST.n(ST.$("wmonth")));
      var d = Math.round(ST.n(ST.$("wday")));
      if (n < 1 || m < 1 || m > 12 || d < 1 || d > 31) {
        return clear("年・月・日を正しく入力してください。");
      }
      var y = era.start[0] + n - 1;
      var w2 = toWareki(y, m, d);
      ST.$("mainLabel").textContent = "西暦";
      ST.set("mainVal", y + "年");
      if (!w2 || w2.era.key !== era.key) {
        show(y, m, d, { era: era, year: n, label: era.name + (n === 1 ? "元" : n) + "年" });
        ST.set("detail", "※ この月日は" + era.name + "の期間外です。" +
          (w2 ? "実際には " + w2.label + " にあたります。" : ""));
      } else {
        show(y, m, d, w2);
      }
    }
  });
})();
`,

  intro: `
西暦と和暦を相互に変換します。元号が変わった年は、同じ西暦年でも月日によって元号が変わるため、日付まで指定して判定しています。
`,

  guide: `
## 元号の期間

| 元号 | 開始 | 終了 | 対応する西暦 |
|---|---|---|---|
| 令和 | 2019年5月1日 | — | 令和N年 = 2018 + N 年 |
| 平成 | 1989年1月8日 | 2019年4月30日 | 平成N年 = 1988 + N 年 |
| 昭和 | 1926年12月25日 | 1989年1月7日 | 昭和N年 = 1925 + N 年 |
| 大正 | 1912年7月30日 | 1926年12月24日 | 大正N年 = 1911 + N 年 |
| 明治 | 1868年1月25日 | 1912年7月29日 | 明治N年 = 1867 + N 年 |

## 暗算で変換する

足す数・引く数を覚えておくと、電卓なしで換算できます。

- **令和 → 西暦**: 令和の年に **18を足す**（令和6年 → 24 → 2024年）
- **平成 → 西暦**: 平成の年に **88を足す**（平成30年 → 118 → 2018年）
- **昭和 → 西暦**: 昭和の年に **25を足す**（昭和60年 → 85 → 1985年）

西暦の下2桁だけで計算できるので、慣れると一瞬です。逆に西暦から和暦にするときは、同じ数を引きます。

## 改元の年は元号が2つある

元号が切り替わった年は、同じ西暦年の中に2つの元号が存在します。ここが変換で最も間違えやすい箇所です。

- **2019年**: 1月1日〜4月30日は **平成31年**、5月1日〜12月31日は **令和元年**
- **1989年**: 1月1日〜1月7日は **昭和64年**、1月8日〜12月31日は **平成元年**
- **1926年**: 12月24日までは **大正15年**、12月25日からは **昭和元年**
- **1912年**: 7月29日までは **明治45年**、7月30日からは **大正元年**

昭和64年はわずか7日間、令和元年は5月1日からの8か月間しかありません。書類に生年月日を書くときは、この境目に注意してください。

## 「元年」と「1年」

改元された最初の年は **元年** と表記するのが正式です。「令和1年」も意味は通じますが、公文書では「令和元年」と書きます。

ただし、システムに入力する場合や、表計算ソフトで並べ替えをする場合は「1」として扱うほうが扱いやすいため、実務では両方が使われています。

## 短縮表記（R6.4.1 など）

公的な書類では、元号のローマ字頭文字を使った短縮表記が使われます。

| 元号 | 記号 | 例 |
|---|---|---|
| 令和 | R | R08.08.26 |
| 平成 | H | H31.04.30 |
| 昭和 | S | S64.01.07 |
| 大正 | T | T15.12.24 |
| 明治 | M | M45.07.29 |

運転免許証やパスポートの有効期限、金融機関の帳票などで見かける形式です。

## 履歴書ではどちらを使うか

履歴書や職務経歴書では、**和暦か西暦のどちらかに統一する** ことが大切です。混在していると読み手が計算し直す必要があり、印象がよくありません。

近年は西暦での記入が増えています。西暦は年数の差をそのまま計算できるため、勤続年数やブランク期間が伝わりやすいためです。ただし、応募先から指定がある場合はそれに従ってください。

なお、公的な証明書（住民票・戸籍謄本・年金記録など）は和暦で発行されることが多いため、これらを転記する際は変換ミスに注意してください。
`,

  faq: [
    {
      q: "令和を西暦に直す簡単な方法はありますか？",
      a: "令和の年に18を足すと西暦の下2桁になります。令和8年なら 8 + 18 = 26 で2026年です。平成は88、昭和は25を足してください。",
    },
    {
      q: "2019年は平成ですか、令和ですか？",
      a: "どちらもあります。2019年4月30日までが平成31年、5月1日からが令和元年です。日付によって変わるため、書類には月日まで確認して記入してください。",
    },
    {
      q: "「令和元年」と「令和1年」はどちらが正しいですか？",
      a: "公文書では「元年」が正式です。ただしシステムへの入力や並べ替えを行う場面では「1年」として扱うことも一般的で、どちらでも意味は通じます。",
    },
    {
      q: "昭和64年は存在しますか？",
      a: "存在します。1989年1月1日から1月7日までの7日間だけです。この期間に生まれた方の書類には昭和64年と記載されます。",
    },
    {
      q: "明治より前の元号には対応していますか？",
      a: "このツールは明治元年（1868年1月25日）以降に対応しています。それ以前は改元が頻繁で、旧暦と新暦の違いもあるため、単純な計算では変換できません。",
    },
  ],
};
