export default {
  category: "math",
  updated: "2026-08-27",
  title: "進数変換ツール｜2進数・16進数・10進数を相互に変換",
  h1: "n進数の変換ツール",
  description:
    "10進数・2進数・8進数・16進数を相互に変換します。任意の基数にも対応し、ビット演算やバイト表記も同時に確認できる無料ツールです。",
  cardText: "2進・8進・10進・16進を相互変換。",
  keywords: [
    "進数変換", "2進数", "16進数", "10進数", "8進数", "バイナリ", "hex", "基数", "計算",
  ],
  yomi: "しんすう にしんすう じゅうろくしんすう",
  related: ["data-yoryo", "color-code"],

  ui: `
<div class="row">
  <div class="field"><label for="dec">10進数</label>
    <input type="text" id="dec" value="255" inputmode="numeric"></div>
  <div class="field"><label for="bin">2進数</label>
    <input type="text" id="bin" value="11111111"></div>
</div>
<div class="row">
  <div class="field"><label for="oct">8進数</label>
    <input type="text" id="oct" value="377"></div>
  <div class="field"><label for="hex">16進数</label>
    <input type="text" id="hex" value="FF"></div>
</div>
<p class="hint">どの欄に入力しても、ほかが自動で変換されます。</p>

<div class="row">
  <div class="field">
    <label for="customBase">任意の基数（2〜36）</label>
    <input type="number" id="customBase" inputmode="numeric" value="36" min="2" max="36">
  </div>
  <div class="field">
    <label for="customVal">その基数での表記</label>
    <input type="text" id="customVal" readonly>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">10進数での値</div>
  <div class="result-main" id="mainVal">-</div>
  <div class="result-grid">
    <div><div class="k">必要なビット数</div><div class="v" id="bitsVal">-</div></div>
    <div><div class="k">バイト表記</div><div class="v" id="byteVal">-</div></div>
    <div><div class="k">4桁区切りの2進数</div><div class="v" id="binGroupVal">-</div></div>
    <div><div class="k">符号つき8bitとして</div><div class="v" id="signed8Val">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>ビット演算</h3>
<div class="row">
  <div class="field"><label for="opA">値A（10進）</label>
    <input type="number" id="opA" inputmode="numeric" value="12"></div>
  <div class="field"><label for="opB">値B（10進）</label>
    <input type="number" id="opB" inputmode="numeric" value="10"></div>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>演算</th><th>意味</th><th>結果（10進）</th><th>2進数</th></tr></thead>
    <tbody id="bitTable"></tbody>
  </table>
</div>
`,

  script: `
(function () {
  var lock = false;

  function clean(s) { return String(s).replace(/[\\s_]/g, ""); }

  function parseIn(s, base) {
    var v = clean(s);
    if (v === "") return null;
    // その基数で使える文字だけかを確認する
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
    var re = new RegExp("^[" + chars + chars.toUpperCase() + "]+$");
    if (!re.test(v)) return null;
    var n = parseInt(v, base);
    return isFinite(n) ? n : null;
  }

  function render(n, from) {
    lock = true;
    if (from !== "dec") ST.$("dec").value = String(n);
    if (from !== "bin") ST.$("bin").value = n.toString(2);
    if (from !== "oct") ST.$("oct").value = n.toString(8);
    if (from !== "hex") ST.$("hex").value = n.toString(16).toUpperCase();
    var base = Math.min(36, Math.max(2, Math.round(ST.n(ST.$("customBase"), 36))));
    ST.$("customVal").value = n.toString(base).toUpperCase();
    lock = false;

    var bin = n.toString(2);
    var bits = bin.length;
    var bytes = Math.ceil(bits / 8);
    // 4桁ずつ区切る（左から数えると桁が合わないので右から）
    var grouped = bin.replace(/\\B(?=(\\d{4})+$)/g, " ");

    ST.set("mainVal", ST.num(n, 0));
    ST.set("bitsVal", bits + " bit");
    ST.set("byteVal", bytes + " バイト（" +
      n.toString(16).toUpperCase().padStart(bytes * 2, "0").replace(/(..)(?=.)/g, "$1 ") + "）");
    ST.set("binGroupVal", grouped);
    ST.set("signed8Val", n <= 255
      ? (n >= 128 ? String(n - 256) + "（負の数）" : String(n))
      : "8bitに収まらない");
    ST.set("detail",
      "16進数の1桁は2進数の4桁（4bit）にちょうど対応します。" +
      "そのため16進数は、2進数を短く書くための表記としてよく使われます。" +
      (n > Number.MAX_SAFE_INTEGER
        ? "※ 値が大きすぎるため、正確に扱えない可能性があります。" : ""));
  }

  var FIELDS = [["dec", 10], ["bin", 2], ["oct", 8], ["hex", 16]];
  FIELDS.forEach(function (pair) {
    ST.$(pair[0]).addEventListener("input", function () {
      if (lock) return;
      var n = parseIn(ST.$(pair[0]).value, pair[1]);
      if (n === null) {
        ST.set("mainVal", "-");
        ST.set("detail", pair[1] + "進数として使えない文字が含まれています。");
        return;
      }
      render(n, pair[0]);
    });
  });
  ST.$("customBase").addEventListener("input", function () {
    var n = parseIn(ST.$("dec").value, 10);
    if (n !== null) render(n, "dec");
  });

  // ビット演算
  ST.live(function () {
    var a = Math.round(ST.n(ST.$("opA")));
    var b = Math.round(ST.n(ST.$("opB")));
    var ops = [
      ["A AND B", "両方が1のビットだけ1", a & b],
      ["A OR B", "どちらかが1なら1", a | b],
      ["A XOR B", "片方だけ1なら1", a ^ b],
      ["NOT A", "0と1を反転", ~a],
      ["A << 1", "左に1ビット移動（2倍）", a << 1],
      ["A >> 1", "右に1ビット移動（半分）", a >> 1]
    ];
    ST.$("bitTable").innerHTML = ops.map(function (o) {
      var bin = o[2] < 0
        ? "…" + (o[2] >>> 0).toString(2).slice(-8)
        : o[2].toString(2);
      return "<tr><td>" + o[0] + "</td><td>" + o[1] + "</td><td>" +
        ST.num(o[2], 0) + "</td><td style=\\"font-family:ui-monospace,monospace\\">" +
        bin + "</td></tr>";
    }).join("");
  });

  render(255, "dec");
})();
`,

  intro: `
10進数・2進数・8進数・16進数を相互に変換します。どの欄に入力しても、ほかが自動で計算されます。下ではビット演算の結果も確認できます。
`,

  guide: `
## n進数とは

普段使っている10進数は、0〜9の10種類の数字を使い、10でひとつ上の桁に繰り上がります。**基数（何種類の数字を使うか）を変えたものが n進数** です。

| 進数 | 使う文字 | 用途 |
|---|---|---|
| 2進数 | 0, 1 | コンピュータの内部処理 |
| 8進数 | 0〜7 | ファイルのアクセス権（Unix） |
| 10進数 | 0〜9 | 日常 |
| 16進数 | 0〜9, A〜F | 色コード、メモリアドレス、文字コード |

## 16進数がよく使われる理由

**16進数の1桁は、2進数のちょうど4桁（4ビット）に対応します。**

| 16進 | 2進 | 10進 |
|---|---|---|
| 0 | 0000 | 0 |
| 7 | 0111 | 7 |
| 8 | 1000 | 8 |
| A | 1010 | 10 |
| F | 1111 | 15 |

2進数の「11111111」は8桁ありますが、16進数なら「FF」の2桁で済みます。**人間が読み書きしやすく、かつ2進数との対応が明確** なため、プログラミングの世界で広く使われています。

色コード \`#FF5733\` も、RGB各色を16進数2桁（0〜255）で表したものです。

## 覚えておくと便利な値

| 2進 | 10進 | 16進 | 意味 |
|---|---|---|---|
| 1111 | 15 | F | 4ビットの最大値 |
| 11111111 | 255 | FF | 1バイトの最大値 |
| 1024 | 1,024 | 400 | 1KB |
| — | 65,535 | FFFF | 2バイトの最大値 |
| — | 16,777,215 | FFFFFF | 3バイトの最大値（色の総数） |

**255（FF）が1バイトの上限** であることが分かると、色の各成分が0〜255である理由や、IPアドレスの各区切りが0〜255である理由が理解できます。

## 符号つき整数

コンピュータで負の数を扱うとき、**最上位のビットを符号として使う** 方法（2の補数表現）が一般的です。

8ビットの場合、

- **符号なし**: 0 〜 255
- **符号つき**: −128 〜 127

同じビット列でも解釈が変わります。\`11111111\`（255）は、符号つきとして読むと **−1** です。

センサーの値やファイルのデータを読むとき、符号あり・なしを取り違えると、大きな正の数が負の数になったり、その逆が起きたりします。

## ビット演算

| 演算 | 記号 | 動作 |
|---|---|---|
| AND | & | 両方が1のときだけ1 |
| OR | \\| | どちらかが1なら1 |
| XOR | ^ | 片方だけが1のとき1 |
| NOT | ~ | 0と1を反転 |
| 左シフト | << | 桁を左にずらす（2倍） |
| 右シフト | >> | 桁を右にずらす（1/2） |

**左シフトは2倍、右シフトは半分** になります。\`5 << 1\` は10、\`20 >> 2\` は5です。掛け算・割り算より高速なため、古くから最適化に使われてきました。

XORには「同じ値で2回かけると元に戻る」という性質があり、簡易的な暗号や、値の入れ替えに使われます。

## ファイルのアクセス権（8進数）

Unix系OSの \`chmod 755\` という指定は、8進数の3桁です。

| 数字 | 2進 | 権限 |
|---|---|---|
| 7 | 111 | 読み・書き・実行 |
| 6 | 110 | 読み・書き |
| 5 | 101 | 読み・実行 |
| 4 | 100 | 読みのみ |
| 0 | 000 | 権限なし |

3桁はそれぞれ「所有者・グループ・その他」を表します。755なら、所有者は全権限、他の人は読みと実行のみ、という意味です。

**読み(4)・書き(2)・実行(1)を足した数** と覚えると分かりやすくなります。6 = 4+2（読み書き）、5 = 4+1（読み実行）です。
`,

  faq: [
    {
      q: "なぜ16進数が使われるのですか？",
      a: "16進数の1桁が2進数のちょうど4桁に対応するためです。2進数を短く書けるうえ、対応関係が明確です。「11111111」を「FF」と書けるので、人間が扱いやすくなります。",
    },
    {
      q: "255やFFという数字をよく見るのはなぜですか？",
      a: "1バイト（8ビット）で表せる最大値だからです。色の各成分が0〜255なのも、IPアドレスの各区切りが0〜255なのも、1バイトで管理しているためです。",
    },
    {
      q: "符号つきと符号なしで値が違うのはなぜですか？",
      a: "最上位ビットを符号として使うかどうかの違いです。8ビットなら符号なしは0〜255、符号つきは−128〜127を表します。同じ11111111が255にも−1にもなります。",
    },
    {
      q: "chmod 755 の数字は何を意味しますか？",
      a: "8進数3桁で、所有者・グループ・その他の権限を表します。読み(4)・書き(2)・実行(1)の合計で、7=全権限、5=読みと実行です。",
    },
    {
      q: "ビットシフトは何のために使いますか？",
      a: "左に1ビットずらすと2倍、右にずらすと半分になります。掛け算・割り算より処理が高速なため、性能が求められる場面で使われます。フラグの管理にもよく使われます。",
    },
  ],
};
