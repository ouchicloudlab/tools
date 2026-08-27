export default {
  category: "text",
  updated: "2026-08-27",
  title: "URLエンコード・デコード｜Base64やHTMLエスケープも変換",
  h1: "URLエンコード・変換ツール",
  description:
    "日本語を含むURLのエンコードとデコード、Base64の相互変換、HTMLの特殊文字エスケープをまとめて行えます。入力内容は送信されない無料ツールです。",
  cardText: "URLエンコード・Base64・HTMLエスケープを変換。",
  keywords: [
    "URLエンコード", "デコード", "Base64", "パーセントエンコード", "変換", "エスケープ", "HTML", "%E3",
  ],
  related: ["moji-henkan", "mojisu-count"],

  ui: `
<div class="field">
  <label for="src">変換したい文字列</label>
  <textarea id="src" style="min-height:110px">https://example.com/検索?q=日本語 テスト&page=1</textarea>
</div>

<div class="field">
  <span class="field-label">変換の種類</span>
  <div class="pills" id="mode">
    <label><input type="radio" name="mode" value="encodeComponent" checked>URLエンコード（全体）</label>
    <label><input type="radio" name="mode" value="encodeUri">URLエンコード（記号は残す）</label>
    <label><input type="radio" name="mode" value="decode">URLデコード</label>
    <label><input type="radio" name="mode" value="base64">Base64にする</label>
    <label><input type="radio" name="mode" value="base64d">Base64を戻す</label>
    <label><input type="radio" name="mode" value="html">HTMLエスケープ</label>
    <label><input type="radio" name="mode" value="htmld">HTMLエスケープを戻す</label>
  </div>
</div>

<div class="row">
  <button class="btn" type="button" id="copyBtn">結果をコピー</button>
  <button class="btn sub" type="button" id="swapBtn">結果を入力欄に戻す</button>
  <button class="btn sub" type="button" id="clearBtn">消去</button>
</div>

<div class="field" style="margin-top:16px">
  <label for="out">変換結果</label>
  <textarea id="out" readonly style="min-height:110px"></textarea>
</div>

<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">変換前の文字数</div><div class="v" id="beforeVal">0</div></div>
    <div><div class="k">変換後の文字数</div><div class="v" id="afterVal">0</div></div>
    <div><div class="k">バイト数（UTF-8）</div><div class="v" id="byteVal">0</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  // UTF-8 を保ったまま Base64 に変換する。
  // btoa() はそのままだと日本語で例外を投げるため、一度バイト列に直す。
  function toBase64(s) {
    var bytes = new TextEncoder().encode(s);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function fromBase64(s) {
    var bin = atob(s.replace(/\\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  var NOTES = {
    encodeComponent: "encodeURIComponent 相当。「/」「?」「&」なども変換します。クエリの値を作るときに使います。",
    encodeUri: "encodeURI 相当。URLの区切り記号（/ ? & = #）はそのまま残します。URL全体を変換するときに使います。",
    decode: "%XX の形式を元の文字に戻します。",
    base64: "UTF-8のバイト列をBase64に変換します。データ量は約1.33倍になります。",
    base64d: "Base64の文字列を元に戻します。",
    html: "< > & \\" ' を実体参照に置き換えます。HTMLに文字列を埋め込むときの安全対策です。",
    htmld: "実体参照を元の文字に戻します。"
  };

  function convert() {
    var s = ST.$("src").value;
    var mode = ST.pick("mode");
    var out = "";
    var err = "";

    try {
      if (mode === "encodeComponent") out = encodeURIComponent(s);
      else if (mode === "encodeUri") out = encodeURI(s);
      else if (mode === "decode") out = decodeURIComponent(s.replace(/\\+/g, " "));
      else if (mode === "base64") out = toBase64(s);
      else if (mode === "base64d") out = fromBase64(s);
      else if (mode === "html") {
        out = s.replace(/[&<>"']/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;",
                   '"': "&quot;", "'": "&#39;" }[c];
        });
      } else {
        out = s.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, function (m, e) {
          return { amp: "&", lt: "<", gt: ">", quot: '"',
                   "#39": "'", apos: "'", nbsp: " " }[e];
        });
      }
    } catch (e) {
      out = "";
      err = mode === "base64d"
        ? "Base64として解釈できませんでした。文字列を確認してください。"
        : "デコードできませんでした。%記号の後ろが正しい形式か確認してください。";
    }

    ST.$("out").value = out;
    ST.set("beforeVal", ST.num(Array.from(s).length, 0));
    ST.set("afterVal", ST.num(Array.from(out).length, 0));
    ST.set("byteVal", ST.num(new TextEncoder().encode(s).length, 0));
    ST.set("detail", err || NOTES[mode]);
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
URLに含まれる日本語のエンコード・デコード、Base64の変換、HTMLの特殊文字エスケープをまとめて行えます。**入力した内容はブラウザ内で処理され、送信されません。**
`,

  guide: `
## URLエンコードとは

URLに使える文字は、英数字と一部の記号だけと決まっています（RFC 3986）。日本語や空白をURLに含めるときは、**UTF-8のバイト列を「%」＋16進数2桁** で表す形式に変換します。これをパーセントエンコーディング、またはURLエンコードと呼びます。

- 「あ」 → UTF-8で E3 81 82 → **%E3%81%82**
- 半角スペース → **%20**（フォームの送信では「+」になることもあります）

日本語1文字が9文字（%XX×3）に膨らむため、URLが長くなります。ブラウザのアドレスバーでは見やすさのために日本語のまま表示されますが、実際に送信されているのはエンコードされた文字列です。

## 2種類のエンコード

用途によって、変換する範囲が変わります。

| 種類 | 変換されない文字 | 用途 |
|---|---|---|
| **encodeURIComponent** | 英数字 と \`- _ . ! ~ * ' ( )\` | クエリの値、パスの一部 |
| **encodeURI** | 上記 ＋ \`; , / ? : @ & = + $ #\` | URL全体 |

**URL全体を変換するなら encodeURI、値の部分だけなら encodeURIComponent** と覚えてください。

たとえば検索キーワードをURLに入れる場合、キーワードに「&」が含まれていると、encodeURIで処理するとパラメータの区切りと解釈されて壊れます。値の部分には必ず encodeURIComponent を使ってください。

## Base64とは

バイナリデータを、英数字と \`+ / =\` の64種類の文字だけで表す方式です。画像やファイルを、テキストしか扱えない仕組み（メールの添付、JSONの中、HTMLのdata URI）に埋め込むために使われます。

- **データ量は約1.33倍** になります（3バイトを4文字で表すため）
- **末尾の「=」** は、長さを4の倍数に揃えるための詰め物です
- **暗号ではありません**。誰でも元に戻せるため、パスワードなど秘密の情報を守る用途には使えません

Basic認証のヘッダーやJWT（JSON Web Token）にBase64が使われているのを見て「暗号化されている」と誤解されることがありますが、単なる変換です。

## HTMLエスケープ

HTMLの中に文字列をそのまま埋め込むと、記号がタグとして解釈されてしまいます。これを防ぐために、特殊な意味を持つ文字を実体参照に置き換えます。

| 文字 | 実体参照 | 意味 |
|---|---|---|
| \`&\` | \`&amp;\` | 実体参照の開始記号 |
| \`<\` | \`&lt;\` | タグの開始 |
| \`>\` | \`&gt;\` | タグの終了 |
| \`"\` | \`&quot;\` | 属性値の囲み |
| \`'\` | \`&#39;\` | 属性値の囲み（単一引用符） |

エスケープを怠ると、利用者が入力した文字列にスクリプトが混ざっていた場合、それが実行されてしまいます（クロスサイトスクリプティング、XSS）。**変換の順序が重要** で、\`&\` を最初に変換しないと二重変換が起きます。

## よくある場面

- **文字化けしたURLを読む**: \`%E6%97%A5%E6%9C%AC%E8%AA%9E\` のような文字列を「デコード」で元に戻す
- **URLを共有する**: 日本語を含むURLをメールやチャットに貼るとリンクが切れる場合、エンコードしてから貼る
- **APIのパラメータを作る**: 検索キーワードをクエリに入れる前に encodeURIComponent で変換する
- **メールのヘッダーを読む**: \`=?UTF-8?B?...?=\` はBase64エンコードされた件名です。\`?B?\` の後ろの部分を「Base64を戻す」で読めます

## 入力内容の扱い

このツールの変換はすべてブラウザ内で行われます。入力した文字列がサーバーに送信されることはありません。APIキーやトークンを含むURLの確認にも使えますが、ページを閉じると内容は消えるため、必要な結果はコピーしてから閉じてください。
`,

  faq: [
    {
      q: "URLの中の %E3%81%82 のような文字列は何ですか？",
      a: "日本語などをURLで扱えるようにしたパーセントエンコーディングです。UTF-8のバイト列を「%」と16進数2桁で表しています。%E3%81%82は「あ」1文字にあたります。デコードすると元に戻せます。",
    },
    {
      q: "encodeURIとencodeURIComponentの違いは何ですか？",
      a: "変換する範囲が違います。encodeURIはURLの区切り記号（/ ? & = #）を残すのでURL全体の変換向き、encodeURIComponentはそれらも変換するのでクエリの値の変換向きです。値に&が含まれる場合は後者を使わないとURLが壊れます。",
    },
    {
      q: "Base64は暗号化ですか？",
      a: "違います。誰でも元に戻せる単なる変換方式で、機密情報を守る効果はありません。テキストしか扱えない場所にバイナリデータを埋め込むための仕組みです。",
    },
    {
      q: "Base64の末尾にある「=」は何ですか？",
      a: "パディング（詰め物）です。Base64は3バイトを4文字に変換するため、元データの長さが3の倍数でない場合に「=」で長さを揃えます。1個または2個付きます。",
    },
    {
      q: "半角スペースが「+」になったり「%20」になったりするのはなぜですか？",
      a: "仕様が異なるためです。URLのパス部分では%20、HTMLフォームの送信（application/x-www-form-urlencoded）では「+」が使われます。このツールのデコードは両方に対応しています。",
    },
  ],
};
