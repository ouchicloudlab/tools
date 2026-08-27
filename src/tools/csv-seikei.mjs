export default {
  category: "text",
  updated: "2026-08-27",
  title: "リスト整形ツール｜改行区切りをカンマ区切りに変換",
  h1: "リスト・CSVの整形ツール",
  description:
    "改行で並んだリストをカンマ区切りに変換したり、その逆を行えます。連番の付与、引用符での囲み、重複の削除にも対応した無料ツールです。",
  cardText: "改行⇔カンマの変換、連番付与、囲み文字の追加。",
  keywords: [
    "CSV", "変換", "改行", "カンマ", "区切り", "リスト", "整形", "連番", "一括",
  ],
  related: ["moji-henkan", "mojisu-count"],

  ui: `
<div class="field">
  <label for="src">元のデータ</label>
  <textarea id="src" style="min-height:130px">田中
佐藤
鈴木
田中
高橋</textarea>
</div>

<div class="row">
  <div class="field">
    <label for="inSep">入力の区切り</label>
    <select id="inSep">
      <option value="\\n" selected>改行</option>
      <option value=",">カンマ</option>
      <option value="\\t">タブ</option>
      <option value=" ">半角スペース</option>
      <option value="、">読点（、）</option>
    </select>
  </div>
  <div class="field">
    <label for="outSep">出力の区切り</label>
    <select id="outSep">
      <option value=",">カンマ</option>
      <option value=", ">カンマ＋スペース</option>
      <option value="\\n" selected>改行</option>
      <option value="\\t">タブ</option>
      <option value="、">読点（、）</option>
      <option value=" / ">スラッシュ</option>
    </select>
  </div>
  <div class="field">
    <label for="quote">各項目を囲む</label>
    <select id="quote">
      <option value="" selected>囲まない</option>
      <option value="&quot;">ダブルクォート "</option>
      <option value="'">シングルクォート '</option>
      <option value="「">かぎ括弧 「」</option>
      <option value="[">角括弧 []</option>
    </select>
  </div>
</div>

<div class="field">
  <span class="field-label">処理</span>
  <div class="pills">
    <label><input type="checkbox" id="trim" checked>前後の空白を削除</label>
    <label><input type="checkbox" id="dropEmpty" checked>空の項目を除く</label>
    <label><input type="checkbox" id="unique">重複を削除</label>
    <label><input type="checkbox" id="sort">並べ替え</label>
    <label><input type="checkbox" id="numbering">連番を付ける</label>
  </div>
</div>

<div class="row">
  <button class="btn" type="button" id="copyBtn">結果をコピー</button>
  <button class="btn sub" type="button" id="swapBtn">結果を入力欄に戻す</button>
  <button class="btn sub" type="button" id="clearBtn">消去</button>
</div>

<div class="field" style="margin-top:16px">
  <label for="out">変換結果</label>
  <textarea id="out" readonly style="min-height:130px"></textarea>
</div>

<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">元の項目数</div><div class="v" id="beforeVal">0</div></div>
    <div><div class="k">結果の項目数</div><div class="v" id="afterVal">0</div></div>
    <div><div class="k">削除された数</div><div class="v" id="removedVal">0</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>
`,

  script: `
(function () {
  var PAIRS = { "「": "」", "[": "]", '"': '"', "'": "'" };

  function unescape(s) {
    return s.replace(/\\\\n/g, "\\n").replace(/\\\\t/g, "\\t");
  }

  function convert() {
    var src = ST.$("src").value;
    var inSep = unescape(ST.$("inSep").value);
    var outSep = unescape(ST.$("outSep").value);
    var q = ST.$("quote").value;
    var qEnd = PAIRS[q] || q;

    // 改行区切りのときは、CRLF も LF も同じように扱う
    var items = inSep === "\\n"
      ? src.split(/\\r?\\n/)
      : src.split(inSep);

    var before = items.length;

    if (ST.$("trim").checked) {
      items = items.map(function (s) { return s.trim(); });
    }
    if (ST.$("dropEmpty").checked) {
      items = items.filter(function (s) { return s !== ""; });
    }
    if (ST.$("unique").checked) {
      var seen = {};
      items = items.filter(function (s) {
        if (Object.prototype.hasOwnProperty.call(seen, s)) return false;
        seen[s] = true;
        return true;
      });
    }
    if (ST.$("sort").checked) {
      items = items.slice().sort(function (a, b) { return a.localeCompare(b, "ja"); });
    }
    if (q) {
      items = items.map(function (s) { return q + s + qEnd; });
    }
    if (ST.$("numbering").checked) {
      items = items.map(function (s, i) { return (i + 1) + ". " + s; });
    }

    ST.$("out").value = items.join(outSep);
    ST.set("beforeVal", ST.num(before, 0));
    ST.set("afterVal", ST.num(items.length, 0));
    ST.set("removedVal", ST.num(Math.max(0, before - items.length), 0));
    ST.set("detail", "項目に区切り文字そのものが含まれている場合は、" +
      "分割位置がずれることがあります。CSVとして正式に扱うなら、" +
      "値を引用符で囲んでください。");
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
改行で並んだリストをカンマ区切りに変換したり、その逆を行えます。重複の削除、連番の付与、引用符での囲みも同時にできます。**入力内容は送信されません。**
`,

  guide: `
## よくある使い道

| やりたいこと | 設定 |
|---|---|
| Excelの列をカンマ区切りにする | 入力=改行、出力=カンマ |
| カンマ区切りを1行ずつに分ける | 入力=カンマ、出力=改行 |
| SQLの IN句 を作る | 出力=カンマ、囲み=シングルクォート |
| メールの宛先リストを作る | 出力=カンマ、重複を削除にチェック |
| 箇条書きに番号を振る | 出力=改行、連番を付けるにチェック |
| 名簿の重複を確認する | 重複を削除にチェックして、削除された数を見る |

表計算ソフトで列をコピーすると、改行区切りのデータとして貼り付けられます。それをそのままこのツールに入れれば、カンマ区切りに変換できます。

## CSVを扱うときの注意

CSV（Comma-Separated Values）は単純な形式に見えますが、実際にはいくつか落とし穴があります。

### 値の中にカンマが入る場合

「東京都千代田区1-1」のような住所は問題ありませんが、「田中, 太郎」のようにカンマを含む値があると、区切り位置がずれます。正式なCSVでは、値をダブルクォートで囲んで対処します。

> "田中, 太郎",30,東京

### 値の中にダブルクォートが入る場合

引用符自体を含めたいときは、**2つ重ねます**。

> "彼は""こんにちは""と言った"

### 改行が値に含まれる場合

住所や備考欄で改行が含まれることがあります。この場合も引用符で囲めば1つの値として扱えますが、多くの簡易ツールは対応していません。

このツールは単純な分割を行うため、**値の中に区切り文字が含まれるデータには向きません**。そのようなデータは、表計算ソフトやプログラムで処理してください。

## 文字コードの問題

CSVをExcelで開くと文字化けすることがあります。原因はほとんどが文字コードの不一致です。

- **UTF-8**: Webやプログラムの標準。Excelは標準では正しく開けないことがある
- **UTF-8 BOM付き**: 先頭に見えない印を付けたもの。Excelが正しく認識できる
- **Shift_JIS**: Windowsの日本語環境で伝統的に使われてきた

Excelで文字化けする場合は、「データ」タブの「テキストまたはCSVから」で読み込み、文字コードにUTF-8を指定すると正しく表示されます。ダブルクリックで開くと、この指定ができません。

## 区切り文字の使い分け

| 区切り | 形式名 | 向いている場面 |
|---|---|---|
| カンマ | CSV | 汎用。最も広く使われる |
| タブ | TSV | 値にカンマが含まれる場合に安全 |
| セミコロン | — | 欧州の一部地域（小数点にカンマを使うため） |
| パイプ（\\|） | — | 値にカンマもタブも含まれる場合 |

**タブ区切り（TSV）は、日本語の文章を含むデータで扱いやすい** 形式です。文章にカンマが入ることは多くても、タブが入ることはまれだからです。表計算ソフトからのコピーもタブ区切りになります。

## 入力内容の扱い

このツールの処理はすべてブラウザ内で行われます。名簿やメールアドレスのリストなど、外部に出せないデータの整形にも使えます。ページを閉じると内容は消えます。
`,

  faq: [
    {
      q: "Excelの列をカンマ区切りにするにはどうすればいいですか？",
      a: "列をコピーしてこのツールに貼り付け、入力の区切りを「改行」、出力の区切りを「カンマ」にしてください。表計算ソフトからコピーした列は改行区切りになっています。",
    },
    {
      q: "値の中にカンマが含まれる場合はどうなりますか？",
      a: "その位置で分割されてしまいます。正式なCSVでは値をダブルクォートで囲んで対処しますが、このツールは単純な分割を行うため対応していません。タブ区切りを使うか、表計算ソフトで処理してください。",
    },
    {
      q: "SQLのIN句に使うリストを作れますか？",
      a: "作れます。出力の区切りを「カンマ」、各項目を囲むを「シングルクォート」にすると 'A','B','C' の形式になります。",
    },
    {
      q: "CSVをExcelで開くと文字化けします。",
      a: "文字コードの不一致が原因です。ダブルクリックで開くのではなく、Excelの「データ」タブから「テキストまたはCSVから」を選び、文字コードにUTF-8を指定して読み込んでください。",
    },
    {
      q: "入力したデータは送信されますか？",
      a: "送信されません。すべての処理はブラウザ内で完結します。名簿やメールアドレスなど、外部に出せないデータの整形にも使えます。",
    },
  ],
};
