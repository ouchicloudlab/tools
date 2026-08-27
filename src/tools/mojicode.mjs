export default {
  category: "text",
  updated: "2026-08-27",
  title: "文字コード調べ｜Unicodeとサロゲートペアを確認",
  h1: "文字コードの確認ツール",
  description:
    "文字を入力すると、Unicodeのコードポイントと UTF-8 のバイト表現を1文字ずつ表示します。文字化けの原因調査や、環境依存文字の確認に使える無料ツールです。",
  cardText: "1文字ずつUnicodeとUTF-8バイトを表示。",
  keywords: [
    "文字コード", "Unicode", "UTF-8", "サロゲートペア", "文字化け", "コードポイント", "絵文字", "調べる",
  ],
  related: ["mojisu-count", "url-encode", "shinsu-henkan"],

  ui: `
<div class="field">
  <label for="src">文字を入力（先頭50文字まで表示）</label>
  <input type="text" id="src" value="髙﨑あA①🍣" placeholder="調べたい文字を入力">
  <p class="hint">名前の異体字や環境依存文字の確認に使えます。</p>
</div>

<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">見た目の文字数</div><div class="v" id="charVal">-</div></div>
    <div><div class="k">JavaScriptでの長さ</div><div class="v" id="lenVal">-</div></div>
    <div><div class="k">UTF-8のバイト数</div><div class="v" id="utf8Val">-</div></div>
    <div><div class="k">UTF-16のバイト数</div><div class="v" id="utf16Val">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>1文字ずつの内訳</h3>
<div class="table-wrap">
  <table>
    <thead><tr><th>文字</th><th>Unicode</th><th>10進</th><th>UTF-8（16進）</th><th>種類</th></tr></thead>
    <tbody id="charTable"></tbody>
  </table>
</div>

<h3>コードポイントから文字を出す</h3>
<div class="row">
  <div class="field">
    <label for="cp">コードポイント（U+ の後ろ、16進）</label>
    <input type="text" id="cp" value="3042" placeholder="3042 / 1F363">
  </div>
  <div class="field">
    <label for="cpResult">その文字</label>
    <input type="text" id="cpResult" readonly style="font-size:24px">
  </div>
</div>
`,

  script: `
(function () {
  function kind(cp) {
    if (cp >= 0x3040 && cp <= 0x309f) return "ひらがな";
    if (cp >= 0x30a0 && cp <= 0x30ff) return "カタカナ";
    if (cp >= 0xff61 && cp <= 0xff9f) return "半角カナ";
    if (cp >= 0x4e00 && cp <= 0x9fff) return "漢字（基本）";
    if (cp >= 0x3400 && cp <= 0x4dbf) return "漢字（拡張A）";
    if (cp >= 0x20000 && cp <= 0x2a6df) return "漢字（拡張B・環境依存）";
    if (cp >= 0xf900 && cp <= 0xfaff) return "漢字（互換・異体字）";
    if (cp >= 0x1f300 && cp <= 0x1faff) return "絵文字";
    if (cp >= 0x2600 && cp <= 0x27bf) return "記号・絵文字";
    if (cp >= 0x2460 && cp <= 0x24ff) return "囲み数字（環境依存）";
    if (cp >= 0x3200 && cp <= 0x33ff) return "囲み文字・単位（環境依存）";
    if (cp >= 0x0020 && cp <= 0x007e) return "ASCII（半角英数記号）";
    if (cp >= 0xff01 && cp <= 0xff5e) return "全角英数記号";
    if (cp === 0x0020 || cp === 0x3000) return "空白";
    if (cp < 0x0020) return "制御文字";
    return "その他";
  }

  function utf8Bytes(ch) {
    return Array.from(new TextEncoder().encode(ch))
      .map(function (b) { return b.toString(16).toUpperCase().padStart(2, "0"); })
      .join(" ");
  }

  ST.live(function () {
    var s = ST.$("src").value;
    var chars = Array.from(s);

    ST.set("charVal", ST.num(chars.length, 0) + " 文字");
    ST.set("lenVal", ST.num(s.length, 0) + "（UTF-16単位）");
    ST.set("utf8Val", ST.num(new TextEncoder().encode(s).length, 0) + " バイト");
    ST.set("utf16Val", ST.num(s.length * 2, 0) + " バイト");

    var hasSurrogate = chars.some(function (c) { return c.length > 1; });
    ST.set("detail", chars.length === 0
      ? "文字を入力してください。"
      : (hasSurrogate
        ? "サロゲートペア（2つの単位で1文字を表す文字）が含まれています。JavaScriptの length では2と数えられるため、文字数の判定がずれることがあります。"
        : "すべて1単位で表せる文字です。"));

    ST.$("charTable").innerHTML = chars.slice(0, 50).map(function (c) {
      var cp = c.codePointAt(0);
      var hex = cp.toString(16).toUpperCase().padStart(4, "0");
      var esc = c.replace(/[&<>"]/g, function (x) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x];
      });
      return "<tr><td style=\\"font-size:20px\\">" + esc + "</td><td>U+" + hex +
        (c.length > 1 ? "（サロゲートペア）" : "") + "</td><td>" + cp +
        "</td><td style=\\"font-family:ui-monospace,monospace\\">" + utf8Bytes(c) +
        "</td><td>" + kind(cp) + "</td></tr>";
    }).join("");
  });

  // コードポイント → 文字
  ST.$("cp").addEventListener("input", function () {
    var v = ST.$("cp").value.trim().replace(/^(U\\+|0x)/i, "");
    var n = parseInt(v, 16);
    ST.$("cpResult").value =
      (isFinite(n) && n >= 0 && n <= 0x10ffff) ? String.fromCodePoint(n) : "";
  });
  ST.$("cp").dispatchEvent(new Event("input", { bubbles: true }));
})();
`,

  intro: `
文字を入力すると、Unicodeのコードポイントと UTF-8 のバイト表現を1文字ずつ表示します。**名前の異体字（髙・﨑など）や環境依存文字** が含まれていないかを確認できます。
`,

  guide: `
## Unicodeとコードポイント

Unicodeは、世界中の文字に固有の番号を割り当てた規格です。この番号を **コードポイント** といい、**U+3042**（ひらがなの「あ」）のように表記します。

| 文字 | コードポイント | 10進 |
|---|---|---|
| A | U+0041 | 65 |
| あ | U+3042 | 12354 |
| 漢 | U+6F22 | 28450 |
| 🍣 | U+1F363 | 127843 |

現在のUnicodeには15万字以上が登録されており、絵文字や古代文字も含まれます。

## UTF-8のバイト数は文字によって違う

コードポイントを実際のデータとして保存する方法が **符号化方式** で、最も広く使われているのがUTF-8です。

| 文字の種類 | UTF-8でのバイト数 |
|---|---|
| 半角英数記号（ASCII） | **1バイト** |
| ラテン文字の一部、記号 | 2バイト |
| **日本語（ひらがな・カタカナ・漢字）** | **3バイト** |
| 絵文字、一部の漢字 | **4バイト** |

英語の文章はほぼ1バイトで済むため、UTF-8は英語圏で効率がよい方式です。日本語は3バイト必要なので、同じ文字数でもデータ量は3倍になります。

**「全角は2バイト」という説明を見かけますが、これはShift_JISの話です。** UTF-8では3バイトなので、文字数制限をバイト数で設けているシステムでは注意が必要です。

## サロゲートペア

Unicodeは当初、すべての文字を2バイト（65,536種類）で表せると想定していました。しかし文字が増えて足りなくなり、**2つの単位を組み合わせて1文字を表す仕組み** が導入されました。これがサロゲートペアです。

対象になるのは U+10000 以降の文字で、次のようなものが該当します。

- 絵文字の多く（🍣 U+1F363 など）
- 一部の漢字（𠮟る の「𠮟」U+20B9F など）
- 古代文字、数学記号の一部

**プログラムで文字数を数えるとき、サロゲートペアは2文字と数えられることがあります。** JavaScriptの \`"🍣".length\` は2を返します。入力欄の文字数制限で「絵文字を入れると2文字ぶん消費される」のはこのためです。

さらに、絵文字には複数の文字を連結したものもあります。「👨‍👩‍👧‍👦」（家族）は5つの文字を結合子でつないだもので、\`length\` は11になります。

## 環境依存文字

特定の環境でしか正しく表示されない文字です。文字化けや「〓」の原因になります。

| 種類 | 例 |
|---|---|
| 丸数字 | ①②③ |
| ローマ数字 | ⅠⅡⅢ |
| 単位記号 | ㎏ ㎝ ℃ ㍻ |
| 略号 | ㈱ ㈲ № ℡ |
| 異体字 | 髙（はしごだか）﨑（たつさき）、德・濵 など |

これらはUnicodeに登録されているため技術的には表示できますが、**フォントが対応していない環境や、古いシステムでは表示できません**。

特に注意が必要なのが **人名の異体字** です。「高橋」と「髙橋」、「山崎」と「山﨑」は別の文字であり、システムによっては登録できなかったり、検索でヒットしなかったりします。公的な書類では正しい字を使う必要がある一方、システムには入力できないという場面がしばしば起こります。

## 文字化けの主な原因

- **文字コードの取り違え**: UTF-8のデータをShift_JISとして読むと「譁�蟄怜喧縺�」のようになります
- **BOMの有無**: UTF-8の先頭に付く目印。あるとExcelが正しく開けますが、他のツールでは余計な文字として扱われます
- **環境依存文字**: フォントがない環境では「□」や「〓」になります
- **絵文字**: 古いシステムでは扱えず、消えるか置き換わります

化けた文字から元の文字コードを推測することもできます。「縺」「繧」が並んでいればUTF-8をShift_JISで読んだ場合、「?」の連続なら変換できない文字が置き換えられた場合、というように特徴があります。

## 主な文字コードの違い

| 名称 | 日本語1文字 | 特徴 |
|---|---|---|
| **UTF-8** | 3バイト | 世界標準。Webの98%以上で使用 |
| Shift_JIS | 2バイト | 日本のWindowsで長く使われた |
| EUC-JP | 2バイト | 主にUnixで使われた |
| ISO-2022-JP | 可変 | メールの本文で使われた |

新しく作るシステムでは、**UTF-8を選ぶのが標準** です。Shift_JISには扱える文字数の制限があり、環境依存文字の問題も起きやすくなります。
`,

  faq: [
    {
      q: "日本語1文字は何バイトですか？",
      a: "UTF-8では3バイトです。「全角は2バイト」という説明はShift_JISの話で、現在主流のUTF-8には当てはまりません。絵文字や一部の漢字は4バイト必要です。",
    },
    {
      q: "絵文字を入れると文字数が2つ分になるのはなぜですか？",
      a: "サロゲートペアという仕組みで、2つの単位を組み合わせて1文字を表しているためです。プログラムが単純に長さを数えると2と判定されます。家族の絵文字のように複数を連結したものは、さらに多く数えられます。",
    },
    {
      q: "「髙」と「高」は別の文字ですか？",
      a: "別の文字です。髙（U+9AD9）は異体字で、高（U+9AD8）とはコードポイントが違います。システムによっては登録できなかったり、検索でヒットしなかったりします。",
    },
    {
      q: "文字化けの原因は何ですか？",
      a: "多くは文字コードの取り違えです。UTF-8のデータをShift_JISとして読むと「縺」「繧」といった文字が並びます。ほかに、環境依存文字やフォント未対応も原因になります。",
    },
    {
      q: "丸数字（①）は使わないほうがいいですか？",
      a: "環境依存文字なので、システム間でやり取りする文書では避けるのが無難です。表示できない環境では「□」や「〓」になります。(1) のように半角で書くと確実です。",
    },
  ],
};
