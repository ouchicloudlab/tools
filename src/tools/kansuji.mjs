export default {
  category: "text",
  updated: "2026-08-27",
  title: "漢数字変換ツール｜金額の大字（壱弐参）と読みがなを表示",
  h1: "数字・漢数字の変換ツール",
  description:
    "数字を漢数字と大字（壱・弐・参）に変換します。領収書や契約書で使う「金壱萬円也」の書き方や、数字の読みがなも同時に表示する無料ツールです。",
  cardText: "数字→漢数字・大字・読みがなに変換。",
  keywords: [
    "漢数字", "大字", "変換", "領収書", "契約書", "壱", "弐", "参", "金額", "読み方",
  ],
  yomi: "かんすうじ だいじ りょうしゅうしょ",
  related: ["moji-henkan", "mojisu-count"],

  ui: `
<div class="field">
  <label for="num">数字（半角）</label>
  <input type="text" id="num" inputmode="numeric" value="12345" placeholder="12345">
  <p class="hint">最大16桁まで。小数には対応していません。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">漢数字（一般）</div>
  <div class="result-main" id="kanjiVal" style="font-size:26px">-</div>
  <div class="result-grid">
    <div><div class="k">大字（証書用）</div><div class="v" id="daijiVal">-</div></div>
    <div><div class="k">領収書の書き方</div><div class="v" id="receiptVal">-</div></div>
    <div><div class="k">読みがな</div><div class="v" id="yomiVal">-</div></div>
    <div><div class="k">桁区切り</div><div class="v" id="commaVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<div class="row" style="margin-top:14px">
  <button class="btn" type="button" id="copyKanji">漢数字をコピー</button>
  <button class="btn sub" type="button" id="copyDaiji">大字をコピー</button>
  <button class="btn sub" type="button" id="copyReceipt">領収書用をコピー</button>
</div>
`,

  script: `
(function () {
  var K = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  var D = ["", "壱", "弐", "参", "四", "五", "六", "七", "八", "九"];
  var SMALL = ["", "十", "百", "千"];
  var SMALL_D = ["", "拾", "百", "千"];
  var BIG = ["", "万", "億", "兆", "京"];
  var BIG_D = ["", "萬", "億", "兆", "京"];
  var YOMI_ONE = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];

  // 4桁のかたまりを漢数字にする
  function chunk(n, digits, units) {
    var s = "";
    var str = String(n).padStart(4, "0");
    for (var i = 0; i < 4; i++) {
      var d = Number(str.charAt(i));
      var unit = units[3 - i];
      if (d === 0) continue;
      // 十・百・千の前の「一」は一般の漢数字では省く
      if (d === 1 && unit && units === SMALL) s += unit;
      else s += digits[d] + unit;
    }
    return s;
  }

  function toKanji(num, digits, units, bigUnits) {
    if (num === 0) return digits === D ? "零" : "〇";
    var s = "";
    var i = 0;
    while (num > 0) {
      var part = num % 10000;
      if (part > 0) {
        s = chunk(part, digits, units) + bigUnits[i] + s;
      }
      num = Math.floor(num / 10000);
      i++;
    }
    return s;
  }

  // 読みがな（万・億の単位で区切って読む）
  function toYomi(num) {
    if (num === 0) return "ぜろ";
    var YOMI_BIG = ["", "まん", "おく", "ちょう", "けい"];
    var parts = [];
    var i = 0;
    while (num > 0) {
      var part = num % 10000;
      if (part > 0) parts.unshift(yomi4(part) + YOMI_BIG[i]);
      num = Math.floor(num / 10000);
      i++;
    }
    return parts.join("");
  }
  function yomi4(n) {
    var s = "";
    var str = String(n).padStart(4, "0");
    var units = ["せん", "ひゃく", "じゅう", ""];
    // 音便（さんびゃく・はっぴゃく等）を反映する
    var SPECIAL = {
      "3ひゃく": "さんびゃく", "6ひゃく": "ろっぴゃく", "8ひゃく": "はっぴゃく",
      "3せん": "さんぜん", "8せん": "はっせん", "1せん": "せん", "1ひゃく": "ひゃく",
      "1じゅう": "じゅう", "8じゅう": "はちじゅう"
    };
    for (var i = 0; i < 4; i++) {
      var d = Number(str.charAt(i));
      if (d === 0) continue;
      var u = units[i];
      var key = d + u;
      if (SPECIAL[key]) s += SPECIAL[key];
      else s += YOMI_ONE[d] + u;
    }
    return s;
  }

  function calc() {
    var raw = ST.$("num").value.replace(/[,\\s]/g, "");
    // 全角数字も受け付ける
    raw = raw.replace(/[０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });

    if (raw === "" || !/^\\d+$/.test(raw)) {
      ["kanjiVal","daijiVal","receiptVal","yomiVal","commaVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "半角の数字を入力してください（小数・マイナスは非対応）。");
      return;
    }
    if (raw.length > 16) {
      ["kanjiVal","daijiVal","receiptVal","yomiVal","commaVal"]
        .forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "16桁までの数字に対応しています。");
      return;
    }

    var n = Number(raw);
    var kanji = toKanji(n, K, SMALL, BIG);
    var daiji = toKanji(n, D, SMALL_D, BIG_D);

    ST.set("kanjiVal", kanji);
    ST.set("daijiVal", daiji);
    ST.set("receiptVal", "金" + daiji + "円也");
    ST.set("yomiVal", toYomi(n));
    ST.set("commaVal", n.toLocaleString("ja-JP"));
    ST.set("detail", "大字は、書き足して金額を改ざんされるのを防ぐために証書で使われる字体です。" +
      "領収書では「金」で始めて「円也」で締めるのが慣例です。");
  }

  ST.live(calc);
  ST.$("copyKanji").addEventListener("click", function (e) {
    ST.copy(ST.$("kanjiVal").textContent, e.currentTarget);
  });
  ST.$("copyDaiji").addEventListener("click", function (e) {
    ST.copy(ST.$("daijiVal").textContent, e.currentTarget);
  });
  ST.$("copyReceipt").addEventListener("click", function (e) {
    ST.copy(ST.$("receiptVal").textContent, e.currentTarget);
  });
})();
`,

  intro: `
数字を漢数字と大字（壱・弐・参）に変換します。領収書や契約書に金額を手書きするときの表記と、数字の読み方が同時に確認できます。
`,

  guide: `
## 大字（だいじ）とは

**壱・弐・参** のような複雑な字体の漢数字を大字といいます。証書に金額を書くときに使われるもので、目的は **改ざんの防止** です。

- 「一」に横棒を足すと「二」「三」になってしまう
- 「十」に線を足すと「千」に見える

こうした書き足しを防ぐため、画数の多い字体を使います。

| 数字 | 漢数字 | 大字 |
|---|---|---|
| 0 | 〇 | 零 |
| 1 | 一 | 壱 |
| 2 | 二 | 弐 |
| 3 | 三 | 参 |
| 4 | 四 | 四 |
| 5 | 五 | 五 |
| 6 | 六 | 六 |
| 7 | 七 | 七 |
| 8 | 八 | 八 |
| 9 | 九 | 九 |
| 10 | 十 | 拾 |
| 100 | 百 | 百 |
| 1000 | 千 | 千 |
| 10000 | 万 | 萬 |

法律で使用が義務づけられているのは **壱・弐・参・拾** の4文字です（戸籍法施行規則など）。四〜九については、そもそも書き足して別の数字にすることが難しいため、大字が定められていません。

「萬」と「阡」「佰」も慣習的に使われますが、必須ではありません。

## 領収書での書き方

金額を書くときの決まった形があります。

> **金壱萬弐阡参百円也**

- **先頭に「金」**: この後に金額が続くことを示し、前に数字を書き足せないようにする
- **末尾に「円也」**: ここで金額が終わることを示し、後ろに書き足せないようにする
- **「也」の意味**: 「〜である」という断定。端数がないことを示す慣習

算用数字で書く場合も、同じ考え方で **¥12,300−** のように、頭に「¥」、末尾に「−」や「※」を付けます。3桁ごとのカンマも、桁を増やされないための工夫です。

なお、「也」を付けるかどうかは慣習であり、法的な要件ではありません。

## 収入印紙が必要な金額

領収書は、記載金額が **5万円以上** になると収入印紙が必要です（金銭または有価証券の受取書）。

| 記載金額 | 印紙税額 |
|---|---|
| 5万円未満 | 非課税 |
| 5万円以上 100万円以下 | 200円 |
| 100万円超 200万円以下 | 400円 |
| 200万円超 300万円以下 | 600円 |
| 300万円超 500万円以下 | 1,000円 |
| 500万円超 1,000万円以下 | 2,000円 |

判定に使うのは **消費税を除いた金額** です。ただしそのためには、領収書に消費税額が明記されている必要があります。「55,000円」とだけ書くと5万円以上として印紙が必要ですが、「本体50,000円 消費税5,000円 合計55,000円」と分けて書けば非課税になります。

クレジットカード払いの場合は金銭の受け取りにあたらないため、その旨を明記すれば印紙は不要です。電子データで発行した領収書も課税対象外です。

## 縦書きでの漢数字

縦書きの文書では、算用数字ではなく漢数字を使うのが一般的です。ただし桁の表し方に2通りあります。

- **位取り方式**: 一二三四五（1万2345の「1」「2」…をそのまま並べる）
- **命数法**: 一万二千三百四十五（読み上げるとおりに書く）

新聞や公文書では位取り方式が多く、契約書の金額は命数法が使われます。このツールは命数法で変換しています。

## 数え方の単位

万より上は4桁ごとに単位が変わります。

| 単位 | 桁数 |
|---|---|
| 万 | 10⁴ |
| 億 | 10⁸ |
| 兆 | 10¹² |
| 京（けい） | 10¹⁶ |
| 垓（がい） | 10²⁰ |

英語では3桁ごと（thousand, million, billion）に区切るため、日本語との対応がずれます。1 million = 100万、1 billion = 10億です。決算資料などで換算するときに間違えやすい部分です。
`,

  faq: [
    {
      q: "領収書に大字を使わないといけませんか？",
      a: "法律上の義務はありません。算用数字でも有効です。ただし改ざん防止のため、頭に「¥」、末尾に「−」を付ける、3桁ごとにカンマを入れるといった対策は行ってください。",
    },
    {
      q: "「金壱萬円也」の「也」は必要ですか？",
      a: "慣習であり、法的な要件ではありません。金額の後ろに数字を書き足されないようにする意味があるため、手書きの領収書では付けておくと安心です。",
    },
    {
      q: "大字が定められているのはどの数字ですか？",
      a: "壱（一）・弐（二）・参（三）・拾（十）の4文字です。四以降は書き足して別の数字にすることが難しいため、大字が定められていません。萬・阡・佰は慣習的な使用です。",
    },
    {
      q: "領収書に収入印紙が必要なのはいくらからですか？",
      a: "5万円以上です。ただし消費税額を明記していれば、税抜金額で判定されます。「本体50,000円 消費税5,000円」と分けて書けば非課税になります。クレジットカード払いや電子発行の場合も不要です。",
    },
    {
      q: "1 billionは何億ですか？",
      a: "10億です。英語は3桁ごと、日本語は4桁ごとに単位が変わるため対応がずれます。1 million = 100万、1 trillion = 1兆です。",
    },
  ],
};
