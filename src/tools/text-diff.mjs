export default {
  category: "text",
  updated: "2026-08-27",
  title: "テキスト差分比較｜2つの文章の違いを行ごとに表示",
  h1: "テキストの差分比較ツール",
  description:
    "2つの文章を並べて、追加・削除された行を色分けして表示します。修正前後の原稿の比較や、設定ファイルの違いの確認に使える無料ツールです。",
  cardText: "2つの文章を比較して違いを行ごとに表示。",
  keywords: [
    "差分", "比較", "diff", "テキスト", "違い", "変更点", "校正", "原稿", "チェック",
  ],
  related: ["moji-henkan", "csv-seikei", "mojisu-count"],

  ui: `
<div class="row">
  <div class="field">
    <label for="a">変更前</label>
    <textarea id="a" style="min-height:150px">おはようございます。
本日の会議は10時から開始します。
場所は3階の会議室です。
資料は事前に配布済みです。
よろしくお願いします。</textarea>
  </div>
  <div class="field">
    <label for="b">変更後</label>
    <textarea id="b" style="min-height:150px">おはようございます。
本日の会議は13時から開始します。
場所は3階の会議室です。
資料は当日お配りします。
持ち物は筆記用具のみです。
よろしくお願いします。</textarea>
  </div>
</div>

<div class="field">
  <span class="field-label">比較のしかた</span>
  <div class="pills">
    <label><input type="checkbox" id="ignoreSpace" checked>行の前後の空白を無視</label>
    <label><input type="checkbox" id="ignoreEmpty">空行を無視</label>
    <label><input type="checkbox" id="ignoreCase">大文字と小文字を区別しない</label>
  </div>
</div>

<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">追加された行</div><div class="v" id="addVal">-</div></div>
    <div><div class="k">削除された行</div><div class="v" id="delVal">-</div></div>
    <div><div class="k">変わらない行</div><div class="v" id="sameVal">-</div></div>
    <div><div class="k">一致率</div><div class="v" id="matchVal">-</div></div>
  </div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>差分</h3>
<div id="diffBox" class="note" style="font-family:ui-monospace,Consolas,monospace;font-size:13.5px;line-height:1.9;white-space:pre-wrap;word-break:break-all"></div>
`,

  style: `
.diff-add { background: rgba(18,128,92,.14); border-left: 3px solid var(--ok); padding: 1px 8px; display: block; }
.diff-del { background: rgba(200,60,60,.14); border-left: 3px solid #c83c3c; padding: 1px 8px; display: block; text-decoration: line-through; opacity: .8; }
.diff-same { padding: 1px 8px; display: block; opacity: .65; border-left: 3px solid transparent; }
`,

  script: `
(function () {
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function normalize(line) {
    var s = line;
    if (ST.$("ignoreSpace").checked) s = s.trim();
    if (ST.$("ignoreCase").checked) s = s.toLowerCase();
    return s;
  }

  function split(text) {
    var lines = String(text).replace(/\\r\\n/g, "\\n").split("\\n");
    if (ST.$("ignoreEmpty").checked) {
      lines = lines.filter(function (l) { return l.trim() !== ""; });
    }
    return lines;
  }

  // 最長共通部分列（LCS）の長さを表で求め、そこから差分をたどる。
  // 行数が多いと計算量が増えるため上限を設けている。
  function diff(a, b) {
    var n = a.length, m = b.length;
    var dp = [];
    for (var i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
    for (var i2 = n - 1; i2 >= 0; i2--) {
      for (var j = m - 1; j >= 0; j--) {
        dp[i2][j] = normalize(a[i2]) === normalize(b[j])
          ? dp[i2 + 1][j + 1] + 1
          : Math.max(dp[i2 + 1][j], dp[i2][j + 1]);
      }
    }
    var out = [];
    var i3 = 0, j3 = 0;
    while (i3 < n && j3 < m) {
      if (normalize(a[i3]) === normalize(b[j3])) {
        out.push(["same", a[i3]]); i3++; j3++;
      } else if (dp[i3 + 1][j3] >= dp[i3][j3 + 1]) {
        out.push(["del", a[i3]]); i3++;
      } else {
        out.push(["add", b[j3]]); j3++;
      }
    }
    while (i3 < n) { out.push(["del", a[i3]]); i3++; }
    while (j3 < m) { out.push(["add", b[j3]]); j3++; }
    return out;
  }

  ST.live(function () {
    var a = split(ST.$("a").value);
    var b = split(ST.$("b").value);

    if (a.length > 600 || b.length > 600) {
      ST.$("diffBox").textContent = "";
      ["addVal","delVal","sameVal","matchVal"].forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "行数が多すぎます（600行まで）。分割して比較してください。");
      return;
    }

    var result = diff(a, b);
    var add = 0, del = 0, same = 0;
    var html = result.map(function (r) {
      if (r[0] === "add") { add++; return '<span class="diff-add">＋ ' + esc(r[1]) + "</span>"; }
      if (r[0] === "del") { del++; return '<span class="diff-del">− ' + esc(r[1]) + "</span>"; }
      same++;
      return '<span class="diff-same">　 ' + esc(r[1]) + "</span>";
    }).join("");

    ST.$("diffBox").innerHTML = html || '<span class="empty">文章を入力してください。</span>';
    ST.set("addVal", add + " 行");
    ST.set("delVal", del + " 行");
    ST.set("sameVal", same + " 行");
    var total = Math.max(1, a.length, b.length);
    ST.set("matchVal", ST.num(same / total * 100, 1) + " %");
    ST.set("detail", add === 0 && del === 0
      ? "2つの文章に違いはありません。"
      : "緑（＋）が追加された行、赤（−）が削除された行です。" +
        "変更された行は、削除と追加の組み合わせとして表示されます。");
  });
})();
`,

  intro: `
2つの文章を並べて、**追加・削除された行を色分け**して表示します。修正前後の原稿の比較や、設定ファイルの違いを確認するときに使えます。入力内容は送信されません。
`,

  guide: `
## 差分の見方

| 表示 | 意味 |
|---|---|
| **＋ 緑の行** | 変更後にだけある行（追加） |
| **− 赤の行** | 変更前にだけある行（削除） |
| 灰色の行 | 両方にある行（変更なし） |

**行の一部だけを書き換えた場合、その行は「削除」と「追加」の2行として表示されます。** 行単位で比較しているためで、これは一般的なdiffツールと同じ動作です。

## LCS（最長共通部分列）

差分の計算には、**両方の文章に共通して現れる最も長い並び** を見つける方法を使っています。これをLCS（Longest Common Subsequence）といいます。

たとえば「ABCDE」と「ACE」なら、共通部分列は「ACE」です。この共通部分を基準に、残りを追加・削除として割り当てます。

単純に上から1行ずつ比べる方法だと、途中に1行挿入されただけで **それ以降のすべての行がずれて「全部違う」と判定されてしまいます**。LCSを使えば、挿入された行だけを正しく検出できます。

## 比較のオプション

- **行の前後の空白を無視**: インデントの違いを無視して内容だけを比べます
- **空行を無視**: 段落の区切り方が違うだけの場合に有効です
- **大文字と小文字を区別しない**: 英文の比較で使います

コードやデータを比較するときは、これらをオフにして厳密に比べるほうが確実です。空白の違いが動作に影響することがあるためです。

## 使いどころ

| 場面 | 使い方 |
|---|---|
| 原稿の修正確認 | 修正前と修正後を貼って、どこが変わったか確認する |
| 契約書のチェック | 相手から返ってきた版と、こちらが送った版を比較する |
| 設定ファイルの調査 | 動く環境と動かない環境の設定を比べる |
| 議事録の更新点 | 前回と今回の内容を比べる |
| コピーの検出 | 2つの文書がどれくらい似ているか一致率で見る |

**相手が「一部だけ修正しました」と言ってきた文書** を確認するとき、この方法なら見落としがありません。目視では、数字の桁が変わっていたり、「以上」が「未満」になっていたりする変更を見逃しやすくなります。

## Wordの変更履歴との違い

Wordの「変更履歴の記録」は、編集した操作そのものを記録します。一方この方法は、**結果として出来上がった2つの文書を後から比べる** ものです。

- 変更履歴: 誰がいつ何をしたかまで分かるが、機能をオンにしていないと記録されない
- 差分比較: 後からでも比較できるが、変更の順序や意図は分からない

相手が変更履歴なしで修正版を送ってきた場合、差分比較が唯一の確認手段になります。

## 入力内容の扱い

比較はすべてブラウザの中で行われます。契約書の草案や未公開の原稿を貼っても、外部に送信されることはありません。ページを閉じれば内容は消えます。

なお、行数が非常に多い場合（600行超）は計算量が大きくなるため、分割して比較してください。LCSの計算は行数の掛け算に比例して重くなります。
`,

  faq: [
    {
      q: "行の一部を直しただけなのに2行に分かれて表示されます。",
      a: "行単位で比較しているためです。1文字でも変わった行は、削除された行と追加された行の組み合わせとして表示されます。これは一般的なdiffツールと同じ動作です。",
    },
    {
      q: "途中に1行足しただけで、それ以降が全部違うと出ませんか？",
      a: "出ません。LCS（最長共通部分列）という方法で共通部分を先に見つけているため、挿入された行だけが正しく検出されます。単純に上から突き合わせる方法とはここが違います。",
    },
    {
      q: "空白の違いは無視できますか？",
      a: "できます。「行の前後の空白を無視」にチェックを入れてください。ただしコードや設定ファイルの比較では、空白の違いが動作に影響することがあるため、オフにして厳密に比べるほうが確実です。",
    },
    {
      q: "貼り付けた文章は外部に送信されますか？",
      a: "されません。比較はすべてブラウザ内で完結します。契約書の草案や未公開の原稿にも使えます。ページを閉じると内容は消えます。",
    },
    {
      q: "Wordの変更履歴とどちらを使うべきですか？",
      a: "変更履歴が記録されているならそちらが詳しく分かります。相手が履歴なしで修正版を送ってきた場合や、後から2つの版を比べたい場合に、この差分比較が役立ちます。",
    },
  ],
};
