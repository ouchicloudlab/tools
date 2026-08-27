export default {
  category: "text",
  updated: "2026-08-20",
  title: "文字数カウントツール｜原稿用紙の枚数・空白除きの字数も同時に表示",
  h1: "文字数カウントツール",
  description:
    "入力した文章の文字数をリアルタイムで数えます。空白を除いた字数、行数、単語数、原稿用紙の枚数、全角・半角の内訳まで一度に表示。入力内容は送信されません。",
  cardText: "字数・行数・原稿用紙枚数をリアルタイム表示。",
  keywords: [
    "文字数", "カウント", "字数", "文字数カウント", "原稿用紙", "何文字", "行数", "単語数", "レポート",
  ],
  yomi: "もじすう じすう かうんと",
  related: [],

  ui: `
<div class="field">
  <label for="text">文章を入力・貼り付け</label>
  <textarea id="text" placeholder="ここに文章を貼り付けると、その場で文字数が表示されます。"></textarea>
</div>

<div class="row">
  <button class="btn sub" type="button" id="clearBtn">消去</button>
  <button class="btn sub" type="button" id="copyBtn">本文をコピー</button>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">文字数（空白・改行を含む）</div>
  <div class="result-main" id="allVal">0文字</div>
  <div class="result-grid">
    <div><div class="k">空白・改行を除く</div><div class="v" id="noSpaceVal">0</div></div>
    <div><div class="k">行数</div><div class="v" id="lineVal">0</div></div>
    <div><div class="k">段落数</div><div class="v" id="paraVal">0</div></div>
    <div><div class="k">単語数（英数）</div><div class="v" id="wordVal">0</div></div>
    <div><div class="k">全角</div><div class="v" id="zenVal">0</div></div>
    <div><div class="k">半角</div><div class="v" id="hanVal">0</div></div>
    <div><div class="k">原稿用紙（400字）</div><div class="v" id="genkoVal">0枚</div></div>
    <div><div class="k">読む目安（400字/分）</div><div class="v" id="timeVal">0分</div></div>
  </div>
  <p class="result-sub" id="detail">入力すると自動で数えます。ボタンを押す必要はありません。</p>
</div>
`,

  script: `
(function () {
  var ta = ST.$("text");
  if (!ta) return;

  // 半角とみなす範囲（ASCII・半角カナ）
  function isHalf(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x20 && c <= 0x7e) || (c >= 0xff61 && c <= 0xff9f);
  }

  function count() {
    var v = ta.value;
    // サロゲートペア（絵文字など）を1文字として数える
    var chars = Array.from(v);
    var all = chars.length;
    var noSpace = chars.filter(function (c) {
      return !/[\\s\\u3000]/.test(c);
    }).length;
    var lines = v === "" ? 0 : v.split(/\\n/).length;
    var paras = v.split(/\\n\\s*\\n/).filter(function (p) { return p.trim() !== ""; }).length;
    var words = (v.match(/[A-Za-z0-9']+/g) || []).length;

    var zen = 0, han = 0;
    chars.forEach(function (c) {
      if (/[\\s\\u3000]/.test(c)) return;
      if (isHalf(c)) han++; else zen++;
    });

    var genko = all / 400;
    var minutes = all / 400;

    ST.set("allVal", ST.num(all, 0) + "文字");
    ST.set("noSpaceVal", ST.num(noSpace, 0));
    ST.set("lineVal", ST.num(lines, 0));
    ST.set("paraVal", ST.num(paras, 0));
    ST.set("wordVal", ST.num(words, 0));
    ST.set("zenVal", ST.num(zen, 0));
    ST.set("hanVal", ST.num(han, 0));
    ST.set("genkoVal", (genko < 1 && genko > 0 ? "1枚未満" : ST.num(Math.ceil(genko), 0) + "枚"));
    ST.set("timeVal", minutes < 1 ? "1分未満" : ST.num(Math.ceil(minutes), 0) + "分");

    var bytes = new Blob([v]).size;
    ST.set("detail", "UTF-8でのデータ量は " + ST.num(bytes, 0) + " バイトです。" +
      "全角を2、半角を1として数えた場合は " + ST.num(zen * 2 + han, 0) + " です。");
  }

  ta.addEventListener("input", count);
  ST.$("clearBtn").addEventListener("click", function () {
    ta.value = "";
    ta.focus();
    count();
  });
  ST.$("copyBtn").addEventListener("click", function (e) {
    ST.copy(ta.value, e.currentTarget);
  });
  count();
})();
`,

  intro: `
文章を貼り付けると、その場で文字数を数えます。ボタンを押す必要はありません。**入力した文章は端末の外に出ません**ので、下書きや未公開の原稿にも使えます。
`,

  guide: `
## どの数え方を求められているかを確認する

「1,000文字以内」と言われたとき、何を1文字と数えるかは提出先によって変わります。主な数え方は次の3つです。

| 数え方 | 内容 | よく使われる場面 |
|---|---|---|
| 全文字数 | 空白・改行も1文字 | Webフォームの入力制限 |
| 空白除き | 空白と改行を除く | レポート、論文 |
| 全角換算 | 全角2・半角1のバイト数的な数え方 | 印刷物、DTP |

このツールはこの3つをすべて同時に表示します。Wordの「文字カウント」で表示される「文字数（スペースを含めない）」は、上の「空白・改行を除く」に相当します。

## 原稿用紙の枚数

400字詰め原稿用紙の枚数は、単純に文字数を400で割った値です。ただし実際の執筆では、次の理由で計算より多くなります。

- 段落の先頭が1マス空く
- 会話文の行末が余る
- 章の変わり目で改ページする

このツールは改行を含めた全文字数を400で割っているため、目安として使ってください。文芸の公募では「40字×30行」を1枚とする指定もあり、その場合は1,200字が1枚になります。

## 読み上げにかかる時間の目安

日本語の朗読は **1分あたり300〜400字** 程度が一般的です。

- プレゼンテーション: 300字/分（間を取るため遅め）
- ニュース読み上げ: 350〜400字/分
- 朗読・ナレーション: 300字/分

5分のスピーチなら1,500〜2,000字が目安になります。原稿を作るときは、書き上げてから実際に声に出して測ると精度が上がります。

## 文字数の制限がある主な場面

| 用途 | 目安 |
|---|---|
| X（旧Twitter）の投稿 | 全角140文字（半角は280） |
| メタディスクリプション | 全角70〜80文字（検索結果での表示） |
| ページタイトル | 全角28〜32文字 |
| LINEの1メッセージ | 10,000文字 |
| 履歴書の志望動機欄 | 200〜400文字 |
| エントリーシート | 設問ごとに指定（300〜800文字が多い） |

## 絵文字と特殊な文字の数え方

絵文字の中には、内部的に2文字分（サロゲートペア）で表現されるものがあります。「👨‍👩‍👧‍👦」のような家族の絵文字は、複数の絵文字を連結して作られており、システムによっては7文字以上と数えられます。

このツールは、見た目の1文字を1文字として数える方式を採用しています。ただし提出先のシステムがバイト数で判定している場合、同じ文章でも文字数が違って表示されることがあります。制限ぎりぎりの場合は余裕を持たせてください。

## 入力内容の扱いについて

このツールの計算はすべてブラウザの中で行われます。入力した文章がサーバーに送信されたり、保存されたりすることはありません。ページを閉じれば内容は残りません。

未発表の原稿や、社外に出せない文書を数える用途でも使えます。
`,

  faq: [
    {
      q: "Wordの文字カウントと数が合いません。",
      a: "Wordの「文字数（スペースを含めない）」は、このツールの「空白・改行を除く」に相当します。「文字数（スペースを含める）」は全文字数に対応します。どちらの数え方を求められているか確認してください。",
    },
    {
      q: "入力した文章は保存されますか？",
      a: "保存されません。処理はすべてブラウザ内で行われ、文章がサーバーに送られることはありません。ページを閉じると内容は消えます。",
    },
    {
      q: "原稿用紙の枚数はどう計算していますか？",
      a: "全文字数を400で割り、小数点以下を切り上げています。実際の原稿用紙では段落の字下げや行末の余りでマスを消費するため、表示より多くなることがあります。",
    },
    {
      q: "全角と半角はどう区別されていますか？",
      a: "ASCII文字（英数字・記号）と半角カタカナを半角、それ以外を全角として数えています。空白と改行はどちらにも含めていません。",
    },
    {
      q: "文字数の上限はありますか？",
      a: "特に制限は設けていません。ただし数万文字を超える文章では、入力のたびに再計算するため動作が重くなる場合があります。",
    },
  ],
};
