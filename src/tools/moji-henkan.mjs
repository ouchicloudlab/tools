export default {
  category: "text",
  updated: "2026-08-27",
  title: "文字変換ツール｜全角半角・大文字小文字・かなカナを一括変換",
  h1: "文字の一括変換ツール",
  description:
    "全角と半角、ひらがなとカタカナ、大文字と小文字をまとめて変換します。空白や改行の削除、重複行の除去にも対応。入力内容は送信されない無料ツールです。",
  cardText: "全角半角・かなカナ・大文字小文字を一括変換。",
  keywords: [
    "全角", "半角", "変換", "カタカナ", "ひらがな", "大文字", "小文字", "一括", "置換", "空白削除",
  ],
  yomi: "もじへんかん ぜんかく はんかく",
  related: ["mojisu-count"],

  ui: `
<div class="field">
  <label for="src">変換したい文章</label>
  <textarea id="src" placeholder="ここに文章を貼り付けてください。">ﾃｽﾄ Test １２３ カタカナ　ひらがな</textarea>
</div>

<div class="field">
  <span class="field-label">変換の種類（複数選べます。上から順に適用されます）</span>
  <div class="pills" id="ops">
    <label><input type="checkbox" id="toHalfAlnum">英数字を半角に</label>
    <label><input type="checkbox" id="toFullAlnum">英数字を全角に</label>
    <label><input type="checkbox" id="toFullKana">カナを全角に</label>
    <label><input type="checkbox" id="toHalfKana">カナを半角に</label>
    <label><input type="checkbox" id="toKatakana">ひらがな→カタカナ</label>
    <label><input type="checkbox" id="toHiragana">カタカナ→ひらがな</label>
    <label><input type="checkbox" id="toUpper">アルファベットを大文字に</label>
    <label><input type="checkbox" id="toLower">アルファベットを小文字に</label>
  </div>
</div>

<div class="field">
  <span class="field-label">整形</span>
  <div class="pills" id="ops2">
    <label><input type="checkbox" id="trimSpace">前後の空白を削除</label>
    <label><input type="checkbox" id="squashSpace">連続する空白を1つに</label>
    <label><input type="checkbox" id="removeSpace">空白をすべて削除</label>
    <label><input type="checkbox" id="removeBreak">改行を削除</label>
    <label><input type="checkbox" id="removeEmpty">空行を削除</label>
    <label><input type="checkbox" id="uniqueLine">重複する行を削除</label>
    <label><input type="checkbox" id="sortLine">行を並べ替え</label>
  </div>
</div>

<div class="row">
  <button class="btn" type="button" id="copyBtn">結果をコピー</button>
  <button class="btn sub" type="button" id="swapBtn">結果を入力欄に戻す</button>
  <button class="btn sub" type="button" id="clearBtn">消去</button>
</div>

<div class="field" style="margin-top:16px">
  <label for="out">変換結果</label>
  <textarea id="out" readonly></textarea>
</div>

<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">変換前の文字数</div><div class="v" id="beforeVal">0</div></div>
    <div><div class="k">変換後の文字数</div><div class="v" id="afterVal">0</div></div>
    <div><div class="k">行数</div><div class="v" id="lineVal">0</div></div>
  </div>
  <p class="result-sub" id="detail">変換の種類を選ぶと、その場で結果が表示されます。</p>
</div>
`,

  script: `
(function () {
  // 半角カナ → 全角カナの対応表（濁点・半濁点は結合して1文字にする）
  var KANA_PAIRS = "ｶﾞガ ｷﾞギ ｸﾞグ ｹﾞゲ ｺﾞゴ ｻﾞザ ｼﾞジ ｽﾞズ ｾﾞゼ ｿﾞゾ ﾀﾞダ ﾁﾞヂ ﾂﾞヅ ﾃﾞデ ﾄﾞド ﾊﾞバ ﾋﾞビ ﾌﾞブ ﾍﾞベ ﾎﾞボ ﾊﾟパ ﾋﾟピ ﾌﾟプ ﾍﾟペ ﾎﾟポ ｳﾞヴ".split(" ");
  var KANA_SINGLE = "ｱア ｲイ ｳウ ｴエ ｵオ ｶカ ｷキ ｸク ｹケ ｺコ ｻサ ｼシ ｽス ｾセ ｿソ ﾀタ ﾁチ ﾂツ ﾃテ ﾄト ﾅナ ﾆニ ﾇヌ ﾈネ ﾉノ ﾊハ ﾋヒ ﾌフ ﾍヘ ﾎホ ﾏマ ﾐミ ﾑム ﾒメ ﾓモ ﾔヤ ﾕユ ﾖヨ ﾗラ ﾘリ ﾙル ﾚレ ﾛロ ﾜワ ｦヲ ﾝン ｧァ ｨィ ｩゥ ｪェ ｫォ ｬャ ｭュ ｮョ ｯッ ｰー ｡。 ､、 ｢「 ｣」 ･・".split(" ");

  function halfToFullKana(s) {
    KANA_PAIRS.forEach(function (p) {
      s = s.split(p.slice(0, 2)).join(p.slice(2));
    });
    KANA_SINGLE.forEach(function (p) {
      s = s.split(p.charAt(0)).join(p.charAt(1));
    });
    return s;
  }
  function fullToHalfKana(s) {
    KANA_PAIRS.forEach(function (p) {
      s = s.split(p.slice(2)).join(p.slice(0, 2));
    });
    KANA_SINGLE.forEach(function (p) {
      s = s.split(p.charAt(1)).join(p.charAt(0));
    });
    return s;
  }

  function convert() {
    var s = ST.$("src").value;
    var before = Array.from(s).length;
    var applied = [];

    if (ST.$("toHalfAlnum").checked) {
      s = s.replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      }).replace(/\\u3000/g, " ");
      applied.push("英数字を半角に");
    }
    if (ST.$("toFullAlnum").checked) {
      s = s.replace(/[A-Za-z0-9!-~]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 0xFEE0);
      });
      applied.push("英数字を全角に");
    }
    if (ST.$("toFullKana").checked) { s = halfToFullKana(s); applied.push("カナを全角に"); }
    if (ST.$("toHalfKana").checked) { s = fullToHalfKana(s); applied.push("カナを半角に"); }
    if (ST.$("toKatakana").checked) {
      s = s.replace(/[\\u3041-\\u3096]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 0x60);
      });
      applied.push("ひらがな→カタカナ");
    }
    if (ST.$("toHiragana").checked) {
      s = s.replace(/[\\u30A1-\\u30F6]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0x60);
      });
      applied.push("カタカナ→ひらがな");
    }
    if (ST.$("toUpper").checked) { s = s.toUpperCase(); applied.push("大文字に"); }
    if (ST.$("toLower").checked) { s = s.toLowerCase(); applied.push("小文字に"); }

    if (ST.$("trimSpace").checked) {
      s = s.split("\\n").map(function (l) { return l.trim(); }).join("\\n").trim();
      applied.push("前後の空白を削除");
    }
    if (ST.$("squashSpace").checked) {
      s = s.replace(/[ \\u3000\\t]+/g, " ");
      applied.push("連続する空白を1つに");
    }
    if (ST.$("removeSpace").checked) {
      s = s.replace(/[ \\u3000\\t]/g, "");
      applied.push("空白を削除");
    }
    if (ST.$("removeBreak").checked) {
      s = s.replace(/\\r?\\n/g, "");
      applied.push("改行を削除");
    }
    if (ST.$("removeEmpty").checked) {
      s = s.split("\\n").filter(function (l) { return l.trim() !== ""; }).join("\\n");
      applied.push("空行を削除");
    }
    if (ST.$("uniqueLine").checked) {
      var seen = {};
      s = s.split("\\n").filter(function (l) {
        if (seen[l]) return false;
        seen[l] = true;
        return true;
      }).join("\\n");
      applied.push("重複行を削除");
    }
    if (ST.$("sortLine").checked) {
      s = s.split("\\n").sort(function (a, b) { return a.localeCompare(b, "ja"); }).join("\\n");
      applied.push("行を並べ替え");
    }

    ST.$("out").value = s;
    ST.set("beforeVal", ST.num(before, 0));
    ST.set("afterVal", ST.num(Array.from(s).length, 0));
    ST.set("lineVal", ST.num(s === "" ? 0 : s.split("\\n").length, 0));
    ST.set("detail", applied.length
      ? "適用中: " + applied.join(" → ")
      : "変換の種類を選ぶと、その場で結果が表示されます。");
  }

  ST.live(convert);
  ST.$("copyBtn").addEventListener("click", function (e) {
    ST.copy(ST.$("out").value, e.currentTarget);
  });
  ST.$("swapBtn").addEventListener("click", function () {
    ST.$("src").value = ST.$("out").value;
    convert();
  });
  ST.$("clearBtn").addEventListener("click", function () {
    ST.$("src").value = "";
    convert();
  });
})();
`,

  intro: `
全角と半角、ひらがなとカタカナ、大文字と小文字の変換をまとめて行えます。複数の変換を組み合わせて一度に適用できるので、名簿やリストの表記ゆれを整えるのに使えます。**入力した文章は送信されません。**
`,

  guide: `
## 全角と半角

同じ「A」でも、全角の **Ａ** と半角の **A** はコンピュータ上では別の文字です。見た目が似ているため、データを扱う場面で問題を起こしやすい部分です。

| 種類 | 全角 | 半角 |
|---|---|---|
| 英字 | ＡＢＣ | ABC |
| 数字 | １２３ | 123 |
| 記号 | ！＠＃ | !@# |
| カタカナ | アイウ | ｱｲｳ |
| スペース | 　（U+3000） | （U+0020） |

**表計算ソフトで検索しても見つからない**、**同じ名前なのに別人として登録されている** といったトラブルの多くは、この全角・半角の混在が原因です。名簿やアンケートの集計前に、英数字を半角へ統一しておくと事故が減ります。

## 半角カナを使わないほうがよい理由

半角カタカナ（ｱｲｳ）は、コンピュータの黎明期に文字数を節約するために作られたものです。現在も使えますが、次の理由から避けるのが一般的です。

- **文字化けしやすい**: 古いシステムやメールで正しく表示されないことがある
- **濁点が別文字になる**: 「ガ」が「ｶ」＋「ﾞ」の2文字として扱われ、文字数が合わなくなる
- **検索でヒットしない**: 全角で検索すると見つからない

このツールで「カナを全角に」を適用すると、濁点も結合して正しい1文字に変換されます。

なお、銀行の振込人名義など、**半角カナしか受け付けないシステム** も一部に残っています。その場合は「カナを半角に」を使ってください。

## ひらがなとカタカナの変換

ひらがなとカタカナは、Unicodeの中で0x60（96文字）ずつずれた位置に並んでいます。そのため、文字コードを足し引きするだけで機械的に変換できます。

- あ（U+3042）+ 0x60 = ア（U+30A2）

ただし、次の文字は対応するものがないため変換されません。

- **ヷ、ヸ、ヹ、ヺ**: 対応するひらがなが存在しない（「ヴ」は「ゔ」に変換されます）
- **ー（長音符）**: どちらでも同じ文字を使う
- **漢字・英数字**: 変換の対象外

## 使いどころ

| 場面 | 使う変換 |
|---|---|
| 名簿の表記ゆれを直す | 英数字を半角に + カナを全角に |
| ふりがな欄をカタカナに統一 | ひらがな→カタカナ |
| メールアドレスを整える | 英数字を半角に + 小文字に |
| コピーした文章の余分な改行を消す | 改行を削除 |
| リストから重複を取り除く | 重複する行を削除 + 行を並べ替え |
| PDFからコピーした文章の整形 | 前後の空白を削除 + 空行を削除 |

変換は上から順に適用されます。たとえば「英数字を全角に」と「英数字を半角に」の両方にチェックを入れると、先に全角化され、その後で半角に戻るため、結果は半角になります。

## 入力内容の扱い

このツールの処理はすべてブラウザの中で行われます。入力した文章がサーバーに送信されたり、保存されたりすることはありません。個人情報を含む名簿や、社外に出せない文書の整形にも使えます。

ページを閉じると内容は消えるため、必要な結果は「結果をコピー」ボタンで取り出してから閉じてください。
`,

  faq: [
    {
      q: "半角カナの濁点が2文字になってしまいます。",
      a: "半角カナでは「ガ」を「ｶ」＋「ﾞ」の2文字で表すためです。このツールの「カナを全角に」を使うと、濁点を結合して正しい1文字（ガ）に変換されます。",
    },
    {
      q: "複数の変換を同時に使えますか？",
      a: "使えます。チェックを複数入れると、画面の上から順に適用されます。「英数字を半角に」と「カナを全角に」を組み合わせると、名簿の表記ゆれを一度に整えられます。",
    },
    {
      q: "全角スペースも半角に変換されますか？",
      a: "「英数字を半角に」を選ぶと、全角スペース（U+3000）も半角スペースに変換されます。すべて削除したい場合は「空白をすべて削除」を使ってください。",
    },
    {
      q: "入力した文章は保存されますか？",
      a: "保存されません。すべての処理はブラウザ内で完結しており、文章がサーバーに送られることはありません。ページを閉じると内容は消えます。",
    },
    {
      q: "変換できない文字はありますか？",
      a: "ヷ・ヸ・ヹ・ヺといった対応するひらがなが存在しない文字、長音符（ー）、漢字は変換されません。「ヴ」は「ゔ」に変換されます。",
    },
  ],
};
