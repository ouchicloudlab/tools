export default {
  category: "text",
  updated: "2026-08-27",
  title: "パスワード生成ツール｜強度を確かめながら安全に作れる",
  h1: "パスワード生成ツール",
  description:
    "推測されにくいパスワードをブラウザ内で生成します。文字数や記号の有無を選べ、解読にかかる時間の目安も表示。生成した内容は送信されない無料ツールです。",
  cardText: "安全なパスワードを生成。強度も同時に表示。",
  keywords: [
    "パスワード", "生成", "作成", "ランダム", "強度", "セキュリティ", "自動生成", "強力",
  ],
  related: ["moji-henkan", "mojisu-count"],

  ui: `
<div class="row">
  <div class="field">
    <label for="length">文字数: <span id="lenLabel">16</span></label>
    <input type="range" id="length" min="4" max="64" value="16" step="1" style="width:100%">
  </div>
  <div class="field">
    <label for="count">生成する個数</label>
    <input type="number" id="count" inputmode="numeric" value="5" min="1" max="20">
  </div>
</div>

<div class="field">
  <span class="field-label">使う文字の種類</span>
  <div class="pills">
    <label><input type="checkbox" id="useLower" checked>英小文字 (a-z)</label>
    <label><input type="checkbox" id="useUpper" checked>英大文字 (A-Z)</label>
    <label><input type="checkbox" id="useDigit" checked>数字 (0-9)</label>
    <label><input type="checkbox" id="useSymbol" checked>記号 (!@#$…)</label>
  </div>
</div>

<div class="field">
  <span class="field-label">読み間違い対策</span>
  <div class="pills">
    <label><input type="checkbox" id="noAmbiguous">紛らわしい文字を除く（0 O o 1 l I）</label>
  </div>
</div>

<div class="row">
  <button class="btn" type="button" id="genBtn">作り直す</button>
</div>

<div class="result" aria-live="polite">
  <div class="result-label">生成したパスワード</div>
  <div id="list" style="margin-top:8px"></div>
  <p class="result-sub" id="detail"></p>
</div>

<h3>強度の目安</h3>
<div class="result" aria-live="polite">
  <div class="result-grid" style="margin-top:0">
    <div><div class="k">使える文字の種類</div><div class="v" id="poolVal">-</div></div>
    <div><div class="k">組み合わせの数</div><div class="v" id="combiVal">-</div></div>
    <div><div class="k">情報量（エントロピー）</div><div class="v" id="entropyVal">-</div></div>
    <div><div class="k">総当たりにかかる時間</div><div class="v" id="crackVal">-</div></div>
  </div>
  <p class="result-sub">1秒あたり1兆回の試行ができる攻撃者を想定した、平均の解読時間です。</p>
</div>
`,

  style: `
.pw-row { display:flex; align-items:center; gap:10px; padding:8px 12px;
  background:var(--surface); border:1px solid var(--border); border-radius:9px; margin-bottom:8px; }
.pw-text { flex:1; font-family:ui-monospace,Consolas,monospace; font-size:16px;
  word-break:break-all; letter-spacing:.02em; }
.pw-copy { flex:none; font-size:12px; padding:6px 12px; }
`,

  script: `
(function () {
  var LOWER = "abcdefghijklmnopqrstuvwxyz";
  var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var DIGIT = "0123456789";
  var SYMBOL = "!@#$%&*+-=?_~";
  var AMBIGUOUS = "0Oo1lI";

  // Math.random() は暗号用途に適さないため crypto を使う
  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      var limit = Math.floor(4294967296 / max) * max;
      var buf = new Uint32Array(1);
      var v;
      do {
        window.crypto.getRandomValues(buf);
        v = buf[0];
      } while (v >= limit);
      return v % max;
    }
    return Math.floor(Math.random() * max);
  }

  function buildPool() {
    var pool = "";
    if (ST.$("useLower").checked) pool += LOWER;
    if (ST.$("useUpper").checked) pool += UPPER;
    if (ST.$("useDigit").checked) pool += DIGIT;
    if (ST.$("useSymbol").checked) pool += SYMBOL;
    if (ST.$("noAmbiguous").checked) {
      pool = pool.split("").filter(function (c) {
        return AMBIGUOUS.indexOf(c) < 0;
      }).join("");
    }
    return pool;
  }

  function make(pool, len) {
    var s = "";
    for (var i = 0; i < len; i++) s += pool.charAt(randomInt(pool.length));
    return s;
  }

  function crackTime(entropy) {
    // 1秒1兆回、平均は全探索の半分
    var seconds = Math.pow(2, entropy) / 2 / 1e12;
    if (seconds < 1) return "1秒未満";
    if (seconds < 60) return Math.round(seconds) + "秒";
    if (seconds < 3600) return Math.round(seconds / 60) + "分";
    if (seconds < 86400) return Math.round(seconds / 3600) + "時間";
    if (seconds < 31536000) return Math.round(seconds / 86400) + "日";
    var years = seconds / 31536000;
    if (years < 1e4) return ST.num(Math.round(years), 0) + "年";
    if (years < 1e8) return ST.num(Math.round(years / 1e4), 0) + "万年";
    if (years < 1e12) return ST.num(Math.round(years / 1e8), 0) + "億年";
    if (years < 1e16) return ST.num(Math.round(years / 1e12), 0) + "兆年";
    return "事実上、解読できません";
  }

  function generate() {
    var len = Math.round(ST.n(ST.$("length"), 16));
    var n = Math.min(20, Math.max(1, Math.round(ST.n(ST.$("count"), 5))));
    ST.set("lenLabel", String(len));

    var pool = buildPool();
    var list = ST.$("list");

    if (!pool) {
      list.innerHTML = '<p class="empty">文字の種類を1つ以上選んでください。</p>';
      ["poolVal","combiVal","entropyVal","crackVal"].forEach(function (id) { ST.set(id, "-"); });
      ST.set("detail", "");
      return;
    }

    var html = "";
    for (var i = 0; i < n; i++) {
      var pw = make(pool, len);
      html += '<div class="pw-row"><span class="pw-text">' +
        pw.replace(/[&<>"]/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        }) +
        '</span><button class="btn sub pw-copy" type="button">コピー</button></div>';
    }
    list.innerHTML = html;

    // コピーボタン
    Array.prototype.forEach.call(list.querySelectorAll(".pw-copy"), function (btn) {
      btn.addEventListener("click", function () {
        ST.copy(btn.parentNode.querySelector(".pw-text").textContent, btn);
      });
    });

    var entropy = len * Math.log(pool.length) / Math.log(2);
    ST.set("poolVal", pool.length + " 種類");
    ST.set("combiVal", pool.length + "の" + len + "乗");
    ST.set("entropyVal", ST.num(entropy, 1) + " ビット");
    ST.set("crackVal", crackTime(entropy));
    ST.set("detail", entropy >= 100
      ? "十分に強力です。"
      : (entropy >= 70
        ? "実用上は十分な強さです。"
        : (entropy >= 50
          ? "重要度の低い用途なら使えますが、文字数を増やすことをおすすめします。"
          : "推測されやすい強度です。文字数を増やしてください。")));
  }

  ST.$("genBtn").addEventListener("click", generate);
  ["length", "count", "useLower", "useUpper", "useDigit", "useSymbol", "noAmbiguous"]
    .forEach(function (id) {
      ST.$(id).addEventListener("input", generate);
      ST.$(id).addEventListener("change", generate);
    });
  generate();
})();
`,

  intro: `
推測されにくいパスワードを生成します。**生成はすべてブラウザの中で行われ、作られたパスワードがサーバーに送られることはありません。** 乱数には暗号用途向けの crypto.getRandomValues を使っています。
`,

  guide: `
## 強さを決めるのは「長さ」

パスワードの強度は **エントロピー（情報量）** という単位で測れます。

> **エントロピー(bit) = 文字数 × log₂(使える文字の種類)**

同じ文字種でも、1文字増えるごとに組み合わせの数は数十倍になります。**記号を混ぜるより、文字数を増やすほうが効果が大きい** のはこのためです。

| 構成 | 8文字 | 12文字 | 16文字 |
|---|---|---|---|
| 数字のみ（10種） | 27 bit | 40 bit | 53 bit |
| 英小文字のみ（26種） | 38 bit | 56 bit | 75 bit |
| 英大小＋数字（62種） | 48 bit | 71 bit | 95 bit |
| 英大小＋数字＋記号（75種） | 50 bit | 75 bit | 100 bit |

**8文字では、記号を混ぜても現代の計算能力では守り切れません。** 12文字以上、できれば16文字を目安にしてください。

## 解読時間の見方

このツールが表示する「総当たりにかかる時間」は、1秒あたり1兆回（10¹²）の試行ができる攻撃者を想定した平均値です。

ただし、実際の攻撃は総当たりだけではありません。

- **辞書攻撃**: 単語や過去に流出したパスワードのリストから試す
- **推測**: 誕生日、名前、ペット名、キーボードの並び（qwerty、123456）
- **パスワードリスト攻撃**: 他のサイトから流出したIDとパスワードの組み合わせをそのまま試す

「P@ssw0rd」のような文字は、一見複雑でも辞書に登録済みで、総当たりを待つまでもなく破られます。**ランダムであること** が、計算上の強度に意味を持たせる前提です。

## 使い回しが最大の危険

どんなに強いパスワードでも、**複数のサイトで使い回すと意味がなくなります**。1つのサイトから流出すれば、同じ組み合わせが他のサイトでも試されるためです（パスワードリスト攻撃）。

実際の被害の多くは、パスワードの強度不足ではなく使い回しが原因です。

対策としては次の順で効果があります。

1. **二段階認証（2FA）を有効にする** — パスワードが漏れても侵入を防げます。最も効果的です
2. **パスワード管理ソフトを使う** — サイトごとに違うパスワードを覚える必要がなくなります
3. **重要なサイトだけでも個別のパスワードにする** — 銀行、メール、SNSは最優先です

特に **メールアカウント** は要注意です。他のサービスのパスワード再設定に使われるため、ここを突破されると芋づる式に被害が広がります。

## 定期変更は必要か

かつては「90日ごとに変更」が推奨されていましたが、現在は **推奨されていません**。

総務省やアメリカのNIST（米国国立標準技術研究所）のガイドラインでは、定期的な変更を求めない方針に変わっています。理由は、頻繁な変更を強制すると、

- 「Password1」→「Password2」のような規則的で弱いパスワードになる
- メモに書いて貼るなど、別のリスクが生まれる

からです。**流出の可能性があるときにだけ変更する** のが現在の考え方です。

## パスフレーズという選択

覚える必要があるパスワード（PCのログインなど）では、**無関係な単語を4つ以上つなげる** 方法も有効です。

- 「correct horse battery staple」のような形式
- 長いためエントロピーが高く、意味のつながりがないため辞書攻撃にも強い
- 記号だらけの文字列より覚えやすい

ただし、ことわざや歌詞など既存のフレーズは辞書に載っている可能性があるため、単語はランダムに選んでください。

## このツールの安全性

- パスワードの生成は **すべてブラウザ内** で行われます。サーバーへの送信はありません
- 乱数には crypto.getRandomValues を使っています。Math.random() は予測可能なため、暗号用途には使いません
- ページを閉じると生成結果は消えます。保存機能はありません

不安な場合は、通信を切った状態（機内モード）でページを開いて生成することもできます。ページの読み込み後は通信を必要としません。
`,

  faq: [
    {
      q: "パスワードは何文字にすればいいですか？",
      a: "12文字以上、できれば16文字を目安にしてください。8文字では記号を混ぜても現代の計算能力に対して不十分です。文字種を増やすより、長さを伸ばすほうが強度への影響が大きくなります。",
    },
    {
      q: "記号は必ず入れたほうがいいですか？",
      a: "入れると強度は上がりますが、長さのほうが効果は大きいです。英大小と数字のみでも16文字あれば95ビットに達し、実用上は十分です。記号が使えないサイトでは長さで補ってください。",
    },
    {
      q: "生成したパスワードは外部に送信されますか？",
      a: "送信されません。生成はすべてブラウザ内で完結し、サーバーへの通信は発生しません。不安な場合は、ページを読み込んだ後に通信を切った状態でも生成できます。",
    },
    {
      q: "パスワードは定期的に変更すべきですか？",
      a: "現在は推奨されていません。総務省やNISTのガイドラインでも定期変更は求めていません。頻繁な変更は規則的で弱いパスワードを生む原因になるためです。流出の可能性があるときに変更してください。",
    },
    {
      q: "強いパスワードを使えば安全ですか？",
      a: "使い回さないことのほうが重要です。強いパスワードでも複数サイトで同じものを使うと、1か所の流出で他も破られます。二段階認証の有効化が最も効果的な対策です。",
    },
  ],
};
